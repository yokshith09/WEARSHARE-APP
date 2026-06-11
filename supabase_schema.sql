-- Supabase PostgreSQL Schema for WearShare
-- Use this file only for a brand-new empty database.
-- If tables already exist, run supabase_safe_apply.sql instead.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Users Table (Maps to NextAuth Users)
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    email_verified TIMESTAMPTZ,
    image TEXT,
    phone VARCHAR(20) UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    rating NUMERIC(3, 2) DEFAULT 4.5,
    address TEXT,
    role VARCHAR(50) DEFAULT 'renter',
    razorpay_account_id VARCHAR(255),
    measurements JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NextAuth specific tables
CREATE TABLE public.accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    UNIQUE(provider, provider_account_id)
);

CREATE TABLE public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE public.verification_tokens (
    identifier VARCHAR(255),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- 2. Listings Table
CREATE TABLE public.listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    mongo_id VARCHAR(64) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    occasion VARCHAR(100),
    gender VARCHAR(50),
    listing_type VARCHAR(50),
    size VARCHAR(50) NOT NULL,
    condition VARCHAR(100) NOT NULL,
    rental_price_per_day NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) DEFAULT 0,
    image_url TEXT,
    photo_urls TEXT[] DEFAULT '{}',
    city VARCHAR(80),
    pincode VARCHAR(10),
    area VARCHAR(120),
    retail_price NUMERIC(10, 2),
    available BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    availability_calendar JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bookings Table (Relational)
CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES public.listings(id) ON DELETE RESTRICT,
    renter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    lender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rental_start DATE NOT NULL,
    rental_end DATE NOT NULL,
    days INTEGER NOT NULL,
    rental_price NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    payment_status VARCHAR(50) DEFAULT 'pending',
    fulfillment_status VARCHAR(50) DEFAULT 'pending',
    notification_status VARCHAR(50) DEFAULT 'pending',
    refund_status VARCHAR(50) DEFAULT 'none',
    refund_id VARCHAR(255),
    refund_amount NUMERIC(10, 2),
    pickup_location TEXT,
    pickup_time TIMESTAMPTZ,
    return_location TEXT,
    lister_earnings NUMERIC(10, 2) DEFAULT 0,
    payment_id VARCHAR(255),
    order_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cart Table
CREATE TABLE public.carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    days INTEGER DEFAULT 1,
    rental_start DATE,
    rental_end DATE,
    UNIQUE(cart_id, listing_id)
);

CREATE TABLE public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.waitlist_signups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255),
    phone VARCHAR(20),
    pincode VARCHAR(10),
    source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.listing_embeddings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE UNIQUE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL,
    user_id UUID NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.security_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type VARCHAR(120) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ip_hash TEXT,
    user_agent_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_available_created_at ON public.listings (available, created_at DESC);
CREATE INDEX idx_listings_category_size_price ON public.listings (category, size, rental_price_per_day);
CREATE INDEX idx_listings_city_pincode ON public.listings (city, pincode);
CREATE INDEX idx_listings_pincode ON public.listings (pincode);
CREATE INDEX idx_bookings_listing_dates ON public.bookings (listing_id, rental_start, rental_end);
CREATE INDEX idx_bookings_renter ON public.bookings (renter_id, created_at DESC);
CREATE INDEX idx_bookings_lender ON public.bookings (lender_id, created_at DESC);
CREATE INDEX idx_listing_embeddings_vector ON public.listing_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_chat_sessions_session ON public.chat_sessions (session_id, created_at DESC);
CREATE INDEX idx_security_events_type_created ON public.security_events (event_type, created_at DESC);
CREATE INDEX idx_security_events_actor_created ON public.security_events (actor_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.match_listings(
  query_embedding vector(768),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  listing_id uuid,
  similarity float8
)
LANGUAGE sql
AS $$
  SELECT
    le.listing_id,
    1 - (le.embedding <=> query_embedding) as similarity
  FROM public.listing_embeddings le
  JOIN public.listings l ON l.id = le.listing_id
  WHERE l.available = true
  ORDER BY le.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active listings
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Available listings are viewable by everyone." ON public.listings FOR SELECT USING (available = true);

-- Users can insert/update their own listings
CREATE POLICY "Users can manage their own listings." ON public.listings FOR ALL USING (auth.uid() = owner_id);

-- Bookings are visible only to the renter and lender involved
CREATE POLICY "Users can view their own bookings." ON public.bookings FOR SELECT USING (auth.uid() = renter_id OR auth.uid() = lender_id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage their own wishlist." ON public.wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Reviews are publicly readable." ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for themselves." ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Anyone can join the waitlist." ON public.waitlist_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Embeddings are not publicly readable." ON public.listing_embeddings FOR SELECT USING (false);
CREATE POLICY "Users can view their own chat sessions." ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can write their own chat sessions." ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
