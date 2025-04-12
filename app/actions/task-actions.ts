"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { checkTablesExist } from "./db-init-actions"

// Types
type TaskInput = {
  title: string
  description?: string
  due_date: string
  repeated?: boolean
  completed?: boolean
  category?: string
  priority: string
  space_id?: string
}

// Get all tasks
export async function getTasks() {
  const supabase = createServerSupabaseClient()

  // Check if tables exist
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    return []
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*, spaces(title, color)")
    .order("due_date", { ascending: true })

  if (error) {
    console.error("Error fetching tasks:", error)
    return []
  }

  return data
}

// Get tasks for today
export async function getTodayTasks() {
  const supabase = createServerSupabaseClient()

  // Check if tables exist
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from("tasks")
    .select("*, spaces(title, color)")
    .gte("due_date", today.toISOString())
    .lt("due_date", tomorrow.toISOString())
    .order("due_date", { ascending: true })

  if (error) {
    console.error("Error fetching today tasks:", error)
    return []
  }

  return data
}

// Create a new task
export async function createTask(task: TaskInput) {
  const supabase = createServerSupabaseClient()

  // Check if tables exist
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    return null
  }

  const { data, error } = await supabase.from("tasks").insert([task]).select()

  if (error) {
    console.error("Error creating task:", error)
    return null
  }

  revalidatePath("/dashboard")
  revalidatePath("/todos")

  return data[0]
}

// Update a task
export async function updateTask(id: string, updates: Partial<TaskInput>) {
  const supabase = createServerSupabaseClient()

  // Check if tables exist
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    return null
  }

  const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select()

  if (error) {
    console.error("Error updating task:", error)
    return null
  }

  revalidatePath("/dashboard")
  revalidatePath("/todos")

  return data[0]
}

// Delete a task
export async function deleteTask(id: string) {
  const supabase = createServerSupabaseClient()

  // Check if tables exist
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    return false
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id)

  if (error) {
    console.error("Error deleting task:", error)
    return false
  }

  revalidatePath("/dashboard")
  revalidatePath("/todos")

  return true
}

// Toggle task completion
export async function toggleTaskCompletion(id: string, completed: boolean) {
  return updateTask(id, { completed })
}
