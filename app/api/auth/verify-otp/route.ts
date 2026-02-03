import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { phone, otp, name } = await request.json()

    // Validate input
    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. Must be 6 digits.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify OTP
    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })

    if (verifyError) {
      console.error('OTP verification error:', verifyError)

      if (verifyError.message.includes('expired')) {
        return NextResponse.json(
          { error: 'OTP expired. Please request a new one.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 401 }
      )
    }

    // Check if trainer record exists (for login)
    const { data: existingTrainer } = await supabase
      .from('trainers')
      .select('id, name, phone')
      .eq('id', authData.user.id)
      .single()

    let trainer = existingTrainer

    // If trainer doesn't exist, create one (for signup)
    if (!existingTrainer && name) {
      const { data: newTrainer, error: createError } = await supabase
        .from('trainers')
        .insert([
          {
            id: authData.user.id,
            name: name.trim(),
            phone: phone,
          },
        ])
        .select()
        .single()

      if (createError) {
        console.error('Failed to create trainer record:', createError)
        return NextResponse.json(
          { error: 'Failed to create trainer profile' },
          { status: 500 }
        )
      }

      trainer = newTrainer
    }

    // If trainer still doesn't exist (login without prior signup), return error
    if (!trainer) {
      return NextResponse.json(
        { error: 'Account not found. Please sign up first.' },
        { status: 404 }
      )
    }

    // Session is automatically created by Supabase Auth after OTP verification
    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: authData.user.id,
        phone: authData.user.phone,
        name: trainer.name || authData.user.user_metadata?.name,
      },
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
