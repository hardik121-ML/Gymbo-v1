-- ============================================================================
-- Gymbo Database Schema - Remove Duplicate Audit Triggers
-- Migration: 007_remove_duplicate_triggers.sql
-- Fix: Remove database triggers that duplicate API code audit logging
-- ============================================================================
-- Issue: Triggers create duplicate audit logs because API code also logs
-- the same events with more detailed information (credit tracking).
-- Solution: Drop triggers, keep only API code logging.
-- ============================================================================

-- Drop triggers that create duplicates
DROP TRIGGER IF EXISTS trigger_log_punch_add ON punches;
DROP TRIGGER IF EXISTS trigger_log_punch_remove ON punches;
DROP TRIGGER IF EXISTS trigger_log_payment_add ON payments;

-- Drop the trigger functions (no longer needed)
DROP FUNCTION IF EXISTS log_punch_add();
DROP FUNCTION IF EXISTS log_punch_remove();
DROP FUNCTION IF EXISTS log_payment_add();

-- Note: We keep trigger_log_rate_change and log_rate_change() function
-- because rate changes are ONLY logged by the trigger (not duplicated in API code)

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
