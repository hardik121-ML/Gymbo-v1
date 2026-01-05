# 🚀 Quick Migration Guide

Your environment is configured! Now let's create the database tables.

## Option 1: Using Supabase Dashboard (Easiest - 5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Run Each Migration File

**Migration 1/3: Core Tables**
1. Copy the entire contents of `supabase/migrations/001_create_core_tables.sql`
2. Paste into the SQL Editor
3. Click **Run** (or press Cmd/Ctrl + Enter)
4. You should see: "Success. No rows returned"

**Migration 2/3: Audit & Rate History**
1. Click **New query** again
2. Copy the entire contents of `supabase/migrations/002_create_audit_and_rate_history.sql`
3. Paste and click **Run**
4. Success message should appear

**Migration 3/3: Row-Level Security**
1. Click **New query** again
2. Copy the entire contents of `supabase/migrations/003_enable_rls_policies.sql`
3. Paste and click **Run**
4. Success message should appear

### Step 3: Verify Tables Were Created

1. Click on **Table Editor** in the left sidebar
2. You should see these 6 tables:
   - ✅ trainers
   - ✅ clients
   - ✅ punches
   - ✅ payments
   - ✅ rate_history
   - ✅ audit_log

If you see all 6 tables, you're done! 🎉

---

## Option 2: Using Supabase CLI (Alternative)

If you prefer the command line:

```bash
# Login to Supabase
npx supabase login

# Link your project (get project-ref from your Supabase URL)
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

---

## ✅ After Running Migrations

Once migrations are complete, let's test the connection:

```bash
npm run dev
```

Then visit: http://localhost:3000/api/health

You should see:
```json
{
  "status": "ok",
  "message": "Supabase connection successful",
  "timestamp": "2025-01-05T..."
}
```

---

## 🐛 Troubleshooting

### "relation 'trainers' does not exist"
- The migrations didn't run successfully
- Double-check you ran all 3 migration files **in order**

### "permission denied for schema public"
- Your Supabase user needs proper permissions
- Try running the migrations as the postgres user in Supabase dashboard

### Syntax errors in SQL
- Make sure you copied the **entire** file contents
- Don't miss the first or last lines
- Run each migration file **completely** before moving to the next

---

## 📞 Need Help?

- Check SUPABASE_SETUP.md for detailed instructions
- Visit Supabase docs: https://supabase.com/docs
- Check the Supabase logs in your dashboard

---

Ready? Go run those migrations! 🚀
