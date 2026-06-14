# WearShare

WearShare is a full-stack peer-to-peer fashion rental marketplace for discovering, renting, and listing outfits within a local community. It combines a responsive storefront with secure authentication, booking and payment flows, renter/lister dashboards, profile sizing data, logistics tracking, and damage-claim support.

## Product Overview

WearShare supports two connected user journeys:

### Renters

- Discover outfits by category, city, pincode, size, occasion, distance, and availability
- Open a complete product page with pricing, deposit, lender, fit, and review information
- Select rental dates and add an outfit to the cart
- Pay through Razorpay
- Track booking, pickup, return, and deposit status
- Save outfits to a wishlist
- Store measurements for fit recommendations
- Manage profile and account details

### Listers

- Publish an outfit with photos, category, size, location, price, deposit, and unavailable dates
- Use AI-assisted listing suggestions when configured
- Review inventory and incoming rental requests
- Approve or decline bookings
- Track active rentals, earnings, and payouts
- Record pickup and return evidence

## Authentication

WearShare provides three authentication methods:

1. **Email and password**
   - Users can create an account from the login page.
   - Passwords must contain at least 8 characters.
   - Passwords are hashed with bcrypt before storage.
   - Plain-text passwords are never stored.

2. **Email OTP**
   - A six-digit, time-limited code is delivered through Resend or SMTP.
   - OTP values are stored as bcrypt hashes.
   - OTP verification is rate limited and codes are marked as used after successful login.
   - Users can resend an OTP from the verification screen.

3. **Google OAuth**
   - Google is enabled only when both `GOOGLE_ID` and `GOOGLE_SECRET` are configured.
   - The production callback URL must be added to the Google OAuth client:

```text
https://YOUR_DOMAIN/api/auth/callback/google
```

Phone and SMS OTP authentication have been removed.

### Password recovery

The login page includes a **Forgot password?** flow:

- The user requests a reset link using their email.
- A random token is created and only its bcrypt hash is stored.
- The link expires after 30 minutes.
- Reset links are single-use.
- The new password is stored as a bcrypt hash.

## Main Features

- Editorial home page with live-listing fallbacks
- Product browse and filtering
- Product detail and availability calendar
- Cart and checkout
- Razorpay payment verification
- Booking and rental status management
- Renter and lister dashboards
- Wishlist
- Profile and measurement management
- Email/password, email OTP, and Google authentication
- Password reset by email
- Cloud image upload support through Cloudflare R2
- Booking confirmation emails
- AI listing assistant and optional try-on/chat integrations
- Rate limiting and security-event logging
- Sentry and PostHog integration points

## Technology Stack

| Area | Technology |
| --- | --- |
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

## Architecture

```text
Browser
  |
  v
Next.js pages and client components
  |
  +--> NextAuth authentication
  +--> Next.js API route handlers
          |
          +--> Supabase PostgreSQL
          +--> Razorpay
          +--> Resend / SMTP
          +--> Upstash Redis
          +--> Cloudflare R2
          +--> Gemini / AI providers
```

The Supabase service-role key is used only in server-side modules and API routes. It must never be exposed through a `NEXT_PUBLIC_` variable.

## Repository Structure

```text
app/
  api/                 Server API routes
  browse/              Search and filtering
  cart/                Shopping cart
  checkout/            Payment checkout
  dashboard/           Renter and lister dashboards
  listing/[id]/        Product details
  login/               Authentication
  profile/             User profile
  reset/               Password recovery
  trips/[id]/          Pickup and return logistics

components/            Shared product and UI components
hooks/                 Client hooks
lib/                   Auth, database, payments, email, AI, and utilities
assets/                Source images imported by Next.js
public/                Public static assets
supabase_safe_apply.sql Idempotent database setup and migration
supabase_schema.sql     Full schema reference
```

## Local Development

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

Apply `supabase_safe_apply.sql` in the Supabase SQL Editor. This adds all required tables and safely adds newer columns such as `password_hash`.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Required

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

Generate a strong NextAuth secret:

```bash
openssl rand -base64 32
```

### Email authentication

Resend:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=WearShare <noreply@example.com>
```

Or SMTP:

```env
EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
EMAIL_FROM_EMAIL=WearShare <noreply@example.com>
```

### Google OAuth

```env
GOOGLE_ID=
GOOGLE_SECRET=
```

For local development, add this authorized redirect URI in Google Cloud:

```text
http://localhost:3000/api/auth/callback/google
```

### Razorpay

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

### Optional services

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=

GEMINI_API_KEY=
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

## Database Setup

Run `supabase_safe_apply.sql` for both new and existing projects. Important authentication tables and columns include:

- `public.users.password_hash`
- `public.email_otps`
- `public.reset_tokens`
- NextAuth account and verification tables

The password hash column is intentionally server-only. Do not include it in public profile queries, browser responses, logs, or analytics.

## Important Routes

| Route | Purpose |
| --- | --- |
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

## Security Notes

- Passwords are hashed with bcrypt using cost factor 12.
- OTP and reset tokens are also stored as hashes.
- Sessions use signed NextAuth JWTs and expire after 30 days.
- Authentication attempts are rate limited.
- Sensitive local files such as `.env.local` and `.vercel/` are ignored.
- Payment signatures are verified server-side.
- Supabase service credentials remain server-only.

Before a public production launch, add automated tests, CSRF-sensitive workflow coverage, a stronger password policy, optional email verification for password registration, and production alerting.

## Available Commands

```bash
npm run dev
npm run build
npm run start
```

Production build verification:

```powershell
npm.cmd run build
```

`npm.cmd` is useful on Windows systems where PowerShell blocks `npm.ps1`.

## Deployment

The app is compatible with Vercel:

1. Import the Git repository into Vercel.
2. Add the environment variables in the Vercel project settings.
3. Set `NEXTAUTH_URL` to the production domain.
4. Add the production Google callback URL.
5. Configure the Razorpay webhook URL and secret.
6. Run the Supabase migration before accepting registrations.
7. Verify email sender domains before enabling email OTP or password recovery.

## Current Status

The application builds successfully with Next.js production checks. External workflows still depend on valid Supabase, email, Google, Razorpay, Redis, R2, and AI provider credentials.
