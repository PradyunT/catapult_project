import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase-types"

// This is a server-side Supabase client
export function createServerSupabaseClient() {
  return createClient<Database>(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
}
