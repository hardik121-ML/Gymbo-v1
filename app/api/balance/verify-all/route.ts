// ============================================================================
// Verify All Balances API Route
// ============================================================================
// Verifies balances for all clients of the authenticated trainer
// Used for health checks and detecting balance drift
// ============================================================================

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { verifyAllBalances } from '@/lib/balance/calculate'

// GET /api/balance/verify-all - Verify all client balances
export async function GET() {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify all balances for this trainer
    const mismatches = await verifyAllBalances(session.trainerId)

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
