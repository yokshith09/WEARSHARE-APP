# WearShare Project Summary

## Overview

WearShare is a community-first outfit rental platform focused on local discovery, secure booking, and lightweight logistics between renters and listers.

## Core product areas

- Home page with featured listings, collections, and lister/renter storytelling
- Browse flow with category, city, pincode, and availability filters
- Product detail page with date selection, carting, and direct rental actions
- Cart and Razorpay checkout
- Booking logistics and claim flows
- Renter dashboard for bookings, wishlist, and body measurements
- Lister dashboard for inventory, requests, and earnings
- Profile page for contact details and sizing data

## Backend and infrastructure

- Supabase stores users, listings, bookings, carts, wishlists, OTP data, and related platform records
- NextAuth manages email/password, email OTP, and Google sign-in
- Razorpay handles order creation and payment verification
- Upstash Redis supports session locking and rate limiting
- Resend / SMTP powers email-based OTP and booking notifications

## Recent cleanup and fixes

- Added a real `/profile` page and connected the header account icon to it
- Extended session duration so users are remembered instead of being forced to log in repeatedly
- Removed phone/SMS OTP authentication
- Added email/password registration and sign-in with bcrypt password hashing
- Added email-based password recovery with expiring, single-use reset links
- Added email OTP resend support on the login screen
- Softened Google auth failure handling when OAuth is not configured correctly
- Improved cart API error handling so Rent Now failures surface properly
- Fixed renter dashboard wishlist and measurement persistence
- Reduced homepage empty-state gaps by falling back more gracefully when live listing counts are low
- Cleaned tracked repo clutter including stale reports, deploy notes, and Vercel project metadata

## Key environment requirements

- Supabase URL and keys
- NextAuth secret and app URL
- Razorpay keys for checkout
- Email provider config for email OTP
- Redis config for session/rate-limit features
- Optional AI provider keys for enhanced features

## Current repo posture

- The repository is now more suitable for GitHub sharing
- Stale reports and deployment notes were removed
- Public documentation is consolidated into `README.md` and this summary
- Sensitive local environment files remain ignored and should stay out of version control
