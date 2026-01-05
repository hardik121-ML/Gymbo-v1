# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gymbo is a mobile-first Progressive Web App (PWA) for independent personal trainers in India to track client classes (punches), payments, and balances. It's a "punch card tracker" - trainers log classes, record payments, and the app automatically calculates how many classes each client has remaining.

**Target User**: Mobile-first personal trainers who travel to clients' homes. Smartphone-only access, needs to work quickly while on the move.

**Key Constraint**: Zero-cost auth (no external auth provider), mobile-first UI, works across all browsers.

**Tech Stack**:
- Next.js 16 (App Router) + TypeScript + React 19
- Tailwind CSS v4 for styling
- Supabase (PostgreSQL with custom JWT auth, not Supabase Auth)
- bcryptjs for password hashing, jsonwebtoken for sessions

## Development Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint (configured via eslint.config.mjs)

# Database
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

**Note**: The app uses Next.js 16 with Tailwind CSS v4. The root page (`app/page.tsx`) automatically redirects authenticated users to `/clients` and unauthenticated users to `/login`.

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
- `clients` - Clients belonging to trainers (name, phone, current_rate, balance)
- `punches` - Class records (client_id, punch_date, is_deleted for soft delete)
- `payments` - Payment records (client_id, amount, classes_added, rate_at_payment)
- `rate_history` - Historical rate changes (client_id, rate, effective_date)
- `audit_log` - Audit trail of all actions (client_id, action, details JSON)

**Balance Calculation**:
- Balance = (sum of classes from payments) - (count of active punches)
- Stored denormalized in `clients.balance` for performance
- Can go negative (trainer extends credit)

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

**Current Status**: The `types/database.types.ts` file exists but contains placeholder types only. The Supabase client doesn't use these types, causing TypeScript to infer `never` for query results.

**Workaround**: When Supabase queries return `never` type, use type assertions:
```typescript
const { data: trainer } = await supabase.from('trainers').select('*').single()
const trainerData = trainer as any  // Workaround until types are properly generated
```

**Proper Fix** (TODO): Generate real types from your Supabase schema:
```bash
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

Then import and use in Supabase client:
```typescript
import { Database } from '@/types/database.types'
const supabase = createClient<Database>(url, key)
```

Run type generation whenever database schema changes.

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
- Recent punches list (last 10, newest first)
- Empty state for clients with no punches yet
- Large "PUNCH CLASS" button (fixed at bottom for thumb reach)
- Placeholder action buttons (Payment, History, Export, Edit) for future features
- Server Component that fetches client and punch data

### Punch Tracking (GYM-11)

**Punch Class Action**:
- `PunchClassButton` component - large CTA at bottom of client detail page
- Date picker modal (defaults to today, allows up to 3 months back, no future dates)
- Records punch, decrements balance by 1, logs to audit trail
- Success feedback: checkmark animation + haptic vibration (if supported)
- Auto-refreshes page to show updated balance and punch list
- API: `POST /api/clients/[id]/punches`
- Validates dates: no future, max 3 months old
- Transaction-safe: rolls back punch if balance update fails

### Payment Logging (GYM-6)

**Log Payment Action**:
- `LogPaymentButton` component - button in action grid on client detail page
- Modal form with amount, classes, and date fields
- **Auto-calculation**: Amount ÷ Rate = Classes (Math.floor for rounding down)
- Shows calculation: "₹8000 ÷ ₹800 = 10 classes"
- **Manual override**: Click ✎ to edit classes, click again to reset to auto-calculated
- **Balance preview**: Shows "current + classes = new balance" before saving
- Payment date picker (defaults to today)
- Records payment, increments balance, logs PAYMENT_ADD to audit trail
- API: `POST /api/clients/[id]/payments`
- Stores rate_at_payment for historical accuracy
- Transaction-safe: rolls back payment if balance update fails
- **Edge case**: When amount doesn't divide evenly (e.g., ₹3500 at ₹3000/class), rounds down to 1 class but records full ₹3500. Trainer can manually override.

### Components Library

**Reusable Components** (`components/`):
- `BalanceIndicator` - Visual status dot (red/yellow/green) based on balance
- `ClientCard` - Client list item with name, balance, rate, clickable
- `ClientList` - Sortable client list with filter controls
- `PunchClassButton` - Primary action button with date picker modal (decreases balance)
- `LogPaymentButton` - Payment form button with modal (increases balance)
- `LogoutButton` - Logout with POST request handling
- `PhoneInput` - Custom phone input for Indian mobile numbers
- `PinInput` - 4-digit PIN input with auto-focus

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

**Punches** (`app/api/clients/[id]/punches/`):
- `POST /api/clients/[id]/punches` - Record a class
  - Body: `{ date }` (ISO date string)
  - Validates: no future dates, max 3 months back
  - Decrements balance by 1, logs PUNCH_ADD
  - Returns: `{ punch, newBalance, previousBalance }`

**Payments** (`app/api/clients/[id]/payments/`):
- `POST /api/clients/[id]/payments` - Log a payment
  - Body: `{ amount, classesAdded, date }` (amount in paise)
  - Validates: amount > 0, classesAdded > 0, valid date
  - Increments balance by classesAdded, logs PAYMENT_ADD
  - Stores rate_at_payment for historical tracking
  - Returns: `{ payment, newBalance, previousBalance }`

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
3. Clients (list, add, detail) ✅ Complete
   - GYM-14: Client list with sorting and balance indicators
   - GYM-13: Add client form with validation
   - GYM-12: Client detail page
4. Punch tracking ✅ Complete
   - GYM-11: Punch class action with date picker
5. Payment logging ✅ Complete
   - GYM-6: Log payment form with auto-calculation
6. Balance indicators ✅ Complete (integrated into client list/detail)

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

- **Supabase TypeScript types**: Currently using placeholder types. Real types need to be generated from schema using `npx supabase gen types`. Until then, use `as any` assertions when accessing query results to avoid `never` type errors.
- Supabase Auth is completely unused (we built custom JWT auth per PRD requirements)
- Consider removing `@supabase/ssr` dependency since we don't use Supabase Auth
- Rate limiting not yet implemented on auth endpoints
- Audit log triggers exist in migrations but audit UI not built yet
- Default JWT_SECRET in code should never be used in production

## UI Framework

**Current**: Tailwind CSS with custom HTML components for auth pages (PhoneInput, PinInput)

**Note**: Tamagui was explored but removed due to TypeScript compatibility issues with Next.js 16. All UI is now built with standard React + Tailwind CSS.
