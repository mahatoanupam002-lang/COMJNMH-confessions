import { createClient } from '@supabase/supabase-js'

// Server-side only — uses service_role key which bypasses RLS
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
