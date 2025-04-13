"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

// Execute SQL with fallback methods
export async function executeSqlWithFallback(sql: string) {
  const supabase = createServerSupabaseClient();

  try {
    // Method 1: Try using _sql
    const { error: sqlError } = await supabase.from("_sql").select(sql);

    if (!sqlError) {
      return { success: true };
    }

    // Method 2: Try using pgSQL RPC if available
    try {
      const { error: rpcError } = await supabase.rpc("pgSQL", { command: sql });

      if (!rpcError) {
        return { success: true };
      }
    } catch (rpcError) {
      console.log("pgSQL RPC not available:", rpcError);
    }

    // Method 3: Try using REST API
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        "X-Client-Info": "Jarvis",
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.ok) {
      return { success: true };
    }

    return {
      success: false,
      message: "Failed to execute SQL with all available methods",
    };
  } catch (error) {
    console.error("Error executing SQL:", error);
    return { success: false, message: String(error) };
  }
}
