import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clear the tokens from cookies
    const response = NextResponse.json({ success: true });
    response.cookies.delete('google_calendar_tokens');
    
    return response;
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 });
  }
} 