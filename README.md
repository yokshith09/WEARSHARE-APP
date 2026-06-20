# WearShare

WearShare is a peer-to-peer fashion rental marketplace for discovering, renting, and listing outfits within a local community.

**Live Demo**: [https://wearshare.qzz.io](https://wearshare.qzz.io)

## Overview

WearShare combines a responsive storefront with secure authentication, booking and payment flows, renter/lister dashboards, profile sizing data, logistics tracking, and damage-claim support.

## Key Features

### For Renters
- Discover outfits by category, city, pincode, size, occasion, distance, and availability
- View complete product pages with pricing, deposit, lender, fit, and review information
- Select rental dates and add outfits to cart
- Pay through Razorpay
- Track booking, pickup, return, and deposit status
- Save outfits to wishlist
- Store measurements for fit recommendations
- Manage profile and account details

### For Listers
- Publish outfits with photos, category, size, location, price, deposit, and unavailable dates
- Use AI-assisted listing suggestions when configured
- Review inventory and incoming rental requests
- Approve or decline bookings
- Track active rentals, earnings, and payouts
- Record pickup and return evidence

## Authentication

Three authentication methods:
- **Email and password** with bcrypt hashing
- **Email OTP** with rate limiting and resend support
- **Google OAuth** (when configured)

## Technology Stack

| Area | Technology |
|------|------------|
| Application | Next.js 14 App Router |
| UI | React 18, Tailwind CSS 4, Radix UI |
| Authentication | NextAuth, Google OAuth, custom credential providers |
| Database | Supabase PostgreSQL |
| Payments | Razorpay |
| Email | Resend or SMTP/Nodemailer |
| Session and locks | Upstash Redis |
| Image storage | Cloudflare R2 |
| AI | Google Gemini and optional external providers |
| Monitoring | Sentry |
| Analytics | PostHog |

## Quick Start

### Requirements

- Node.js 20 or newer
- npm
- A Supabase project
- Resend or SMTP credentials for email OTP and password recovery
- Google and Razorpay credentials when testing those integrations

### Installation

```bash
git clone YOUR_REPOSITORY_URL
cd wearshare-app
npm install
```

Create the local environment file:

```powershell
Copy-Item .env.example .env.local
```

On macOS or Linux:

```bash
cp .env.example .env.local
```

Apply `supabase_safe_apply.sql` in the Supabase SQL Editor.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Important Routes

| Route | Purpose |
|-------|---------|
| `/` | Home and featured listings |
| `/browse` | Search and filters |
| `/listing/[id]` | Product details and rental dates |
| `/cart` | Rental cart |
| `/checkout` | Razorpay checkout |
| `/login` | Password, email OTP, and Google sign-in |
| `/reset` | Request or complete a password reset |
| `/profile` | Profile and measurements |
| `/dashboard/renter` | Renter bookings and wishlist |
| `/dashboard/lister` | Inventory, requests, and earnings |
| `/trips/[id]` | Handover and return workflow |

## Available Commands

```bash
npm run dev
npm run build
npm run start
```

## Documentation

For detailed information about the project architecture, authentication flows, database setup, and environment configuration, see the [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) file.

## Security

- Passwords are hashed with bcrypt using cost factor 12
- OTP and reset tokens are stored as hashes
- Sessions use signed NextAuth JWTs and expire after 30 days
- Authentication attempts are rate limited
- Sensitive local files such as `.env.local` and `.vercel/` are ignored
- Payment signatures are verified server-side

## Deployment

The app is compatible with Vercel:

1. Import the Git repository into Vercel.
2. Add the environment variables in the Vercel project settings.
3. Set `NEXTAUTH_URL` to the production domain.
4. Add the production Google callback URL.
5. Configure the Razorpay webhook URL and secret.
6. Run the Supabase migration before accepting registrations.
7. Verify email sender domains before enabling email OTP or password recovery.

**Live Demo**: [https://wearshare.qzz.io](https://wearshare.qzz.io)
