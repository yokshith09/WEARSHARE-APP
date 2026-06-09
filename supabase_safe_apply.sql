-- WearShare safe Supabase schema apply
-- Paste this whole file into Supabase SQL Editor and run it.
-- It is designed to be re-runnable after partial failures.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.users (
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

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.5;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'renter';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS razorpay_account_id VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS measurements JSONB;

CREATE TABLE IF NOT EXISTS public.accounts (
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

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.verification_tokens (
    identifier VARCHAR(255),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS public.listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL,
    condition VARCHAR(100) NOT NULL,
    rental_price_per_day NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) DEFAULT 0,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS mongo_id VARCHAR(64);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS occasion VARCHAR(100);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS listing_type VARCHAR(50);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS area VARCHAR(120);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10, 2);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 1;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS availability_calendar JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_mongo_id_unique ON public.listings (mongo_id) WHERE mongo_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.bookings (
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
    pickup_location TEXT,
    pickup_time TIMESTAMPTZ,
    return_location TEXT,
    lister_earnings NUMERIC(10, 2) DEFAULT 0,
    payment_id VARCHAR(255),
    order_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notification_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_location TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_location TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS lister_earnings NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS order_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS public.carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    days INTEGER DEFAULT 1,
    rental_start DATE,
    rental_end DATE,
    UNIQUE(cart_id, listing_id)
);

ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS rental_start DATE;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS rental_end DATE;

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.waitlist_signups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255),
    phone VARCHAR(20),
    pincode VARCHAR(10),
    source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.listing_embeddings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE UNIQUE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL,
    user_id UUID NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_available_created_at ON public.listings (available, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_category_size_price ON public.listings (category, size, rental_price_per_day);
CREATE INDEX IF NOT EXISTS idx_listings_pincode ON public.listings (pincode);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_dates ON public.bookings (listing_id, rental_start, rental_end);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON public.bookings (renter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_lender ON public.bookings (lender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session ON public.chat_sessions (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_embeddings_vector ON public.listing_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

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

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Available listings are viewable by everyone." ON public.listings;
DROP POLICY IF EXISTS "Users can manage their own listings." ON public.listings;
DROP POLICY IF EXISTS "Users can view their own bookings." ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can manage their own wishlist." ON public.wishlists;
DROP POLICY IF EXISTS "Reviews are publicly readable." ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews for themselves." ON public.reviews;
DROP POLICY IF EXISTS "Anyone can join the waitlist." ON public.waitlist_signups;
DROP POLICY IF EXISTS "Embeddings are not publicly readable." ON public.listing_embeddings;
DROP POLICY IF EXISTS "Users can view their own chat sessions." ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can write their own chat sessions." ON public.chat_sessions;

CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Available listings are viewable by everyone." ON public.listings FOR SELECT USING (available = true);
CREATE POLICY "Users can manage their own listings." ON public.listings FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can view their own bookings." ON public.bookings FOR SELECT USING (auth.uid() = renter_id OR auth.uid() = lender_id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage their own wishlist." ON public.wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Reviews are publicly readable." ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for themselves." ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Anyone can join the waitlist." ON public.waitlist_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Embeddings are not publicly readable." ON public.listing_embeddings FOR SELECT USING (false);
CREATE POLICY "Users can view their own chat sessions." ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can write their own chat sessions." ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
