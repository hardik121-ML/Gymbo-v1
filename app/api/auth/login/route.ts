import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign in with Supabase Auth
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Supabase Auth login error:', signInError)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      )
    }

    // Fetch trainer profile
    const { data: trainer } = await supabase
      .from('trainers')
      .select('id, name, phone')
      .eq('id', authData.user.id)
      .single()

    // Session is automatically created by Supabase Auth
    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: trainer?.name || authData.user.user_metadata?.name,
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
