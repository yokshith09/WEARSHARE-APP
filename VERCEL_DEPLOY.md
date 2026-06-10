# Deploy WearShare to Vercel

Vercel is the quickest deployment path for this Next.js app. It provides a
generated HTTPS `vercel.app` URL, so a custom domain is not required for launch.
You can also connect your free domain `wearshare.qzz.io`.

## 1. Fix Supabase schema first

If your Supabase database already has tables, do not paste
`supabase_schema.sql`. That file is only for a brand-new empty database.

For your current database, paste and run:

```text
supabase_safe_apply.sql
```

It is designed to be re-runnable and adds missing columns/tables such as
`refund_status`, `refund_id`, `refund_amount`, and `security_events`.

## 2. Import the GitHub repo

1. Open Vercel.
2. Choose Add New Project.
3. Import `yokshith09/WEARSHARE-APP`.
4. Keep the framework preset as Next.js.
5. Use:

```text
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

## 3. Add environment variables

Add the same variables from `.env.example` in Vercel Project Settings ->
Environment Variables.

Important public variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=
```

Important private variables:

```env
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
GOOGLE_ID=
GOOGLE_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
GEMINI_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
INGEST_SECRET=
WEBHOOK_SECRET=
SECURITY_LOG_HASH_SECRET=
SENTRY_DSN=
SENTRY_ORG=yokshiths-org
SENTRY_PROJECT=javascript-nextjs
```

`SENTRY_AUTH_TOKEN` is optional and only needed if you want source-map uploads
during the build.

## 4. First deploy, then set URLs

Vercel will create a URL like:

```text
https://wearshare-app.vercel.app
```

After the first deploy, set:

```env
NEXTAUTH_URL=https://wearshare.qzz.io
ALLOWED_ORIGINS=https://wearshare.qzz.io,https://YOUR_VERCEL_URL,http://localhost:3000
```

Then redeploy.

## 5. Connect `wearshare.qzz.io`

In Vercel Project Settings -> Domains, add:

```text
wearshare.qzz.io
```

Vercel will show the exact DNS record to create in DigitalPlat. For most
subdomains, it will be a `CNAME` record pointing `wearshare.qzz.io` to
`cname.vercel-dns.com`.

After DNS is verified, use `https://wearshare.qzz.io` everywhere instead of the
temporary `vercel.app` URL.

## 6. Configure provider callbacks

Google OAuth:

```text
Authorized JavaScript origin: https://wearshare.qzz.io
Authorized redirect URI: https://wearshare.qzz.io/api/auth/callback/google
```

Supabase:

```text
Site URL: https://wearshare.qzz.io
Redirect URLs: https://wearshare.qzz.io/**
```

Razorpay webhook:

```text
Webhook URL: https://wearshare.qzz.io/api/payments/webhook
```

Use the same secret value as `RAZORPAY_WEBHOOK_SECRET`.

## 7. Verify

Test these flows after deployment:

- Google login
- Phone OTP login
- Listing upload
- Razorpay test checkout
- Paid booking decline and refund
- Booking confirmation email
- Gemini chat limits
- Sentry event capture
- PostHog event capture
