import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
// You'll likely need the googleapis library
// npm install googleapis
import { google } from 'googleapis';

import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types' // Adjust path if needed

// This function handles the GET request to /auth/callback
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

  if (code) {
    try {
      // Exchange code for session
      const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

      if (session) {
        const user = session.user
        const providerToken = session.provider_token // Type: string | null | undefined

        // Initial check (already present, good)
        if (!providerToken) {
          throw new Error('Provider token not found. Did you request scopes?')
        }

        // --- Refined New User Check & Gmail Fetch Logic ---
        let profileExists = false;
        let needsGmailFetch = false;

        // 1. Check if profile exists
        const { data: existingProfile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('id, gmail_data') // Select needed fields
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle to avoid error if not found

        if (profileFetchError) {
          console.error("Error fetching profile data:", profileFetchError);
          // Decide if this error is critical or if we can proceed
          // For now, let's assume we might still try to insert/fetch Gmail
        }

        if (existingProfile) {
          profileExists = true;
          if (existingProfile.gmail_data === null) {
            // Profile exists (likely from trigger), but needs Gmail data
            needsGmailFetch = true;
            console.log(`Profile found, gmail_data is null for user: ${user.id}. Flagging for email fetch.`);
          } else {
            // Profile exists and has Gmail data (or it's not null)
            console.log(`Returning user or Gmail data already exists for ${user.id}. Skipping email fetch.`);
          }
        } else {
          // Profile doesn't exist - Likely race condition with trigger, or trigger failed.
          console.warn(`Profile not found for user ${user.id} during callback. Attempting to create.`);
          profileExists = false; // Explicitly false
          needsGmailFetch = true; // Assume new user needs Gmail fetch

          // 2. Attempt to create the profile directly within the callback
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id }); // Insert minimal profile

          if (insertError) {
            // Handle potential insert errors
            // Code '23505' is unique_violation - means trigger *did* run just before/during this attempt
            if (insertError.code === '23505') {
               console.log(`Insert failed due to unique constraint, profile likely created by trigger concurrently for ${user.id}. Proceeding.`);
               profileExists = true; // The profile effectively exists now
            } else {
              console.error(`Failed to insert profile for user ${user.id}:`, insertError);
              // Decide how to handle this failure - maybe skip Gmail fetch?
              needsGmailFetch = false; // Can't fetch if profile creation failed non-recoverably
            }
          } else {
             console.log(`Successfully inserted profile for user ${user.id} from callback.`);
             profileExists = true; // It definitely exists now
          }
        }

        // 3. Fetch and store Gmail data if needed
        if (profileExists && needsGmailFetch) {

          // Add explicit check here for TypeScript's benefit
          if (!providerToken) {
             // This should logically never happen due to the earlier check,
             // but it satisfies TypeScript and guards against regressions.
             console.error("Critical error: providerToken became null/undefined before Gmail fetch.");
             throw new Error("Provider token missing unexpectedly before Gmail fetch.");
          }

          // Now TypeScript knows providerToken is definitely a string here
          console.log(`Proceeding with Gmail fetch for user: ${user.id}.`);
          try {
            // Pass the guaranteed string token
            const gmailData = await fetchGmailMessages(providerToken);

            // Update profile with Gmail data
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ gmail_data: gmailData })
              .eq('id', user.id);

            if (updateError) {
              console.error("Error storing gmail data:", updateError);
            } else {
              console.log(`Stored Gmail data for user ${user.id}`)
            }
          } catch (gmailError) {
             console.error(`Failed to fetch or store Gmail data for ${user.id}:`, gmailError);
          }
        }
        // --- End of Refined Logic ---

      } else {
         throw new Error('Session not found after code exchange.');
      }

    } catch (error) {
      console.error('Error in callback handler:', error)
      // Safely handle unknown error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during authentication callback';
      return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?message=${encodeURIComponent(errorMessage)}`)
    }
  } else {
    console.error('No code found in callback URL')
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?message=Missing authorization code`)
  }

  // Redirect to dashboard after processing
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}


// --- Helper Function for Gmail API Calls ---
// (Could also be in a separate file or Edge Function)
async function fetchGmailMessages(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth });

  try {
    // 1. Get list of message IDs
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50, // Fetch last 50 message IDs
      // You might want to add q (query) parameters here, e.g., 'in:inbox'
    });

    const messages = listResponse.data.messages;
    if (!messages || messages.length === 0) {
      console.log('No messages found.');
      return [];
    }

    // 2. Fetch details for each message
    const emailDetails = [];
    for (const message of messages) {
      if (message.id) {
        try {
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata', // Fetch metadata (headers) - use 'full' for body etc.
            metadataHeaders: ['Subject', 'From', 'To', 'Date'], // Specify needed headers
          });
          // Extract relevant info (adjust structure as needed)
           emailDetails.push({
             id: messageResponse.data.id,
             threadId: messageResponse.data.threadId,
             snippet: messageResponse.data.snippet,
             headers: messageResponse.data.payload?.headers?.reduce((acc, header) => {
               if (header.name && header.value) acc[header.name.toLowerCase()] = header.value;
               return acc;
             }, {} as Record<string, string>) || {}
           });
        } catch (err) {
          console.error(`Error fetching message details for ID ${message.id}:`, err);
          // Decide if you want to skip this email or stop the process
        }
      }
    }

    console.log(`Fetched details for ${emailDetails.length} emails.`);
    return emailDetails; // This is the array of email objects (JSON)

  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    // Handle API errors (e.g., token expired, insufficient permissions)
    throw error; // Re-throw to be caught in the main handler
  }
} 