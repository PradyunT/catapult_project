"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { executeSqlWithFallback } from "./db-utils"

// Initialize system settings table
export async function initializeSystemSettings() {
  const supabase = createServerSupabaseClient()

  try {
    // First check if the table already exists
    const { error: checkError } = await supabase.from("system_settings").select("key").limit(1)

    // If the table doesn't exist, create it
    if (checkError && checkError.message.includes("relation") && checkError.message.includes("does not exist")) {
      // Create the table using our fallback method
      const sql = `
        CREATE TABLE IF NOT EXISTS system_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create update trigger for system_settings
        CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
        CREATE TRIGGER update_system_settings_updated_at
        BEFORE UPDATE ON system_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_system_settings_updated_at();
      `

      const result = await executeSqlWithFallback(sql)

      if (!result.success) {
        console.error("Error creating system_settings table:", result.message)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error initializing system settings:", error)
    return false
  }
}

// Check if database has been seeded
export async function checkDatabaseSeeded() {
  const supabase = createServerSupabaseClient()

  try {
    // First check if the system_settings table exists
    const { error: tableCheckError } = await supabase.from("system_settings").select("key").limit(1)

    if (
      tableCheckError &&
      tableCheckError.message.includes("relation") &&
      tableCheckError.message.includes("does not exist")
    ) {
      // Table doesn't exist, initialize it
      const initialized = await initializeSystemSettings()
      if (!initialized) {
        return false
      }
    }

    // Check if the database_seeded setting exists
    const { data, error } = await supabase.from("system_settings").select("value").eq("key", "database_seeded").single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found, database is not seeded
        return false
      }
      console.error("Error checking if database is seeded:", error)
      return false
    }

    return data?.value?.seeded === true
  } catch (error) {
    console.error("Error checking if database is seeded:", error)
    return false
  }
}

// Mark database as seeded
export async function markDatabaseAsSeeded() {
  const supabase = createServerSupabaseClient()

  try {
    // First ensure the system_settings table exists
    await initializeSystemSettings()

    // Upsert the database_seeded setting
    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "database_seeded",
        value: { seeded: true, timestamp: new Date().toISOString() },
      },
      { onConflict: "key" },
    )

    if (error) {
      console.error("Error marking database as seeded:", error)
      return false
    }

    revalidatePath("/dashboard")
    return true
  } catch (error) {
    console.error("Error marking database as seeded:", error)
    return false
  }
}
