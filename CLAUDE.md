# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Most Common Commands:**
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build --webpack  # Production build (requires --webpack flag for Next.js 16)
npm run lint             # Run ESLint

# Regenerate database types after schema changes
npx supabase gen types typescript --project-id lwkucbtmtylbbdskvrnc > types/database.types.ts
```

**Most Common Patterns:**
```typescript
// Get authenticated user in Server Components
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Currency: Always store in PAISE (₹800 = 80000 paise)

// Wrap all pages in MobileLayout for consistent UI
<MobileLayout title="Page Title" showBackButton={true} backHref="/back">
```

**Most Important Files:**
- `proxy.ts` - Next.js 16 auth proxy (NOT middleware.ts - this is the Next.js 16 way)
- `lib/supabase/server.ts` - Server-side Supabase client (respects RLS)
- `lib/supabase/client.ts` - Browser client for Client Components
- `types/database.types.ts` - Generated TypeScript types from database
- `supabase/migrations/` - Database schema migrations (run in order!)

**Key Architecture Decisions:**
- ✅ All monetary amounts in PAISE (not rupees) to avoid floating-point issues
- ✅ Supabase Auth (not custom JWT) - zero cost, battle-tested
- ✅ Soft deletes (is_deleted flag) - never lose data
- ✅ Audit logs via API code (not database triggers) for credit tracking
- ✅ shadcn/ui dark theme only (no light mode toggle)

## Project Overview

Gymbo is a mobile-first Progressive Web App (PWA) for independent personal trainers in India to track client classes (punches), payments, and balances. It's a "punch card tracker" - trainers log classes, record payments, and the app automatically calculates how many classes each client has remaining.

**Target User**: Mobile-first personal trainers who travel to clients' homes. Smartphone-only access, needs to work quickly while on the move.

**Key Constraint**: Zero-cost auth (no external auth provider), mobile-first UI, works across all browsers.

**Tech Stack**:
- Next.js 16 (App Router) + TypeScript + React 19
- shadcn/ui + Tailwind CSS v4 for styling (dark theme)
- Supabase (PostgreSQL + Supabase Auth for phone + SMS OTP authentication via Twilio Verify)
- Serwist for PWA/service worker functionality

## Production Deployment

**Status**: ✅ **LIVE IN PRODUCTION**

**Production URL**: https://gymbo-v1.vercel.app

**Deployment Platform**: Vercel
- Auto-deploys from `main` branch
- Preview deployments on feature branches
- Environment variables configured in Vercel dashboard

**Environment Variables** (Production):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (e.g., `https://lwkucbtmtylbbdskvrnc.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (starts with `eyJ...`, safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, SECRET, rarely needed)
- ~~`JWT_SECRET`~~ - **REMOVED** after migration to Supabase Auth (safe to delete from Vercel if still present)

**Security Notes**:
- ⚠️ Never commit production secrets to git
- ⚠️ Local secrets stay in `.env.local` (gitignored)
- ⚠️ Production secrets managed via Vercel dashboard only
- ⚠️ Sessions managed by Supabase Auth (no custom JWT secret needed)

**Common Deployment Issues**:
- **"Invalid API key" error**: Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel exactly matches the anon key from Supabase dashboard (starts with `eyJ`, often gets truncated when copy-pasting)
- **Login works locally but fails in production**: Verify all three Supabase env vars match between `.env.local` and Vercel dashboard
- **After env var changes**: Always trigger a manual redeploy in Vercel (env var updates don't auto-redeploy)

**Deployment History**:
- **2026-02-05**: Visual enhancements and animation system (GYM-36, GYM-37, GYM-38)
  - Punch card visual component with 20-dot grid display (GYM-38)
  - Success overlays for punch and payment actions (GYM-37)
  - Comprehensive motion/animation system with accessibility support (GYM-36)
  - New components: PunchCard, SuccessOverlay
  - Animations: screen transitions, list stagger, button press feedback
  - Full prefers-reduced-motion support for accessibility
- **2026-01-12**: Additional features (GYM-27, GYM-29, GYM-30, GYM-31)
  - Bulk import clients from phone contacts via Contact Picker API (GYM-27)
  - "Choose a date" link added to punch button for better UX (GYM-29)
  - Swipe-to-delete clients with undo functionality (GYM-30, migration 008)
  - Full audit timeline view showing complete client history (GYM-31)
  - New components: SwipeableClientCard, ImportContactsButton, ImportReviewModal, AuditTimeline, AuditEventItem, Toast
- **2026-01-11**: Audit log architecture refactor
  - Fixed audit_log RLS policy to allow INSERT operations (migration 006)
  - Removed duplicate audit triggers to prevent double-logging (migration 007)
  - All audit logs now created by API code with full credit tracking details
  - Rate changes still use database trigger (only non-duplicated trigger)
- **2026-02-03**: Migration to Phone + OTP Authentication
  - Migrated from email/password to phone + SMS OTP via Twilio Verify
  - Indian mobile numbers only (+91XXXXXXXXXX format)
  - Two-step authentication flow (phone entry → OTP verification)
  - 60-second OTP expiry with resend functionality
  - Edge case handling: duplicate signup prevention, unregistered login detection
  - Database migration 009: phone now required and unique
- **2026-01-10**: Migration to Supabase Auth
  - Replaced custom JWT auth with Supabase Auth
  - Removed bcryptjs and jsonwebtoken dependencies
  - Updated all authentication flows and RLS policies
- **2026-01-06**: Initial production deployment
  - Complete shadcn/ui migration
  - PWA configuration complete
  - TypeScript fully type-safe
  - All MVP features implemented

## Development Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000 (uses Turbopack)

# Production
npm run build        # Build for production (uses --webpack flag for Webpack mode)
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint (configured via eslint.config.mjs)

# Database
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts

# Testing
# Note: No test suite currently implemented
```

**Important Build Notes**:
- The build command uses `--webpack` flag (`next build --webpack`) because Next.js 16 uses Turbopack by default in dev mode but requires explicit Webpack mode for production builds
- Dev mode runs with Turbopack for faster HMR (Hot Module Replacement)
- The project uses Serwist for PWA functionality (service worker in `app/sw.ts`, compiled to `public/sw.js`), which is disabled in development mode

**ESLint Configuration**: The project uses the modern ESLint flat config format (`eslint.config.mjs`) instead of the legacy `.eslintrc` format. This is the new standard for ESLint 9+.

**Note**: The app uses Next.js 16 with shadcn/ui components and Tailwind CSS v4 in dark mode. The root page (`app/page.tsx`) automatically redirects authenticated users to `/clients` and unauthenticated users to `/login`.

## Project Documentation

**CLAUDE.md** (this file): Source of truth for architecture and development practices
**README.md**: Production-ready overview with getting started instructions
**prd.md**: Full product requirements document
**SUPABASE_SETUP.md**: Detailed Supabase setup instructions
**RUN_MIGRATIONS.md**: Quick migration instructions

## Architecture

### Authentication System (Supabase Auth + Twilio Verify)

**Important**: We use Supabase Auth with phone + SMS OTP authentication via Twilio Verify. This is included free in Supabase's free tier (up to 50,000 MAU). Twilio SMS costs ~₹0.66 per OTP (~$0.008 USD).

**Flow**:
1. **Signup**: Trainer enters name + phone (+91XXXXXXXXXX format)
   - System checks if phone already exists (admin client to bypass RLS)
   - If phone is new, sends 6-digit OTP via Twilio Verify (60-second expiry)
   - Trainer enters OTP to verify
   - On successful verification: creates auth user + trainer record
2. **Login**: Trainer enters phone number
   - System checks if phone exists in trainers table (admin client)
   - If exists, sends 6-digit OTP via Twilio Verify (60-second expiry)
   - Trainer enters OTP to verify
   - On successful verification: creates session
3. Sessions are managed automatically by Supabase (cookies, token refresh)
4. Sessions are validated in `proxy.ts` (Next.js 16 proxy)

**Two-Step UI Flow**:
- Step 1: Phone entry (10 digits, displays with +91 prefix)
- Step 2: OTP verification (6-digit code, 60s expiry, resend option)

**Key Files**:
- `lib/supabase/server.ts` - Server-side Supabase client for auth and queries
- `lib/supabase/admin.ts` - Admin client for pre-auth phone existence checks (bypasses RLS)
- `proxy.ts` - Next.js 16 proxy that checks Supabase Auth sessions and redirects
- `app/api/auth/signup/route.ts` - Signup endpoint (checks phone existence, sends OTP)
- `app/api/auth/login/route.ts` - Login endpoint (checks phone existence, sends OTP)
- `app/api/auth/verify-otp/route.ts` - OTP verification endpoint (creates trainer record if signup)
- `app/api/auth/logout/route.ts` - Logout endpoint (uses Supabase signOut)
- `app/(auth)/signup/page.tsx` - Two-step signup UI
- `app/(auth)/login/page.tsx` - Two-step login UI

**Data Storage**:
- Authentication credentials: Stored in `auth.users` (managed by Supabase)
- Trainer profile: Stored in `trainers` table (name, phone - both required)
- `trainers.id` = `auth.users.id` (linked)
- Phone numbers stored in E.164 format: +91XXXXXXXXXX (unique constraint)

**Edge Cases Handled**:
- **Duplicate signup**: Checks if phone exists BEFORE sending OTP (saves SMS cost)
- **Unregistered login**: Checks if phone exists BEFORE sending OTP (saves SMS cost)
- **RLS bypass**: Uses admin client for pre-auth queries (unauthenticated API routes can't query trainers table)

**Cost Optimization**:
- Phone existence checks happen BEFORE sending OTP to avoid unnecessary SMS costs
- Admin client (`createAdminClient()`) bypasses RLS for pre-auth queries

**Why Supabase Auth + Twilio?**
- Battle-tested security (OTP generation, expiry, token management)
- Low cost (~₹0.66 per OTP, only charged when OTP is sent)
- Zero-infrastructure (no custom SMS gateway needed)
- RLS works automatically with `auth.uid()`
- Mobile-first UX (no password typing on small screens)

### Database Architecture

**Supabase PostgreSQL with Row-Level Security (RLS)**

Core tables:
- `trainers` - Trainer profiles (id matches auth.users.id, name, phone - both required, phone is unique, brand_name, brand_address, brand_phone, brand_email - all nullable)
- `clients` - Clients belonging to trainers (name, phone, current_rate, balance, credit_balance, is_deleted, rate_updated_at)
- `punches` - Class records (client_id, punch_date, is_deleted for soft delete)
- `payments` - Payment records (client_id, amount, classes_added, rate_at_payment)
- `audit_log` - Audit trail of all actions (client_id, action, details JSON)
- ~~`rate_history`~~ - **REMOVED** in migration 010 (historical rates tracked via payments.rate_at_payment and audit_log)

**Balance Calculation**:
- Balance = (sum of classes from payments) - (count of active punches)
- Stored denormalized in `clients.balance` for performance
- Can go negative (trainer extends credit)

**Credit Balance System** (GYM-26):
- `credit_balance` column tracks monetary credit in paise (separate from class balance)
- Payment remainders are automatically stored as credit (e.g., ₹10,500 at ₹2,500/class = 4 classes + ₹500 credit)
- Credit can be explicitly used during payments via "Use Credit Balance" checkbox
- Credit is automatically used when punching classes (if credit ≥ rate, deduct from credit instead of balance)
- All credit operations logged to audit trail with detailed breakdown

**RLS Policies**: All tables enforce trainer isolation - trainers can only access their own data via `trainer_id` foreign keys.

**Migrations**: Located in `supabase/migrations/`. Run manually via Supabase SQL Editor or `npx supabase db push`.
- `001_create_core_tables.sql` - Core tables (trainers, clients, punches, payments)
- `002_create_audit_and_rate_history.sql` - Audit log and rate history tables with triggers
- `003_enable_rls_policies.sql` - Row-Level Security policies
- `004_add_credit_balance.sql` - Credit balance system (GYM-26)
- `005_migrate_to_supabase_auth.sql` - Supabase Auth migration (links trainers to auth.users)
- `006_fix_audit_log_rls.sql` - Add INSERT policy for audit_log (fixes RLS violation)
- `007_remove_duplicate_triggers.sql` - Remove duplicate audit triggers (keeps API code logging only)
- `008_add_client_soft_delete.sql` - Add is_deleted column to clients table (GYM-30)
- `009_migrate_to_phone_auth.sql` - Phone + OTP authentication migration (phone required and unique)
- `010_remove_rate_history_table.sql` - Remove rate_history table, add rate_updated_at to clients (simplifies architecture)
- `011_add_brand_settings.sql` - Add brand settings columns to trainers table (brand_name, brand_address, brand_phone, brand_email - all nullable)

### Audit Log Architecture

**Important**: The audit log system was refactored to eliminate duplicate entries and add credit tracking.

**Current Implementation** (as of migrations 006, 007 & 010):
- **API Code Logging**: All audit logs are created manually in API routes via `supabase.from('audit_log').insert(...)`
- **Database Triggers**: None (all removed as of migration 010)
- **No Duplicates**: No triggers to prevent double-logging

**Audit Log Actions**:
- `PUNCH_ADD` - API code logs with: punch_id, punch_date, paid_with_credit, credit_used, previous_credit, new_credit, balance changes
- `PUNCH_EDIT` - API code logs with: punch_id, old_date, new_date (no balance change)
- `PUNCH_REMOVE` - API code logs with: punch_id, punch_date, balance changes
- `PAYMENT_ADD` - API code logs with: payment_id, amount, classes_added, rate_at_payment, payment_date, credit_used, credit_added, previous_credit, new_credit, balance changes
- `RATE_CHANGE` - API code logs with: new_rate, old_rate, effective_date (no balance change)
- `CLIENT_UPDATE` - API code logs with: previous/updated objects containing name/phone (no balance change)

**Why API Code Over Triggers?**
- Credit tracking (GYM-26) requires detailed calculations done in application logic
- Triggers can't access the context needed for credit_used, credit_added, paid_with_credit fields
- API code has full transaction context and can log more detailed information
- Easier to debug and maintain audit logic in TypeScript than in PL/pgSQL

**RLS Policy**: Migration 006 added INSERT policy allowing trainers to insert their own audit logs (`trainer_id = auth.uid()`)

### Supabase Client Strategy

**Two types of clients**:

1. **Server Client** (`lib/supabase/server.ts`):
   - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Respects RLS (automatically filters by `auth.uid()`)
   - For Server Components, API routes, and auth operations
   - Handles authentication via `supabase.auth.getUser()`
   - Primary client for all server-side operations

2. **Browser Client** (`lib/supabase/client.ts`):
   - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Respects RLS
   - For Client Components
   - Used for real-time subscriptions and client-side mutations

**Admin Client** (`lib/supabase/admin.ts`):
- Still exists but rarely needed
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Only use for administrative operations that need to bypass security
- NOT used for normal auth or data operations

### Next.js 16 Routing

**Route Groups**:
- `app/(auth)/` - Unauthenticated pages (login, signup)
- `app/(main)/` - Protected pages requiring authentication (clients, etc.)
- `app/page.tsx` - Root page that redirects to `/clients` (authenticated) or `/login` (unauthenticated)

**Proxy vs Middleware**: Next.js 16 uses `proxy.ts` (at the project root) instead of the older `middleware.ts` from previous Next.js versions. This is the Next.js 16 way of intercepting requests. The proxy function:
- Checks Supabase Auth sessions via `supabase.auth.getUser()`
- Redirects authenticated users away from auth pages (`/login`, `/signup`) to `/clients`
- Redirects unauthenticated users from protected pages (`/clients`) to `/login`
- Uses a matcher config to exclude static files and images from processing: `_next/static`, `_next/image`, `favicon.ico`, and all image extensions (svg, png, jpg, jpeg, gif, webp)
- Properly handles Supabase cookie management for session persistence

**Important**: When adding new protected routes, update the `isProtectedPage` check in `proxy.ts` to include the new route pattern (see "Adding a New Protected Page" section below).

### Data Model: Currency

**All monetary amounts stored in PAISE (not rupees)**:
- Example: ₹800 stored as 80000 (paise)
- Rationale: Avoid floating-point precision issues
- Convert to rupees only in UI display layer

### TypeScript Types

**Status**: ✅ **Fully Type-Safe** - Proper Supabase TypeScript types have been generated from the database schema.

The `types/database.types.ts` file contains complete type definitions for all database tables, including:
- `trainers` - Trainer accounts (linked to Supabase Auth)
- `clients` - Client records with balance, rate, and credit tracking
- `punches` - Class attendance records
- `payments` - Payment history with rate snapshots
- `rate_history` - Historical rate changes
- `audit_log` - Complete audit trail with typed actions

All Supabase clients (`admin.ts`, `server.ts`, `client.ts`) import and use these types automatically. TypeScript now provides:
- **Full autocomplete** for all table columns
- **Type checking** for insert/update operations
- **Compile-time safety** for database queries
- **Zero `as any` workarounds** throughout the codebase

**Regenerating Types**: If you modify the database schema, regenerate types with:
```bash
npx supabase gen types typescript --project-id lwkucbtmtylbbdskvrnc > types/database.types.ts
```

The types are manually maintained based on migration files to avoid requiring Supabase CLI authentication.

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-side only, rarely needed with Supabase Auth
```

**How to get Supabase credentials**: See `SUPABASE_SETUP.md` for complete setup instructions.

**Security**:
- `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS - rarely needed with Supabase Auth
- Sessions are managed automatically by Supabase (cookies, tokens, refresh)
- No custom JWT secret needed - Supabase handles all auth token signing

## Mobile-First UI Principles

From PRD requirements:
- **One-thumb operation**: Primary actions reachable with thumb
- **Punch-first**: Recording a class should be <3 taps
- **Glanceable**: Red/yellow/green balance indicators
- **Mobile keyboard optimizations**: `inputMode="numeric"` for phone/PIN inputs

## Implemented Features

### Client Management (GYM-14, GYM-13, GYM-12, GYM-25, GYM-24, GYM-27, GYM-30, GYM-31)

**Client List** (`/clients`):
- Displays all clients with balance indicators (🔴 negative, 🟡 low ≤3, 🟢 healthy >3)
- **Swipe-to-delete** (GYM-30) - Swipe left to reveal delete button, confirmation dialog, 4-second undo window
  - Uses `SwipeableClientCard` component with touch + mouse event support for desktop testing
  - Soft delete pattern (`is_deleted = true`) preserves historical data
  - Shows toast notification with undo action
- Sortable by: Recent (default), Name, Balance
- Empty state for new trainers
- Server Component that fetches data on page load
- Uses `ClientList` component for sorting (Client Component)
- `LogoutButton` component for logout (must use POST, not GET)

**Add Client** (`/clients/new`):
- Form with validation: name (required, ≥2 chars), phone (optional, valid Indian mobile), rate (₹100-₹10,000)
- Converts rate from rupees to paise before storing
- Creates client, initial rate_history entry, and audit log
- Client Component with form state management
- API: `POST /api/clients`

**Bulk Import Clients** (GYM-27):
- `ImportContactsButton` component on client list page
- Uses Contact Picker API (Chrome/Edge Android only, progressive enhancement)
- Shows disabled state with tooltip on unsupported browsers
- **Browser Compatibility**: Contact Picker API only works on Chrome/Edge Android (not iOS Safari). The button gracefully degrades to disabled state with a tooltip on unsupported browsers.
- `ImportReviewModal` with two-screen flow: review contacts → import results
- Detects duplicates by phone number
- Normalizes phone numbers (removes +91 country code, validates Indian mobile format)
- Sets `current_rate = 0` for bulk-imported clients
- Logs CLIENT_ADD action for each imported client
- API: `POST /api/clients/bulk-import`

**Client Detail** (`/clients/[id]`):
- Shows client name, balance (large), rate, balance status text
- Color-coded balance display (red/yellow/green)
- **Credit balance badge** (GYM-26) - Blue badge showing "💳 Credit: ₹X" when credit > 0
- **Negative balance alert** - Red warning banner when balance < 0, shows amount owed and "Log Payment" CTA
- **Grouped punches list** (GYM-10) - Punches grouped by month with pagination (20 per page)
- Empty state for clients with no punches yet
- Large "PUNCH CLASS" button (fixed at bottom for thumb reach) with "or choose a date" link (GYM-29)
- Action buttons: Log Payment, Payments (payment history), Full History (audit timeline), Change Rate, Edit Client
- Server Component that fetches client and punch data

**Edit Client** (`/clients/[id]/edit` - GYM-25):
- Form to edit client name and phone number
- Validation: name (required, ≥2 chars), phone (optional, valid Indian mobile)
- Rate editing is separate (see Change Rate below)
- Client Component with form state management
- API: `PATCH /api/clients/[id]`

**Change Rate** (GYM-24):
- Modal form accessible from client detail page
- Set new rate with effective date (defaults to today)
- Validates rate between ₹100-₹10,000
- Creates entry in rate_history table
- New rate only applies to future payments (historical payments preserve rate_at_payment)
- Logs RATE_CHANGE to audit trail
- API: `PATCH /api/clients/[id]/rate`

**Payment History** (`/clients/[id]/history`):
- Table view of all payments for a client
- Shows: date, amount (₹), classes added, rate at payment time
- Summary totals at bottom
- Empty state when no payments exist
- Server Component that fetches payment data

**Audit Timeline / Full History** (`/clients/[id]/audit` - GYM-31):
- Timeline view showing ALL historical activity for a client
- Groups events by month with sticky month headers
- Vertical timeline line connecting events (1px, rgba(235, 235, 230, 0.2))
- Event types with color-coded Lucide icons:
  - 👊 PUNCH_ADD (green CircleDot) - date/time, credit indicator, balance changes
  - ❌ PUNCH_REMOVE (red CircleX) - "Removed" + original date, balance changes
  - ✏️ PUNCH_EDIT (blue Edit) - old date → new date
  - 💳 PAYMENT_ADD (green CreditCard) - amount, +classes, rate, credit used/added, balance changes
  - 🎯 RATE_CHANGE (orange Edit2) - new rate, effective date
  - ➕ CLIENT_ADD (blue UserPlus) - creation timestamp
  - ✏️ CLIENT_UPDATE (blue Edit) - name/phone changes
  - 🗑️ CLIENT_DELETE (red UserX) - soft delete indicator
- Empty state: "no history yet"
- Components: `AuditTimeline`, `AuditEventItem`
- Pulls from `audit_log` table (no database changes needed)

### Punch Tracking (GYM-11, GYM-8, GYM-9, GYM-29)

**Punch Class Action** (GYM-11, GYM-26, GYM-29):
- `PunchClassButton` component - large CTA at bottom of client detail page
- **"or choose a date" link** (GYM-29) - Centered text link below button, triggers same date picker modal
  - Underlined, 50% opacity, hover to 100%, 44px tap target for accessibility
- Date picker modal (defaults to today, allows up to 3 months back, no future dates)
- **Credit Auto-Usage** (GYM-26): If credit ≥ rate, deducts from credit (balance unchanged)
  - Otherwise, decrements balance by 1 (credit unchanged)
  - Logs whether punch was paid with credit or balance in audit trail
- Success feedback: checkmark animation + haptic vibration (if supported)
- Auto-refreshes page to show updated balance/credit and punch list
- API: `POST /api/clients/[id]/punches`
- Validates dates: no future, max 3 months old
- Transaction-safe: rolls back punch if balance update fails

**Remove Punch** (GYM-8):
- `PunchListItem` component with edit (✎) and delete (✕) buttons
- Delete flow: confirmation → strike-through animation → 5-second undo snackbar → success
- Soft delete: sets `is_deleted = true` on punch record
- Restores balance (+1 class) when punch is removed
- Haptic feedback at each step
- API: `DELETE /api/punches/[id]`
- Logs PUNCH_REMOVE to audit trail

**Edit Punch Date** (GYM-9):
- Edit button (✎) on each punch opens date picker modal
- Pre-filled with current punch date
- Validates: within last 3 months, no future dates
- Balance remains unchanged (still counts as 1 punch)
- API: `PATCH /api/punches/[id]`
- Logs PUNCH_EDIT with old and new dates to audit trail

### Payment Management (GYM-6, GYM-4, GYM-1, GYM-26)

**Log Payment Action** (GYM-6, GYM-26):
- `LogPaymentButton` component - button in action grid on client detail page
- Modal form with amount, classes, and date fields
- **Auto-calculation**: Amount ÷ Rate = Classes (Math.floor for rounding down)
- Shows calculation: "₹8000 ÷ ₹800 = 10 classes"
- **Manual override**: Click ✎ to edit classes, click again to reset to auto-calculated
- **Credit Balance Usage** (GYM-26): "Use Credit Balance" checkbox appears when credit > 0
  - When checked, includes credit in auto-calculation: (Amount + Credit) ÷ Rate = Classes
  - Shows breakdown: "(₹665 + ₹35 credit) ÷ ₹100 = 7 classes"
  - Validates credit usage doesn't exceed available credit
- **Payment Remainders** (GYM-26): Automatically stored as credit
  - Example: ₹10,500 at ₹2,500/class = 4 classes + ₹500 credit
  - Credit displayed on client page and in payment history
- **Balance preview**: Shows "current + classes = new balance" and credit changes
- Payment date picker (defaults to today)
- Records payment, increments balance, updates credit, logs PAYMENT_ADD to audit trail
- API: `POST /api/clients/[id]/payments`
- Body accepts optional `creditUsed` parameter (in paise)
- Stores rate_at_payment for historical accuracy
- Transaction-safe: rolls back payment if balance update fails

**Payment History View** (GYM-4, GYM-26):
- Accessible from "View History" button on client detail page
- Route: `/clients/[id]/history`
- Table view showing all payments in reverse chronological order
- Columns: Date, Amount (₹), Classes added, Rate at time of payment
- Shows credit indicators:
  - "+₹X credit used" (blue) when existing credit was applied to payment
  - "+₹X credit added" (green) when payment created new credit from remainder
- Fetches credit data from audit trail logs
- Backward compatible: calculates credit for old payments without audit logs
- Summary footer with totals (total amount, total classes)
- Empty state when no payments exist
- Read-only view (no edit/delete in MVP)

**Negative Balance Alert** (GYM-1):
- `NegativeBalanceAlert` component shows when balance < 0
- Prominent red warning banner on client detail page
- Displays: "X classes on credit" and calculated amount owed
- "Log Payment" CTA button that triggers payment modal
- Non-blocking, informational only (trainer can still punch classes)
- Client list already shows red indicator for negative balances via `BalanceIndicator`

### Brand Settings

**Brand Settings Page** (`/settings/brand`):
- Configure business details for PDF statements and exports
- Form fields: Business Name, Business Address, Business Phone (all required), Business Email (optional)
- Validation: name ≥2 chars, address ≥5 chars, phone 10 digits (6-9), email format
- Phone field shows +91 prefix with numeric keyboard
- Preview link shows "Coming Soon" dialog (PDF export not yet implemented)
- Accessible via settings gear icon in header (only on /clients page)
- API: `GET /api/trainers`, `PATCH /api/trainers`
- Database: `trainers.brand_name`, `trainers.brand_address`, `trainers.brand_phone`, `trainers.brand_email` (all nullable)

**Navigation**:
- Settings gear icon appears in header on `/clients` page only
- Located between custom header actions and logout button
- Ghost button style with 9x9 size for consistency with back button
- Links to `/settings/brand`

### PDF Export (MAT-92, MAT-93, MAT-94, MAT-95)

**Per-Client PDF Export**:
- `ExportClientPDFButton` component on client detail page (6th button in action grid)
- Opens `ExportModal` with three-screen flow:
  1. Date range selection (Last 30 days, Last 3 months, All time, Custom)
  2. Generating PDF (loading spinner)
  3. Success confirmation (SuccessOverlay with file name)
- Date range selector with validation (start ≤ end, no future dates)
- API: `GET /api/clients/[id]/export-data?startDate=&endDate=`
- PDF Generator: `generateClientPDF()` (client-side using jsPDF)

**PDF Layout - Client Statement**:
```
CLIENT STATEMENT
─────────────────────────────────────
Trainer: [brand_name or "Gymbo Trainer"]
Address: [brand_address or "Address not set"]
Phone: [brand_phone or "Phone not set"]
Email: [brand_email if exists]
─────────────────────────────────────
Client: [name]
Phone: [phone]
Period: [date range label]
─────────────────────────────────────
CLASSES ATTENDED
[Table: Date | Paid with Credit]
─────────────────────────────────────
PAYMENTS RECEIVED
[Table: Date | Amount | Classes | Rate]
  (+₹X credit used) - if applicable
  (+₹X credit added) - if applicable
─────────────────────────────────────
CURRENT BALANCE: [X] classes
Credit Balance: ₹[Y]
Amount Due: ₹[Z] (if negative balance)
─────────────────────────────────────
Generated on [date] via Gymbo
```

**All Clients PDF Export**:
- `ExportAllClientsButton` component on client list page (3rd button in ClientPageActions)
- Opens `ExportModal` with same three-screen flow
- API: `GET /api/clients/export-all?startDate=&endDate=`
- PDF Generator: `generateAllClientsPDF()` (client-side using jsPDF)

**PDF Layout - All Clients Summary**:
```
ALL CLIENTS SUMMARY
─────────────────────────────────────
Trainer: [brand_name]
Period: [date range label]
─────────────────────────────────────
SUMMARY STATISTICS
Total Clients: [X]
Total Classes (Remaining): [Y]
Total Payments Received: ₹[Z]
Total Outstanding: ₹[A]
─────────────────────────────────────
CLIENT LIST (Sorted by Balance)
[Table: Name | Phone | Balance | Amount Due]
─────────────────────────────────────
Generated on [date] via Gymbo
```

**Technical Details**:
- Client-side PDF generation (jsPDF library) for offline PWA support
- File naming: `{ClientName}_Statement_{Date}.pdf` and `All_Clients_Summary_{Date}.pdf`
- Auto-pagination with page breaks for large datasets
- Missing brand settings fallback to placeholders
- Empty data shows "No classes/payments in selected period"
- Credit information enriched from audit logs
- Performance: < 5s for 50 clients

**Components**:
- `DateRangeSelector` - Date range picker with presets and custom range
- `ExportModal` - Three-screen modal (select → generating → success)
- `ExportClientPDFButton` - Trigger button for single client export
- `ExportAllClientsButton` - Trigger button for all clients export

**PDF Utilities** (`lib/pdf/`):
- `types.ts` - TypeScript type definitions (ClientPDFData, AllClientsPDFData)
- `pdfTemplate.ts` - Shared template utilities (header, footer, table rendering)
- `generateClientPDF.ts` - Single client statement generator
- `generateAllClientsPDF.ts` - All clients summary generator

### Components Library

**Reusable Components** (`components/`):
- `MobileLayout` - Mobile-first layout shell with header, back button, and optional logout (GYM-15)
  - Now includes screen-enter animation for smooth page transitions (GYM-36)
- `BalanceIndicator` - Visual status dot (red/yellow/green) based on balance
- `ClientCard` - Client list item with name, balance, rate, credit (GYM-26), clickable
- `SwipeableClientCard` - Swipeable wrapper for ClientCard with delete functionality (GYM-30)
  - Touch + mouse event handlers for desktop testing
  - Confirmation dialog, toast notification with undo
- `ClientList` - Sortable client list with filter controls and stagger animations (GYM-36)
  - Each client card animates in with 50ms delay between items
- `ClientPageActions` - Wrapper for Add Client + Import Contacts + Export All buttons (GYM-27, MAT-92)
- `ImportContactsButton` - Contact Picker API integration with progressive enhancement (GYM-27)
- `ImportReviewModal` - Two-screen modal for reviewing and importing contacts (GYM-27)
- `ClientBalanceCard` - Large balance display with color-coded status and credit badge
- `PunchCard` - Visual 20-dot punch card showing classes used/remaining (GYM-38)
  - 2 rows × 10 columns, cream background, bounce animation on fill
  - Shows overflow indicator for negative balance
- `PunchClassButton` - Primary action button with date picker modal and "or choose a date" link (GYM-29)
  - Shows SuccessOverlay after punch with updated balance
- `PunchesListGrouped` - Punches grouped by month with pagination (GYM-10)
- `PunchListItem` - Individual punch row with edit (✎) and delete (✕) buttons
- `LogPaymentButton` - Payment form with "Use Credit Balance" checkbox (GYM-26), increases balance
  - Shows SuccessOverlay after payment with classes added count
- `NegativeBalanceAlert` - Red warning banner for negative balances with CTA
- `ClientDetailActions` - Wrapper that manages alert and payment button interaction
- `SuccessOverlay` - Full-screen success confirmation overlay (GYM-37)
  - Dark semi-transparent background with pulsing green check icon
  - Auto-dismiss after 2s or tap to dismiss
  - Used for punch, payment, and PDF export confirmations
- `DateRangeSelector` - Date range picker with presets and custom range (MAT-92)
  - Radio buttons for Last 30 days, Last 3 months, All time, Custom
  - Custom date inputs with validation (start ≤ end, no future dates)
- `ExportModal` - Three-screen modal for PDF export (MAT-92)
  - Screen 1: Date range selection, Screen 2: Generating, Screen 3: Success
  - Fetches data from API, generates PDF client-side, shows success overlay
- `ExportClientPDFButton` - Trigger button for single client PDF export (MAT-92)
- `ExportAllClientsButton` - Trigger button for all clients summary PDF export (MAT-92)
- `AuditTimeline` - Timeline component with month grouping and sticky headers (GYM-31)
- `AuditEventItem` - Individual audit event with icons and rich formatting (GYM-31)
- `Toast` - Reusable toast notification with auto-dismiss and optional undo button (GYM-30)
- `LogoutButton` - Logout with POST request handling

**Loading Skeletons** (`components/LoadingSkeletons.tsx` - GYM-15):
- `ClientListSkeleton` - Animated skeleton for client list loading state
- `ClientDetailSkeleton` - Animated skeleton for client detail page
- `FormSkeleton` - Animated skeleton for form pages
- `PaymentHistorySkeleton` - Animated skeleton for payment history
- `PageSkeleton` - Generic page loading skeleton

**Error Boundaries** (GYM-15):
- `app/error.tsx` - Global error boundary with recovery options and dev mode error details

### API Endpoints

**Authentication** (`app/api/auth/`):
- `POST /api/auth/signup` - Step 1: Send OTP for signup
  - Body: `{ name, phone }` (phone in E.164 format: +91XXXXXXXXXX)
  - Validates: name ≥2 chars, phone matches +91[6-9]XXXXXXXXX
  - Checks if phone already exists (admin client to bypass RLS)
  - If phone is new, sends 6-digit OTP via Supabase Auth (Twilio Verify)
  - OTP expires in 60 seconds
  - Returns: `{ success: true, message: 'OTP sent...', phone }`
  - Returns 409 if phone already registered

- `POST /api/auth/login` - Step 1: Send OTP for login
  - Body: `{ phone }` (phone in E.164 format: +91XXXXXXXXXX)
  - Validates: phone matches +91[6-9]XXXXXXXXX
  - Checks if phone exists in trainers table (admin client to bypass RLS)
  - If phone exists, sends 6-digit OTP via Supabase Auth (Twilio Verify)
  - OTP expires in 60 seconds
  - Returns: `{ success: true, message: 'OTP sent...', phone }`
  - Returns 404 if phone not registered

- `POST /api/auth/verify-otp` - Step 2: Verify OTP (both signup and login)
  - Body: `{ phone, otp, name? }` (name required for signup, optional for login)
  - Verifies OTP with Supabase Auth
  - On signup: creates trainer record with name and phone
  - On login: fetches existing trainer record
  - Session managed automatically by Supabase
  - Returns: `{ success: true, user: { id, name, phone } }`
  - Returns 401 if OTP is invalid or expired

- `POST /api/auth/logout` - Logout (must be POST!)
  - Uses Supabase Auth signOut
  - Clears session cookies
  - Returns: `{ success: true }`

**Trainers** (`app/api/trainers/`):
- `GET /api/trainers` - Fetch current trainer profile
  - Returns: `{ trainer }` (includes all columns: id, name, phone, brand_name, brand_address, brand_phone, brand_email)
  - Auth required

- `PATCH /api/trainers` - Update brand settings
  - Body: `{ brand_name, brand_address, brand_phone, brand_email }`
  - Validates: name ≥2 chars, address ≥5 chars, phone 10 digits (6-9), email format (optional)
  - Empty strings converted to NULL
  - Returns: `{ trainer }`
  - Auth required

**Clients** (`app/api/clients/`):
- `POST /api/clients` - Create new client
  - Body: `{ name, phone?, rate }` (rate in rupees, converted to paise)
  - Creates client, rate_history, audit_log
  - Returns: `{ client }`

- `POST /api/clients/bulk-import` - Bulk import clients from contacts (GYM-27)
  - Body: `{ contacts: [{ name, phone }] }` (array of contact objects)
  - Validates: name ≥2 chars, phone must be valid Indian mobile (10 digits, 6-9)
  - Normalizes phone numbers (removes +91 country code)
  - Detects duplicates by phone number (fetches existing clients first)
  - Sets `current_rate = 0` for all imported clients
  - Logs CLIENT_ADD for each imported client
  - Returns: `{ imported: Client[], skipped: { name, phone, reason }[] }`

- `GET /api/clients/[id]` - Get client details
  - Returns: `{ client }` with all fields

- `PATCH /api/clients/[id]` - Update client details (GYM-25)
  - Body: `{ name?, phone?, is_deleted? }` (at least one required)
  - Validates: name ≥2 chars, phone must be valid Indian mobile
  - `is_deleted` field used for soft delete/undo functionality (GYM-30)
  - Logs CLIENT_UPDATE to audit trail (not for is_deleted changes)
  - Returns: `{ client }`

- `DELETE /api/clients/[id]` - Soft delete a client (GYM-30)
  - Sets `is_deleted = true` on client record
  - Validates client exists and belongs to trainer
  - Checks if already deleted (returns 400 if true)
  - Logs CLIENT_DELETE to audit trail with soft_delete flag
  - Returns: `{ success: true, client }`

- `PATCH /api/clients/[id]/rate` - Change client rate (GYM-24)
  - Body: `{ rate, effectiveDate }` (rate in rupees, converted to paise)
  - Validates: rate ₹100-₹10,000, valid date
  - Updates client.current_rate and rate_updated_at
  - Logs RATE_CHANGE to audit trail (includes old_rate and new_rate)
  - Returns: `{ client, message }`

**Punches** (`app/api/clients/[id]/punches/` and `app/api/punches/[id]/`):
- `POST /api/clients/[id]/punches` - Record a class (GYM-26 credit support)
  - Body: `{ date }` (ISO date string)
  - Validates: no future dates, max 3 months back
  - If credit ≥ rate: deducts from credit_balance, balance unchanged
  - If credit < rate: decrements balance by 1, credit_balance unchanged
  - Logs PUNCH_ADD with credit usage details to audit trail
  - Returns: `{ punch, newBalance, previousBalance, newCredit, previousCredit, paidWithCredit }`

- `PATCH /api/punches/[id]` - Update punch date
  - Body: `{ date }` (ISO date string)
  - Validates: no future dates, max 3 months back
  - Balance remains unchanged
  - Logs PUNCH_EDIT to audit trail
  - Returns: `{ punch }`

- `DELETE /api/punches/[id]` - Soft delete a punch
  - Soft delete: sets `is_deleted = true`
  - Increments balance by 1 (restores the class)
  - Logs PUNCH_REMOVE to audit trail
  - Returns: `{ success, newBalance, previousBalance }`

**Payments** (`app/api/clients/[id]/payments/`):
- `POST /api/clients/[id]/payments` - Log a payment (GYM-26 credit support)
  - Body: `{ amount, classesAdded, date, creditUsed? }` (amounts in paise)
  - Validates: amount > 0, classesAdded > 0, valid date, creditUsed ≤ available credit
  - Calculates: `totalPaid = amount + creditUsed`
  - Calculates: `remainder = totalPaid - (classesAdded × rate)`
  - Updates: `credit_balance = previous - creditUsed + remainder`
  - Increments balance by classesAdded
  - Logs PAYMENT_ADD with full credit breakdown to audit trail
  - Stores rate_at_payment for historical tracking
  - Returns: `{ payment, newBalance, previousBalance, newCredit, previousCredit, creditUsed, creditAdded }`

**PDF Export** (`app/api/clients/[id]/export-data/`, `app/api/clients/export-all/`):
- `GET /api/clients/[id]/export-data?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Fetch client PDF data
  - Query params: `startDate`, `endDate` (optional, for date range filtering)
  - Fetches client, punches, payments filtered by date range
  - Enriches data with credit information from audit logs
  - Fetches trainer brand settings
  - Calculates amount due if balance is negative
  - Returns: `ClientPDFData` (client info, trainer brand, punches, payments, balance)

- `GET /api/clients/export-all?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Fetch all clients summary data
  - Query params: `startDate`, `endDate` (optional, for future date filtering)
  - Fetches all clients (exclude deleted)
  - Calculates summary statistics (total clients, classes, payments, outstanding)
  - Sorts clients by balance (negative first)
  - Fetches trainer brand settings
  - Returns: `AllClientsPDFData` (trainer brand, summary stats, clients list)

**Note**: All protected endpoints check session via `getSession()` and return 401 if not authenticated. Punch and payment endpoints are transaction-safe - they rollback on failure.

## Common Patterns

### Adding a New Protected Page

1. Create in `app/(main)/your-page/page.tsx`
2. Update `proxy.ts` to protect the route (add to `isProtectedPage` condition):
   ```typescript
   const isProtectedPage = request.nextUrl.pathname.startsWith('/clients') ||
                           request.nextUrl.pathname.startsWith('/your-page')
   ```
3. Get authenticated user in Server Components:
   ```typescript
   import { createClient } from '@/lib/supabase/server'

   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()

   if (!user) {
     redirect('/login')
   }

   // Use user.id as trainer_id for queries
   ```
4. Wrap content in `MobileLayout` component for consistent UI (see below)

### Using MobileLayout Component (GYM-15)

All pages should use the `MobileLayout` component for consistent navigation, headers, and mobile-first responsive design.

**Basic Usage**:
```typescript
import { MobileLayout } from '@/components/MobileLayout'

export default function YourPage() {
  return (
    <MobileLayout
      title="Page Title"
      showBackButton={true}
      backHref="/previous-page"
    >
      {/* Your page content here */}
    </MobileLayout>
  )
}
```

**Props**:
- `title` (optional) - Page title shown in header
- `showBackButton` (optional) - Show back arrow button
- `backHref` (optional) - URL for back button navigation
- `showLogout` (optional) - Show logout button in header
- `headerAction` (optional) - Custom React node for additional header actions
- `children` - Page content

**Loading States**:
For Client Components with loading states, use skeleton components:
```typescript
import { FormSkeleton } from '@/components/LoadingSkeletons'

if (isLoading) {
  return (
    <MobileLayout title="Your Page" showBackButton={true} backHref="/back">
      <FormSkeleton />
    </MobileLayout>
  )
}
```

Available skeletons: `ClientListSkeleton`, `ClientDetailSkeleton`, `FormSkeleton`, `PaymentHistorySkeleton`, `PageSkeleton`

**Error States**:
```typescript
import { Alert, AlertDescription } from '@/components/ui/alert'

if (error) {
  return (
    <MobileLayout title="Your Page" showBackButton={true} backHref="/back">
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </MobileLayout>
  )
}
```

### Adding a New API Route

```typescript
// app/api/your-route/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Get current authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use supabase client for database operations
  // RLS automatically filters by user.id
  // Your logic here - user.id is the authenticated trainer ID
}
```

### Creating a New Database Table

1. Write SQL migration in `supabase/migrations/00X_your_migration.sql`
2. Enable RLS: `ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;`
3. Add policy: `CREATE POLICY "trainer_isolation" ON your_table FOR ALL USING (trainer_id = auth.uid());`
4. Run migration via Supabase SQL Editor or CLI
5. Regenerate TypeScript types with: `npx supabase gen types typescript --project-id lwkucbtmtylbbdskvrnc > types/database.types.ts`

### Fetching Data in Protected Pages

When building authenticated pages that need to query the database (e.g., client list):

1. **Server Components** (Recommended for initial data):
   ```typescript
   import { createClient } from '@/lib/supabase/server'
   import { redirect } from 'next/navigation'

   export default async function Page() {
     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()

     if (!user) redirect('/login')

     // RLS automatically filters by user.id
     const { data } = await supabase
       .from('clients')
       .select('*')
       .eq('trainer_id', user.id)

     return <div>{/* render data */}</div>
   }
   ```

2. **Client Components** (For interactive mutations):
   - Use API routes (e.g., `/api/clients/route.ts`) that verify auth with `supabase.auth.getUser()`
   - Call API routes from client components using `fetch()`
   - Example: `PunchClassButton` component calls `POST /api/clients/[id]/punches`

## PRD Reference

See `prd.md` for full product requirements. Key points:

**MVP Critical Path**:
1. Foundation (setup, database) ✅ Complete
2. Auth (phone/PIN) ✅ Complete
3. Clients (list, add, detail, edit) ✅ Complete
   - GYM-14: Client list with sorting and balance indicators
   - GYM-13: Add client form with validation
   - GYM-12: Client detail page
   - GYM-25: Edit client details (name, phone)
   - GYM-24: Change client rate with history tracking
4. Punch tracking ✅ Complete
   - GYM-11: Punch class action with date picker
   - GYM-8: Remove punch (soft delete with undo)
   - GYM-9: Edit punch date
   - GYM-10: Month grouping and pagination for punches
5. Payment logging ✅ Complete
   - GYM-6: Log payment form with auto-calculation
   - GYM-4: Payment history view
   - GYM-26: Credit balance tracking with explicit usage
6. Balance indicators ✅ Complete
   - GYM-1: Negative balance alert
   - GYM-2: Visual balance indicators (red/yellow/green)
   - GYM-3: Balance calculation utilities
   - GYM-5: Balance animation with smooth count up/down
7. UI Framework ✅ Complete
   - GYM-23: Migration to shadcn/ui with dark theme
   - GYM-15: Mobile layout shell with consistent navigation, back buttons, loading skeletons, and error boundaries
   - GYM-16: PWA configuration with install prompt and icons

**Out of Scope**:
- Scheduling/calendar
- Client-facing app
- Email/SMS notifications
- Multi-trainer accounts
- Automated billing

**Terminology**:
- **Trainer** = The user (personal trainer)
- **Client** = Trainer's customer (trainee)
- **Punch** = Recording that a class occurred
- **Balance** = Classes remaining (can be negative if trainer extends credit)

## Database Setup

**First-time setup**: Run migrations to create database tables. See `RUN_MIGRATIONS.md` for quick instructions or `SUPABASE_SETUP.md` for detailed setup.

**Two options**:
1. **Supabase Dashboard** (easier): Copy/paste SQL from `supabase/migrations/*.sql` into SQL Editor
2. **Supabase CLI**: `npx supabase db push` (requires linking project first)

**Required tables**: trainers, clients, punches, payments, rate_history, audit_log

**Important**: After running migrations, configure Supabase Auth and Twilio:
1. **Twilio Setup**:
   - Create a Twilio account and get Account SID, Auth Token, and Verify Service SID
   - See README.md and SUPABASE_SETUP.md for detailed Twilio configuration steps
2. **Supabase Authentication Configuration**:
   - Go to Authentication → Providers → Phone
   - Enable Phone provider and add Twilio credentials:
     - Twilio Account SID
     - Twilio Auth Token
     - Twilio Verify Service SID (not Messaging Service SID!)
   - Set OTP expiry to 60 seconds (configured at project level)
3. **Authentication Settings**:
   - Go to Authentication → Settings:
     - ✅ "Allow new users to sign up" - ON
     - ❌ "Confirm phone" - OFF (OTP verification is enough)
     - ❌ "Allow manual linking" - OFF
     - ❌ "Allow anonymous sign-ins" - OFF

## Known Issues / Technical Debt

### ✅ Resolved (Production Ready)
- **Authentication Migration**: ✅ **Complete** - Migrated to Supabase Auth with phone + SMS OTP
  - Removed custom JWT session management
  - Using Supabase Auth + Twilio Verify for OTP delivery
  - Two-step authentication flow (phone → OTP verification)
  - Edge case handling (duplicate signup, unregistered login detection)
  - Phone now required and unique in trainers table (migration 009)
  - RLS works automatically with `auth.uid()`
  - No JWT_SECRET needed (managed by Supabase)
- **Supabase TypeScript types**: ✅ **Fixed** - Proper types generated from database schema, zero `as any` workarounds
- **README.md**: ✅ **Updated** - Now accurately reflects Supabase Auth and current architecture
- **PWA Configuration** (GYM-16): ✅ **Complete** - Fully functional and live in production
  - PWA icons (192x192, 512x512, Apple touch icon) in public/ folder
  - Manifest.json configured with dark theme colors (#020817)
  - Service worker configured via Serwist (@serwist/next) in next.config.ts
  - Install prompt component with beforeinstallprompt event handling
  - PWA is disabled in development mode, enabled in production
- **Next.js 16 metadata warnings**: ✅ **Fixed** - viewport and themeColor moved to separate viewport export
- **Dialog accessibility**: ✅ **Fixed** - All Dialogs now have proper DialogDescription for screen readers
- **Date picker dark mode**: ✅ **Fixed** - Calendar icons now visible with `colorScheme: 'dark'`
- **Mobile layout consistency** (GYM-15): ✅ **Complete** - MobileLayout component used across all pages
- **Audit log RLS policy**: ✅ **Fixed** - Added INSERT policy for audit_log table (migration 006)
- **Duplicate audit logs**: ✅ **Fixed** - Removed duplicate database triggers, kept API code logging only (migration 007)

### 📋 Remaining Technical Debt (Non-Blocking)
- **No test suite**: No tests currently implemented (unit, integration, or e2e)
- **Rate limiting**: Not yet implemented on auth endpoints (deferred - not critical for MVP)
- **Linear integration**: Linear issue tracking is used (issues referenced as GYM-XX, FB-XX in commits) but integration not documented

## Next Steps / Roadmap

### Recently Completed
**PDF Export System** (MAT-92, MAT-93, MAT-94, MAT-95) ✅ **Complete**
- ✅ jsPDF library installed
- ✅ Per-client PDF export (statement with punches, payments, balance)
- ✅ All-clients summary PDF export
- ✅ Date range selector for filtering (Last 30 days, Last 3 months, All time, Custom)
- ✅ File naming: `{ClientName}_Statement_{Date}.pdf` and `All_Clients_Summary_{Date}.pdf`
- ✅ Client-side PDF generation for offline PWA support
- ✅ Brand settings integration with fallback placeholders

### Future Enhancements (Post-MVP)
- Rate limiting on auth endpoints
- Test suite implementation
- Performance monitoring (Vercel Analytics)
- Error tracking (Sentry integration)

## UI Framework

**Current**: shadcn/ui + Tailwind CSS v4 (Dark Theme)

**shadcn/ui Setup** (GYM-23 - Completed):
- Chosen after Tamagui proved incompatible with Next.js 16 TypeScript
- Perfect integration with existing Tailwind CSS v4
- Component library: Button, Input, Label, Card, Alert, Badge, Dialog, Select
- Components copied into codebase (`components/ui/`) - no external dependencies
- Dark theme enabled globally via `className="dark"` on `<html>` element in `app/layout.tsx`
- All colors use semantic tokens (bg-background, text-foreground, text-muted-foreground, etc.)
- CSS variables defined in `app/globals.css` using oklch color space

**Component Usage Patterns**:
- **Buttons**: Use `<Button>` with variants: `default` (primary), `outline`, `destructive`, `ghost`, `secondary`
- **Forms**: Use `<Input>` + `<Label>` for all form fields
- **Modals**: Use `<Dialog>` + `<DialogContent>` + `<DialogHeader>` + `<DialogTitle>` (and optionally `<DialogDescription>`)
- **Alerts**: Use `<Alert>` + `<AlertDescription>` with variants: `default` or `destructive`
- **Cards**: Use `<Card>` + `<CardContent>` for containers
- **Badges**: Use `<Badge>` with custom className for colored badges (e.g., credit balance)

**Migration Status** (✅ Complete):
- ✅ Auth pages (login, signup) - Card, Button, Alert
- ✅ Client list - Card, Button, Badge
- ✅ Client detail - Card, Button, Alert
- ✅ Client forms (add, edit) - Input, Label, Card, Alert, Button
- ✅ Change rate form - Input, Label, Card, Alert, Button
- ✅ Payment history - Card, Button with dark theme table
- ✅ All components - LogPaymentButton, PunchClassButton, ClientBalanceCard, PunchesListGrouped, PunchListItem, LogoutButton, NegativeBalanceAlert

**Why shadcn over Tamagui**:
- Tamagui had persistent TypeScript prop compatibility issues with Next.js 16
- shadcn built specifically for Next.js + TypeScript + Tailwind
- Zero runtime dependencies (components are copied, not imported from npm)
- Excellent accessibility via Radix UI primitives
- Better suited for web-only PWA (Tamagui targets React Native cross-platform)

**Dark Theme Implementation**:
- Dark mode is the default and only theme (no light mode toggle)
- All pages and components use semantic color tokens that adapt to dark theme
- Color palette defined in `:root .dark` selector in globals.css
- Never use hard-coded colors (bg-white, text-gray-900, etc.) - always use semantic tokens
- Example: Use `bg-background` instead of `bg-gray-900`, `text-muted-foreground` instead of `text-gray-500`

## Motion/Animation System (GYM-36)

**Comprehensive animation system for polished UX:**

**Animation Classes** (defined in `app/globals.css`):

| Class | Animation | Duration | Usage |
|-------|-----------|----------|-------|
| `.screen-enter` | fadeSlideUp | 300ms | Page transitions (applied to MobileLayout) |
| `.screen-exit` | fadeSlideDown | 200ms | Back navigation (available for future use) |
| `.stagger-item` | staggerFadeIn | 300ms + 50ms delay | List items (applied to ClientList) |
| `.btn:active` | buttonPress | 150ms | Button tap feedback (all Button components) |
| `.animate-punch-bounce` | punchBounce | 600ms | Punch card dot fill (GYM-38) |
| `.animate-celebration-pulse` | celebrationPulse | 1s infinite | Success overlay icon (GYM-37) |
| `.animate-fade-in` | fadeIn | 200ms | Overlay entrance |
| `.animate-fade-out` | fadeOut | 200ms | Overlay exit |

**Key Features**:
- **Spring easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` for bounce effects
- **Stagger delays**: 50ms increments between list items (supports up to 20 items)
- **Accessibility**: Full `prefers-reduced-motion` support - all animations disabled when user enables reduced motion

**Usage Examples**:
```tsx
// Screen transition (automatic in MobileLayout)
<main className="screen-enter">
  {children}
</main>

// List stagger animation
<div className="stagger-item">
  <ClientCard {...props} />
</div>

// Button press feedback (automatic on all Button components)
<Button>Click me</Button> {/* Has .btn class with :active animation */}
```

**Accessibility**:
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations reduced to 0.01ms or disabled completely */
  .screen-enter,
  .stagger-item,
  /* ... other animations */
  {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```
