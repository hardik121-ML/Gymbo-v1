import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Sign out with Supabase Auth
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Supabase Auth logout error:', error)
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
