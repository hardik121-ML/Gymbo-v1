# Gymbo

**Punch Card Tracker for Personal Trainers**

A mobile-first Progressive Web App (PWA) for independent personal trainers to track client classes, payments, and balances.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tamagui UI
- **Backend**: Supabase (PostgreSQL + Auth + Row-Level Security)
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

Edit `.env.local` and add your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (server-side only)

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Project Structure

```
/app
  /api              # API routes
  /(auth)           # Authentication pages (login, signup)
  /(main)           # Main app pages (clients, punch cards)
/components         # Reusable React components
/lib                # Utility functions and helpers
/types              # TypeScript type definitions
```

## Key Features (MVP)

- Phone + 4-digit PIN authentication
- Client management (add, view, edit)
- Punch class tracking (add, edit, remove)
- Payment logging with auto-calculated classes
- Balance tracking (positive and negative)
- Visual balance indicators (red/yellow/green)
- PDF export (per-client and all-clients)
- Audit trail for all actions

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Documentation

See `prd.md` for full product requirements and specifications.
