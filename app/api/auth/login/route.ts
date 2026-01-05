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

    // Use admin client to fetch trainer (bypass RLS)
    const adminSupabase = createAdminClient()

    // Find trainer by phone
    const { data: trainer, error: fetchError } = await adminSupabase
      .from('trainers')
      .select('id, phone, pin_hash, name')
      .eq('phone', phone)
      .single()

    if (fetchError || !trainer) {
      return NextResponse.json(
        { error: 'Invalid phone number or PIN' },
        { status: 401 }
      )
    }

    // Type assertion for trainer data
    const trainerData = trainer as any

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, trainerData.pin_hash)

    if (!isPinValid) {
      return NextResponse.json(
        { error: 'Invalid phone number or PIN' },
        { status: 401 }
      )
    }

    // Create session with custom JWT
    await createSession({
      trainerId: trainerData.id,
      phone: trainerData.phone,
    })

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      trainer: {
        id: trainerData.id,
        phone: trainerData.phone,
        name: trainerData.name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
