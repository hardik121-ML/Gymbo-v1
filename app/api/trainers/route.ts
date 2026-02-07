import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/trainers
 * Fetch current trainer profile (all columns including brand fields)
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: trainer, error } = await supabase
    .from('trainers')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching trainer:', error)
    return NextResponse.json({ error: 'Failed to fetch trainer data' }, { status: 500 })
  }

  return NextResponse.json({ trainer })
}

/**
 * PATCH /api/trainers
 * Update brand settings for current trainer
 */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { brand_name, brand_address, brand_phone, brand_email } = body

  // Validation
  const errors: Record<string, string> = {}

  // Brand name: required, min 2 chars
  if (!brand_name || brand_name.trim().length < 2) {
    errors.brand_name = 'Business name must be at least 2 characters'
  }

  // Brand address: required, min 5 chars
  if (!brand_address || brand_address.trim().length < 5) {
    errors.brand_address = 'Business address must be at least 5 characters'
  }

  // Brand phone: required, 10 digits, starts with 6-9
  const phoneRegex = /^[6-9]\d{9}$/
  if (!brand_phone || !phoneRegex.test(brand_phone.trim())) {
    errors.brand_phone = 'Phone must be 10 digits starting with 6-9'
  }

  // Brand email: optional, but must be valid if provided
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (brand_email && brand_email.trim() && !emailRegex.test(brand_email.trim())) {
    errors.brand_email = 'Invalid email format'
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 })
  }

  // Prepare updates (convert empty strings to NULL)
  const updates: {
    brand_name: string | null
    brand_address: string | null
    brand_phone: string | null
    brand_email: string | null
  } = {
    brand_name: brand_name?.trim() || null,
    brand_address: brand_address?.trim() || null,
    brand_phone: brand_phone?.trim() || null,
    brand_email: brand_email?.trim() || null,
  }

  // Update trainer
  const { data: trainer, error } = await supabase
    .from('trainers')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating trainer:', error)
    return NextResponse.json({ error: 'Failed to update brand settings' }, { status: 500 })
  }

  return NextResponse.json({ trainer })
}
