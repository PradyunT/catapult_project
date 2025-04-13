// app/api/generate-plan/route.ts
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Database } from "@/lib/database.types"; // Adjust path if your types are elsewhere

export const maxDuration = 90;

// Updated Zod Schema
const planSchema = z.object({
  goal: z.string().describe("The user's original goal."),
  tasks: z
    .array(
      z.object({
        title: z.string().describe("A concise, clear title for the task (max 5-7 words)."), // Added title
        description: z.string().describe("A slightly more detailed description of the task, outlining the action."), // Kept description
        due_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format.")
          .describe("Task due date in YYYY-MM-DD format."), // Added regex validation
      })
    )
    .min(1) // Adjusted min to 1
    .describe("A sequential list of tasks to achieve the goal."),
});

export async function POST(req: Request) {
  // 1. Get Goal from Request Body
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

  // Get Current Date
  const currentDate = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD

  // 2. Fetch User Context (Tasks and Spaces)
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

    // Fetch Spaces
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

    // Updated System Prompt
    const systemPrompt = `You are an expert planner AI. Your task is to generate a detailed, actionable plan based on the user's goal, their current context (tasks and spaces), and today's date.
Generate the plan according to the provided schema, ensuring each task has a concise 'title', a more detailed 'description', and a 'due_date'.
Follow these requirements strictly:
1. Create a progressive plan where each task builds upon previous ones logically.
2. 'title' should be short and clear (max 5-7 words). 'description' should explain the action.
3. Use the provided current date to estimate realistic 'due_date' values in YYYY-MM-DD format. Do NOT use "ongoing" or relative dates.
4. Include measurable milestones/metrics in descriptions where possible.
5. Balance different components needed for the goal (e.g., skills, knowledge, networking, actions).
6. Include specific check-in points or review tasks for assessment and plan adjustment.
7. Provide actionable verbs and specific details in descriptions.
8. Ensure tasks follow a realistic progression.
9. For recurring activities, create separate, dated task entries representing checkpoints or completions (e.g., title: "Week 1 Daily Practice", description: "Complete daily practice for [Topic] during week 1", due_date: "YYYY-MM-DD" for end of week 1).`;

    // Updated User Prompt
    const userPrompt = `---
CURRENT DATE: ${currentDate}

USER CONTEXT START
Tasks:
${taskContext}

Spaces:
${spaceContext}
USER CONTEXT END
---

Based on the rules in the system prompt, my current context, and today's date (${currentDate}), generate a detailed task plan for the following goal: "${goal}"`;

    console.log("Requesting plan generation for goal:", goal);

    const { object: generatedPlan } = await generateObject({
      model: google("models/gemini-1.5-flash-latest"),
      schema: planSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return NextResponse.json(generatedPlan, { status: 200 });
  } catch (error: any) {
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
    if (
      error.message &&
      (error.message.includes("Validation Error") ||
        error.message.includes("Failed to parse") ||
        error.message.includes("schema"))
    ) {
      return NextResponse.json(
        { error: "AI failed to generate response in the expected format.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Failed to generate plan", details: error.message || String(error) }, { status: 500 });
  }
}
