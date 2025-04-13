import { NextResponse } from 'next/server';
// Adjust the path based on where you placed scrapeAssignments.ts
import { scrapeAssignments } from '../../../lib/ScrapeAssignments'; 

export async function GET() {
  try {
    // Ensure scrapeAssignments returns the Task[] type defined in your script
    const assignments = await scrapeAssignments(); 
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error scraping assignments:', error);
    // Provide a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to scrape assignments', details: errorMessage }, { status: 500 });
  }
}