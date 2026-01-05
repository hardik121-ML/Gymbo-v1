-- ============================================================================
-- Gymbo Database Schema - Audit & Rate History Tables
-- Migration: 002_create_audit_and_rate_history.sql
-- Based on: GYM-20 (Database schema - audit & rate history)
-- ============================================================================

-- ============================================================================
-- 1. RATE HISTORY TABLE
-- ============================================================================
CREATE TABLE rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rate INTEGER NOT NULL, -- Rate in paise (₹1 = 100 paise)
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_rate_history_client_id ON rate_history(client_id);
CREATE INDEX idx_rate_history_effective_date ON rate_history(effective_date);

-- ============================================================================
-- 2. AUDIT LOG TABLE
-- ============================================================================

-- Create audit action enum
CREATE TYPE audit_action AS ENUM (
  'PUNCH_ADD',
  'PUNCH_REMOVE',
  'PUNCH_EDIT',
  'PAYMENT_ADD',
  'RATE_CHANGE',
  'CLIENT_ADD',
  'CLIENT_UPDATE',
  'CLIENT_DELETE'
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  action audit_action NOT NULL,
  details JSONB, -- Flexible JSON field for action-specific data
  previous_balance INTEGER, -- Balance before the action
  new_balance INTEGER, -- Balance after the action
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_audit_log_client_id ON audit_log(client_id);
CREATE INDEX idx_audit_log_trainer_id ON audit_log(trainer_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================================================
-- 3. AUDIT TRIGGERS
-- ============================================================================

-- Function to log punch addition
CREATE OR REPLACE FUNCTION log_punch_add()
RETURNS TRIGGER AS $$
DECLARE
  v_trainer_id UUID;
  v_old_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get trainer_id and balance from client
  SELECT c.trainer_id, c.balance INTO v_trainer_id, v_old_balance
  FROM clients c
  WHERE c.id = NEW.client_id;

  v_new_balance := v_old_balance - 1;

  -- Log the action
  INSERT INTO audit_log (client_id, trainer_id, action, details, previous_balance, new_balance)
  VALUES (
    NEW.client_id,
    v_trainer_id,
    'PUNCH_ADD',
    jsonb_build_object(
      'punch_id', NEW.id,
      'punch_date', NEW.punch_date
    ),
    v_old_balance,
    v_new_balance
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log punch removal (soft delete)
CREATE OR REPLACE FUNCTION log_punch_remove()
RETURNS TRIGGER AS $$
DECLARE
  v_trainer_id UUID;
  v_old_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Only log if is_deleted changed from FALSE to TRUE
  IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
    -- Get trainer_id and balance from client
    SELECT c.trainer_id, c.balance INTO v_trainer_id, v_old_balance
    FROM clients c
    WHERE c.id = NEW.client_id;

    v_new_balance := v_old_balance + 1;

    -- Log the action
    INSERT INTO audit_log (client_id, trainer_id, action, details, previous_balance, new_balance)
    VALUES (
      NEW.client_id,
      v_trainer_id,
      'PUNCH_REMOVE',
      jsonb_build_object(
        'punch_id', NEW.id,
        'punch_date', NEW.punch_date
      ),
      v_old_balance,
      v_new_balance
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log payment addition
CREATE OR REPLACE FUNCTION log_payment_add()
RETURNS TRIGGER AS $$
DECLARE
  v_trainer_id UUID;
  v_old_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get trainer_id and balance from client
  SELECT c.trainer_id, c.balance INTO v_trainer_id, v_old_balance
  FROM clients c
  WHERE c.id = NEW.client_id;

  v_new_balance := v_old_balance + NEW.classes_added;

  -- Log the action
  INSERT INTO audit_log (client_id, trainer_id, action, details, previous_balance, new_balance)
  VALUES (
    NEW.client_id,
    v_trainer_id,
    'PAYMENT_ADD',
    jsonb_build_object(
      'payment_id', NEW.id,
      'amount', NEW.amount,
      'classes_added', NEW.classes_added,
      'rate_at_payment', NEW.rate_at_payment,
      'payment_date', NEW.payment_date
    ),
    v_old_balance,
    v_new_balance
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log rate changes
CREATE OR REPLACE FUNCTION log_rate_change()
RETURNS TRIGGER AS $$
DECLARE
  v_trainer_id UUID;
BEGIN
  -- Get trainer_id from client
  SELECT trainer_id INTO v_trainer_id
  FROM clients
  WHERE id = NEW.client_id;

  -- Log the action
  INSERT INTO audit_log (client_id, trainer_id, action, details, previous_balance, new_balance)
  VALUES (
    NEW.client_id,
    v_trainer_id,
    'RATE_CHANGE',
    jsonb_build_object(
      'rate_history_id', NEW.id,
      'new_rate', NEW.rate,
      'effective_date', NEW.effective_date
    ),
    NULL, -- Rate changes don't affect balance directly
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_log_punch_add
  AFTER INSERT ON punches
  FOR EACH ROW
  EXECUTE FUNCTION log_punch_add();

CREATE TRIGGER trigger_log_punch_remove
  AFTER UPDATE ON punches
  FOR EACH ROW
  WHEN (NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE)
  EXECUTE FUNCTION log_punch_remove();

CREATE TRIGGER trigger_log_payment_add
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION log_payment_add();

CREATE TRIGGER trigger_log_rate_change
  AFTER INSERT ON rate_history
  FOR EACH ROW
  EXECUTE FUNCTION log_rate_change();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
