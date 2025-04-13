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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to fetch spaces.");
    return [];
  }

  const { data, error } = await supabase.from("spaces").select("*").eq("user_id", user.id).order("title", { ascending: true });

  if (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }

  return data;
}

// Get space by ID
export async function getSpaceById(id: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to fetch space.");
    return null;
  }

  const { data, error } = await supabase.from("spaces").select("*").eq("id", id).eq("user_id", user.id).single();

  if (error) {
    console.error("Error fetching space:", error);
    return null;
  }

  return data;
}

// Create a new space
export async function createSpace(space: SpaceInput) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to create space.");
    return null;
  }

  // Add user_id to the space data
  const spaceWithUser = { ...space, user_id: user.id };

  const { data, error } = await supabase.from("spaces").insert([spaceWithUser]).select();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to update space.");
    return null;
  }

  const { data, error } = await supabase.from("spaces").update(updates).eq("id", id).eq("user_id", user.id).select();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to delete space.");
    return false;
  }

  const { error } = await supabase.from("spaces").delete().eq("id", id).eq("user_id", user.id);

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated to count tasks for space.");
    return 0;
  }

  // First, verify the space belongs to the user (optional but good practice)
  const { data: spaceData, error: spaceError } = await supabase
    .from("spaces")
    .select("id")
    .eq("id", spaceId)
    .eq("user_id", user.id)
    .single();

  if (spaceError || !spaceData) {
    console.error("Error verifying space ownership or space not found:", spaceError?.message);
    return 0;
  }

  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("space_id", spaceId)
    // Ensure we only count tasks belonging to the user,
    // assuming tasks table also has a user_id column linked correctly.
    .eq("user_id", user.id);

  if (error) {
    console.error("Error counting tasks for space:", error);
    return 0;
  }

  return count || 0;
}
