// ============================================================================
// Clients API Routes
// ============================================================================
// Handles client creation and management
// ============================================================================

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/clients - Create a new client
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { name, phone, rate } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (!rate || typeof rate !== 'number' || rate < 100 || rate > 10000) {
      return NextResponse.json(
        { error: 'Rate must be between ₹100 and ₹10,000' },
        { status: 400 }
      )
    }

    // Validate phone if provided
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(phone.trim())) {
        return NextResponse.json(
          { error: 'Invalid Indian mobile number' },
          { status: 400 }
        )
      }
    }

    const supabase = createAdminClient()

    // Convert rate from rupees to paise
    const rateInPaise = rate * 100

    // Create client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        trainer_id: session.trainerId,
        name: name.trim(),
        phone: phone?.trim() || null,
        current_rate: rateInPaise,
        balance: 0, // New clients start with 0 balance
      })
      .select()
      .single()

    if (clientError || !client) {
      console.error('Error creating client:', clientError)
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      )
    }

    // Create initial rate history entry
    const { error: rateHistoryError } = await supabase
      .from('rate_history')
      .insert({
        client_id: client.id,
        rate: rateInPaise,
        effective_date: new Date().toISOString().split('T')[0],
      })

    if (rateHistoryError) {
      console.error('Error creating rate history:', rateHistoryError)
      // Don't fail the whole request, just log it
    }

    // Log to audit trail
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        trainer_id: session.trainerId,
        client_id: client.id,
        action: 'CLIENT_ADD',
        details: {
          name: client.name,
          phone: client.phone,
          rate: rateInPaise,
        },
        previous_balance: null,
        new_balance: 0,
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the whole request, just log it
    }

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
