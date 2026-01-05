import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSession } from '@/lib/auth/session'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { phone, pin } = await request.json()

    // Validate input
    if (!phone || !pin) {
      return NextResponse.json(
        { error: 'Phone and PIN are required' },
        { status: 400 }
      )
    }

    // Validate phone format (+91XXXXXXXXXX)
    const phoneRegex = /^\+91[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Validate PIN (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4 digits' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for checking and creating
    const adminSupabase = createAdminClient()

    // Check if phone already exists
    const { data: existingTrainer } = await adminSupabase
      .from('trainers')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingTrainer) {
      return NextResponse.json(
        { error: 'Phone number already registered. Please log in.' },
        { status: 409 }
      )
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(pin, 10)

    // Create trainer record (admin client bypasses RLS)
    const { data: trainer, error: createError } = await (adminSupabase
      .from('trainers') as any)
      .insert([
        {
          phone,
          pin_hash: pinHash,
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error('Failed to create trainer:', createError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Type assertion for trainer data
    const trainerData = trainer as any

    // Create session with custom JWT
    await createSession({
      trainerId: trainerData.id,
      phone: trainerData.phone,
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      trainer: {
        id: trainerData.id,
        phone: trainerData.phone,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
