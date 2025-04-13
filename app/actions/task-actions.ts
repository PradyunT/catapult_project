// app/actions/task-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server"; // Adjust if your client setup is different
import type { Database } from "@/lib/database.types"; // Adjust path if your types are elsewhere

// Existing TaskInput type (if used elsewhere)
type TaskInput = {
  title: string;
  description?: string;
  due_date: string; // Expects ISO string format for DB
  repeated?: boolean;
  completed?: boolean;
  category?: string;
  priority: string;
  space_id?: string;
};

// --- Updated PlanTaskData type ---
// This is the data structure received from the frontend after plan generation
type PlanTaskData = {
  title: string;
  description: string;
  due_date: string; // Expected in 'YYYY-MM-DD' format from frontend
};

export async function getTasks() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to fetch tasks.");
    return [];
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*, spaces(title, color)")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });
  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
  return data;
}

export async function getTodayTasks() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to fetch today's tasks.");
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { data, error } = await supabase
    .from("tasks")
    .select("*, spaces(title, color)")
    .eq("user_id", user.id)
    .gte("due_date", today.toISOString())
    .lt("due_date", tomorrow.toISOString())
    .order("due_date", { ascending: true });
  if (error) {
    console.error("Error fetching today tasks:", error);
    return [];
  }
  return data;
}

export async function createTask(task: TaskInput) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to create task.");
    return null;
  }

  // Add user_id to the task data
  const taskWithUser = { ...task, user_id: user.id };

  const { data, error } = await supabase.from("tasks").insert([taskWithUser]).select();
  if (error) {
    console.error("Error creating task:", error);
    return null;
  }
  revalidatePath("/dashboard");
  revalidatePath("/todos");
  return data?.[0] ?? null;
}

export async function updateTask(id: string, updates: Partial<TaskInput>) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to update task.");
    return null;
  }

  const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).eq("user_id", user.id).select();
  if (error) {
    console.error("Error updating task:", error);
    return null;
  }
  revalidatePath("/dashboard");
  revalidatePath("/todos");
  return data?.[0] ?? null;
}

export async function deleteTask(id: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to delete task.");
    return false;
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("Error deleting task:", error);
    return false;
  }
  revalidatePath("/dashboard");
  revalidatePath("/todos");
  return true;
}

export async function toggleTaskCompletion(id: string, completed: boolean) {
  return updateTask(id, { completed });
}

// --- Updated Batch Create Function ---
export async function batchCreateTasks(tasksData: PlanTaskData[]) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to batch create tasks.");
    return { success: false, error: "User not authenticated." };
  }

  if (!tasksData || tasksData.length === 0) {
    return { success: false, error: "No task data provided." };
  }

  // Map frontend data to the database schema structure
  const tasksToInsert = tasksData
    .map((task) => {
      // Basic validation for due_date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(task.due_date)) {
        console.warn(`Invalid date format for task "${task.title}": ${task.due_date}. Skipping.`);
        return null;
      }
      // Convert YYYY-MM-DD to ISO string suitable for TIMESTAMPTZ
      const isoDueDate = `${task.due_date}T00:00:00Z`;

      return {
        // Map required fields from PlanTaskData
        title: task.title,
        description: task.description, // Using AI description field for DB description
        due_date: isoDueDate,
        priority: "Medium", // Assign a default priority
        user_id: user.id,

        // Defaults for other fields
        completed: false,
        repeated: false,
      };
    })
    .filter((task) => task !== null); // Remove tasks with invalid dates

  if (tasksToInsert.length === 0) {
    return { success: false, error: "No valid tasks to insert after filtering." };
  }

  try {
    // Perform the batch insert
    const { data, error } = await supabase
      .from("tasks")
      .insert(tasksToInsert as Database["public"]["Tables"]["tasks"]["Insert"][]) // Use generated type
      .select();

    if (error) {
      console.error("Supabase batch insert error:", error);
      throw new Error(error.message);
    }

    const insertedCount = data?.length ?? 0;
    console.log(`Successfully inserted ${insertedCount} tasks.`);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/todos");

    return { success: true, count: insertedCount };
  } catch (error: any) {
    console.error("Error in batchCreateTasks:", error);
    return { success: false, error: error.message || "An unexpected error occurred while saving tasks." };
  }
}
