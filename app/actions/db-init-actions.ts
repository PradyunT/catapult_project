"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

// Check if tables exist
export async function checkTablesExist() {
  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase.from("spaces").select("id").limit(1)

    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking tables:", error)
    return false
  }
}

// Check if database has data
export async function checkDatabaseHasData() {
  const supabase = createServerSupabaseClient()

  try {
    const { count, error } = await supabase.from("spaces").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error checking if database has data:", error)
      return false
    }

    return count !== null && count > 0
  } catch (error) {
    console.error("Error checking if database has data:", error)
    return false
  }
}

// Initialize database using SQL
export async function initializeDatabase() {
  try {
    // Check if tables exist first
    const tablesExist = await checkTablesExist()

    if (tablesExist) {
      return { success: true, message: "Database tables already exist" }
    }

    // If tables don't exist, create them using inline SQL
    const result = await createTables()

    if (result.success) {
      revalidatePath("/dashboard")
      revalidatePath("/todos")
      revalidatePath("/spaces")
    }

    return result
  } catch (error) {
    console.error("Error initializing database:", error)
    return { success: false, message: "Error initializing database: " + String(error) }
  }
}

// Create tables using inline SQL
async function createTables() {
  try {
    // Use inline SQL to create tables
    const sql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS spaces (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        color TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Execute the SQL using the SQL block
    const spacesResult = await executeSql(sql)

    if (!spacesResult.success) {
      return spacesResult
    }

    // Create tasks table
    const tasksSql = `
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
    `

    const tasksResult = await executeSql(tasksSql)

    if (!tasksResult.success) {
      return tasksResult
    }

    // Create schedule table
    const scheduleSql = `
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
    `

    const scheduleResult = await executeSql(scheduleSql)

    if (!scheduleResult.success) {
      return scheduleResult
    }

    // Create function and triggers
    const triggersSql = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

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

    const triggersResult = await executeSql(triggersSql)

    if (!triggersResult.success) {
      return triggersResult
    }

    return { success: true, message: "Database tables created successfully" }
  } catch (error) {
    console.error("Error creating tables:", error)
    return { success: false, message: "Error creating tables: " + String(error) }
  }
}

// Execute SQL using the SQL block
async function executeSql(sql: string) {
  try {
    // Use the SQL block to execute SQL
    const result = await fetch("/api/execute-sql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    }).then((res) => res.json())

    if (!result.success) {
      return { success: false, message: result.message || "SQL execution failed" }
    }

    return { success: true, message: "SQL executed successfully" }
  } catch (error) {
    console.error("Error executing SQL:", error)
    return { success: false, message: "Error executing SQL: " + String(error) }
  }
}
