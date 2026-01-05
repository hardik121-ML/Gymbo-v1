# Supabase Setup Guide for Gymbo

This guide will walk you through setting up your Supabase project for Gymbo.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a free account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: gymbo (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free tier is perfect for MVP
5. Click "Create new project" and wait for it to provision (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll need these three values:
   - **Project URL**: Looks like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Long string starting with `eyJ...` (keep this secret!)

## Step 3: Configure Environment Variables

1. In your project root, create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 4: Run Database Migrations

You have two options to set up your database schema:

### Option A: Using Supabase SQL Editor (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/001_create_core_tables.sql`
   - `supabase/migrations/002_create_audit_and_rate_history.sql`
   - `supabase/migrations/003_enable_rls_policies.sql`
5. Click **Run** after pasting each file
6. Verify the tables were created in the **Table Editor**

### Option B: Using Supabase CLI

1. Install the Supabase CLI (already in package.json):

```bash
npx supabase login
```

2. Link your project (you'll need your project ref from the URL):

```bash
npx supabase link --project-ref your-project-ref
```

3. Push the migrations:

```bash
npx supabase db push
```

## Step 5: Verify Database Schema

1. Go to **Table Editor** in your Supabase dashboard
2. You should see these tables:
   - trainers
   - clients
   - punches
   - payments
   - rate_history
   - audit_log

3. Click on any table and verify the columns match our schema

## Step 6: Verify RLS is Enabled

1. Go to **Authentication** → **Policies** in your Supabase dashboard
2. For each table, you should see RLS is enabled and policies are listed
3. This ensures data security - trainers can only see their own data

## Step 7: Generate TypeScript Types (Optional but Recommended)

Once your database is set up, generate fresh TypeScript types:

```bash
npx supabase gen types typescript --project-id your-project-ref > types/database.types.ts
```

Replace `your-project-ref` with your actual project reference from the Supabase URL.

## Step 8: Test the Connection

1. Start your development server:

```bash
npm run dev
```

2. The app should start without errors
3. Check the browser console - you shouldn't see any Supabase connection errors

## Troubleshooting

### "Invalid API key" error
- Double-check your API keys in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart your dev server after changing `.env.local`

### Tables not appearing
- Make sure you ran all three migration files in order
- Check the SQL Editor for any error messages
- Verify you're looking at the correct project

### RLS policy errors
- Ensure RLS is enabled on all tables
- Verify the policies were created successfully
- Check that `auth.uid()` is being used correctly in policies

## Next Steps

Once Supabase is set up, you're ready to:
1. Build the authentication flow (signup/login)
2. Create the client management UI
3. Implement punch tracking
4. Add payment logging

## Useful Supabase Dashboard Links

- **Table Editor**: View and edit your data
- **SQL Editor**: Run custom queries
- **Authentication**: Manage users and auth settings
- **API Docs**: Auto-generated API documentation
- **Logs**: View real-time logs and errors

## Security Notes

- ✅ RLS is enabled on all tables
- ✅ Trainers can only access their own data
- ✅ Service role key should NEVER be exposed to the client
- ✅ All auth happens through Supabase Auth
- ✅ PIN hashes are stored securely (never plain text)

---

Need help? Check the [Supabase Documentation](https://supabase.com/docs) or ask in the project!
