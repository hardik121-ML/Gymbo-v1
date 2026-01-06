// ============================================================================
// Rate Change API Route
// ============================================================================
// Handles rate changes with history tracking
// ============================================================================

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/clients/[id]/rate - Change client rate with history
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { rate, effectiveDate } = body

    // Validate rate
    if (!rate || typeof rate !== 'number' || rate < 100 || rate > 10000) {
      return NextResponse.json(
        { error: 'Rate must be between ₹100 and ₹10,000' },
        { status: 400 }
      )
    }

    // Validate effective date
    if (!effectiveDate || typeof effectiveDate !== 'string') {
      return NextResponse.json(
        { error: 'Effective date is required' },
        { status: 400 }
      )
    }

    // Parse and validate date
    const effDate = new Date(effectiveDate)
    if (isNaN(effDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify client exists and belongs to trainer
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, current_rate, trainer_id')
      .eq('id', clientId)
      .eq('trainer_id', session.trainerId)
      .single()

    if (fetchError || !existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const client = existingClient as any
    const oldRate = client.current_rate

    // Convert rate from rupees to paise
    const rateInPaise = rate * 100

    // Check if rate is actually changing
    if (rateInPaise === oldRate) {
      return NextResponse.json(
        { error: 'New rate must be different from current rate' },
        { status: 400 }
      )
    }

    // Update client's current rate
    const updateResult: any = await (supabase.from('clients') as any)
      .update({
        current_rate: rateInPaise,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()

    const { data: updatedClient, error: updateError } = updateResult

    if (updateError) {
      console.error('Error updating client rate:', updateError)
      return NextResponse.json(
        { error: 'Failed to update rate' },
        { status: 500 }
      )
    }

    // Add entry to rate_history
    const { data: rateHistoryEntry, error: historyError } = await supabase
      .from('rate_history')
      .insert({
        client_id: clientId,
        rate: rateInPaise,
        effective_date: effectiveDate,
      } as any)
      .select()
      .single()

    if (historyError) {
      console.error('Error creating rate history:', historyError)
      // Try to rollback the client update
      await (supabase.from('clients') as any)
        .update({ current_rate: oldRate })
        .eq('id', clientId)

      return NextResponse.json(
        { error: 'Failed to create rate history' },
        { status: 500 }
      )
    }

    // Note: Audit log is automatically created by the trigger_log_rate_change trigger
    // No need to manually insert into audit_log

    // Fetch all rate history for this client
    const { data: rateHistory, error: historyFetchError } = await supabase
      .from('rate_history')
      .select('*')
      .eq('client_id', clientId)
      .order('effective_date', { ascending: false })

    if (historyFetchError) {
      console.error('Error fetching rate history:', historyFetchError)
    }

    return NextResponse.json({
      client: updatedClient,
      rateHistory: rateHistory || [],
      message: `Rate changed from ₹${oldRate / 100} to ₹${rateInPaise / 100} effective ${new Date(effectiveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/clients/[id]/rate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
