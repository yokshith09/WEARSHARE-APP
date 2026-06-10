# Deploy WearShare to Koyeb

Koyeb is a good alternative if you want a normal long-running Node.js server
instead of Vercel serverless functions. It provides a generated HTTPS
`koyeb.app` URL, so a custom domain is not required for launch.
You can also connect your free domain `wearshare.qzz.io`.

## 1. Fix Supabase schema first

If your Supabase database already has tables, use:

```text
supabase_safe_apply.sql
```

Do not use `supabase_schema.sql` unless the database is completely empty.

## 2. Create a Koyeb web service

1. Open Koyeb.
2. Create Web Service.
3. Select GitHub.
4. Choose `yokshith09/WEARSHARE-APP`.
5. Use the `main` branch.

Use these settings:

```text
Build command: npm install && npm run build
Run command: npm run start
Port: 3000
```

## 3. Add environment variables

Add all required variables from `.env.example` to the Koyeb service.

For the first deploy, you can temporarily omit:

```env
NEXTAUTH_URL
ALLOWED_ORIGINS
```

After Koyeb gives you a URL like `https://wearshare-yourname.koyeb.app`, set:

```env
NEXTAUTH_URL=https://wearshare.qzz.io
ALLOWED_ORIGINS=https://wearshare.qzz.io,https://YOUR_KOYEB_URL,http://localhost:3000
```

Redeploy after updating those values.

## 4. Connect `wearshare.qzz.io`

In Koyeb service settings, add `wearshare.qzz.io` as a custom domain.

Koyeb will show the exact DNS record to create in DigitalPlat. For most
subdomains, it will be a `CNAME` record pointing `wearshare.qzz.io` to the Koyeb
domain target shown in the dashboard.

After DNS is verified, use `https://wearshare.qzz.io` everywhere instead of the
temporary `koyeb.app` URL.

## 5. Configure provider callbacks

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
