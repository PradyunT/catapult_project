import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ success: false, message: "No SQL provided" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Execute the SQL directly using Supabase's SQL method
    const { data, error } = await supabase.from("_sql").select(sql)

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in execute-sql API route:", error)
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 })
  }
}
