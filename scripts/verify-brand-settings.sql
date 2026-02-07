-- Verification Script for Brand Settings Feature
-- Run these queries in Supabase SQL Editor to verify the implementation

-- ============================================================================
-- 1. Verify Columns Exist
-- ============================================================================
-- This should return 4 rows showing all brand columns are nullable

SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trainers'
  AND column_name IN ('brand_name', 'brand_address', 'brand_phone', 'brand_email')
ORDER BY column_name;

-- Expected output:
-- brand_address  | text           | NULL | YES
-- brand_email    | character varying | 255  | YES
-- brand_name     | character varying | 200  | YES
-- brand_phone    | character varying | 15   | YES

-- ============================================================================
-- 2. Verify Existing Trainers Have NULL Values
-- ============================================================================
-- All existing trainers should have NULL brand fields

SELECT
  id,
  name,
  phone,
  brand_name,
  brand_address,
  brand_phone,
  brand_email,
  created_at
FROM trainers
ORDER BY created_at DESC
LIMIT 5;

-- Expected: All brand_* columns should be NULL for existing trainers

-- ============================================================================
-- 3. Test Sample Data (Optional - for testing only)
-- ============================================================================
-- Uncomment and run to add sample brand settings to your trainer account
-- Replace <your-trainer-id> with your actual trainer ID from step 2

/*
UPDATE trainers
SET
  brand_name = 'FitZone Personal Training',
  brand_address = '123 Main Street, Mumbai 400001',
  brand_phone = '9876543210',
  brand_email = 'contact@fitzone.com'
WHERE id = '<your-trainer-id>';
*/

-- ============================================================================
-- 4. Verify RLS Policy Coverage
-- ============================================================================
-- Check that trainers_own_data policy allows SELECT and UPDATE

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'trainers';

-- Expected: trainers_own_data policy should show FOR ALL (covers SELECT and UPDATE)

-- ============================================================================
-- 5. Count Trainers With/Without Brand Settings
-- ============================================================================
-- Shows how many trainers have configured brand settings

SELECT
  COUNT(*) FILTER (WHERE brand_name IS NOT NULL) as trainers_with_brand,
  COUNT(*) FILTER (WHERE brand_name IS NULL) as trainers_without_brand,
  COUNT(*) as total_trainers
FROM trainers;

-- Expected initially: 0 with brand, all without brand

-- ============================================================================
-- Done!
-- ============================================================================
