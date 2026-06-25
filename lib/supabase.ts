import { createClient } from "@supabase/supabase-js"

// In production (Netlify) use the anon key — RLS allows public SELECT.
// Locally the service key is also fine and bypasses RLS for the seed script.
const key =
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY ?? ""

export const supabaseAdmin = createClient(process.env.SUPABASE_URL!, key)
