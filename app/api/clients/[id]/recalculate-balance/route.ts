// ============================================================================
// Recalculate Balance API Route
// ============================================================================
// Recalculates client balance from payments and punches
// Used for data integrity checks and fixing balance discrepancies
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recalculateBalance, verifyBalance } from '@/lib/balance/calculate'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/clients/[id]/recalculate-balance - Recalculate balance from scratch
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client exists and belongs to trainer
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('trainer_id', user.id)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Recalculate balance
    const result = await recalculateBalance(clientId)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in POST /api/clients/[id]/recalculate-balance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/clients/[id]/recalculate-balance - Verify balance without updating
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client exists and belongs to trainer
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('trainer_id', user.id)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Verify balance
    const result = await verifyBalance(clientId)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/clients/[id]/recalculate-balance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
