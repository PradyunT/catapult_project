"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

// Types
type ScheduleInput = {
  task_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  date: string;
  notes?: string;
};

// Get all schedule items
export async function getScheduleItems() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("schedule")
    .select("*, tasks(title, priority, completed)")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching schedule items:", error);
    return [];
  }

  return data;
}

// Get schedule items for a specific date
export async function getScheduleForDate(date: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("schedule")
    .select("*, tasks(title, priority, completed)")
    .eq("date", date)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching schedule for date:", error);
    return [];
  }

  return data;
}

// Create a new schedule item
export async function createScheduleItem(item: ScheduleInput) {
  const supabase = createClient();

  const { data, error } = await supabase.from("schedule").insert([item]).select();

  if (error) {
    console.error("Error creating schedule item:", error);
    return null;
  }

  revalidatePath("/dashboard");

  return data[0];
}

// Update a schedule item
export async function updateScheduleItem(id: string, updates: Partial<ScheduleInput>) {
  const supabase = createClient();

  const { data, error } = await supabase.from("schedule").update(updates).eq("id", id).select();

  if (error) {
    console.error("Error updating schedule item:", error);
    return null;
  }

  revalidatePath("/dashboard");

  return data[0];
}

// Delete a schedule item
export async function deleteScheduleItem(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from("schedule").delete().eq("id", id);

  if (error) {
    console.error("Error deleting schedule item:", error);
    return false;
  }

  revalidatePath("/dashboard");

  return true;
}
