import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    // Validate input
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate phone format (E.164: +91XXXXXXXXXX)
    const phoneRegex = /^\+91[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be in format +91XXXXXXXXXX' },
        { status: 400 }
      )
    }

    // Check if user exists BEFORE sending OTP (use admin client to bypass RLS)
    const adminClient = createAdminClient()
    const { data: existingTrainer } = await adminClient
      .from('trainers')
      .select('id, phone')
      .eq('phone', phone)
      .maybeSingle()

    if (!existingTrainer) {
      return NextResponse.json(
        { error: 'Account not found. Please sign up first.' },
        { status: 404 }
      )
    }

    const supabase = await createClient()

    // Send OTP via SMS (Supabase + Twilio)
    const { error: signInError } = await supabase.auth.signInWithOtp({
      phone,
    })

    if (signInError) {
      console.error('Supabase Auth login error:', signInError)
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 401 }
      )
    }

    // OTP sent successfully
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your phone number',
      phone,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
