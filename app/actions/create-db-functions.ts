"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function createDatabaseFunctions() {
  const supabase = createServerSupabaseClient()

  // Create function to create UUID extension
  const createUuidExtension = `
  CREATE OR REPLACE FUNCTION create_uuid_extension()
  RETURNS void AS $$
  BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  END;
  $$ LANGUAGE plpgsql;
  `

  // Create function to create spaces table
  const createSpacesTable = `
  CREATE OR REPLACE FUNCTION create_spaces_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS spaces (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      color TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END;
  $$ LANGUAGE plpgsql;
  `

  // Create function to create tasks table
  const createTasksTable = `
  CREATE OR REPLACE FUNCTION create_tasks_table()
  RETURNS void AS $$
  BEGIN
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
  END;
  $$ LANGUAGE plpgsql;
  `

  // Create function to create schedule table
  const createScheduleTable = `
  CREATE OR REPLACE FUNCTION create_schedule_table()
  RETURNS void AS $$
  BEGIN
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
  END;
  $$ LANGUAGE plpgsql;
  `

  // Create function to create update triggers
  const createUpdateTriggers = `
  CREATE OR REPLACE FUNCTION create_update_triggers()
  RETURNS void AS $$
  BEGIN
    -- Create the update_updated_at_column function if it doesn't exist
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
  END;
  $$ LANGUAGE plpgsql;
  `

  try {
    // Create the functions
    await supabase.rpc("create_uuid_extension_function", { query: createUuidExtension })
    await supabase.rpc("create_spaces_table_function", { query: createSpacesTable })
    await supabase.rpc("create_tasks_table_function", { query: createTasksTable })
    await supabase.rpc("create_schedule_table_function", { query: createScheduleTable })
    await supabase.rpc("create_update_triggers_function", { query: createUpdateTriggers })

    return { success: true, message: "Database functions created successfully" }
  } catch (error) {
    console.error("Error creating database functions:", error)
    return { success: false, message: "Error creating database functions" }
  }
}
