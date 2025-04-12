"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { checkDatabaseHasData } from "./db-init-actions"
import { markDatabaseAsSeeded } from "./system-settings-actions"

export async function seedDatabase() {
  const supabase = createServerSupabaseClient()

  try {
    // Check if we already have data
    const hasData = await checkDatabaseHasData()

    if (hasData) {
      console.log("Database already has data, skipping seed")
      // Mark as seeded even if we skipped seeding (since data exists)
      await markDatabaseAsSeeded()
      return { success: true, message: "Database already has data" }
    }

    // Create spaces
    const spaces = [
      { title: "Work", description: "Work-related tasks and projects", color: "bg-blue-500" },
      { title: "Study", description: "Academic tasks and learning goals", color: "bg-purple-500" },
      { title: "Personal", description: "Personal errands and activities", color: "bg-green-500" },
    ]

    const { data: spacesData, error: spacesError } = await supabase.from("spaces").insert(spaces).select()

    if (spacesError) {
      console.error("Error seeding spaces:", spacesError)
      return { success: false, message: "Error seeding spaces: " + spacesError.message }
    }

    // Map space titles to IDs
    const spaceMap = spacesData.reduce(
      (acc, space) => {
        acc[space.title.toLowerCase()] = space.id
        return acc
      },
      {} as Record<string, string>,
    )

    // Create tasks
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tasks = [
      {
        title: "Complete project proposal",
        description: "Finish the draft and send for review",
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0).toISOString(),
        completed: false,
        category: "Work",
        priority: "high",
        space_id: spaceMap["work"],
      },
      {
        title: "Study for exam",
        description: "Review chapters 5-7",
        due_date: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 22, 0).toISOString(),
        completed: false,
        category: "Study",
        priority: "high",
        space_id: spaceMap["study"],
      },
      {
        title: "Grocery shopping",
        description: "Buy ingredients for dinner",
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0).toISOString(),
        completed: true,
        category: "Personal",
        priority: "medium",
        space_id: spaceMap["personal"],
      },
      {
        title: "Team meeting",
        description: "Weekly sync with the team",
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString(),
        completed: false,
        category: "Work",
        priority: "medium",
        space_id: spaceMap["work"],
      },
      {
        title: "Workout session",
        description: "30 minutes cardio",
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0).toISOString(),
        completed: true,
        category: "Health",
        priority: "low",
        space_id: spaceMap["personal"],
      },
    ]

    const { error: tasksError } = await supabase.from("tasks").insert(tasks)

    if (tasksError) {
      console.error("Error seeding tasks:", tasksError)
      return { success: false, message: "Error seeding tasks: " + tasksError.message }
    }

    // Create schedule items
    const schedule = [
      {
        title: "Morning Workout",
        start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0).toISOString(),
        end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 30).toISOString(),
        date: now.toISOString().split("T")[0],
        notes: "Cardio and stretching",
      },
      {
        title: "Team Meeting",
        start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
        end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString(),
        date: now.toISOString().split("T")[0],
        notes: "Weekly sync",
      },
      {
        title: "Project Work",
        start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30).toISOString(),
        end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0).toISOString(),
        date: now.toISOString().split("T")[0],
        notes: "Focus on proposal",
      },
      {
        title: "Lunch Break",
        start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0).toISOString(),
        end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0).toISOString(),
        date: now.toISOString().split("T")[0],
        notes: "Meal prep",
      },
      {
        title: "Study Session",
        start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString(),
        end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0).toISOString(),
        date: now.toISOString().split("T")[0],
        notes: "Focus on exam material",
      },
    ]

    const { error: scheduleError } = await supabase.from("schedule").insert(schedule)

    if (scheduleError) {
      console.error("Error seeding schedule:", scheduleError)
      return { success: false, message: "Error seeding schedule: " + scheduleError.message }
    }

    // Mark the database as seeded
    await markDatabaseAsSeeded()

    revalidatePath("/dashboard")
    revalidatePath("/todos")
    revalidatePath("/spaces")

    return { success: true, message: "Database seeded successfully" }
  } catch (error) {
    console.error("Error in seed process:", error)
    return { success: false, message: "Error in seed process: " + String(error) }
  }
}
