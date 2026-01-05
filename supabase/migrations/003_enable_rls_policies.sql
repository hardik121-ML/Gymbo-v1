-- ============================================================================
-- Gymbo Database Schema - Row-Level Security (RLS) Policies
-- Migration: 003_enable_rls_policies.sql
-- Based on: GYM-17 (Row-level security policies)
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. TRAINERS TABLE POLICIES
-- ============================================================================

-- Trainers can read and update their own record
CREATE POLICY "trainers_own_data" ON trainers
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow trainers to insert their own record (for signup)
CREATE POLICY "trainers_insert_own" ON trainers
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- 3. CLIENTS TABLE POLICIES
-- ============================================================================

-- Trainers can read their own clients
CREATE POLICY "trainers_read_own_clients" ON clients
  FOR SELECT
  USING (trainer_id = auth.uid());

-- Trainers can insert their own clients
CREATE POLICY "trainers_insert_own_clients" ON clients
  FOR INSERT
  WITH CHECK (trainer_id = auth.uid());

-- Trainers can update their own clients
CREATE POLICY "trainers_update_own_clients" ON clients
  FOR UPDATE
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Trainers can delete their own clients
CREATE POLICY "trainers_delete_own_clients" ON clients
  FOR DELETE
  USING (trainer_id = auth.uid());

-- ============================================================================
-- 4. PUNCHES TABLE POLICIES
-- ============================================================================

-- Trainers can read punches for their own clients
CREATE POLICY "trainers_read_own_punches" ON punches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = punches.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can insert punches for their own clients
CREATE POLICY "trainers_insert_own_punches" ON punches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can update punches for their own clients
CREATE POLICY "trainers_update_own_punches" ON punches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = punches.client_id
      AND clients.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = punches.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can delete punches for their own clients (soft delete)
CREATE POLICY "trainers_delete_own_punches" ON punches
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = punches.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. PAYMENTS TABLE POLICIES
-- ============================================================================

-- Trainers can read payments for their own clients
CREATE POLICY "trainers_read_own_payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = payments.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can insert payments for their own clients
CREATE POLICY "trainers_insert_own_payments" ON payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can update payments for their own clients
CREATE POLICY "trainers_update_own_payments" ON payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = payments.client_id
      AND clients.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = payments.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can delete payments for their own clients
CREATE POLICY "trainers_delete_own_payments" ON payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = payments.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. RATE HISTORY TABLE POLICIES
-- ============================================================================

-- Trainers can read rate history for their own clients
CREATE POLICY "trainers_read_own_rate_history" ON rate_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = rate_history.client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can insert rate history for their own clients
CREATE POLICY "trainers_insert_own_rate_history" ON rate_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. AUDIT LOG TABLE POLICIES
-- ============================================================================

-- Trainers can read their own audit logs
CREATE POLICY "trainers_read_own_audit_log" ON audit_log
  FOR SELECT
  USING (trainer_id = auth.uid());

-- Note: No INSERT policy needed - audit logs are created by triggers only

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
