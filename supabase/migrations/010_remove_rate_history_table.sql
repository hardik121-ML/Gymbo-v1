-- Migration 010: Remove rate_history table
-- This migration removes the redundant rate_history table and uses payments.rate_at_payment
-- as the source of historical rate information instead.
--
-- IMPORTANT: Run this migration AFTER verifying all rate changes are in audit_log:
-- SELECT COUNT(*) FROM rate_history;
-- SELECT COUNT(*) FROM audit_log WHERE action = 'RATE_CHANGE';
-- (Counts should match)

-- Step 1: Add rate_updated_at column to clients table
ALTER TABLE clients
ADD COLUMN rate_updated_at TIMESTAMPTZ;

-- Step 2: Backfill rate_updated_at from rate_history
-- For each client, set rate_updated_at to the most recent rate change date
-- If no rate changes exist, use created_at as fallback
UPDATE clients c
SET rate_updated_at = COALESCE(
  (
    SELECT MAX(effective_date)
    FROM rate_history rh
    WHERE rh.client_id = c.id
  ),
  c.created_at
);

-- Step 3: Make rate_updated_at NOT NULL after backfill
ALTER TABLE clients
ALTER COLUMN rate_updated_at SET NOT NULL;

-- Step 4: Drop the rate change trigger and function
DROP TRIGGER IF EXISTS trigger_log_rate_change ON rate_history;
DROP FUNCTION IF EXISTS log_rate_change();

-- Step 5: Drop RLS policies on rate_history
DROP POLICY IF EXISTS "trainer_isolation" ON rate_history;

-- Step 6: Drop indexes on rate_history
DROP INDEX IF EXISTS idx_rate_history_client_id;
DROP INDEX IF EXISTS idx_rate_history_effective_date;

-- Step 7: Drop the rate_history table entirely
DROP TABLE IF EXISTS rate_history CASCADE;

-- Verification queries (run these in Supabase SQL Editor after migration):
-- 1. Verify rate_history is gone:
--    SELECT table_name FROM information_schema.tables WHERE table_name = 'rate_history';
--    (Should return 0 rows)
--
-- 2. Verify rate_updated_at exists:
--    SELECT column_name FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'rate_updated_at';
--    (Should return 1 row)
--
-- 3. Verify all clients have rate_updated_at:
--    SELECT COUNT(*) FROM clients WHERE rate_updated_at IS NULL;
--    (Should return 0)
