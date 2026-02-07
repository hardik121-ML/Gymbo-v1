# Running Migration 011: Brand Settings

## Quick Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Open SQL Editor**
   - Go to: https://supabase.com/dashboard/project/lwkucbtmtylbbdskvrnc/sql/new

2. **Copy Migration SQL**
   - Open `supabase/migrations/011_add_brand_settings.sql`
   - Copy all contents (Ctrl+A, Ctrl+C)

3. **Run Migration**
   - Paste into SQL Editor
   - Click "Run" button
   - Should see: "Success. No rows returned"

4. **Verify**
   - Click "New Query"
   - Paste this verification query:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'trainers'
   AND column_name IN ('brand_name', 'brand_address', 'brand_phone', 'brand_email');
   ```
   - Should return 4 rows showing the new columns

### Option 2: Supabase CLI

```bash
# From project root
npx supabase db push
```

## What This Migration Does

Adds 4 new columns to the `trainers` table:
- `brand_name` - Business/brand name (nullable)
- `brand_address` - Business address (nullable)
- `brand_phone` - Business phone number (nullable)
- `brand_email` - Business email (nullable)

All fields are nullable, so existing trainers won't be affected.

## After Migration

1. **Test the Feature**
   - Go to http://localhost:3000/clients (in dev mode)
   - Look for gear icon in header
   - Click gear icon → should open brand settings page
   - Fill in and save brand settings

2. **Production Deployment**
   - Migration runs automatically on Vercel deploy (if using Supabase CLI)
   - OR run manually via Supabase Dashboard before deploying

## Troubleshooting

**If migration fails:**
- Check you're logged into correct Supabase project
- Verify no existing columns with same names
- Check database connection is active

**If columns already exist:**
Migration will fail with "column already exists" error. This is safe - it means the migration was already run.

**Rollback (if needed):**
```sql
ALTER TABLE trainers
DROP COLUMN IF EXISTS brand_name,
DROP COLUMN IF EXISTS brand_address,
DROP COLUMN IF EXISTS brand_phone,
DROP COLUMN IF EXISTS brand_email;
```

## Next Steps

After migration is complete:
1. ✅ Restart dev server (if running)
2. ✅ Test brand settings page
3. ✅ Deploy to production
4. ✅ Test in production environment

---

For more detailed verification steps, see `scripts/verify-brand-settings.sql`
