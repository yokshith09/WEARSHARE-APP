-- Supabase Canonical Migration & Schema Definition
-- Run this in your Supabase SQL Editor to set up all required tables, extensions, indexes, and functions.

-- 1. Enable Vector extension for AI RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  image TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 5.0,
  razorpay_account_id TEXT,
  measurements JSONB DEFAULT '{}'::jsonb,
  email_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Listings Table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  occasion TEXT,
  gender TEXT,
  listing_type TEXT DEFAULT 'Rental',
  size TEXT NOT NULL,
  condition TEXT DEFAULT 'Good',
  rental_price_per_day NUMERIC NOT NULL DEFAULT 0,
  security_deposit NUMERIC NOT NULL DEFAULT 0,
  retail_price NUMERIC,
  image_url TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  city TEXT DEFAULT 'Bengaluru',
  area TEXT,
  pincode TEXT,
  available BOOLEAN DEFAULT true,
  availability_calendar JSONB,
  mongo_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Listing Embeddings Table (pgvector 768 dimensions for Gemini text-embedding-004)
CREATE TABLE IF NOT EXISTS public.listing_embeddings (
  listing_id UUID PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Fast Vector Cosine Similarity
CREATE INDEX IF NOT EXISTS listing_embeddings_vector_idx 
ON public.listing_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rental_start DATE NOT NULL,
  rental_end DATE NOT NULL,
  days INT NOT NULL DEFAULT 1,
  rental_price NUMERIC NOT NULL,
  security_deposit NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  lister_earnings NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'requested', -- requested, approved, picked_up, returned, declined, maintenance
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  fulfillment_status TEXT NOT NULL DEFAULT 'pending', -- pending, picked_up, returned
  refund_status TEXT DEFAULT 'none', -- none, refund_pending, refunded, refund_failed
  refund_id TEXT,
  refund_amount NUMERIC,
  payment_id TEXT,
  order_id TEXT,
  pickup_location TEXT,
  pickup_time TIMESTAMPTZ,
  return_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Damage Claims Table
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  notes TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, in_review, approved, rejected, resolved
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Trip Messages (Handover & Return Chat) Table
CREATE TABLE IF NOT EXISTS public.trip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'text', -- text, address, photos, checklist
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_sessions_session_id_idx ON public.chat_sessions(session_id);

-- 9. Email OTPs Table
CREATE TABLE IF NOT EXISTS public.email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_otps_email_idx ON public.email_otps(email);

-- 10. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS public.reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reset_tokens_email_idx ON public.reset_tokens(email);

-- 11. Carts & Cart Items Tables
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  days INT NOT NULL DEFAULT 1,
  rental_start DATE,
  rental_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Wishlists Table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- 13. Waitlist Table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  city TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Vector Similarity Search Stored Function (RPC)
CREATE OR REPLACE FUNCTION match_listings (
  query_embedding vector(768),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  listing_id UUID,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    listing_embeddings.listing_id,
    1 - (listing_embeddings.embedding <=> query_embedding) AS similarity
  FROM listing_embeddings
  JOIN listings ON listings.id = listing_embeddings.listing_id
  WHERE listings.available = true
  ORDER BY listing_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
