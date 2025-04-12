// app/api/chat/route.ts
import { google } from "@ai-sdk/google"; // Use Vercel AI SDK's Google provider
import { streamText, CoreMessage } from "ai"; // Use streamText and CoreMessage type
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const maxDuration = 30; // Or higher if needed for complex generations

// Note: This endpoint now expects 'messages' array from the useChat hook,
// but we'll adapt it to also handle the 'goal' parameter for now
// if called directly without useChat's structure.
// A better long-term approach might be separate endpoints or adapting the frontend call.
export async function POST(req: Request) {
  // 1. Get Request Body - Adapt to handle both 'goal' and 'messages' potentially
  let goal: string | undefined;
  let incomingMessages: CoreMessage[] | undefined;

  try {
    const body = await req.json();
    // Prefer 'messages' if available (standard for useChat)
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      incomingMessages = body.messages as CoreMessage[];
      // Attempt to extract the latest user goal/prompt from messages
      goal = incomingMessages.findLast((m) => m.role === "user")?.content as string | undefined;
    } else if (body.goal && typeof body.goal === "string") {
      // Fallback to handling direct 'goal' parameter
      goal = body.goal;
    }

    if (!goal) {
      return NextResponse.json(
        { error: "Could not determine goal from request (expected 'messages' array or 'goal' string)" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // 2. Fetch User Tasks from Supabase (No changes needed here)
  let taskContext = "The user has no current tasks listed.";
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: tasks, error: dbError } = await supabase
      .from("tasks")
      .select("title, description, due_date, priority, completed")
      .order("due_date", { ascending: true });

    if (dbError) {
      console.error("Supabase error fetching tasks:", dbError.message);
      taskContext = "Could not retrieve user's current tasks due to a database error.";
    } else if (tasks && tasks.length > 0) {
      taskContext = "Here is the user's current list of tasks for context:\n";
      taskContext += tasks
        .map((task) => {
          const dueDate = task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "No due date";
          const status = task.completed ? "Completed" : "Pending";
          const desc = task.description ? ` - ${task.description.substring(0, 60)}...` : "";
          const priorityText = task.priority ? ` (Priority: ${task.priority}` : "";
          return `- "${task.title}"${priorityText}, Due: ${dueDate}, Status: ${status})${desc}`;
        })
        .join("\n");
    }
  } catch (supabaseError) {
    console.error("Error initializing Supabase client or fetching tasks:", supabaseError);
    taskContext = "Could not retrieve user's current tasks due to a server error.";
  }

  // 3. Prepare Prompt & Call AI using Vercel AI SDK
  try {
    // Check if the correct environment variable is set for the Vercel SDK Google provider
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set.");
      return NextResponse.json({ error: "AI service is not configured (missing API key)" }, { status: 500 });
    }

    // Define the system prompt containing the rules and JSON structure requirements
    const systemPrompt = `{ "type": "object", "properties": { "goal": { "type": "string", "description": "The user's long-term career or life objective." }, "tasks": { "type": "array", "description": "A sequential list of tasks to achieve the goal, each with a description and due date.", "minItems": 10, "items": { "type": "object", "properties": { "description": { "type": "string" }, "due_date": { "type": "string", "format": "date" } }, "required": ["description", "due_date"] } } }, "required": ["goal", "tasks"] }
This is the JSON output format I want you to give me. You need to give me specific, goal oriented actions to achieve the goal given.
Important requirements:
1. Create a progressive plan where each task builds upon previous ones in a logical sequence.
2. Include measurable milestones with specific metrics.
3. Balance different components needed for the goal.
4. Include specific check-in points for assessment and plan adjustment.
5. Provide tasks with actionable details.
6. Ensure tasks follow a realistic progression.
7. Include both primary activities and supporting habits/actions.
8. Front-load more detailed guidance for the first phase.
9. EVERY task MUST have a specific due_date in YYYY-MM-DD format.
10. For recurring activities, create separate dated checkpoints.`;

    // Construct the user message, including context and the specific goal
    const userMessageContent = `---
USER'S CURRENT TASK CONTEXT:
${taskContext}
---

Based on the rules in the system prompt and my current tasks, generate a detailed task plan for the following goal: ${goal}`;

    // Prepare messages for the Vercel AI SDK
    // If incomingMessages exists (from useChat), use it, otherwise create a new history
    const messages: CoreMessage[] = incomingMessages
      ? [
          ...incomingMessages.slice(0, -1), // Keep history, exclude the latest user message we extracted 'goal' from
          { role: "user", content: userMessageContent }, // Use the newly constructed user message
        ]
      : [
          // If only 'goal' was provided, create a simple history
          { role: "user", content: userMessageContent },
        ];

    console.log("Sending messages to Gemini via Vercel AI SDK. Last user message goal:", goal);

    // Use streamText from 'ai' package
    const result = await streamText({
      model: google("models/gemini-1.5-flash-latest"), // Use the Google provider
      system: systemPrompt, // Pass the rules/schema as the system prompt
      messages: messages, // Pass the chat history (including the constructed user message)
    });

    // 4. Return the streaming response - the Vercel AI SDK handles the streaming format
    return result.toDataStreamResponse();
  } catch (error: any) {
    // Catch block for AI call errors
    console.error("Error generating plan with Vercel AI SDK:", error);

    // Check for specific errors if needed (e.g., API key issues handled by the SDK)
    // The SDK might throw errors with specific structures or messages
    if (error.message && error.message.includes("API key")) {
      return NextResponse.json({ error: "Invalid Google API Key or Authentication Error" }, { status: 401 });
    }
    if (error.message && error.message.includes("permission denied")) {
      return NextResponse.json({ error: "AI service permission denied. Check API key and enabled services." }, { status: 403 });
    }
    if (error.name === "RateLimitError") {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }

    return NextResponse.json(
      { error: "Failed to generate plan using AI service", details: error.message || String(error) },
      { status: 500 }
    );
  }
}
