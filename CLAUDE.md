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
- `proxy.ts` - Next.js 16 auth proxy (NOT middleware.ts)
- `lib/supabase/server.ts` - Server-side Supabase client (respects RLS)
- `lib/supabase/client.ts` - Browser client for Client Components
- `types/database.types.ts` - Generated TypeScript types from database
- `supabase/migrations/` - Database schema migrations (run in order!)

**Key Architecture Decisions:**
- ✅ All monetary amounts in PAISE (not rupees) to avoid floating-point issues
- ✅ Supabase Auth with phone + SMS OTP (Twilio Verify)
- ✅ Soft deletes (is_deleted flag) - never lose data
- ✅ Audit logs via API code for detailed credit tracking
- ✅ shadcn/ui dark theme only (no light mode toggle)
- ✅ Client-side PDF generation (jsPDF + jsPDF-AutoTable)

## Project Overview

**Gymbo** is a mobile-first PWA for independent personal trainers in India to track client classes (punches), payments, and balances.

**Tech Stack:**
- Next.js 16 (App Router) + TypeScript + React 19
- shadcn/ui + Tailwind CSS v4 (dark theme)
- Supabase (PostgreSQL + Auth)
- jsPDF + jsPDF-AutoTable (PDF export)
- Serwist (PWA/service worker)

**Production:** https://gymbo-v1.vercel.app (Auto-deploys from `main` branch)

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, SECRET)

## Architecture

### Authentication (Supabase Auth + Twilio Verify)
- Phone + SMS OTP authentication
- Indian mobile numbers only (+91XXXXXXXXXX format)
- Two-step flow: Phone entry → OTP verification
- Sessions managed by Supabase (automatic refresh)
- RLS policies use `auth.uid()` for data isolation

**Key Files:**
- `lib/supabase/server.ts` - Server-side client
- `lib/supabase/admin.ts` - Admin client (bypasses RLS for pre-auth checks)
- `proxy.ts` - Session validation and redirects
- `app/api/auth/` - Auth endpoints (signup, login, verify-otp, logout)

### Database (Supabase PostgreSQL with RLS)

**Core Tables:**
- `trainers` - Trainer profiles (linked to auth.users.id)
- `clients` - Client records (balance, rate, credit_balance)
- `punches` - Class attendance records
- `payments` - Payment history with rate snapshots
- `audit_log` - Complete audit trail

**Balance Calculation:**
- Balance = (sum of classes from payments) - (count of active punches)
- Stored denormalized in `clients.balance` for performance
- Can go negative (trainer extends credit)

**Credit System:**
- Payment remainders stored as credit (e.g., ₹10,500 at ₹2,500/class = 4 classes + ₹500 credit)
- Credit auto-used when punching classes (if credit ≥ rate)
- All credit operations logged to audit trail

**Migrations:** Located in `supabase/migrations/` (11 migrations total)

### PDF Export System (MAT-92, MAT-93, MAT-94, MAT-95)

**Client-side generation using jsPDF + jsPDF-AutoTable:**

**Per-Client PDF Export:**
- Button on client detail page
- Generates statement with classes, payments, balance
- Date range filtering (Last 30 days, 3 months, All time, Custom)
- File: `{ClientName}_Statement_{YYYY-MM-DD}.pdf`

**All Clients Summary:**
- Button on client list page
- Summary statistics + sorted client list
- File: `All_Clients_Summary_{YYYY-MM-DD}.pdf`

**Brand Settings Preview:**
- Preview button in `/settings/brand`
- Generates sample PDF with current form data
- Shows how brand info appears on statements

**Key Files:**
- `lib/pdf/generateClientPDF.ts` - Client statement generator
- `lib/pdf/generateAllClientsPDF.ts` - Summary generator
- `lib/pdf/pdfTemplate.ts` - Shared utilities
- `lib/pdf/types.ts` - TypeScript types
- `app/api/clients/[id]/export-data/route.ts` - Client data endpoint
- `app/api/clients/export-all/route.ts` - Summary data endpoint

**Technical Notes:**
- Currency displayed as "Rs. X,XXX" (not ₹ for PDF font compatibility)
- Unicode characters sanitized for PDF rendering
- Automatic text wrapping and pagination
- Consistent dark theme table styling

## API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Send OTP for signup
- `POST /api/auth/login` - Send OTP for login
- `POST /api/auth/verify-otp` - Verify OTP and create session
- `POST /api/auth/logout` - Sign out

**Trainers:**
- `GET /api/trainers` - Fetch current trainer profile
- `PATCH /api/trainers` - Update brand settings

**Clients:**
- `POST /api/clients` - Create new client
- `POST /api/clients/bulk-import` - Bulk import from contacts
- `GET /api/clients/[id]` - Get client details
- `PATCH /api/clients/[id]` - Update client (name, phone)
- `DELETE /api/clients/[id]` - Soft delete client
- `PATCH /api/clients/[id]/rate` - Change client rate (called from edit page)

**Punches:**
- `POST /api/clients/[id]/punches` - Record a class
- `PATCH /api/punches/[id]` - Update punch date
- `DELETE /api/punches/[id]` - Soft delete punch

**Payments:**
- `POST /api/clients/[id]/payments` - Log a payment

**PDF Export:**
- `GET /api/clients/[id]/export-data` - Fetch client PDF data
- `GET /api/clients/export-all` - Fetch all clients summary data

## Key Components

**Layout & Navigation:**
- `MobileLayout` - Page wrapper with header, back button, animations
- `ClientPageActions` - Add Client + Import Contacts + Export All buttons

**Client Management:**
- `ClientCard` - Client list item with balance indicators
- `SwipeableClientCard` - Swipeable wrapper with delete
- `ClientBalanceCard` - Large balance display with status
- `PunchCard` - Visual 20-dot punch card (GYM-38)

**Actions:**
- `PunchClassButton` - Record class with date picker
- `LogPaymentButton` - Payment form with credit support
- `ExportClientPDFButton` - Single client PDF export
- `ExportAllClientsButton` - All clients PDF export

**PDF Export:**
- `DateRangeSelector` - Date range picker with presets
- `ExportModal` - Three-screen flow (select → generating → success)

**UI Components:**
- `SuccessOverlay` - Full-screen success confirmation
- `NegativeBalanceAlert` - Red warning for negative balances
- `AuditTimeline` - Timeline view with month grouping
- `Toast` - Notification with auto-dismiss and undo

## Common Patterns

### Adding a New Protected Page

1. Create in `app/(main)/your-page/page.tsx`
2. Update `proxy.ts` to protect the route:
   ```typescript
   const isProtectedPage = request.nextUrl.pathname.startsWith('/clients') ||
                           request.nextUrl.pathname.startsWith('/your-page')
   ```
3. Get authenticated user:
   ```typescript
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) redirect('/login')
   ```
4. Wrap in `MobileLayout` component

### Editing Client Details

The edit client page (`/clients/[id]/edit`) handles both basic info and rate changes:
- **Basic Info**: Name and phone (always shown)
- **Rate Changes**: When rate is modified, effective date field appears
- **Backend**: Calls `/api/clients/[id]` for basic info, then `/api/clients/[id]/rate` if rate changed
- **Audit**: Rate changes logged with RATE_CHANGE action to audit_log

### Using MobileLayout Component

```typescript
<MobileLayout
  title="Page Title"
  showBackButton={true}
  backHref="/previous-page"
  showLogout={false}
>
  {/* Your page content */}
</MobileLayout>
```

### Creating a Database Table

1. Write SQL migration in `supabase/migrations/00X_name.sql`
2. Enable RLS: `ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;`
3. Add policy: `CREATE POLICY "trainer_isolation" ON your_table FOR ALL USING (trainer_id = auth.uid());`
4. Run migration via Supabase SQL Editor
5. Regenerate types: `npx supabase gen types typescript --project-id lwkucbtmtylbbdskvrnc > types/database.types.ts`

## Motion/Animation System (GYM-36)

**Animation Classes:**
- `.screen-enter` - Page transitions (300ms fadeSlideUp)
- `.stagger-item` - List items (300ms + 50ms delay between items)
- `.btn:active` - Button press feedback (150ms)
- `.animate-punch-bounce` - Punch card dot fill (600ms)
- `.animate-celebration-pulse` - Success overlay icon (1s infinite)

**Accessibility:** Full `prefers-reduced-motion` support - all animations disabled when user enables reduced motion.

## Implemented Features

**Complete Feature Set:**
- ✅ Phone + OTP authentication
- ✅ Client management (add, edit, delete, bulk import)
- ✅ Punch tracking (add, edit, delete with date picker)
- ✅ Payment logging with credit balance support
- ✅ Balance indicators (red/yellow/green)
- ✅ Audit timeline with full history
- ✅ Brand settings configuration
- ✅ PDF export (per-client + all clients summary)
- ✅ PWA with offline support
- ✅ Dark theme UI with animations
- ✅ Swipe-to-delete with undo
- ✅ Contact picker integration

## Recent Major Features

**Latest (2026-02-08):** PDF Export System Complete
- Client-side PDF generation (jsPDF + jsPDF-AutoTable)
- Per-client statements with date filtering + all clients summary
- Brand settings preview functionality

**Previous:** Visual enhancements (motion system, success overlays, punch card), bulk import, swipe-to-delete, audit timeline

## Technical Constraints

**Known Limitations:**
- No test suite (unit, integration, e2e)
- No rate limiting on auth endpoints

**Future Considerations:**
- Test suite implementation
- Rate limiting for production security

## Development Notes

**Build Commands:**
- Use `--webpack` flag for production builds (Next.js 16 requirement)
- Dev mode uses Turbopack for faster HMR
- PWA disabled in development, enabled in production

**PWA Development:**
- Service worker only active in production builds (`npm run build && npm run start`)
- To test PWA features: build locally, serve on HTTPS (or localhost), and install
- Clear service worker cache: Chrome DevTools → Application → Service Workers → Unregister
- Serwist config in `app/sw.ts` and `next.config.mjs`

**Common Issues:**
- **Build fails:** Check TypeScript errors with `npm run build`
- **Auth issues:** Verify Supabase env vars match in `.env.local` and Vercel
- **PDF rendering issues:** Use "Rs." not "₹", sanitize Unicode characters
- **Service worker stale cache:** Unregister SW in DevTools, hard refresh

**Best Practices:**
- Always use MobileLayout for pages
- Store currency in paise, convert to rupees only for display
- Use Server Components for data fetching, Client Components for interactivity
- Follow soft delete pattern (is_deleted flag)
- Log all balance-affecting operations to audit_log

---

**For more details:** See `README.md` for getting started, `prd.md` for full requirements, `SUPABASE_SETUP.md` for database setup.
