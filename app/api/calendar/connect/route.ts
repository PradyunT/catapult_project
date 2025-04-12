import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

export async function POST() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      'http://localhost:3000/api/calendar/callback'
    );

    const state = uuidv4();
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: state,
    });

    // Store the state in a secure way (e.g., in a session or database)
    // This is a simplified example - in production, you should use a proper session store
    const response = NextResponse.json({ authUrl });
    response.cookies.set('oauth_state', state, { httpOnly: true, secure: true });
    
    return response;
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
} 