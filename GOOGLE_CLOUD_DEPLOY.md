# Deploy WearShare to Google Cloud Run

Cloud Run provides a generated HTTPS `run.app` URL, so a custom domain is not required.

## 1. Prepare Google Cloud

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

Use `asia-south1` for Mumbai unless most users are closer to another region.

## 2. Store server secrets

Create each secret in Google Secret Manager. Never put real values in this file or git.

```powershell
Set-Content -NoNewline secret.txt "REPLACE_WITH_REAL_VALUE"
gcloud secrets create NEXTAUTH_SECRET --data-file=secret.txt
Remove-Item secret.txt
```

Repeat for:

- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `GOOGLE_SECRET`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `UPSTASH_REDIS_REST_TOKEN`
- `GEMINI_API_KEY`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `INGEST_SECRET`
- `WEBHOOK_SECRET`

Sentry runtime reporting only needs the DSN. `SENTRY_AUTH_TOKEN` is a build-time
credential for source-map uploads; omit it for the first deployment and add it
later through a private Cloud Build or GitHub Actions secret.

Grant the Cloud Run service account Secret Manager access before attaching secrets.

## 3. Deploy from source

Replace the placeholder public values and deploy:

```powershell
gcloud run deploy wearshare `
  --source . `
  --region asia-south1 `
  --allow-unauthenticated `
  --port 8080 `
  --memory 1Gi `
  --timeout 120 `
  --set-build-env-vars "NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY,NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=YOUR_POSTHOG_TOKEN,NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com,NEXT_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN" `
  --set-env-vars "NODE_ENV=production,NEXTAUTH_URL=https://YOUR_CLOUD_RUN_URL,NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY,GOOGLE_ID=YOUR_GOOGLE_CLIENT_ID,RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID,RESEND_FROM_EMAIL=onboarding@resend.dev,UPSTASH_REDIS_REST_URL=YOUR_UPSTASH_REST_URL,R2_ACCOUNT_ID=YOUR_R2_ACCOUNT_ID,R2_BUCKET=YOUR_BUCKET,R2_PUBLIC_BASE_URL=YOUR_R2_DEV_URL,NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=YOUR_POSTHOG_TOKEN,NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com,SENTRY_ORG=YOUR_SENTRY_ORG,SENTRY_PROJECT=YOUR_SENTRY_PROJECT,SENTRY_DSN=YOUR_SENTRY_DSN,GEMINI_MODEL=gemini-1.5-flash,GEMINI_MAX_OUTPUT_TOKENS=500,GEMINI_CHAT_PER_MINUTE_LIMIT=10,GEMINI_CHAT_DAILY_LIMIT=100,OTP_VERIFY_MAX_ATTEMPTS=5,ALLOWED_ORIGINS=https://YOUR_CLOUD_RUN_URL" `
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,GOOGLE_SECRET=GOOGLE_SECRET:latest,RAZORPAY_KEY_SECRET=RAZORPAY_KEY_SECRET:latest,RAZORPAY_WEBHOOK_SECRET=RAZORPAY_WEBHOOK_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest,INGEST_SECRET=INGEST_SECRET:latest,WEBHOOK_SECRET=WEBHOOK_SECRET:latest"
```

For the first deployment, omit `NEXTAUTH_URL` and `ALLOWED_ORIGINS`, copy the generated Cloud Run URL, then update them:

```powershell
gcloud run services update wearshare `
  --region asia-south1 `
  --update-env-vars "NEXTAUTH_URL=https://YOUR_CLOUD_RUN_URL,ALLOWED_ORIGINS=https://YOUR_CLOUD_RUN_URL"
```

## 4. Configure provider callbacks

Google OAuth:

- Authorized JavaScript origin: `https://YOUR_CLOUD_RUN_URL`
- Authorized redirect URI: `https://YOUR_CLOUD_RUN_URL/api/auth/callback/google`

Razorpay webhook:

- URL: `https://YOUR_CLOUD_RUN_URL/api/payments/webhook`
- Use the same value stored as `RAZORPAY_WEBHOOK_SECRET`

Supabase:

- Set the Site URL to the Cloud Run URL.
- Add the Cloud Run URL to redirect URLs.
- Enable Phone Auth and configure an SMS provider if phone OTP login will be available.

## 5. Verify

```powershell
gcloud run services describe wearshare --region asia-south1 --format="value(status.url)"
gcloud run services logs read wearshare --region asia-south1 --limit 100
```

Test Google login, phone OTP, listing upload, cart checkout with Razorpay test mode, webhook delivery, booking confirmation email, chat limits, PostHog events, and Sentry errors.
