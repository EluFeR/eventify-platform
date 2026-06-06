Here's your README, ready to copy:

---

# EventFlow 🎟️

A full-stack **event ticketing and hosting platform** built with Next.js. Attendees discover and book tickets (paid via **Chapa**), organizers apply for verification and sell tiered tickets, and admins review applications and track platform revenue.

---

## ✨ Features

### For attendees
- Register, browse published events, and view event details
- Buy tickets across **multiple tiers** (e.g. Normal / VIP / VVIP), each with its own price and quantity
- Pay securely through **Chapa** hosted checkout (free tickets confirm instantly)
- Get a **QR-code ticket** on confirmation
- **My Tickets** page with full booking history and status

### For organizers
- Apply to become a verified organizer
- In-app notification when the application is approved/rejected
- Create events with tiered tickets, then **publish** them to go live
- Dashboard with per-organizer **earnings** (net of platform fee), gross sales, and tickets sold

### For admins
- Review, approve, or reject organizer applications (with notes)
- Approval auto-promotes the user to `ORGANIZER`
- **Platform revenue dashboard**: commission profit, gross sales, payouts owed to organizers

### Monetization
- **Merchant-of-record commission model**: the platform collects each ticket payment and keeps a configurable percentage (`PLATFORM_FEE_PERCENT`, default **10%**); the remainder is tracked as the organizer's earnings.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript, React 19 |
| Auth | NextAuth v5 (credentials + JWT sessions) |
| Database | PostgreSQL via Prisma ORM |
| Payments | Chapa |
| Styling | Tailwind CSS + shadcn/ui |
| Forms & validation | React Hook Form + Zod |
| Notifications | Sonner |
| QR codes | `qrcode` |

---

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone <your-repo-url>
cd eventflow
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
# Database (PostgreSQL — local or a hosted provider like Neon)
DATABASE_URL="postgresql://user:password@host:5432/eventflow?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Chapa payments
CHAPA_SECRET_KEY="CHASECK_TEST-xxxxxxxxxxxxxxxx"

# Platform commission percentage (optional, default 10)
PLATFORM_FEE_PERCENT=10
```

### 3. Set up the database

```bash
npx prisma db push      # sync schema to your database
npx prisma generate     # generate the Prisma client
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 👤 Creating the first admin

There is intentionally **no in-app way to grant admin** (that would be a security hole). Promote your account once via the database:

```bash
npx prisma studio
# Open the User table → set your account's `role` to ADMIN → Save
```

Or with SQL:

```bash
npx prisma db execute --stdin <<< "UPDATE \"User\" SET role='ADMIN' WHERE email='you@example.com';"
```

> ⚠️ Roles are stored in the JWT at sign-in. After changing a role in the DB, **sign out and back in** for it to take effect.

---

## 🔄 How it works

```
Register ──▶ ATTENDEE ──(apply + admin approval)──▶ ORGANIZER
   │                                                    │
   ▼                                                    ▼
Browse → pick a tier → pay via Chapa → QR ticket    Create events → publish → sell
```

**Booking & payment flow**
1. Attendee selects a ticket tier and quantity on the event page.
2. A `PENDING` booking is created and the buyer is redirected to Chapa checkout.
3. After payment, Chapa returns the user to the booking page; the payment is **verified** with Chapa, the booking is marked `CONFIRMED`, `sold` is incremented, and a QR code is generated.
4. Free (price-0) tickets skip Chapa and confirm immediately.

---

## 🗺 Key routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Homepage with featured events |
| `/events` | Public | Browse published events |
| `/events/[id]` | Public | Event detail + ticket purchase |
| `/register`, `/login` | Public | Auth |
| `/tickets` | Logged in | My Tickets (booking history) |
| `/bookings/[id]` | Owner | Ticket / booking confirmation + QR |
| `/organizer/apply` | Logged in | Organizer application |
| `/organizer/application-status` | Logged in | Application status |
| `/organizer/dashboard` | Organizer / Admin | Manage events + earnings |
| `/organizer/events/new` | Organizer / Admin | Create an event |
| `/admin/applications` | Admin | Review applications + platform revenue |

Route protection is enforced in `middleware.ts`.

---

## 📂 Project structure

```
app/
  api/            # Route handlers (events, bookings, auth, admin, organizer)
  events/         # Listing + detail pages
  bookings/       # Ticket confirmation page
  organizer/      # Apply, status, dashboard, create event
  admin/          # Admin dashboard
  tickets/        # My Tickets
components/       # Navbar, EventCard, ApprovalNotice, UI primitives
lib/              # auth, prisma, chapa, fees, bookings helpers
prisma/           # schema.prisma
```

---

## 📜 Scripts

```bash
npm run dev     # start dev server (Turbopack)
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint
```

---

## 📌 Notes & roadmap

- **Payouts:** Currently all ticket revenue lands in the platform's Chapa account, with each organizer's share *tracked* (not auto-paid). Automatic payouts via **Chapa subaccounts / split payments** are the next planned milestone.
- **Email notifications** (in addition to the in-app approval toast) can be added with an email provider.

---

## 📄 License

MIT — feel free to use and adapt.
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> 8032be7 (Initial commit)
