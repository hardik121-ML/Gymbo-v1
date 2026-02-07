# Migration 010: Remove rate_history Table

## Overview

This migration removes the redundant `rate_history` table and simplifies the architecture. Historical rate information is already preserved in `payments.rate_at_payment` and `audit_log`, making the `rate_history` table unnecessary overhead.

## Pre-Migration Verification

**IMPORTANT**: Before running this migration, verify all rate changes are in the audit log:

```sql
-- Check counts match (should be equal)
SELECT COUNT(*) FROM rate_history;
SELECT COUNT(*) FROM audit_log WHERE action = 'RATE_CHANGE';
```

If the counts don't match, investigate the discrepancy before proceeding.

## Running the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Log in to your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor** (left sidebar)
3. Open the file `supabase/migrations/010_remove_rate_history_table.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** button
7. Verify success (should see "Success. No rows returned")

### Option 2: Supabase CLI

```bash
# Make sure you're in the project root
cd /Users/harora/Desktop/Gymbo-v1

# Link to your project (if not already linked)
npx supabase link --project-id lwkucbtmtylbbdskvrnc

# Push the migration
npx supabase db push
```

## Post-Migration Verification

Run these queries in Supabase SQL Editor to verify the migration succeeded:

```sql
-- 1. Verify rate_history is gone (should return 0 rows)
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'rate_history';

-- 2. Verify rate_updated_at exists (should return 1 row)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name = 'rate_updated_at';

-- 3. Verify all clients have rate_updated_at (should return 0)
SELECT COUNT(*)
FROM clients
WHERE rate_updated_at IS NULL;

-- 4. Sample a few clients to verify backfill worked
SELECT id, name, current_rate, rate_updated_at
FROM clients
LIMIT 5;
```

## What Changed

### Database Schema

**Removed:**
- `rate_history` table (entirely dropped)
- `trigger_log_rate_change` trigger
- `log_rate_change()` function
- All RLS policies on `rate_history`
- All indexes on `rate_history`

**Added:**
- `clients.rate_updated_at` column (TIMESTAMPTZ, NOT NULL)
  - Backfilled with most recent rate change date from `rate_history`
  - Falls back to `created_at` for clients with no rate changes

### Code Changes

**Files Modified:**
1. `app/api/clients/[id]/rate/route.ts` - Rate change now creates audit log manually (no rate_history insert)
2. `app/api/clients/route.ts` - Client creation sets `rate_updated_at`
3. `types/database.types.ts` - Removed `rate_history` type, added `rate_updated_at` to `clients`
4. `CLAUDE.md` - Updated documentation

**No UI Changes:**
- Audit timeline (`/clients/[id]/audit`) continues to work (reads from `audit_log`)
- All existing functionality preserved

## Testing Checklist

After running the migration, test these scenarios:

- [ ] **Create new client**
  - Go to `/clients/new`
  - Add a client with name, phone, rate
  - Verify no errors in browser console
  - Check database: `SELECT rate_updated_at FROM clients WHERE id = '[new-client-id]'` (should have a timestamp)

- [ ] **Change client rate**
  - Go to any client detail page
  - Click "Change Rate"
  - Set new rate and effective date
  - Verify success message
  - Check audit timeline - should show RATE_CHANGE event
  - Check database: `SELECT * FROM audit_log WHERE action = 'RATE_CHANGE' ORDER BY created_at DESC LIMIT 1`
    - Should have `details.old_rate` and `details.new_rate`

- [ ] **View audit timeline**
  - Go to `/clients/[id]/audit`
  - Verify all historical RATE_CHANGE events still display
  - Check for any console errors

- [ ] **Payment history**
  - Go to `/clients/[id]/history`
  - Verify historical payments show correct rates (from `payments.rate_at_payment`)

## Rollback Plan

If you need to rollback this migration:

```sql
-- Recreate rate_history table from audit_log
CREATE TABLE rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rate INTEGER NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Populate from audit_log
INSERT INTO rate_history (client_id, rate, effective_date, created_at)
SELECT
  client_id,
  (details->>'new_rate')::INTEGER,
  (details->>'effective_date')::DATE,
  created_at
FROM audit_log
WHERE action = 'RATE_CHANGE'
  AND client_id IS NOT NULL;

-- Add RLS policies
ALTER TABLE rate_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_isolation" ON rate_history
FOR ALL
USING (client_id IN (
  SELECT id FROM clients WHERE trainer_id = auth.uid()
));

-- Add indexes
CREATE INDEX idx_rate_history_client_id ON rate_history(client_id);
CREATE INDEX idx_rate_history_effective_date ON rate_history(effective_date);
```

## Why This Change?

**Before Migration 010:**
- Rate changes required inserting into `rate_history`
- Database trigger `trigger_log_rate_change` created audit log from `rate_history` insert
- Unnecessary indirection and extra table maintenance

**After Migration 010:**
- Rate changes create audit log directly in API code (like punches/payments already do)
- No intermediate `rate_history` table
- Simpler architecture, easier to maintain
- Historical rates still preserved in:
  - `audit_log` (all rate changes with timestamps)
  - `payments.rate_at_payment` (immutable rate snapshots)
  - `clients.rate_updated_at` (last change timestamp)

## Support

If you encounter any issues:
1. Check the build output: `npm run build --webpack`
2. Check Vercel deployment logs
3. Check browser console for errors
4. Verify migration SQL ran successfully (no errors in Supabase SQL Editor)
