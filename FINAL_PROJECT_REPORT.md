# WearShare Final Project Report

## Project Summary

WearShare is a Next.js marketplace for renting premium ethnic and occasion wear locally. The app supports browsing by city and pincode, listing outfits, renter checkout with Razorpay, lister dashboards, booking logistics, Gemini-powered assistance, analytics, monitoring, and production deployment on Vercel.

## Current Build Status

- Production build passes with `npm run build`.
- Latest recommended deployment target: Vercel.
- Main production domain target: `https://wearshare.qzz.io`.
- CI/CD workflow exists at `.github/workflows/vercel-deploy.yml`.
- Automatic Vercel deployment requires GitHub secrets:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

## Implemented Product Features

### Authentication

- Google sign-in through NextAuth.
- Phone OTP sign-in through Supabase phone auth.
- JWT session expiry and rotation logic.
- Redis-backed active session tracking when Upstash is configured.
- Security event logging for auth and suspicious events.

Google OAuth still requires this exact redirect URI in Google Cloud Console:

```text
https://wearshare.qzz.io/api/auth/callback/google
```

### Marketplace Browsing

- Browse listings by category, occasion, size, distance, trusted lender, city, and pincode.
- Supported launch cities: Bengaluru and Coimbatore.
- Listing cards show city/area context.
- Listing creation captures city and pincode.

### Listing Creation

- Listers can upload outfit photos.
- Listing form captures title, category, occasion, size, pricing, deposit, city, pincode, and unavailable dates.
- AI listing assistant can suggest listing metadata when Gemini is configured.
- Cloudflare R2 upload path exists when R2 credentials are configured.

### Booking And Checkout

- Instant booking confirmation step exists at `/booking/[id]`.
- Renter acknowledgement is required before payment.
- Damage deposit and protection fee breakdown is shown before checkout.
- Razorpay Standard Checkout order creation and signature verification are implemented.
- Confirmed paid bookings now enter the `approved` status.

### Booking Status Timeline

The product status model is now:

```text
requested -> approved -> picked_up -> returned
```

Backward compatibility exists for older statuses:

```text
pending -> requested
confirmed -> approved
active -> picked_up
completed -> returned
```

### Pickup And Return Logistics

- Logistics page exists at `/trips/[id]`.
- Works for renter and lister roles using `?role=renter` or `?role=lister`.
- Includes pickup address, return flow, chat-style messages, handover photo upload, pickup confirmation, return confirmation, and deposit release UI.
- Dashboards link directly into logistics pages.

### Lister Dashboard

- Lister dashboard includes:
  - Inventory view
  - Rental requests
  - Active logistics
  - Earnings overview
  - Payout schedule
  - Rental history
  - Relist action

### Renter Dashboard

- Renter dashboard includes:
  - Bookings
  - Status timeline
  - Deposit visibility
  - Logistics action
  - Wishlist placeholder
  - Measurements profile

### Payments And Refunds

- Razorpay payment orders are created server-side.
- Payment signatures are verified server-side.
- Paid booking decline triggers refund workflow before final decline.
- Refund status fields are stored in Supabase.

### AI Assistant

- Gemini chat and streaming routes exist.
- RAG ingestion stores listing embeddings.
- Gemini model fallback uses `gemini-2.5-flash` instead of deprecated Gemini 1.5 models.
- Chat rate limits exist for per-minute and daily usage.

### Monitoring And Analytics

- PostHog client analytics integration exists.
- Sentry DSN support exists.
- Security events table and recording utilities exist.

## Required Production Configuration

Add or verify these in Vercel:

```env
NEXTAUTH_URL=https://wearshare.qzz.io
ALLOWED_ORIGINS=https://wearshare.qzz.io,http://localhost:3000
GOOGLE_ID=
GOOGLE_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
RAZORPAY_KEY_ID=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
RESEND_API_KEY=
RESEND_FROM_EMAIL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
INGEST_SECRET=
WEBHOOK_SECRET=
SECURITY_LOG_HASH_SECRET=
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
```

Optional for image uploads:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

## Supabase Notes

If tables already exist, use:

```text
supabase_safe_apply.sql
```

Do not re-run the full schema on an existing database unless you intentionally reset it.

## Remaining Manual Setup

- Register Google OAuth redirect URI.
- Enable Supabase Phone provider and configure SMS delivery.
- Add Vercel GitHub Action secrets for auto-deploy.
- Add Vercel production environment variables.
- Configure `wearshare.qzz.io` DNS to Vercel.
- Create Razorpay webhook pointing to `/api/payments/webhook`.
- Run `/api/ingest` with `INGEST_SECRET` after listings exist.

## Verification Checklist

- Google login works.
- OTP login sends SMS.
- User can list an item with city and pincode.
- Browse filters work for Bengaluru, Coimbatore, and pincode.
- Booking page requires damage/deposit acknowledgement before payment.
- Razorpay test payment succeeds.
- Renter dashboard shows booking timeline.
- Lister dashboard shows active logistics and payout schedule.
- `/trips/[id]?role=renter` and `/trips/[id]?role=lister` open correctly.
- Gemini chat responds using `gemini-2.5-flash`.

