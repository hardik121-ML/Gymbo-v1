// ============================================================================
// Supabase Admin Client - Server-Side Only
// ============================================================================
// This client uses the SERVICE_ROLE_KEY and bypasses Row Level Security
// ONLY use this for admin operations like user signup
// NEVER expose this client to the browser
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
