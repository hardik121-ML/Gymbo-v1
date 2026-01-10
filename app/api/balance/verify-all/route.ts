// ============================================================================
// Verify All Balances API Route
// ============================================================================
// Verifies balances for all clients of the authenticated trainer
// Used for health checks and detecting balance drift
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAllBalances } from '@/lib/balance/calculate'

// GET /api/balance/verify-all - Verify all client balances
export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify all balances for this trainer
    const mismatches = await verifyAllBalances(user.id)

    return NextResponse.json({
      totalClientsChecked: mismatches.length > 0 ? 'some' : 'all',
      mismatches: mismatches,
      allCorrect: mismatches.length === 0,
    }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/balance/verify-all:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
