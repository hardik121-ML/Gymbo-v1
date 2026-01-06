// ============================================================================
// Punch Delete API Route
// ============================================================================
// Handles soft deletion of individual punch records
// ============================================================================

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

// DELETE /api/punches/[id] - Soft delete a punch record
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id: punchId } = await context.params

    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

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

    const punch = punchData as any

    // Check if already deleted
    if (punch.is_deleted) {
      return NextResponse.json(
        { error: 'Punch already deleted' },
        { status: 400 }
      )
    }

    // Verify the client belongs to the trainer
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, balance, trainer_id')
      .eq('id', punch.client_id)
      .eq('trainer_id', session.trainerId)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    const client = clientData as any
    const previousBalance = client.balance

    // Soft delete the punch (set is_deleted = true)
    const punchUpdateResult: any = await (supabase.from('punches') as any)
      .update({ is_deleted: true })
      .eq('id', punchId)

    const { error: deleteError } = punchUpdateResult

    if (deleteError) {
      console.error('Error soft deleting punch:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete punch' },
        { status: 500 }
      )
    }

    // Increment client balance by 1 (restore the class)
    const newBalance = previousBalance + 1
    const updateResult: any = await (supabase.from('clients') as any)
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', punch.client_id)

    const { error: balanceError } = updateResult

    if (balanceError) {
      console.error('Error updating balance:', balanceError)
      // Try to restore the punch to maintain consistency
      await (supabase.from('punches') as any)
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
        trainer_id: session.trainerId,
        client_id: punch.client_id,
        action: 'PUNCH_REMOVE',
        details: {
          punch_date: punch.punch_date,
          punch_id: punchId,
        },
        previous_balance: previousBalance,
        new_balance: newBalance,
      } as any)

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
