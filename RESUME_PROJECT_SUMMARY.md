# Resume Project Summary: WearShare

## One-Line Version

Built WearShare, a full-stack Next.js fashion rental marketplace with secure auth, Razorpay payments, Supabase backend, Gemini AI assistant, booking logistics, lister earnings dashboard, and Vercel CI/CD deployment.

## Resume Bullet Version

- Developed a full-stack peer-to-peer fashion rental marketplace using Next.js, TypeScript, Supabase, NextAuth, Razorpay, Gemini, Upstash Redis, Sentry, PostHog, and Vercel.
- Implemented secure authentication with Google OAuth, phone OTP, JWT session rotation, Redis-backed active sessions, and security-event logging.
- Built marketplace workflows for listing outfits, browsing by city/pincode, booking rentals, payment confirmation, damage deposit acknowledgement, and Razorpay checkout.
- Designed renter and lister dashboards with booking timelines, pickup/return logistics, chat-style coordination, handover photo tracking, payout schedule, rental history, and relist actions.
- Integrated Gemini-powered AI assistant with listing search/RAG, rate limits, and model fallback to `gemini-2.5-flash`.
- Added production readiness features including CI/CD via GitHub Actions, Vercel deployment documentation, Supabase migration scripts, Sentry monitoring, PostHog analytics, and secure environment-variable management.

## Interview Explanation

WearShare is a marketplace app for renting premium occasion wear locally. I built the core product flow end to end: users can sign in, list outfits, search by city and pincode, book an item, acknowledge deposit and damage terms, pay through Razorpay, and coordinate pickup and return through a logistics page. For listers, I built an earnings dashboard with payout scheduling, rental history, active rental requests, and relist actions.

The backend uses Supabase for data, NextAuth for authentication, Razorpay for payments, Upstash Redis for rate limiting/session support, and Gemini for AI chat and listing assistance. I also added production features such as Sentry, PostHog, Vercel deployment, GitHub Actions CI/CD, secure secret handling, and safe Supabase migration scripts.

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Next.js API routes, Supabase, NextAuth
- Payments: Razorpay Standard Checkout and webhook verification
- AI: Gemini API with RAG listing search
- Infra: Vercel, GitHub Actions, Upstash Redis, Cloudflare R2-ready uploads
- Observability: Sentry, PostHog, security-event logs

