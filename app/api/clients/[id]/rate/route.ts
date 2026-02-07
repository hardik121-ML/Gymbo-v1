// ============================================================================
// Rate Change API Route
// ============================================================================
// Handles rate changes with history tracking
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/clients/[id]/rate - Change client rate with history
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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

    // Verify client exists and belongs to trainer
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, current_rate, rate_updated_at, trainer_id')
      .eq('id', clientId)
      .eq('trainer_id', user.id)
      .single()

    if (fetchError || !existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const oldRate = existingClient.current_rate

    // Convert rate from rupees to paise
    const rateInPaise = rate * 100

    // Check if rate is actually changing
    if (rateInPaise === oldRate) {
      return NextResponse.json(
        { error: 'New rate must be different from current rate' },
        { status: 400 }
      )
    }

    // Update client's current rate and rate_updated_at
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({
        current_rate: rateInPaise,
        rate_updated_at: effectiveDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()

    if (updateError || !updatedClient) {
      console.error('Error updating client rate:', updateError)
      return NextResponse.json(
        { error: 'Failed to update rate' },
        { status: 500 }
      )
    }

    // Manually create audit log entry (follows pattern from punches/payments)
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        trainer_id: user.id,
        client_id: clientId,
        action: 'RATE_CHANGE',
        details: {
          new_rate: rateInPaise,
          old_rate: oldRate,
          effective_date: effectiveDate,
        },
        previous_balance: null,
        new_balance: null,
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Try to rollback the client update
      await supabase
        .from('clients')
        .update({
          current_rate: oldRate,
          rate_updated_at: existingClient.rate_updated_at
        })
        .eq('id', clientId)

      return NextResponse.json(
        { error: 'Failed to create audit log' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      client: updatedClient,
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
