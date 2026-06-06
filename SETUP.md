# EventFlow — Full Setup Guide

EventFlow is a Next.js 14 event ticketing platform with event browsing for attendees and a verified organizer system.

## Features

- **Event Browsing** — Browse and discover events by category, date, location
- **Organizer Verification** — Attendees apply to become organizers; admins review applications
- **Role-based Access** — Three roles: `ATTENDEE`, `ORGANIZER`, `ADMIN`
- **Admin Dashboard** — Review/approve/reject organizer applications with optional notes
- **Auth** — NextAuth.js v5 with credentials provider + JWT sessions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v5
- **DB**: PostgreSQL via Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui
- **Validation**: Zod + React Hook Form
- **Notifications**: Sonner

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set Up the Database

```bash
# Push schema to database
npx prisma db push

# Or run migrations (recommended for production)
npx prisma migrate dev --name init

# Apply the organizer application migration
psql $DATABASE_URL < prisma/migration.sql
```

### 4. Seed an Admin User

After creating a user via the app's signup/register flow, promote them to ADMIN:

```bash
npx prisma studio
# Or via psql:
# UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### 5. Run the App

```bash
npm run dev
```

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Homepage with featured events |
| `/events` | Public | Browse all events |
| `/organizer/apply` | Logged in (non-organizer) | Submit organizer application |
| `/organizer/application-status` | Logged in | Check application status |
| `/organizer/dashboard` | ORGANIZER / ADMIN | Manage your events |
| `/organizer/events/new` | ORGANIZER / ADMIN | Create a new event |
| `/admin/applications` | ADMIN only | Review organizer applications |

## Organizer Flow

1. User signs up as ATTENDEE
2. Clicks "Host Event" → redirected to `/organizer/apply`
3. Submits application with org details
4. Admin reviews at `/admin/applications` and approves/rejects
5. On approval: user role automatically promoted to `ORGANIZER`
6. Organizer can now create and manage events

## Middleware

`middleware.ts` protects routes:
- `/organizer/events/*` and `/organizer/dashboard/*` → requires ORGANIZER or ADMIN role
- `/admin/*` → requires ADMIN role
- `/organizer/apply/*` and `/organizer/application-status/*` → requires login
