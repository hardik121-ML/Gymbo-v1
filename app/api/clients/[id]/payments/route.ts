// ============================================================================
// Payments API Routes
// ============================================================================
// Handles payment recording for clients
// ============================================================================

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/clients/[id]/payments - Log a payment
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params

    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { amount, classesAdded, date, creditUsed = 0 } = body

    // Validate amount (in paise)
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Validate creditUsed (optional, defaults to 0)
    if (typeof creditUsed !== 'number' || creditUsed < 0) {
      return NextResponse.json(
        { error: 'Credit used must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate classes added
    if (typeof classesAdded !== 'number' || classesAdded < 0) {
      return NextResponse.json(
        { error: 'Classes added must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate date
    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    // Parse and validate date
    const paymentDate = new Date(date)
    if (isNaN(paymentDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify client exists and belongs to trainer
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, balance, credit_balance, trainer_id, current_rate')
      .eq('id', clientId)
      .eq('trainer_id', session.trainerId)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const previousBalance = clientData.balance
    const previousCredit = clientData.credit_balance || 0
    const rateAtPayment = clientData.current_rate

    // Validate that creditUsed doesn't exceed available credit
    if (creditUsed > previousCredit) {
      return NextResponse.json(
        { error: `Cannot use ₹${(creditUsed / 100).toFixed(0)} credit. Only ₹${(previousCredit / 100).toFixed(0)} available.` },
        { status: 400 }
      )
    }

    // Calculate remainder (credit) from payment
    // Example: ₹10,500 payment at ₹2,500/class = 4 classes + ₹500 credit
    // Or with credit used: ₹50 payment + ₹50 credit used = ₹100 total at ₹100/class = 1 class
    const totalPaid = amount + creditUsed
    const totalCostOfClasses = classesAdded * rateAtPayment
    const remainder = totalPaid - totalCostOfClasses
    const newCredit = previousCredit - creditUsed + remainder

    // Create payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        client_id: clientId,
        amount: amount,
        classes_added: classesAdded,
        rate_at_payment: rateAtPayment,
        payment_date: date,
      })
      .select()
      .single()

    if (paymentError || !paymentData) {
      console.error('Error creating payment:', paymentError)
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      )
    }

    // Increment client balance and credit
    const newBalance = previousBalance + classesAdded
    const { error: balanceError } = await supabase
      .from('clients')
      .update({
        balance: newBalance,
        credit_balance: newCredit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (balanceError) {
      console.error('Error updating balance:', balanceError)
      // Try to delete the payment to maintain consistency
      await supabase
        .from('payments')
        .delete()
        .eq('id', paymentData.id)

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
        client_id: clientId,
        action: 'PAYMENT_ADD',
        details: {
          amount: amount,
          classes_added: classesAdded,
          rate_at_payment: rateAtPayment,
          payment_date: date,
          payment_id: paymentData.id,
          credit_used: creditUsed,
          credit_added: remainder,
          previous_credit: previousCredit,
          new_credit: newCredit,
        },
        previous_balance: previousBalance,
        new_balance: newBalance,
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the whole request, just log it
    }

    return NextResponse.json({
      payment: paymentData,
      newBalance,
      previousBalance,
      newCredit,
      previousCredit,
      creditUsed,
      creditAdded: remainder,
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/clients/[id]/payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
