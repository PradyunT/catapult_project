import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
  try {
    const cookies = request.headers.get('cookie');
    const tokensCookie = cookies?.split(';').find(c => c.trim().startsWith('google_calendar_tokens='));
    
    if (!tokensCookie) {
      return NextResponse.json({ connected: false });
    }

    const tokens = JSON.parse(tokensCookie.split('=')[1]);
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      'http://localhost:3000/api/calendar/callback'
    );

    oauth2Client.setCredentials(tokens);

    // Try to make a simple API call to verify the tokens are valid
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.calendarList.list();

    return NextResponse.json({ connected: true });
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json({ connected: false });
  }
} 