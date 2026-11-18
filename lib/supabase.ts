import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key-for-build-only'

// Export an admin client configured with the Service Role key.
// Optimized for Server/API runtimes:
// 1. Disable persistSession & autoRefreshToken to prevent serverless lock overhead.
// 2. Add an explicit fetch timeout (8s) so stalled requests fail fast rather than hanging the server for 5 minutes.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (url, options: any = {}) => {
      const timeoutSignal = AbortSignal.timeout(8000)
      const signal = options?.signal
        ? (typeof AbortSignal.any === "function" ? AbortSignal.any([options.signal, timeoutSignal]) : options.signal)
        : timeoutSignal
      return fetch(url, {
        ...options,
        signal,
      })
    },
  },
})


