// ============================================================================
// Punch API Routes
// ============================================================================
// Handles punch operations: edit date and soft deletion
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/punches/[id] - Update punch date
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: punchId } = await context.params

    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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
    const newPunchDate = new Date(date)
    if (isNaN(newPunchDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Check date is not in future
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (newPunchDate > today) {
      return NextResponse.json(
        { error: 'Cannot set future dates' },
        { status: 400 }
      )
    }

    // Check date is not more than 3 months old
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    threeMonthsAgo.setHours(0, 0, 0, 0)
    if (newPunchDate < threeMonthsAgo) {
      return NextResponse.json(
        { error: 'Cannot set dates older than 3 months' },
        { status: 400 }
      )
    }

    // Fetch the punch to verify it exists and belongs to trainer's client
    const { data: punchData, error: punchError } = await supabase
      .from('punches')
      .select('id, client_id, punch_date, is_deleted')
      .eq('id', punchId)
      .single()

    if (punchError || !punchData) {
      return NextResponse.json(
        { error: 'Punch not found' },
        { status: 404 }
      )
    }

    // Check if deleted
    if (punchData.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot edit deleted punch' },
        { status: 400 }
      )
    }

    // Verify the client belongs to the trainer
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, trainer_id')
      .eq('id', punchData.client_id)
      .eq('trainer_id', user.id)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    const oldDate = punchData.punch_date

    // Update punch date
    const { data: updatedPunch, error: updateError } = await supabase
      .from('punches')
      .update({
        punch_date: date,
      })
      .eq('id', punchId)
      .select()
      .single()

    if (updateError || !updatedPunch) {
      console.error('Error updating punch:', updateError)
      return NextResponse.json(
        { error: 'Failed to update punch' },
        { status: 500 }
      )
    }

    // Log to audit trail
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        trainer_id: user.id,
        client_id: punchData.client_id,
        action: 'PUNCH_EDIT',
        details: {
          punch_id: punchId,
          old_date: oldDate,
          new_date: date,
        },
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the whole request, just log it
    }

    return NextResponse.json({
      punch: updatedPunch,
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/punches/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/punches/[id] - Soft delete a punch record
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id: punchId } = await context.params

    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the punch to verify it exists and belongs to trainer's client
    const { data: punchData, error: punchError } = await supabase
      .from('punches')
      .select('id, client_id, punch_date, is_deleted')
      .eq('id', punchId)
      .single()

    if (punchError || !punchData) {
      return NextResponse.json(
        { error: 'Punch not found' },
        { status: 404 }
      )
    }

    // Check if already deleted
    if (punchData.is_deleted) {
      return NextResponse.json(
        { error: 'Punch already deleted' },
        { status: 400 }
      )
    }

    // Verify the client belongs to the trainer
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, balance, trainer_id')
      .eq('id', punchData.client_id)
      .eq('trainer_id', user.id)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    const previousBalance = clientData.balance

    // Soft delete the punch (set is_deleted = true)
    const { error: deleteError } = await supabase
      .from('punches')
      .update({ is_deleted: true })
      .eq('id', punchId)

    if (deleteError) {
      console.error('Error soft deleting punch:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete punch' },
        { status: 500 }
      )
    }

    // Increment client balance by 1 (restore the class)
    const newBalance = previousBalance + 1
    const { error: balanceError } = await supabase
      .from('clients')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', punchData.client_id)

    if (balanceError) {
      console.error('Error updating balance:', balanceError)
      // Try to restore the punch to maintain consistency
      await supabase
        .from('punches')
        .update({ is_deleted: false })
        .eq('id', punchId)

      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      )
    }

    // Log to audit trail
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        trainer_id: user.id,
        client_id: punchData.client_id,
        action: 'PUNCH_REMOVE',
        details: {
          punch_date: punchData.punch_date,
          punch_id: punchId,
        },
        previous_balance: previousBalance,
        new_balance: newBalance,
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the whole request, just log it
    }

    return NextResponse.json({
      success: true,
      newBalance,
      previousBalance,
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/punches/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
