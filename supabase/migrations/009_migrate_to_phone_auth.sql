-- ============================================================================
-- Gymbo Database Schema - Migrate to Phone-Only Authentication
-- Migration: 009_migrate_to_phone_auth.sql
-- Description: Make phone number required for phone + OTP authentication
-- ============================================================================

-- ============================================================================
-- 1. UPDATE TRAINERS TABLE SCHEMA
-- ============================================================================

-- Make phone number REQUIRED (NOT NULL)
ALTER TABLE trainers ALTER COLUMN phone SET NOT NULL;

-- Add unique constraint on phone (globally unique)
ALTER TABLE trainers ADD CONSTRAINT trainers_phone_unique UNIQUE (phone);

-- Add index for faster phone lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_trainers_phone ON trainers(phone);

-- Update column comment
COMMENT ON COLUMN trainers.phone IS 'Phone number for SMS OTP authentication (required, unique, E.164 format)';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- After this migration:
-- 1. Phone is REQUIRED for all trainers
-- 2. Phone must be UNIQUE (no duplicates)
-- 3. Phone must be in E.164 format (+919876543210)
-- 4. Authentication uses phone + SMS OTP (via Twilio)
-- 5. Email/password authentication is deprecated

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
