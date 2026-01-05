-- ============================================================================
-- Gymbo Database Schema - Core Tables
-- Migration: 001_create_core_tables.sql
-- Based on: GYM-18 (Database schema - core tables)
-- ============================================================================

-- ============================================================================
-- 1. TRAINERS TABLE
-- ============================================================================
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster phone lookup
CREATE INDEX idx_trainers_phone ON trainers(phone);

-- ============================================================================
-- 2. CLIENTS TABLE
-- ============================================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  current_rate INTEGER NOT NULL, -- Rate in paise (₹1 = 100 paise)
  balance INTEGER NOT NULL DEFAULT 0, -- Can be negative (credit)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create composite unique constraint: phone must be unique per trainer
CREATE UNIQUE INDEX idx_clients_trainer_phone ON clients(trainer_id, phone)
  WHERE phone IS NOT NULL;

-- Create indexes for faster queries
CREATE INDEX idx_clients_trainer_id ON clients(trainer_id);
CREATE INDEX idx_clients_balance ON clients(balance);

-- ============================================================================
-- 3. PUNCHES TABLE
-- ============================================================================
CREATE TABLE punches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  punch_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE -- Soft delete
);

-- Create indexes for faster queries
CREATE INDEX idx_punches_client_id ON punches(client_id);
CREATE INDEX idx_punches_date ON punches(punch_date);
CREATE INDEX idx_punches_is_deleted ON punches(is_deleted);

-- ============================================================================
-- 4. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in paise
  classes_added INTEGER NOT NULL,
  rate_at_payment INTEGER NOT NULL, -- Snapshot of rate at payment time
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- ============================================================================
-- 5. AUTO-UPDATE TIMESTAMP FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for clients table
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
