-- ============================================================================
-- Gymbo Database Schema - Migrate to Supabase Auth
-- Migration: 005_migrate_to_supabase_auth.sql
-- Description: Migrate from custom JWT auth to Supabase Auth (email/password)
-- ============================================================================

-- ============================================================================
-- 1. UPDATE TRAINERS TABLE SCHEMA
-- ============================================================================

-- Drop the old unique constraint on phone
ALTER TABLE trainers DROP CONSTRAINT IF EXISTS trainers_phone_key;
DROP INDEX IF EXISTS idx_trainers_phone;

-- Make phone optional (trainers may not have phone numbers)
ALTER TABLE trainers ALTER COLUMN phone DROP NOT NULL;

-- Remove pin_hash column (no longer needed with Supabase Auth)
ALTER TABLE trainers DROP COLUMN IF EXISTS pin_hash;

-- Remove default UUID generation (we'll use auth.uid() instead)
ALTER TABLE trainers ALTER COLUMN id DROP DEFAULT;

-- Add constraint: trainers.id must match auth.users.id
COMMENT ON COLUMN trainers.id IS 'Must match auth.users.id from Supabase Auth';

-- Make name NOT NULL (required during signup)
ALTER TABLE trainers ALTER COLUMN name SET NOT NULL;

-- ============================================================================
-- 2. RLS POLICIES (Already correct - no changes needed!)
-- ============================================================================

-- RLS policies already use auth.uid() throughout
-- No changes needed - policies are already compatible with Supabase Auth

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- After this migration:
-- 1. Trainers table schema:
--    - id: UUID (must match auth.users.id, no default)
--    - phone: VARCHAR(15) NULL (optional)
--    - name: VARCHAR(100) NOT NULL (required)
--    - created_at: TIMESTAMPTZ
--
-- 2. Authentication flow:
--    - Signup: Create auth.user → Create trainers record with same ID
--    - Login: Use Supabase Auth (email/password)
--    - Session: Managed by Supabase Auth
--
-- 3. RLS policies work automatically with auth.uid()

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
