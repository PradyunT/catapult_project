// catapult/src/services/google/calendarService.js

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// If modifying these scopes, delete the file token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

async function getCredentials() {
    let creds = null;
    try {
        // The file token.json stores the user's access and refresh tokens
        if (await fs.access('token.json').then(() => true).catch(() => false)) {
            const tokenContent = await fs.readFile('token.json');
            creds = JSON.parse(tokenContent);
        }
        
        // If there are no (valid) credentials available, let the user log in.
        if (!creds || !creds.access_token) {
            if (creds && creds.refresh_token) {
                // Refresh the token if it's expired
                const oauth2Client = new google.auth.OAuth2(
                    process.env.CLIENT_ID,
                    process.env.CLIENT_SECRET,
                    'http://localhost'
                );
                oauth2Client.setCredentials(creds);
                const { credentials } = await oauth2Client.refreshAccessToken();
                creds = credentials;
            } else {
                // Get new credentials
                const authUrl = await getAuthUrl();
                console.log('Opening authorization URL in your browser...');
                const { default: open } = await import('open');
                await open(authUrl);
                
                const code = await new Promise((resolve) => {
                    console.log('Enter the authorization code: ');
                    process.stdin.once('data', (data) => resolve(data.toString().trim()));
                });

                const oauth2Client = new google.auth.OAuth2(
                    process.env.CLIENT_ID,
                    process.env.CLIENT_SECRET,
                    'http://localhost'
                );
                
                const { tokens } = await oauth2Client.getToken(code);
                creds = tokens;
                
                // Save the credentials for the next run
                await fs.writeFile('token.json', JSON.stringify(creds));
            }
        }
        return creds;
    } catch (error) {
        console.error('Error getting credentials:', error);
        throw error;
    }
}

async function getAuthUrl() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        'http://localhost'
    );
    
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
}

async function fetchCalendarEvents() {
    try {
        const creds = await getCredentials();
        const oauth2Client = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            'http://localhost'
        );
        oauth2Client.setCredentials(creds);
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // Get current time in RFC3339 format
        const now = new Date().toISOString();
        
        // Call the Calendar API
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now,
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
        });
        
        const events = response.data.items;
        
        if (!events || events.length === 0) {
            console.log('No upcoming events found.');
            return [];
        }

        // Format events to match the schedule table schema
        const formattedEvents = events.map(event => {
            const start = event.start.dateTime || event.start.date;
            const end = event.end.dateTime || event.end.date;
            
            // Convert string dates to Date objects
            const startDt = new Date(start);
            const endDt = new Date(end);
            
            // Format according to schedule table schema
            return {
                id: uuidv4(),  // Generate UUID for the event
                task_id: null,  // This would be set when linking to a task
                title: event.summary,
                start_time: startDt.toISOString(),
                end_time: endDt.toISOString(),
                date: startDt.toISOString().split('T')[0],  // Get just the date part
                notes: event.description || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        });

        // Output the events as JSON
        console.log(JSON.stringify(formattedEvents, null, 2));
        return formattedEvents;

    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

// Export the function to be used in other parts of the application
module.exports = { fetchCalendarEvents };

// If running directly
if (require.main === module) {
    fetchCalendarEvents().catch(console.error);
}