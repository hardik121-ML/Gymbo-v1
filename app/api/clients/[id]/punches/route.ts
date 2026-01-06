// ============================================================================
// Punches API Routes
// ============================================================================
// Handles punch (class) recording for clients
// ============================================================================

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/clients/[id]/punches - Fetch punches for a client with pagination
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Validate pagination params
    if (offset < 0 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify client exists and belongs to trainer
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, trainer_id')
      .eq('id', clientId)
      .eq('trainer_id', session.trainerId)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Fetch punches with pagination
    const { data: punchesData, error: punchesError } = await supabase
      .from('punches')
      .select('id, punch_date')
      .eq('client_id', clientId)
      .eq('is_deleted', false)
      .order('punch_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (punchesError) {
      console.error('Error fetching punches:', punchesError)
      return NextResponse.json(
        { error: 'Failed to fetch punches' },
        { status: 500 }
      )
    }

    const punches = (punchesData as any[]) || []

    // Get total count for pagination metadata
    const { count, error: countError } = await supabase
      .from('punches')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('is_deleted', false)

    if (countError) {
      console.error('Error counting punches:', countError)
    }

    // Fetch audit logs to check which punches were paid with credit
    const punchIds = punches.map(p => p.id)
    let punchAuditData: any[] = []

    // Only query audit logs if there are punches
    if (punchIds.length > 0) {
      const { data } = await supabase
        .from('audit_log')
        .select('details')
        .eq('action', 'PUNCH_ADD')
        .in('details->>punch_id', punchIds)

      punchAuditData = data || []
    }

    // Create map of punch_id to paid_with_credit
    const paidWithCreditMap = new Map()
    for (const audit of punchAuditData as any[]) {
      if (audit.details?.punch_id && audit.details?.paid_with_credit) {
        paidWithCreditMap.set(audit.details.punch_id, true)
      }
    }

    // Enrich punches with credit info
    const enrichedPunches = punches.map(p => ({
      ...p,
      paid_with_credit: paidWithCreditMap.get(p.id) || false
    }))

    return NextResponse.json({
      punches: enrichedPunches,
      pagination: {
        offset,
        limit,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/clients/[id]/punches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/clients/[id]/punches - Record a class (punch)
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { date } = body

    // Validate date
    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    // Parse and validate date
    const punchDate = new Date(date)
    if (isNaN(punchDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Check date is not in future
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    if (punchDate > today) {
      return NextResponse.json(
        { error: 'Cannot record future classes' },
        { status: 400 }
      )
    }

    // Check date is not more than 3 months old
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    threeMonthsAgo.setHours(0, 0, 0, 0)
    if (punchDate < threeMonthsAgo) {
      return NextResponse.json(
        { error: 'Cannot record classes older than 3 months' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify client exists and belongs to trainer
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, balance, credit_balance, current_rate, trainer_id')
      .eq('id', clientId)
      .eq('trainer_id', session.trainerId)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const client = clientData as any
    const previousBalance = client.balance
    const previousCredit = client.credit_balance || 0
    const currentRate = client.current_rate

    // Create punch record
    const { data: punchData, error: punchError } = await supabase
      .from('punches')
      .insert({
        client_id: clientId,
        punch_date: date,
        is_deleted: false,
      } as any)
      .select()
      .single()

    if (punchError) {
      console.error('Error creating punch:', punchError)
      return NextResponse.json(
        { error: 'Failed to record class' },
        { status: 500 }
      )
    }

    const punch = punchData as any

    // Check if we can pay with credit, otherwise use balance
    let newBalance = previousBalance
    let newCredit = previousCredit
    let paidWithCredit = false

    if (previousCredit >= currentRate) {
      // Pay with credit - deduct from credit, balance stays same
      newCredit = previousCredit - currentRate
      paidWithCredit = true
    } else {
      // Pay with balance - deduct from balance, credit stays same
      newBalance = previousBalance - 1
    }

    const updateResult: any = await (supabase.from('clients') as any)
      .update({
        balance: newBalance,
        credit_balance: newCredit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    const { error: balanceError } = updateResult

    if (balanceError) {
      console.error('Error updating balance:', balanceError)
      // Try to delete the punch to maintain consistency
      await supabase
        .from('punches')
        .delete()
        .eq('id', punch.id)

      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      )
    }

    // Log to audit trail
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        trainer_id: session.trainerId,
        client_id: clientId,
        action: 'PUNCH_ADD',
        details: {
          punch_date: date,
          punch_id: punch.id,
          paid_with_credit: paidWithCredit,
          credit_used: paidWithCredit ? currentRate : 0,
          previous_credit: previousCredit,
          new_credit: newCredit,
        },
        previous_balance: previousBalance,
        new_balance: newBalance,
      } as any)

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the whole request, just log it
    }

    return NextResponse.json({
      punch,
      newBalance,
      previousBalance,
      newCredit,
      previousCredit,
      paidWithCredit,
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/clients/[id]/punches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
