"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { checkTablesExist } from "./db-init-actions";
import type { Database } from "@/lib/database.types";

// Types
type TaskInput = {
  title: string;
  description?: string;
  due_date: string;
  repeated?: boolean;
  completed?: boolean;
  category?: string;
  priority: string;
  space_id?: string;
};

// Get all tasks
export async function getTasks() {
  const supabase = createServerSupabaseClient();

  // Check if tables exist
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    return [];
  }

  const { data, error } = await supabase.from("tasks").select("*, spaces(title, color)").order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return data;
}

// Get tasks for today
export async function getTodayTasks() {
  const supabase = createServerSupabaseClient();

  // Check if tables exist
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from("tasks")
    .select("*, spaces(title, color)")
    .gte("due_date", today.toISOString())
    .lt("due_date", tomorrow.toISOString())
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching today tasks:", error);
    return [];
  }

  return data;
}

// Create a new task
export async function createTask(task: TaskInput) {
  const supabase = createServerSupabaseClient();

  // Check if tables exist
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    return null;
  }

  const { data, error } = await supabase.from("tasks").insert([task]).select();

  if (error) {
    console.error("Error creating task:", error);
    return null;
  }

  revalidatePath("/dashboard");
  revalidatePath("/todos");

  return data[0];
}

// Update a task
export async function updateTask(id: string, updates: Partial<TaskInput>) {
  const supabase = createServerSupabaseClient();

  // Check if tables exist
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    return null;
  }

  const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select();

  if (error) {
    console.error("Error updating task:", error);
    return null;
  }

  revalidatePath("/dashboard");
  revalidatePath("/todos");

  return data[0];
}

// Delete a task
export async function deleteTask(id: string) {
  const supabase = createServerSupabaseClient();

  // Check if tables exist
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    return false;
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting task:", error);
    return false;
  }

  revalidatePath("/dashboard");
  revalidatePath("/todos");

  return true;
}

// Toggle task completion
export async function toggleTaskCompletion(id: string, completed: boolean) {
  return updateTask(id, { completed });
}

type PlanTaskData = {
  description: string; // This will map to the 'title' field in the DB
  due_date: string; // Expected in 'YYYY-MM-DD' format
};

// --- NEW FUNCTION ---
export async function batchCreateTasks(tasksData: PlanTaskData[]) {
  console.log(tasksData);
  const supabase = createServerSupabaseClient(); // Use the client creation function already in use

  // Check if tables exist (using the existing utility)
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    console.error("Cannot batch create tasks: Required tables do not exist.");
    return { success: false, error: "Database not initialized." };
  }

  // Ensure we have tasks to add
  if (!tasksData || tasksData.length === 0) {
    return { success: false, error: "No task data provided." };
  }

  // Map frontend data to the database schema structure (TaskInput compatible)
  const tasksToInsert = tasksData
    .map((task) => {
      // Basic validation for due_date format (can be enhanced)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(task.due_date)) {
        console.warn(`Invalid date format for task "${task.description}": ${task.due_date}. Skipping.`);
        return null; // Mark this task to be filtered out
      }

      // Convert YYYY-MM-DD to ISO string suitable for TIMESTAMPTZ (midnight UTC)
      const isoDueDate = `${task.due_date}T00:00:00Z`;

      // Create an object matching the DB schema / TaskInput type
      return {
        // Map required fields
        title: task.description, // Using AI description as title
        due_date: isoDueDate, // Use the converted ISO string
        priority: "Medium", // Assign a default priority (adjust if needed)

        // Map optional/default fields
        description: task.description, // Can use AI description here too
        completed: false,
        repeated: false,
        // category: null, // Default is null if not provided
        // space_id: null, // Default is null if not provided - could potentially add logic to assign based on 'goal' context later
      };
    })
    .filter((task) => task !== null); // Remove any tasks that had invalid dates

  // Check if any valid tasks remain after filtering
  if (tasksToInsert.length === 0) {
    return { success: false, error: "No valid tasks to insert after filtering." };
  }

  try {
    // Perform the batch insert operation
    // Note: Supabase types might require explicit casting if defaults aren't perfectly matched
    const { data, error } = await supabase
      .from("tasks")
      .insert(tasksToInsert as Database["public"]["Tables"]["tasks"]["Insert"][]) // Use generated type for insert
      .select(); // Optionally select the inserted data

    if (error) {
      console.error("Supabase batch insert error:", error);
      throw new Error(error.message); // Throw error to be caught below
    }

    const insertedCount = data?.length ?? 0;
    console.log(`Successfully inserted ${insertedCount} tasks.`);

    // Revalidate paths where tasks are displayed (using existing pattern)
    revalidatePath("/dashboard");
    revalidatePath("/todos");
    // Add other relevant paths if needed

    return { success: true, count: insertedCount };
  } catch (error: any) {
    console.error("Error in batchCreateTasks:", error);
    return { success: false, error: error.message || "An unexpected error occurred while saving tasks." };
  }
}
