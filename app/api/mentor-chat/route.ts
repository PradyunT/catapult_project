// app/api/gemini/route.ts
import { NextResponse } from 'next/server'

// If you need Node APIs (for fetch or other Node stuff)
export const runtime = 'nodejs';

// Example: adapt for your real Gemini endpoint
const GEMINI_API_URL = 'https://api.gemini-2.0-flash.com/v1/chat';

export async function POST(req: Request) {
  try {
    // 1) parse JSON from request body
    const { userMessage } = await req.json() as { userMessage: string }

    // 2) read your secret from env
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API key not set in .env.local')
    }

    // 3) call Gemini endpoint (this is example pseudocode, adjust to real spec)
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // depends on how Gemini wants the data
        // e.g. some parameter for "systemPrompt" or "userPrompt" or "messages"
        prompt: userMessage, 
        // ...other required fields...
      }),
    })

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status}`)
    }

    // 4) parse response from Gemini
    const data = await res.json()

    // Let's say the returned text is in data.content or data.choices[0].message
    // adapt as needed
    const geminiText = data?.content || 'No response from Gemini'

    // 5) return JSON
    return NextResponse.json({
      assistantMessage: geminiText,
    })
  } catch (err: any) {
    console.error('Gemini route error:', err)
    return new NextResponse(err.toString(), { status: 500 })
  }
}
