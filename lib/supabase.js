import { createClient } from '@supabase/supabase-js'

// Server-side only — uses service_role key which bypasses RLS.
// Returns null during build/dev if env vars aren't set yet; route handlers check for this.
export const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null
