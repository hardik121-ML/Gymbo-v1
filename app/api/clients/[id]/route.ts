// ============================================================================
// Client API Routes
// ============================================================================
// Handles individual client operations (update, etc.)
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/clients/[id] - Get client details
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch client
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('trainer_id', user.id)
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { name, phone, is_deleted } = body

    // Validate at least one field is provided
    if (!name && phone === undefined && is_deleted === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name, phone, or is_deleted) must be provided' },
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

    // Verify client exists and belongs to trainer
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, name, phone, trainer_id')
      .eq('id', clientId)
      .eq('trainer_id', user.id)
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
      is_deleted?: boolean
    } = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      updates.name = name.trim()
    }

    if (phone !== undefined) {
      updates.phone = phone && phone.trim().length > 0 ? phone.trim() : null
    }

    if (is_deleted !== undefined) {
      updates.is_deleted = is_deleted
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
        trainer_id: user.id,
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

// DELETE /api/clients/[id] - Soft delete a client
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client exists and belongs to trainer
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, name, phone, is_deleted, trainer_id')
      .eq('id', clientId)
      .eq('trainer_id', user.id)
      .single()

    if (fetchError || !existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check if already deleted
    if (existingClient.is_deleted) {
      return NextResponse.json(
        { error: 'Client is already deleted' },
        { status: 400 }
      )
    }

    // Soft delete the client
    const { data: deletedClient, error: deleteError } = await supabase
      .from('clients')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()

    if (deleteError || !deletedClient) {
      console.error('Error deleting client:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete client' },
        { status: 500 }
      )
    }

    // Log to audit trail
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        trainer_id: user.id,
        client_id: clientId,
        action: 'CLIENT_DELETE' as const,
        details: {
          name: existingClient.name,
          phone: existingClient.phone,
          soft_delete: true
        },
        previous_balance: null,
        new_balance: null,
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the whole request, just log it
    }

    return NextResponse.json({
      success: true,
      client: deletedClient
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/clients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
