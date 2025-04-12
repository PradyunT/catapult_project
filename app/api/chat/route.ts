// app/api/chat/route.ts
import { google } from "@ai-sdk/google"; // Use Vercel AI SDK's Google provider
import { streamText, CoreMessage } from "ai"; // Use streamText and CoreMessage type
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/database.types"; // Import your generated types

export const maxDuration = 60; // Increased duration slightly for more complex chat

export async function POST(req: Request) {
  // 1. Get Request Body - Expecting 'messages' array from useChat
  let incomingMessages: CoreMessage[];
  try {
    const body = await req.json();
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      incomingMessages = body.messages as CoreMessage[];
    } else {
      // If not using useChat structure, this won't work well.
      // For a general chat, the 'messages' array is essential for history.
      return NextResponse.json({ error: "Invalid request format: 'messages' array is required." }, { status: 400 });
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Extract the actual user query from the last message
  const currentUserQuery = incomingMessages[incomingMessages.length - 1]?.content;
  if (!currentUserQuery) {
    return NextResponse.json({ error: "Could not extract user query from messages." }, { status: 400 });
  }

  // 2. Fetch User Context (Tasks and Spaces) from Supabase
  let taskContext = "User has no current tasks listed.";
  let spaceContext = "User has no defined spaces.";
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore }); // Use Database type

    // Fetch Tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("title, description, due_date, priority, completed, space_id") // Added space_id if relevant
      .order("due_date", { ascending: true })
      .limit(20); // Limit context size

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
          // const spaceIdText = task.space_id ? ` (Space ID: ${task.space_id})` : ""; // Optionally include space ID
          return `- "${task.title}" (${priorityText}, ${dueDate}, ${status})`; // Simplified format
        })
        .join("\n");
    }

    // Fetch Spaces
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id, title, description, color") // Select relevant space fields
      .order("created_at", { ascending: true })
      .limit(10); // Limit context size

    if (spacesError) {
      console.error("Supabase error fetching spaces:", spacesError.message);
      spaceContext = "Could not retrieve user's spaces due to a database error.";
    } else if (spaces && spaces.length > 0) {
      spaceContext = "User's Defined Spaces:\n";
      spaceContext += spaces
        .map((space) => {
          const desc = space.description ? `: ${space.description.substring(0, 50)}...` : "";
          // const colorText = space.color ? ` (Color: ${space.color})` : ""; // Optionally include color
          return `- "${space.title}" (ID: ${space.id})${desc}`; // Include ID for reference
        })
        .join("\n");
    }
  } catch (supabaseError) {
    console.error("Error initializing Supabase client or fetching context:", supabaseError);
    taskContext = "Could not retrieve user's current tasks due to a server error.";
    spaceContext = "Could not retrieve user's spaces due to a server error.";
  }

  // 3. Prepare Prompt & Call AI using Vercel AI SDK
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set.");
      return NextResponse.json({ error: "AI service is not configured (missing API key)" }, { status: 500 });
    }

    // Define the GENERAL system prompt for the AI Mentor
    const systemPrompt = `You are Sensei AI, a helpful and encouraging AI mentor. Your goal is to assist users in managing their tasks, achieving their goals, and organizing their work within different 'Spaces'.
You can answer questions, provide daily summaries, help break down goals, suggest tasks based on context, offer advice, and chat about productivity and learning.
You will be provided with the user's current list of tasks and spaces for context in their messages. Use this information to provide relevant and personalized responses.
Keep your responses conversational, clear, concise, and supportive. Be action-oriented when appropriate. Avoid overly technical jargon unless requested.
Respond in plain text or Markdown. Do NOT output JSON unless the user explicitly asks for data in JSON format.`;

    // Construct the context block to prepend to the *latest* user message
    const contextBlock = `---
CONTEXT START
${taskContext}

${spaceContext}
CONTEXT END
---

User query: ${currentUserQuery}`; // Combine context with the actual user query

    // Prepare messages for the Vercel AI SDK: Use history + modified last message
    const messages: CoreMessage[] = [
      ...incomingMessages.slice(0, -1), // Keep all messages except the last one
      { role: "user", content: contextBlock }, // Replace last user message with context + query
    ];

    console.log("Sending messages to Gemini via Vercel AI SDK. Last user query:", currentUserQuery);

    // Use streamText from 'ai' package
    const result = await streamText({
      model: google("models/gemini-2.0-flash"), // Use the Google provider
      system: systemPrompt, // General persona and instructions
      messages: messages, // Full chat history with context injected into the last user message
    });

    // 4. Return the streaming response
    return result.toDataStreamResponse();
  } catch (error: any) {
    // Catch block for AI call errors
    console.error("Error generating chat response with Vercel AI SDK:", error);
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
      { error: "Failed to generate chat response", details: error.message || String(error) },
      { status: 500 }
    );
  }
}
