"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function initializeDatabaseWithSql() {
  const supabase = createServerSupabaseClient()

  try {
    // Create tables using SQL
    const sql = `
      -- Create extension for UUID generation
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create spaces table
      CREATE TABLE IF NOT EXISTS spaces (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        color TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        repeated BOOLEAN DEFAULT FALSE,
        completed BOOLEAN DEFAULT FALSE,
        category TEXT,
        priority TEXT NOT NULL,
        space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create schedule table
      CREATE TABLE IF NOT EXISTS schedule (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create update_updated_at_column function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers for each table
      DROP TRIGGER IF EXISTS update_spaces_updated_at ON spaces;
      CREATE TRIGGER update_spaces_updated_at
      BEFORE UPDATE ON spaces
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
      CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_schedule_updated_at ON schedule;
      CREATE TRIGGER update_schedule_updated_at
      BEFORE UPDATE ON schedule
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `

    // Execute the SQL directly
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error initializing database with SQL:", error)
      return { success: false, message: "Error initializing database: " + error.message }
    }

    revalidatePath("/dashboard")
    revalidatePath("/todos")
    revalidatePath("/spaces")

    return { success: true, message: "Database initialized successfully" }
  } catch (error) {
    console.error("Error initializing database:", error)
    return { success: false, message: "Error initializing database: " + String(error) }
  }
}
