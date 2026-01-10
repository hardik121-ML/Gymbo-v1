import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone (optional but if provided must be valid Indian mobile)
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(phone.trim())) {
        return NextResponse.json(
          { error: 'Invalid Indian mobile number' },
          { status: 400 }
        )
      }
    }

    // Validate password (at least 6 characters for Supabase)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create auth user with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // Store name in user metadata
        },
      },
    })

    if (signUpError) {
      console.error('Supabase Auth signup error:', signUpError)

      // Handle specific error cases
      if (signUpError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email already registered. Please log in.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Create trainer record with same ID as auth user
    const { error: createError } = await supabase
      .from('trainers')
      .insert([
        {
          id: authData.user.id, // Use auth user ID
          name: name.trim(),
          phone: phone?.trim() || null, // Optional field
        },
      ])

    if (createError) {
      console.error('Failed to create trainer record:', createError)

      // If trainer creation fails, we should ideally delete the auth user
      // but for now just return error
      return NextResponse.json(
        { error: 'Failed to create trainer profile' },
        { status: 500 }
      )
    }

    // Session is automatically created by Supabase Auth
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
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
