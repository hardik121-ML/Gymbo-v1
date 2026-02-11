# Gymbo

**Punch Card Tracker for Personal Trainers**

A mobile-first Progressive Web App (PWA) for independent personal trainers in India to track client classes, payments, and balances.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + React 19
- **UI**: shadcn/ui + Tailwind CSS v4 (Dark Theme)
- **Backend**: Supabase (PostgreSQL with Row-Level Security)
- **Auth**: Supabase Auth (Phone + SMS OTP via Twilio Verify)
- **PWA**: Serwist for service worker and offline support
- **Platform**: Progressive Web App (PWA)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works for MVP)
- A Twilio account with Verify service configured (for SMS OTP)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (server-side only, rarely needed)

3. Set up Supabase and Twilio:

- **Database Setup**: Run migrations in `supabase/migrations/` via Supabase SQL Editor, then regenerate types with `npx supabase gen types typescript --project-id lwkucbtmtylbbdskvrnc > types/database.types.ts`
- **Twilio Setup**:
  1. Create a Twilio account and get your Account SID, Auth Token, and Verify Service SID
  2. In Supabase Dashboard → Authentication → Providers → Phone
  3. Enable Phone provider and add your Twilio credentials

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Project Structure

```
/app
  /api              # API routes (auth, clients, punches, payments)
  /(auth)           # Authentication pages (login, signup)
  /(main)           # Protected pages (clients, punch tracking)
  error.tsx         # Global error boundary
  layout.tsx        # Root layout with PWA metadata
/components
  /ui               # shadcn/ui components (Button, Input, Dialog, etc.)
  MobileLayout      # Reusable mobile-first layout shell
  LoadingSkeletons  # Loading state components
  [feature components] # PunchClassButton, LogPaymentButton, etc.
/lib
  /supabase         # Supabase client configurations (server, client, admin)
/types              # TypeScript type definitions
/supabase/migrations # Database migration SQL files
```

## Key Features

### Authentication
- Phone + SMS OTP authentication (6-digit code, 60-second expiry)
- Indian mobile numbers only (+91XXXXXXXXXX format)
- Supabase Auth + Twilio Verify for secure SMS delivery
- Automatic session management with cookie-based auth
- Edge case handling: duplicate signup prevention, unregistered login detection
- Cost: ~$0.008 per OTP (Twilio pricing for India)

### Client Management
- Add, view, edit clients
- Track current rate per class
- Rate change history with effective dates
- Phone number required for authentication

### Punch Tracking
- Record classes with date picker (up to 3 months back)
- Edit punch dates
- Soft delete with undo functionality
- Automatic balance updates
- Month-based grouping with pagination

### Payment Management
- Log payments with auto-calculated classes
- Credit balance system for payment remainders
- Use existing credit during payments
- Automatic credit usage when punching classes
- Full payment history with credit tracking

### Balance System
- Real-time balance calculation
- Positive balance = classes remaining
- Negative balance = classes on credit (tracked separately)
- Credit balance = monetary credit in paise
- Visual indicators (🔴 negative, 🟡 low ≤3, 🟢 healthy >3)

### UI/UX
- Mobile-first responsive design
- Dark theme throughout
- PWA installable on all devices
- Loading skeletons for better perceived performance
- Global error boundary with recovery options
- Native date pickers optimized for dark mode

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production (uses --webpack flag)
npm run start        # Start production server
npm run lint         # Run ESLint
```

**Note**: Build uses `--webpack` flag for Next.js 16 compatibility.

## Deployment

- **Production**: https://gymbo-v1.vercel.app (auto-deploys from `main` branch)
- **Staging**: Vercel preview deployments from `staging` branch

**Workflow:**
1. Develop on feature branch
2. Merge to `staging` for testing
3. Test on staging URL
4. Merge `staging` → `main` for production release

## Documentation

- `CLAUDE.md` - Full architecture, development patterns, and technical guidance

## Production Checklist

Before deploying to production:

- [x] Authentication configured (Supabase Auth + Twilio)
- [x] Phone provider enabled in Supabase
- [x] Twilio Verify service configured
- [x] Supabase TypeScript types generated
- [x] PWA configuration complete
- [x] Database migration 009 applied (phone auth)
- [ ] Set Twilio spending limits (to prevent SMS spam costs)
- [ ] Test OTP delivery on production
- [ ] Test PWA installation on target devices
- [ ] Verify all migrations are applied to production database
- [ ] Set up error monitoring/logging service (optional)

## License

Proprietary - Material Lab

## Credits

Built with Claude Code by Anthropic
