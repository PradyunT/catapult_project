import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // This is a placeholder for the Gemini 2.0 Flash integration
    // In a real implementation, you would use the appropriate AI SDK
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system:
        "You are Sensei AI, a helpful AI mentor focused on helping users achieve their goals and manage their tasks. You can suggest tasks, break down goals into actionable steps, and provide daily overviews.",
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
