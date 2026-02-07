/**
 * Client Export Data API Route
 *
 * GET /api/clients/[id]/export-data?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Fetches all data needed for generating a client PDF statement.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ClientPDFData } from '@/lib/pdf/types'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch client (RLS automatically enforces ownership)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, phone, balance, credit_balance, current_rate, is_deleted')
      .eq('id', clientId)
      .eq('is_deleted', false)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch punches with date filtering
    let punchesQuery = supabase
      .from('punches')
      .select('id, punch_date, client_id')
      .eq('client_id', clientId)
      .eq('is_deleted', false)
      .order('punch_date', { ascending: false })

    if (startDate) punchesQuery = punchesQuery.gte('punch_date', startDate)
    if (endDate) punchesQuery = punchesQuery.lte('punch_date', endDate)

    const { data: punches, error: punchesError } = await punchesQuery

    if (punchesError) {
      console.error('Error fetching punches:', punchesError)
      return NextResponse.json({ error: 'Failed to fetch punches' }, { status: 500 })
    }

    // Fetch payments with date filtering
    let paymentsQuery = supabase
      .from('payments')
      .select('id, amount, classes_added, rate_at_payment, payment_date')
      .eq('client_id', clientId)
      .order('payment_date', { ascending: false })

    if (startDate) paymentsQuery = paymentsQuery.gte('payment_date', startDate)
    if (endDate) paymentsQuery = paymentsQuery.lte('payment_date', endDate)

    const { data: payments, error: paymentsError } = await paymentsQuery

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    // Fetch audit logs to enrich data with credit information
    let auditQuery = supabase
      .from('audit_log')
      .select('action, details, created_at')
      .eq('client_id', clientId)
      .in('action', ['PUNCH_ADD', 'PAYMENT_ADD'])
      .order('created_at', { ascending: false })

    if (startDate || endDate) {
      // Only fetch audit logs for the date range if specified
      if (startDate) auditQuery = auditQuery.gte('created_at', startDate)
      if (endDate) auditQuery = auditQuery.lte('created_at', `${endDate}T23:59:59`)
    }

    const { data: auditLogs } = await auditQuery

    // Create a map of punch/payment IDs to their credit details from audit logs
    const punchCreditMap = new Map<string, boolean>()
    const paymentCreditMap = new Map<
      string,
      { credit_used?: number; credit_added?: number }
    >()

    if (auditLogs) {
      auditLogs.forEach((log) => {
        if (log.action === 'PUNCH_ADD' && log.details) {
          const details = log.details as Record<string, unknown>
          if (details.punch_id) {
            punchCreditMap.set(details.punch_id as string, details.paid_with_credit === true)
          }
        } else if (log.action === 'PAYMENT_ADD' && log.details) {
          const details = log.details as Record<string, unknown>
          if (details.payment_id) {
            paymentCreditMap.set(details.payment_id as string, {
              credit_used: details.credit_used as number | undefined,
              credit_added: details.credit_added as number | undefined,
            })
          }
        }
      })
    }

    // Enrich punches with credit information
    const enrichedPunches = (punches || []).map((punch) => ({
      punch_date: punch.punch_date,
      paid_with_credit: punchCreditMap.get(punch.id) || false,
    }))

    // Enrich payments with credit information
    const enrichedPayments = (payments || []).map((payment) => {
      const creditInfo = paymentCreditMap.get(payment.id)
      return {
        payment_date: payment.payment_date,
        amount: payment.amount,
        classes_added: payment.classes_added,
        rate_at_payment: payment.rate_at_payment,
        credit_used: creditInfo?.credit_used,
        credit_added: creditInfo?.credit_added,
      }
    })

    // Fetch trainer brand settings
    const { data: trainer } = await supabase
      .from('trainers')
      .select('brand_name, brand_address, brand_phone, brand_email')
      .eq('id', user.id)
      .single()

    // Calculate amount due if balance is negative
    const amountDue = client.balance < 0 ? Math.abs(client.balance) * client.current_rate : 0

    // Build response data
    const responseData: ClientPDFData = {
      client: {
        name: client.name,
        phone: client.phone,
      },
      trainer: {
        brand_name: trainer?.brand_name || null,
        brand_address: trainer?.brand_address || null,
        brand_phone: trainer?.brand_phone || null,
        brand_email: trainer?.brand_email || null,
      },
      dateRange: {
        start: startDate || '',
        end: endDate || '',
        label: '', // Will be set by client
      },
      punches: enrichedPunches,
      payments: enrichedPayments,
      balance: {
        current: client.balance,
        credit: client.credit_balance,
        amountDue,
      },
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error in export-data route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
