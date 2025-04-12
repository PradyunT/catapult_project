import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      'http://localhost:3000/api/calendar/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store the tokens securely
    const response = NextResponse.redirect('http://localhost:3000/settings?tab=integrations');
    response.cookies.set('google_calendar_tokens', JSON.stringify(tokens), { 
      httpOnly: true, 
      secure: true,
      maxAge: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : undefined
    });

    // Return a simple HTML page that will close the popup and notify the parent
    const html = `
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'google-calendar-connected' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 });
  }
} 