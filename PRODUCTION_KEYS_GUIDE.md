# WearShare Production Keys Guide

This maps each `.env` key to exactly where you get the real value.

## 1) Supabase

Open Supabase Dashboard -> Project -> `Settings` -> `API`.

- `NEXT_PUBLIC_SUPABASE_URL`: copy `Project URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: copy `anon` / `publishable` key
- `SUPABASE_SERVICE_ROLE_KEY`: copy `service_role` key

Phone OTP:

Open `Authentication` -> `Providers` -> `Phone` and enable provider.
Configure SMS channel supported by Supabase in your project.
If OTP still fails, check the provider error text in the login page and verify
the Supabase phone/SMS provider settings first.

## 2) NextAuth

- `NEXTAUTH_URL`: deployed app URL, e.g. `https://wearshare.qzz.io`
- `NEXTAUTH_SECRET`: generate 32+ random bytes

PowerShell example:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Google OAuth:

Open [Google Cloud Console](https://console.cloud.google.com/) -> APIs & Services -> Credentials -> OAuth 2.0 Client.

- `GOOGLE_ID`: OAuth client ID
- `GOOGLE_SECRET`: OAuth client secret
- Authorized JavaScript origin: `https://wearshare.qzz.io`
- Authorized redirect URI: `https://wearshare.qzz.io/api/auth/callback/google`

If Google login is currently failing, these are the first two values to add.
Without them, the sign-in button can render but the provider cannot complete auth.

## 3) Razorpay

Open [Razorpay Dashboard](https://dashboard.razorpay.com/) -> `Settings` -> `API Keys`.

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Webhook:

Open `Settings` -> `Webhooks` -> create webhook for your `/api/payments/webhook` URL.

- `RAZORPAY_WEBHOOK_SECRET`: webhook secret you set there

## 4) Gemini

Open [Google AI Studio](https://aistudio.google.com/app/apikey).

- `GEMINI_API_KEY`: create API key

## 5) PostHog

Open PostHog -> Project Settings -> API Keys.

- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`: project token (`phc_...`)
- `NEXT_PUBLIC_POSTHOG_HOST`: `https://eu.i.posthog.com` for the EU region

## 6) Sentry

Open Sentry -> Project Settings -> Client Keys (DSN):

- `NEXT_PUBLIC_SENTRY_DSN`: DSN
- `SENTRY_DSN`: same DSN is acceptable

For this project:

- `SENTRY_ORG=yokshiths-org`
- `SENTRY_PROJECT=javascript-nextjs`

The URL `.../settings/projects/javascript-nextjs/keys/` is the settings page, not
the DSN. Copy the DSN value displayed on that page.

`SENTRY_AUTH_TOKEN` is optional for runtime error reporting. It is only needed
during builds that upload source maps. Create it under Organization Settings ->
Developer Settings -> Custom Integrations, and store it only in the private
build or CI secret store.

## 7) Resend

Open [Resend Dashboard](https://resend.com/) -> API Keys:

- `RESEND_API_KEY`

Add and verify sender domain/address:

- `RESEND_FROM_EMAIL`: e.g. `WearShare <bookings@wearshare.in>`

## 8) Upstash Redis

Open [Upstash Console](https://console.upstash.com/) -> Redis database -> REST API section.

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 9) Cloudflare R2

Open Cloudflare Dashboard -> R2 -> bucket -> API Tokens / S3 API.

- `R2_ACCOUNT_ID`: Cloudflare account ID
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`: bucket name, e.g. `wearshare-listing-photos`
- `R2_PUBLIC_BASE_URL`: your public CDN URL or R2 public domain

## 10) App Security Secrets

- `INGEST_SECRET`: random secret for `/api/ingest`
- `WEBHOOK_SECRET`: random secret for `/api/webhooks/listing`
- `ALLOWED_ORIGINS`: comma-separated origins, e.g. `https://wearshare.qzz.io,http://localhost:3000`

These are still missing in your current Vercel list and should be added before
you depend on ingestion, webhooks, or origin checks in production.

Recommended with your current domain:

- `NEXTAUTH_URL=https://wearshare.qzz.io`
- `ALLOWED_ORIGINS=https://wearshare.qzz.io,http://localhost:3000`

Optional but useful:

- `GEMINI_MODEL=gemini-2.5-flash` if you want to pin the working model explicitly

## 11) Deploy Checklist

1. Put all keys into local `.env.local`.
2. Put same keys in Vercel (`Production` + `Preview`).
3. If the database is new and empty, apply [supabase_schema.sql](E:/New folder/wearshare-app/supabase_schema.sql). If tables already exist, apply [supabase_safe_apply.sql](E:/New folder/wearshare-app/supabase_safe_apply.sql) instead.
4. Trigger ingest:

```bash
curl -X POST https://your-domain/api/ingest \
  -H "Authorization: Bearer YOUR_INGEST_SECRET"
```

5. Test:
- `/api/chat` returns grounded listing answers
- `/api/chat/stream` streams tokens
- chat widget shows listing cards for fashion queries

## 12) GitHub Actions Deploy

If you want automatic deploys from GitHub, add these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

The workflow at [`.github/workflows/vercel-deploy.yml`](E:/New folder/wearshare-app/.github/workflows/vercel-deploy.yml)
builds on pull requests and deploys `main` to Vercel automatically.
