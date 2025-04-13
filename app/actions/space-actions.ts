"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Types
type SpaceInput = {
  title: string;
  description?: string;
  color?: string;
};

// Get all spaces
export async function getSpaces() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.from("spaces").select("*").order("title", { ascending: true });

  if (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }

  return data;
}

// Get space by ID
export async function getSpaceById(id: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.from("spaces").select("*").eq("id", id).single();

  if (error) {
    console.error("Error fetching space:", error);
    return null;
  }

  return data;
}

// Create a new space
export async function createSpace(space: SpaceInput) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.from("spaces").insert([space]).select();

  if (error) {
    console.error("Error creating space:", error);
    return null;
  }

  revalidatePath("/spaces");

  return data[0];
}

// Update a space
export async function updateSpace(id: string, updates: Partial<SpaceInput>) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.from("spaces").update(updates).eq("id", id).select();

  if (error) {
    console.error("Error updating space:", error);
    return null;
  }

  revalidatePath("/spaces");

  return data[0];
}

// Delete a space
export async function deleteSpace(id: string) {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("spaces").delete().eq("id", id);

  if (error) {
    console.error("Error deleting space:", error);
    return false;
  }

  revalidatePath("/spaces");

  return true;
}

// Get tasks count for a space
export async function getTasksCountForSpace(spaceId: string) {
  const supabase = createServerSupabaseClient();

  const { count, error } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("space_id", spaceId);

  if (error) {
    console.error("Error counting tasks for space:", error);
    return 0;
  }

  return count || 0;
}
