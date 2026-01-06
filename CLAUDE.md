# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gymbo is a mobile-first Progressive Web App (PWA) for independent personal trainers in India to track client classes (punches), payments, and balances. It's a "punch card tracker" - trainers log classes, record payments, and the app automatically calculates how many classes each client has remaining.

**Target User**: Mobile-first personal trainers who travel to clients' homes. Smartphone-only access, needs to work quickly while on the move.

**Key Constraint**: Zero-cost auth (no external auth provider), mobile-first UI, works across all browsers.

**Tech Stack**:
- Next.js 16 (App Router) + TypeScript + React 19
- shadcn/ui + Tailwind CSS v4 for styling (dark theme)
- Supabase (PostgreSQL with custom JWT auth, not Supabase Auth)
- bcryptjs for password hashing, jsonwebtoken for sessions

## Development Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Production
npm run build        # Build for production (uses --webpack flag due to Next.js 16 compatibility)
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint (configured via eslint.config.mjs)

# Database
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts

# Testing
# Note: No test suite currently implemented
```

**Important Build Note**: The build command uses `--webpack` flag (`next build --webpack`) because Next.js 16 requires explicit Webpack mode. This is configured in `package.json`. The project also uses Serwist for PWA functionality, which is disabled in development mode.

**Note**: The app uses Next.js 16 with shadcn/ui components and Tailwind CSS v4 in dark mode. The root page (`app/page.tsx`) automatically redirects authenticated users to `/clients` and unauthenticated users to `/login`.

## Project Documentation

**CLAUDE.md** (this file): Source of truth for architecture and development practices
**README.md**: Outdated (mentions Next.js 14 and Tamagui instead of Next.js 16, Tailwind CSS v4, and shadcn/ui)
**prd.md**: Full product requirements document
**SUPABASE_SETUP.md**: Detailed Supabase setup instructions
**RUN_MIGRATIONS.md**: Quick migration instructions

## Architecture

### Authentication System (Custom JWT - No Supabase Auth)

**Important**: We do NOT use Supabase Auth. We built a custom JWT-based authentication system because the PRD requires zero-cost auth with no external provider.

**Flow**:
1. Trainer signs up with phone number + 4-digit PIN
2. PIN is hashed with bcryptjs (10 rounds) and stored in `trainers` table
3. On login, we verify the PIN and create a JWT session cookie (30-day expiration)
4. Sessions are validated in `proxy.ts` (Next.js 16 proxy, not middleware)

**Key Files**:
- `lib/auth/session.ts` - JWT session management (create, get, delete sessions)
- `lib/supabase/admin.ts` - Admin client that bypasses RLS for signup/login operations
- `proxy.ts` - Next.js 16 proxy (not middleware) that checks JWT sessions and redirects
- `app/api/auth/signup/route.ts` - Signup endpoint
- `app/api/auth/login/route.ts` - Login endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint

**Why Admin Client?**
Row-Level Security (RLS) blocks unauthenticated database access. During signup/login, there's no session yet, so we use the admin client (with `SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS. This is secure because it only runs server-side in controlled API routes.

### Database Architecture

**Supabase PostgreSQL with Row-Level Security (RLS)**

Core tables:
- `trainers` - Trainer accounts (phone, pin_hash)
- `clients` - Clients belonging to trainers (name, phone, current_rate, balance, credit_balance)
- `punches` - Class records (client_id, punch_date, is_deleted for soft delete)
- `payments` - Payment records (client_id, amount, classes_added, rate_at_payment)
- `rate_history` - Historical rate changes (client_id, rate, effective_date)
- `audit_log` - Audit trail of all actions (client_id, action, details JSON)

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

### Supabase Client Strategy

**Three types of clients**:

1. **Admin Client** (`lib/supabase/admin.ts`):
   - Uses `SUPABASE_SERVICE_ROLE_KEY`
   - Bypasses RLS
   - Server-side only (never expose to browser)
   - Used for: signup, login (when no session exists yet)

2. **Server Client** (`lib/supabase/server.ts`):
   - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Respects RLS
   - For Server Components and API routes
   - Currently not heavily used since we use custom JWT auth

3. **Browser Client** (`lib/supabase/client.ts`):
   - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Respects RLS
   - For Client Components
   - Will be used for data fetching after auth is implemented

### Next.js 16 Routing

**Route Groups**:
- `app/(auth)/` - Unauthenticated pages (login, signup)
- `app/(main)/` - Protected pages requiring authentication (clients, etc.)
- `app/page.tsx` - Root page that redirects to `/clients` (authenticated) or `/login` (unauthenticated)

**Proxy vs Middleware**: Next.js 16 uses `proxy.ts` instead of the older `middleware.ts`. The proxy function:
- Checks JWT sessions via `getSessionFromRequest()` from `lib/auth/session.ts`
- Redirects authenticated users away from auth pages (`/login`, `/signup`) to `/clients`
- Redirects unauthenticated users from protected pages (`/clients`) to `/login`
- Uses a matcher config to exclude static files and images from processing

### Data Model: Currency

**All monetary amounts stored in PAISE (not rupees)**:
- Example: ₹800 stored as 80000 (paise)
- Rationale: Avoid floating-point precision issues
- Convert to rupees only in UI display layer

### TypeScript Types

**Status**: ✅ **Fully Type-Safe** - Proper Supabase TypeScript types have been generated from the database schema.

The `types/database.types.ts` file contains complete type definitions for all database tables, including:
- `trainers` - Trainer accounts with phone/PIN authentication
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
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-side only, never expose to client
JWT_SECRET=your-secret-key-here      # For session JWT signing (change in production!)
```

**How to get Supabase credentials**: See `SUPABASE_SETUP.md` for complete setup instructions.

**Security**:
- `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS - NEVER use in client-side code, only in API routes
- `JWT_SECRET` must be changed in production (generate with `openssl rand -base64 32`)
- Default JWT_SECRET in code is for development only

## Mobile-First UI Principles

From PRD requirements:
- **One-thumb operation**: Primary actions reachable with thumb
- **Punch-first**: Recording a class should be <3 taps
- **Glanceable**: Red/yellow/green balance indicators
- **Mobile keyboard optimizations**: `inputMode="numeric"` for phone/PIN inputs

## Implemented Features

### Client Management (GYM-14, GYM-13, GYM-12)

**Client List** (`/clients`):
- Displays all clients with balance indicators (🔴 negative, 🟡 low ≤3, 🟢 healthy >3)
- Sortable by: Recent (default), Name, Balance
- Empty state for new trainers
- Server Component that fetches data on page load
- Uses `ClientList` component for sorting (Client Component)
- `ClientCard` component for each client
- `LogoutButton` component for logout (must use POST, not GET)

**Add Client** (`/clients/new`):
- Form with validation: name (required, ≥2 chars), phone (optional, valid Indian mobile), rate (₹100-₹10,000)
- Converts rate from rupees to paise before storing
- Creates client, initial rate_history entry, and audit log
- Client Component with form state management
- API: `POST /api/clients`

**Client Detail** (`/clients/[id]`):
- Shows client name, balance (large), rate, balance status text
- Color-coded balance display (red/yellow/green)
- **Credit balance badge** (GYM-26) - Blue badge showing "💳 Credit: ₹X" when credit > 0
- **Negative balance alert** - Red warning banner when balance < 0, shows amount owed and "Log Payment" CTA
- **Grouped punches list** (GYM-10) - Punches grouped by month with pagination (20 per page)
- Empty state for clients with no punches yet
- Large "PUNCH CLASS" button (fixed at bottom for thumb reach)
- Action buttons: Log Payment, View History (active), Export PDF (disabled), Edit Client (active), Change Rate (active)
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

### Punch Tracking (GYM-11, GYM-8, GYM-9)

**Punch Class Action** (GYM-11, GYM-26):
- `PunchClassButton` component - large CTA at bottom of client detail page
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

### Components Library

**Reusable Components** (`components/`):
- `MobileLayout` - Mobile-first layout shell with header, back button, and optional logout (GYM-15)
- `BalanceIndicator` - Visual status dot (red/yellow/green) based on balance
- `ClientCard` - Client list item with name, balance, rate, credit (GYM-26), clickable
- `ClientList` - Sortable client list with filter controls
- `ClientBalanceCard` - Large balance display with color-coded status and credit badge
- `PunchClassButton` - Primary action button with date picker modal (decreases balance or credit)
- `PunchesListGrouped` - Punches grouped by month with pagination (GYM-10)
- `PunchListItem` - Individual punch row with edit (✎) and delete (✕) buttons
- `LogPaymentButton` - Payment form with "Use Credit Balance" checkbox (GYM-26), increases balance
- `NegativeBalanceAlert` - Red warning banner for negative balances with CTA
- `ClientDetailActions` - Wrapper that manages alert and payment button interaction
- `LogoutButton` - Logout with POST request handling
- `PhoneInput` - Custom phone input for Indian mobile numbers
- `PinInput` - 4-digit PIN input with auto-focus

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
- `POST /api/auth/signup` - Create trainer account (phone + PIN)
- `POST /api/auth/login` - Login and create session
- `POST /api/auth/logout` - Delete session (must be POST!)

**Clients** (`app/api/clients/`):
- `POST /api/clients` - Create new client
  - Body: `{ name, phone?, rate }` (rate in rupees, converted to paise)
  - Creates client, rate_history, audit_log
  - Returns: `{ client }`

- `GET /api/clients/[id]` - Get client details
  - Returns: `{ client }` with all fields

- `PATCH /api/clients/[id]` - Update client details (GYM-25)
  - Body: `{ name?, phone? }` (at least one required)
  - Validates: name ≥2 chars, phone must be valid Indian mobile
  - Logs CLIENT_EDIT to audit trail
  - Returns: `{ client }`

- `PATCH /api/clients/[id]/rate` - Change client rate (GYM-24)
  - Body: `{ rate, effectiveDate }` (rate in rupees, converted to paise)
  - Validates: rate ₹100-₹10,000, valid date
  - Creates entry in rate_history table
  - Updates client.current_rate
  - Logs RATE_CHANGE to audit trail
  - Returns: `{ client, rateHistory }`

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

**Note**: All protected endpoints check session via `getSession()` and return 401 if not authenticated. Punch and payment endpoints are transaction-safe - they rollback on failure.

## Common Patterns

### Adding a New Protected Page

1. Create in `app/(main)/your-page/page.tsx`
2. Update `proxy.ts` to protect the route (add to `isProtectedPage` condition):
   ```typescript
   const isProtectedPage = request.nextUrl.pathname.startsWith('/clients') ||
                           request.nextUrl.pathname.startsWith('/your-page')
   ```
3. Use `getSession()` from `lib/auth/session.ts` in Server Components to get current trainer
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
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'

export async function POST(request: Request) {
  // Get current session
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client for database operations
  const supabase = createAdminClient()

  // Your logic here - session.trainerId is the authenticated trainer
}
```

### Creating a New Database Table

1. Write SQL migration in `supabase/migrations/00X_your_migration.sql`
2. Enable RLS: `ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;`
3. Add policy: `CREATE POLICY "trainer_isolation" ON your_table FOR ALL USING (trainer_id = current_setting('app.trainer_id')::uuid);`
4. Run migration via Supabase SQL Editor or CLI
5. Regenerate TypeScript types

### Fetching Data in Protected Pages

When building authenticated pages that need to query the database (e.g., client list):

1. **Server Components** (Recommended for initial data):
   ```typescript
   import { getSession } from '@/lib/auth/session'
   import { createAdminClient } from '@/lib/supabase/admin'

   export default async function Page() {
     const session = await getSession()
     if (!session) redirect('/login')

     const supabase = createAdminClient()
     const { data } = await supabase
       .from('clients')
       .select('*')
       .eq('trainer_id', session.trainerId)

     return <div>{/* render data */}</div>
   }
   ```

2. **Client Components** (For interactive mutations):
   - Use API routes (e.g., `/api/clients/route.ts`) that verify session and query via admin client
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

## Known Issues / Technical Debt

- **Supabase TypeScript types**: ✅ **Fixed** - Proper types generated from database schema, zero `as any` workarounds
- **No test suite**: No tests currently implemented (unit, integration, or e2e)
- **README.md**: ✅ **Updated** - Now accurately reflects Next.js 16, shadcn/ui, and Tailwind CSS v4
- **PWA Configuration** (GYM-16 - ✅ Complete): Progressive Web App is fully configured and functional
  - PWA icons (192x192, 512x512, Apple touch icon) in public/ folder
  - Manifest.json configured with dark theme colors (#020817)
  - Service worker configured via Serwist (@serwist/next) in next.config.ts
  - Install prompt component with beforeinstallprompt event handling
  - PWA is disabled in development mode, enabled in production
- **Next.js 16 metadata warnings**: ✅ Fixed - viewport and themeColor moved to separate viewport export
- **Dialog accessibility**: Some shadcn Dialog components missing `DialogDescription` for screen readers
- Supabase Auth is completely unused (we built custom JWT auth per PRD requirements)
- Consider removing `@supabase/ssr` dependency since we don't use Supabase Auth
- Rate limiting not yet implemented on auth endpoints
- Audit log triggers exist in migrations but audit UI not built yet
- Default JWT_SECRET in code should never be used in production
- Linear issue tracking is used (issues referenced as GYM-XX in commits) but integration not documented

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
