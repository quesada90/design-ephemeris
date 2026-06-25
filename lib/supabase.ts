import { createClient } from "@supabase/supabase-js"

// Server-only — never import this in "use client" files
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
