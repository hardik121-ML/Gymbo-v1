// ============================================================================
// Client API Routes
// ============================================================================
// Handles individual client operations (update, etc.)
// ============================================================================

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/clients/[id] - Get client details
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Fetch client
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('trainer_id', session.trainerId)
      .single()

    if (fetchError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Unexpected error in GET /api/clients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/clients/[id] - Update client details (name, phone)
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
    const { name, phone } = body

    // Validate at least one field is provided
    if (!name && phone === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name or phone) must be provided' },
        { status: 400 }
      )
    }

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Validate phone if provided
    if (phone !== undefined && phone !== null && typeof phone === 'string' && phone.trim().length > 0) {
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(phone.trim())) {
        return NextResponse.json(
          { error: 'Invalid Indian mobile number' },
          { status: 400 }
        )
      }
    }

    const supabase = createAdminClient()

    // Verify client exists and belongs to trainer
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, name, phone, trainer_id')
      .eq('id', clientId)
      .eq('trainer_id', session.trainerId)
      .single()

    if (fetchError || !existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: {
      updated_at: string
      name?: string
      phone?: string | null
    } = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      updates.name = name.trim()
    }

    if (phone !== undefined) {
      updates.phone = phone && phone.trim().length > 0 ? phone.trim() : null
    }

    // Update client
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single()

    if (updateError || !updatedClient) {
      console.error('Error updating client:', updateError)
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500 }
      )
    }

    // Log to audit trail
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        trainer_id: session.trainerId,
        client_id: clientId,
        action: 'CLIENT_UPDATE',
        details: {
          previous: {
            name: existingClient.name,
            phone: existingClient.phone
          },
          updated: {
            name: updates.name || existingClient.name,
            phone: updates.phone !== undefined ? updates.phone : existingClient.phone
          }
        },
        previous_balance: null,
        new_balance: null,
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the whole request, just log it
    }

    return NextResponse.json({ client: updatedClient })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/clients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
