import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Export an admin client configured with the Service Role key
// CAUTION: This bypasses Row Level Security (RLS) entirely.
// Only use this in trusted server environments (like Next.js API routes)
// when you need to read/write data across users.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Export a public client for anon/public access
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey)
