"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function executeSql(sql: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Execute raw SQL using the .rpc() method with the built-in sql function
    const { data, error } = await supabase.rpc("pgSQL", { command: sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return { success: false, message: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error executing SQL:", error)
    return { success: false, message: String(error) }
  }
}
