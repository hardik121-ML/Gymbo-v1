-- ============================================================================
-- Gymbo Database Schema - Fix Audit Log RLS Policy
-- Migration: 006_fix_audit_log_rls.sql
-- Fix: Add INSERT policy for audit_log table
-- ============================================================================
-- Issue: Application code inserts audit logs directly (not via triggers)
-- but the RLS policy only allows SELECT. This causes RLS violations.
-- ============================================================================

-- Add INSERT policy for audit_log table
-- Trainers can insert audit logs for their own clients
CREATE POLICY "trainers_insert_own_audit_log" ON audit_log
  FOR INSERT
  WITH CHECK (trainer_id = auth.uid());

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
