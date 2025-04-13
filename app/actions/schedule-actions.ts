"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to fetch schedule items.");
    return [];
  }

  const { data, error } = await supabase
    .from("schedule")
    .select("*, tasks(title, priority, completed)")
    .eq("user_id", user.id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching schedule items:", error);
    return [];
  }

  return data;
}

// Get schedule items for a specific date
export async function getScheduleForDate(date: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to fetch schedule for date.");
    return [];
  }

  const { data, error } = await supabase
    .from("schedule")
    .select("*, tasks(title, priority, completed)")
    .eq("user_id", user.id)
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
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to create schedule item.");
    return null;
  }

  // Add user_id to the schedule item data
  const itemWithUser = { ...item, user_id: user.id };

  const { data, error } = await supabase.from("schedule").insert([itemWithUser]).select();

  if (error) {
    console.error("Error creating schedule item:", error);
    return null;
  }

  revalidatePath("/dashboard");

  return data[0];
}

// Update a schedule item
export async function updateScheduleItem(id: string, updates: Partial<ScheduleInput>) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to update schedule item.");
    return null;
  }

  const { data, error } = await supabase.from("schedule").update(updates).eq("id", id).eq("user_id", user.id).select();

  if (error) {
    console.error("Error updating schedule item:", error);
    return null;
  }

  revalidatePath("/dashboard");

  return data[0];
}

// Delete a schedule item
export async function deleteScheduleItem(id: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to delete schedule item.");
    return false;
  }

  const { error } = await supabase.from("schedule").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("Error deleting schedule item:", error);
    return false;
  }

  revalidatePath("/dashboard");

  return true;
}
