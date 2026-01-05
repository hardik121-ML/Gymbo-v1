// ============================================================================
// Health Check API Route
// ============================================================================
// This route verifies that Supabase connection is working properly
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Try to query the trainers table to verify connection
    const { data, error } = await supabase
      .from('trainers')
      .select('count')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine for an empty table
      throw error
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Supabase health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Supabase connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
