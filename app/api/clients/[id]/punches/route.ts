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
      .select('id, balance, trainer_id')
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

    // Decrement client balance by 1
    const newBalance = previousBalance - 1
    const updateResult: any = await (supabase.from('clients') as any)
      .update({
        balance: newBalance,
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
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/clients/[id]/punches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
