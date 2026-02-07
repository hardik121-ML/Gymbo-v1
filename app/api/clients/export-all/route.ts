/**
 * All Clients Export Data API Route
 *
 * GET /api/clients/export-all?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Fetches all data needed for generating an all-clients summary PDF.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AllClientsPDFData } from '@/lib/pdf/types'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params (for future date filtering if needed)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch all clients (exclude deleted)
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, phone, balance, credit_balance, current_rate, is_deleted')
      .eq('trainer_id', user.id)
      .eq('is_deleted', false)
      .order('balance', { ascending: true }) // Negative balances first

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    if (!clients || clients.length === 0) {
      // Return empty data structure
      const emptyData: AllClientsPDFData = {
        trainer: {
          brand_name: null,
          brand_address: null,
          brand_phone: null,
          brand_email: null,
        },
        dateRange: {
          start: startDate || '',
          end: endDate || '',
          label: '',
        },
        summary: {
          totalClients: 0,
          totalClasses: 0,
          totalPayments: 0,
          totalOutstanding: 0,
        },
        clients: [],
      }

      return NextResponse.json(emptyData)
    }

    // Calculate summary statistics
    let totalClasses = 0
    let totalOutstanding = 0

    const enrichedClients = clients.map((client) => {
      const amountDue = client.balance < 0 ? Math.abs(client.balance) * client.current_rate : 0

      // Accumulate totals
      if (client.balance > 0) {
        totalClasses += client.balance
      }
      if (amountDue > 0) {
        totalOutstanding += amountDue
      }

      return {
        name: client.name,
        phone: client.phone,
        balance: client.balance,
        credit: client.credit_balance,
        amountDue,
        current_rate: client.current_rate,
      }
    })

    // Calculate total payments received (optional - requires payment query)
    // For now, we'll set it to 0 or calculate from payment history
    let totalPayments = 0

    // Optionally fetch all payments to calculate total payments received
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .in(
        'client_id',
        clients.map((c) => c.id)
      )

    if (payments) {
      totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
    }

    // Fetch trainer brand settings
    const { data: trainer } = await supabase
      .from('trainers')
      .select('brand_name, brand_address, brand_phone, brand_email')
      .eq('id', user.id)
      .single()

    // Build response data
    const responseData: AllClientsPDFData = {
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
      summary: {
        totalClients: clients.length,
        totalClasses,
        totalPayments,
        totalOutstanding,
      },
      clients: enrichedClients,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error in export-all route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
