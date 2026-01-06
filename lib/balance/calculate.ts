// ============================================================================
// Balance Calculation Utilities
// ============================================================================
// Functions to calculate, verify, and recalculate client balances
// Used for data integrity checks and debugging
// ============================================================================

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Calculate balance from scratch using payments and punches
 * Balance = (sum of classes from payments) - (count of active punches)
 */
export async function calculateBalance(clientId: string): Promise<number> {
  const supabase = createAdminClient()

  // Get total classes from payments
  const { data: payments } = await supabase
    .from('payments')
    .select('classes_added')
    .eq('client_id', clientId)

  const totalClassesFromPayments = (payments || []).reduce(
    (sum, payment: any) => sum + payment.classes_added,
    0
  )

  // Get count of active punches
  const { count: activePunchesCount } = await supabase
    .from('punches')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('is_deleted', false)

  const totalPunches = activePunchesCount || 0

  return totalClassesFromPayments - totalPunches
}

/**
 * Verify if stored balance matches calculated balance
 * Returns { matches: boolean, stored: number, calculated: number }
 */
export async function verifyBalance(clientId: string): Promise<{
  matches: boolean
  stored: number
  calculated: number
  drift: number
}> {
  const supabase = createAdminClient()

  // Get stored balance
  const { data: clientData } = await supabase
    .from('clients')
    .select('balance')
    .eq('id', clientId)
    .single()

  const storedBalance = (clientData as any)?.balance || 0

  // Calculate what balance should be
  const calculatedBalance = await calculateBalance(clientId)

  return {
    matches: storedBalance === calculatedBalance,
    stored: storedBalance,
    calculated: calculatedBalance,
    drift: storedBalance - calculatedBalance,
  }
}

/**
 * Recalculate and update client balance
 * Use this to fix balance discrepancies
 */
export async function recalculateBalance(clientId: string): Promise<{
  success: boolean
  previousBalance: number
  newBalance: number
  fixed: boolean
}> {
  const supabase = createAdminClient()

  // Get current balance
  const { data: clientData } = await supabase
    .from('clients')
    .select('balance, trainer_id')
    .eq('id', clientId)
    .single()

  if (!clientData) {
    return {
      success: false,
      previousBalance: 0,
      newBalance: 0,
      fixed: false,
    }
  }

  const client = clientData as any
  const previousBalance = client.balance

  // Calculate correct balance
  const correctBalance = await calculateBalance(clientId)

  // Update if different
  if (previousBalance !== correctBalance) {
    const updateResult: any = await (supabase.from('clients') as any)
      .update({
        balance: correctBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    const { error } = updateResult

    if (error) {
      return {
        success: false,
        previousBalance,
        newBalance: previousBalance,
        fixed: false,
      }
    }

    // Log to audit trail
    await supabase
      .from('audit_log')
      .insert({
        trainer_id: client.trainer_id,
        client_id: clientId,
        action: 'BALANCE_RECALCULATE',
        details: {
          reason: 'Manual recalculation',
          drift: previousBalance - correctBalance,
        },
        previous_balance: previousBalance,
        new_balance: correctBalance,
      } as any)

    return {
      success: true,
      previousBalance,
      newBalance: correctBalance,
      fixed: true,
    }
  }

  return {
    success: true,
    previousBalance,
    newBalance: correctBalance,
    fixed: false, // No fix needed
  }
}

/**
 * Batch verify all clients for a trainer
 * Returns list of clients with balance mismatches
 */
export async function verifyAllBalances(trainerId: string): Promise<
  Array<{
    clientId: string
    clientName: string
    stored: number
    calculated: number
    drift: number
  }>
> {
  const supabase = createAdminClient()

  // Get all clients for trainer
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('trainer_id', trainerId)

  if (!clients || clients.length === 0) {
    return []
  }

  const mismatches = []

  for (const client of clients as any[]) {
    const verification = await verifyBalance(client.id)
    if (!verification.matches) {
      mismatches.push({
        clientId: client.id,
        clientName: client.name,
        stored: verification.stored,
        calculated: verification.calculated,
        drift: verification.drift,
      })
    }
  }

  return mismatches
}
