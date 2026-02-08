# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (localhost:3000, uses Turbopack)
npm run build --webpack  # Production build (--webpack flag required for Next.js 16)
npm run lint             # Run ESLint
npm run start            # Start production server (needed to test PWA)

# Regenerate database types after schema changes
npx supabase gen types typescript --project-id lwkucbtmtylbbdskvrnc > types/database.types.ts
```

No test suite exists — there are no unit, integration, or e2e tests.

## Project Overview

**Gymbo** is a mobile-first PWA for independent personal trainers in India to track client classes (punches), payments, and balances.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + React 19 + shadcn/ui + Tailwind CSS v4 + Supabase (PostgreSQL + Auth) + Serwist (PWA)

**Production:** https://gymbo-v1.vercel.app (auto-deploys from `main`)

## Architecture

### Route Structure

```
app/
  page.tsx                          # Root redirect (auth → /dashboard, unauth → /login)
  (auth)/
    layout.tsx                      # Orange theme wrapper (client component, manages theme on <html>)
    login/                          # Phone + OTP auth with NumericKeypad
    signup/                         # Name + phone + OTP with NumericKeypad
  (main)/
    layout.tsx                      # ThemeProvider wrapper (dark/light only)
    dashboard/                      # Dashboard with LedgerCard + client list
    clients/                        # Client list with sort controls
    clients/new/                    # Add client form
    clients/export/                 # Export all clients (PDF/CSV)
    clients/[id]/                   # Client detail with hero, punch card, quick actions
    clients/[id]/edit/              # Edit client info + rate
    clients/[id]/audit/             # Audit timeline
    clients/[id]/history/           # Payment history
    clients/[id]/export/            # Export single client (PDF/CSV)
    settings/                       # Settings menu (profile tab in BottomNav)
    settings/brand|profile|notifications|privacy|help/
  api/
    auth/signup|login|verify-otp|logout/
    clients/                        # CRUD + bulk-import + export-all
    clients/[id]/punches|payments|rate|export-data|recalculate-balance/
    punches/[id]/                   # Edit/delete individual punches
    trainers/                       # Profile + brand settings
```

### Theme System

Three themes managed across two layouts:

- **light** — Warm beige (#ebebe6) + charcoal (#1a1a1a)
- **dark** — Charcoal (#2d2d2d) + warm beige (#ebebe6) [default]
- **orange** — Burnt orange (#f8623a) background, auth pages only

**`ThemeProvider`** (`components/ThemeProvider.tsx`) lives in `app/(main)/layout.tsx` — NOT in the root layout. It manages dark/light only. `toggleTheme()` cycles between dark and light. `setTheme()` accepts any theme value.

**Orange theme** is managed separately by `app/(auth)/layout.tsx`, which applies `theme-orange` class directly to `document.documentElement` on mount and restores the user's stored theme on unmount. This is intentionally outside ThemeProvider.

**FOUC prevention:** An inline `<script>` in `app/layout.tsx` checks `window.location.pathname` — if on `/login` or `/signup`, applies `theme-orange`; otherwise reads `gymbo-theme` from localStorage and applies `dark` if needed. This runs before React hydration.

Color tokens defined in `app/globals.css` using hex values with `:root`, `.dark`, and `.theme-orange` selectors. Status colors: `--status-negative`, `--status-warning`, `--status-healthy`.

### Tailwind v4

Config lives in `app/globals.css` via `@theme inline` — there is NO `tailwind.config` file. Color mappings use `--color-*: var(--*)` pattern to bridge CSS custom properties to Tailwind utilities. Font is set via `--font-sans: var(--font-space-mono)` and `--font-mono: var(--font-space-mono)`.

### Layout System

**AppShell** (`components/AppShell.tsx`) — Primary layout wrapper. Combines TopBar + content area + optional BottomNav.

```tsx
<AppShell title="page title" showBackButton={true} backHref="/clients" showBottomNav={true} activeTab="clients">
  {children}
</AppShell>
```

- **TopBar** (`components/TopBar.tsx`) — Sticky, blurred background, centered lowercase title, left Grab icon (main pages) or back button (sub-pages), right settings link
- **BottomNav** (`components/BottomNav.tsx`) — Fixed bottom with 3 tabs: dashboard, clients, profile. Active dot indicator.

Pages with BottomNav: dashboard, clients list, settings. All sub-pages: no BottomNav, show back button.

### Auth Proxy (NOT middleware.ts)

Auth is handled by `proxy.ts`, not Next.js middleware. It validates sessions via `supabase.auth.getUser()` and redirects:
- Authenticated users on `/login` or `/signup` → `/dashboard`
- Unauthenticated users on `/clients/*`, `/settings/*`, or `/dashboard/*` → `/login`

When adding new protected routes, update the `isProtectedPage` check in `proxy.ts`.

### Supabase Clients

- `lib/supabase/server.ts` — Server-side client (respects RLS, use in Server Components/API routes)
- `lib/supabase/client.ts` — Browser client (for Client Components)
- `lib/supabase/admin.ts` — Admin client (bypasses RLS, for pre-auth checks only)

```typescript
// Standard pattern for Server Components
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### Database

**Core Tables:** `trainers`, `clients`, `punches`, `payments`, `audit_log`

All tables use RLS with `trainer_id = auth.uid()` policies. Soft deletes via `is_deleted` flag — never hard delete. **Exception:** `payments` table has NO `is_deleted` column — do not filter payments by `is_deleted`.

**Balance System:**
- Balance = (classes from payments) - (active punches). Stored denormalized in `clients.balance`.
- Can go negative (trainer extends credit).
- Credit remainder stored in `clients.credit_balance` (paise). Auto-used when punching if credit ≥ rate.
- All balance-affecting operations logged to `audit_log`.

**Date columns:** `payment_date` and `punch_date` are PostgreSQL `DATE` type — use `YYYY-MM-DD` format strings, not ISO timestamps.

**Adding a table:** Write migration in `supabase/migrations/`, enable RLS, add trainer isolation policy, run via Supabase SQL Editor, regenerate types.

### Currency

All monetary amounts stored in **paise** (₹800 = 80000 paise) to avoid floating-point issues. Use `lib/utils/currency.ts`:
- `formatCurrency(paise)` → `"₹1,000"`
- `formatRate(paise)` → `"₹1,000/class"`

In PDFs, use `"Rs."` not `"₹"` (font compatibility).

### Design System

- **Font:** Space Mono (variable: `--font-space-mono`), used for both sans and mono via Tailwind
- **Icon:** Grab (lucide-react) used as the brand icon everywhere — TopBar, auth pages, PDF exports (circle with "G")
- **Colors:** Hex values in globals.css. Primary: `#f8623a` (burnt orange). Status: negative (red), warning (orange), healthy (green)
- **Style:** All text lowercase, wide letter-spacing, rounded-full buttons, border-bottom inputs. No emojis in buttons — use lucide-react icons.
- **Radius:** 1rem base
- **Action buttons:** `bg-foreground text-background h-14 rounded-full font-bold text-sm lowercase tracking-wider` — used for all primary CTAs (punch class, confirm payment, save changes, create client)
- **Form fields:** Native `<input>` with `border-0 border-b border-foreground/20` and labels as `text-[10px] font-mono lowercase opacity-50 tracking-wider`. Rate fields use ₹ prefix + "/ class" suffix.
- **Components:** shadcn/ui with customized Button (rounded-full, `action` variant), Input (border-bottom), Card (border-foreground/10), Label (10px mono), Badge (status variants)
- **NumericKeypad** (`components/NumericKeypad.tsx`) — Used in auth pages and payment flow
- **LogPaymentButton** — Full-screen keypad overlay (not a Dialog modal). Renders as a quick action icon on client detail; opens full-screen amount entry with NumericKeypad.
- **SwipeToDelete** — Generic swipe-to-delete wrapper accepting `children`. Used in dashboard and clients list. Includes confirmation dialog and undo toast.

### Export System

Full-page export flow with date range selection, format toggle, and PDF preview.

**Routes:**
- `/clients/[id]/export` — Single client export options
- `/clients/export` — All clients export options

**Components:**
- `ExportOptionsPage` — Shared options page (date range pills, include notes toggle, PDF/CSV format, generate/preview buttons)
- `StatementPreview` — In-app PDF preview with share (Web Share API), download, and print
- `ExportAllClientsButton` — Link to `/clients/export` from clients list

**Generators (client-side, in `lib/`):**
- `lib/pdf/generateClientPDF.ts` — Per-client invoice-style statement (brand icon, bill to, line items, total due)
- `lib/pdf/generateAllClientsPDF.ts` — All clients summary table
- `lib/pdf/pdfTemplate.ts` — Shared PDF utilities (header, table, footer, brand icon)
- `lib/csv/generateClientCSV.ts` — Per-client CSV with classes, payments, balance
- `lib/csv/generateAllClientsCSV.ts` — All clients summary CSV

Each generator exports three variants: `generate*()` (returns jsPDF doc or string), `download*()` (triggers browser download), `get*Blob()` (returns blob for preview/share).

**Data endpoints:** `GET /api/clients/[id]/export-data` and `GET /api/clients/export-all` (accept `startDate`/`endDate` query params).

### PWA

Serwist config in `app/sw.ts` and `next.config.ts`. Service worker disabled in development, enabled in production. To test: `npm run build && npm run start`.

### Animation System

Defined in `app/globals.css`. Key classes: `.screen-enter` (page transitions), `.stagger-item` (list stagger), `.animate-punch-bounce`, `.animate-celebration-pulse`. All respect `prefers-reduced-motion`.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key (safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only, SECRET)

## Common Issues

- **Build fails:** Check TypeScript errors with `npm run build --webpack`
- **Stale Turbopack cache:** Dev uses Turbopack, production uses Webpack. If dev shows stale styles or unexpected behavior, run `rm -rf .next` and restart the dev server.
- **Auth issues:** Verify Supabase env vars in `.env.local` match Vercel
- **PDF rendering:** Use `"Rs."` not `"₹"`, sanitize Unicode for jsPDF
- **Stale service worker:** Unregister in DevTools → Application → Service Workers
