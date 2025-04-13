// app/api/generate-plan/route.ts
import { google } from "@ai-sdk/google";
import { generateObject } from "ai"; // Import generateObject
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod"; // Import zod
import type { Database } from "@/lib/database.types"; // Import your generated types

export const maxDuration = 90; // Allow more time for potentially complex plan generation

// Define the Zod schema for the expected JSON output
const planSchema = z.object({
  goal: z.string().describe("The user's original goal."),
  tasks: z
    .array(
      z.object({
        description: z.string().describe("Specific, actionable task description."),
        // Using string for simplicity, prompt enforces format
        due_date: z.string().describe("Task due date in YYYY-MM-DD format."),
      })
    )
    .min(1)
    .describe("A sequential list of tasks to achieve the goal, each with a description and due date."),
});

export async function POST(req: Request) {
  // 1. Get Request Body - Expecting only 'goal'
  let goal: string;
  try {
    const body = await req.json();
    if (body.goal && typeof body.goal === "string") {
      goal = body.goal;
    } else {
      return NextResponse.json({ error: "Invalid request format: 'goal' string is required." }, { status: 400 });
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // 2. Fetch User Context (Tasks and Spaces) from Supabase
  // (Using the same logic as the chat route for consistency)
  let taskContext = "User has no current tasks listed.";
  let spaceContext = "User has no defined spaces.";
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Fetch Tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("title, description, due_date, priority, completed, space_id")
      .order("due_date", { ascending: true })
      .limit(20);

    if (tasksError) {
      console.error("Supabase error fetching tasks:", tasksError.message);
      taskContext = "Could not retrieve user's current tasks due to a database error.";
    } else if (tasks && tasks.length > 0) {
      taskContext = "User's Current Tasks:\n";
      taskContext += tasks
        .map((task) => {
          const dueDate = task.due_date ? `Due: ${new Date(task.due_date).toISOString().split("T")[0]}` : "No due date";
          const status = task.completed ? "Status: Completed" : "Status: Pending";
          const priorityText = task.priority ? `Priority: ${task.priority}` : "";
          return `- "${task.title}" (${priorityText}, ${dueDate}, ${status})`;
        })
        .join("\n");
    }

    // Fetch Spaces (Optional but potentially helpful context)
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id, title, description")
      .order("created_at", { ascending: true })
      .limit(10);

    if (spacesError) {
      console.error("Supabase error fetching spaces:", spacesError.message);
      spaceContext = "Could not retrieve user's spaces due to a database error.";
    } else if (spaces && spaces.length > 0) {
      spaceContext = "User's Defined Spaces:\n";
      spaceContext += spaces
        .map((space) => {
          const desc = space.description ? `: ${space.description.substring(0, 50)}...` : "";
          return `- "${space.title}" (ID: ${space.id})${desc}`;
        })
        .join("\n");
    }
  } catch (supabaseError) {
    console.error("Error initializing Supabase client or fetching context:", supabaseError);
    taskContext = "Could not retrieve user's current tasks due to a server error.";
    spaceContext = "Could not retrieve user's spaces due to a server error.";
  }

  // 3. Prepare Prompt & Call AI using generateObject
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set.");
      return NextResponse.json({ error: "AI service is not configured (missing API key)" }, { status: 500 });
    }

    // Define the SYSTEM prompt - Focus on the *rules* for plan generation
    // The JSON structure itself is defined by the Zod schema passed to generateObject
    const systemPrompt = `You are an expert planner AI. Your task is to generate a detailed, actionable plan based on the user's goal and their current context (tasks and spaces).
Follow these requirements strictly:
1. Create a progressive plan where each task builds upon previous ones in a logical sequence. Aim for at least 10 tasks if feasible for the goal.
2. Include measurable milestones with specific metrics where possible.
3. Balance different components needed for the goal (e.g., skills, knowledge, networking, actions).
4. Include specific check-in points or review tasks for assessment and plan adjustment.
5. Provide tasks with actionable verbs and specific details (e.g., "Research 3 online courses on X" instead of "Learn X").
6. Ensure tasks follow a realistic progression based on estimated time needed.
7. Include both primary activities and supporting habits/actions if relevant.
8. Front-load more detailed guidance for the initial phase.
9. EVERY task MUST have a specific due_date assigned in YYYY-MM-DD format. Estimate reasonable dates based on the goal and task sequence. Do NOT use "ongoing" or relative dates.
10. For recurring activities, create separate, dated task entries representing checkpoints or completions (e.g., "Complete week 1 of daily practice [Topic]" with a specific end date for that week).`;

    // Construct the USER prompt - Combine context and the specific goal
    const userPrompt = `---
USER CONTEXT START
Tasks:
${taskContext}

Spaces:
${spaceContext}
USER CONTEXT END
---

Based on the rules provided in the system prompt and my current context, generate a detailed task plan for the following goal: "${goal}"`;

    console.log("Requesting plan generation for goal:", goal);

    // Use generateObject with the Zod schema
    const { object: generatedPlan } = await generateObject({
      model: google("models/gemini-2.0-flash"),
      schema: planSchema, // Pass the Zod schema here
      system: systemPrompt, // Pass the planning rules
      prompt: userPrompt, // Pass the context + goal
      // Optional: Specify mode if needed, 'json' is default for generateObject
      // mode: 'json'
    });

    // 4. Return the structured JSON response
    // The 'object' property contains the validated and typed data
    return NextResponse.json(generatedPlan, { status: 200 });
  } catch (error: any) {
    // Catch block for AI call and JSON parsing errors
    console.error("Error generating structured plan with Vercel AI SDK:", error);
    if (error.message && error.message.includes("API key")) {
      return NextResponse.json({ error: "Invalid Google API Key or Authentication Error" }, { status: 401 });
    }
    if (error.message && error.message.includes("permission denied")) {
      return NextResponse.json({ error: "AI service permission denied. Check API key and enabled services." }, { status: 403 });
    }
    if (error.name === "RateLimitError") {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }
    // Handle potential Zod validation errors if the AI output doesn't match schema after retries
    if (error.message && (error.message.includes("Validation Error") || error.message.includes("Failed to parse"))) {
      return NextResponse.json(
        { error: "AI failed to generate response in the expected format.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Failed to generate plan", details: error.message || String(error) }, { status: 500 });
  }
}
