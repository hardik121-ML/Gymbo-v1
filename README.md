# Gymbo

**Punch Card Tracker for Personal Trainers**

A mobile-first Progressive Web App (PWA) for independent personal trainers in India to track client classes, payments, and balances.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + React 19
- **UI**: shadcn/ui + Tailwind CSS v4 (Dark Theme)
- **Backend**: Supabase (PostgreSQL with Row-Level Security)
- **Auth**: Supabase Auth (email/password)
- **PWA**: Serwist for service worker and offline support
- **Platform**: Progressive Web App (PWA)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works for MVP)

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

3. Set up the database:

See `SUPABASE_SETUP.md` for detailed setup instructions or `RUN_MIGRATIONS.md` for quick migration steps.

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
- Email + Password authentication (minimum 6 characters)
- Supabase Auth for secure session management
- Optional phone number collection during signup
- Zero-cost auth (included in Supabase free tier)

### Client Management
- Add, view, edit clients
- Track current rate per class
- Rate change history with effective dates
- Phone number (optional) for contact

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

## Documentation

- `CLAUDE.md` - Full architecture, development patterns, and technical guidance
- `prd.md` - Complete product requirements document
- `SUPABASE_SETUP.md` - Detailed database setup instructions
- `RUN_MIGRATIONS.md` - Quick migration guide

## Production Checklist

Before deploying to production:

- [x] Authentication configured (Supabase Auth)
- [x] Supabase TypeScript types generated
- [x] PWA configuration complete
- [ ] Implement rate limiting on auth endpoints (optional)
- [ ] Test PWA installation on target devices
- [ ] Verify all migrations are applied to production database
- [ ] Set up error monitoring/logging service (optional)

## License

Proprietary - Material Lab

## Credits

Built with Claude Code by Anthropic
