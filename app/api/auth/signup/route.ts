import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { name, phone } = await request.json()

    // Validate input
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      )
    }

    // Validate name (at least 2 characters)
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Validate phone (E.164 format: +91XXXXXXXXXX)
    const phoneRegex = /^\+91[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be in format +91XXXXXXXXXX' },
        { status: 400 }
      )
    }

    // Check if phone number already exists (use admin client to bypass RLS)
    const adminClient = createAdminClient()
    const { data: existingTrainer } = await adminClient
      .from('trainers')
      .select('id, phone, name')
      .eq('phone', phone)
      .maybeSingle()

    if (existingTrainer) {
      return NextResponse.json(
        { error: 'Phone number already registered. Please log in instead.' },
        { status: 409 }
      )
    }

    const supabase = await createClient()

    // Send OTP to phone number (Supabase handles Twilio integration)
    const { error: signUpError } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: {
          name, // Store name in user metadata for later use
        },
      },
    })

    if (signUpError) {
      console.error('Supabase Auth signup error:', signUpError)

      // Handle specific error cases
      if (signUpError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'Phone number already registered. Please log in.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    // Note: User record and trainer record are created AFTER OTP verification
    // See verify-otp endpoint

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully. Please verify to complete signup.',
      phone,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
