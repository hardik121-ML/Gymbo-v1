-- ============================================================================
-- Migration: Add Credit Balance Tracking
-- ============================================================================
-- Adds credit_balance column to clients table to track monetary credit
-- from payment remainders (when payment doesn't divide evenly by rate)
-- ============================================================================

-- Add credit_balance column to clients table
ALTER TABLE clients ADD COLUMN credit_balance INTEGER DEFAULT 0 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN clients.credit_balance IS 'Monetary credit in paise from payment remainders. Can be used to pay for future classes.';

-- Backfill existing clients with 0 credit (already set by DEFAULT, but explicit)
UPDATE clients SET credit_balance = 0 WHERE credit_balance IS NULL;

-- Add check constraint to ensure credit is never negative
ALTER TABLE clients ADD CONSTRAINT clients_credit_balance_check CHECK (credit_balance >= 0);
