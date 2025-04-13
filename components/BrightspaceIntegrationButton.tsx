'use client'; // <-- Mark as a Client Component

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"; // Import the Button component
// You might want to import your Task interface if you use it here
// import { Task } from '../lib/scrapeAssignments'; 

const BrightspaceIntegrationButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleClick = async () => {
    if (isConnected) return; // Don't do anything if already connected
    
    setIsLoading(true);
    setMessage(null); // Clear previous messages
    try {
      const response = await fetch('/api/scrape-assignments', { // Use the correct API route
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
      }

      const data = await response.json(); // data should be Task[]
      console.log('Scraped Assignments:', data);
      //setMessage(`Successfully scraped ${data.length} assignments!`);
      setIsConnected(true); // Set connected state to true after successful import
      // You can now process the 'data' array (e.g., update state, display results)

    } catch (error) {
      console.error('Error fetching assignments:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button 
        onClick={handleClick} 
        disabled={isLoading}
      >
        {isLoading ? 'Scraping...' : isConnected ? 'Connected' : 'Import Assignments'}
      </Button>
      {message && 
        <p className={`mt-2 text-sm ${message.startsWith('Error:') ? 'text-red-600' : 'text-muted-foreground'}`}>
          {message}
        </p>
      }
    </div>
  );
};

export default BrightspaceIntegrationButton;