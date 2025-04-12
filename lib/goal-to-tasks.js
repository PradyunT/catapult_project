import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the goal from the request body
    const { goal } = req.body;
    
    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }

    // Initialize the Gemini AI client
    // IMPORTANT: In production, use environment variables for API keys
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Create the prompt
    const prompt = `{ "type": "object", "properties": { "goal": { "type": "string", "description": "The user's long-term career or life objective." }, "tasks": { "type": "array", "description": "A sequential list of tasks to achieve the goal, each with a description and due date.", "minItems": 10, "items": { "type": "object", "properties": { "description": { "type": "string" }, "due_date": { "type": "string", "format": "date" } }, "required": ["description", "due_date"] } } }, "required": ["goal", "tasks"] }
This is the output I want you to give me. You need to give me specific, goal oriented actions to achieve the goal given.
Important requirements:
1. Create a progressive plan where each task builds upon previous ones in a logical sequence
2. Include measurable milestones with specific metrics (e.g., "Complete 3 mock interviews with feedback" rather than "Practice interviewing")
3. Balance different components needed for the goal (skills, knowledge, networking, applications, etc.)
4. Include specific check-in points for assessment and plan adjustment
5. Provide tasks with actionable details rather than vague suggestions. (e.g, "Work out MWF" rather than "Work out several days")
6. Ensure tasks follow a realistic progression based on time needed to develop skills or complete processes
7. Include both primary activities and supporting habits/actions
8. Front-load more detailed guidance for the first phase, then transition to more advanced steps
9. EVERY task MUST have a specific due_date in YYYY-MM-DD format - NO "ongoing" tasks
10. For recurring activities, create separate dated checkpoints (e.g., instead of "Practice daily", use "Complete week 1 of daily practice" with a specific date)
The prompt is: ${goal}`;

    // Get response from Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    // Parse the response text as JSON
    let planData;
    try {
      // The text may contain markdown code blocks, so we need to extract just the JSON
      const jsonText = response.text.replace(/```json\n|\n```/g, '').trim();
      planData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // Return the plan data
    return res.status(200).json(planData);
  } catch (error) {
    console.error("Error generating plan:", error);
    return res.status(500).json({ error: 'Failed to generate plan' });
  }
}
