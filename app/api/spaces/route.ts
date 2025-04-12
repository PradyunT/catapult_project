import { getSpaces } from "@/app/actions/space-actions"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const spaces = await getSpaces()
    return NextResponse.json(spaces)
  } catch (error) {
    console.error("Error fetching spaces:", error)
    return NextResponse.json([], { status: 500 })
  }
}
