// supabase/functions/gemini-proxy/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts' // Ensure this helper exists

// Get Gemini API Key from environment variables
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Helper function to construct Gemini API URL
function getGeminiUrl(apiKey: string | undefined): string | null {
  if (!apiKey) return null;
  // Use a specific model known to work well, like 1.5 flash
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const geminiUrl = getGeminiUrl(GEMINI_API_KEY);

  // Check if API key is set properly
  if (!geminiUrl) {
    console.error("Gemini API Key environment variable not set or invalid.");
    return new Response(JSON.stringify({ error: 'Server configuration error: API key missing or invalid' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    // 1. Get the request body sent from the frontend
    // It might contain just the prompt string, or an object like { action: '...', payload: ... }
    const requestPayload = await req.json();

    // Determine the actual prompt text based on the structure sent by frontend
    let promptText: string | null = null;
    if (typeof requestPayload === 'string') {
        // If frontend sends just the prompt string directly
        promptText = requestPayload;
    } else if (requestPayload && typeof requestPayload.prompt === 'string') {
        // If frontend sends { prompt: "..." }
        promptText = requestPayload.prompt;
    } else if (requestPayload && requestPayload.action === 'mark_quiz' && requestPayload.payload) {
         // Handle marking: Construct the detailed marking prompt here
         // This part needs to match the structure you decided on in quiz.js for marking
         const { chapterContext, answers } = requestPayload.payload;
         promptText = `
            You are an IGCSE Chemistry examiner providing feedback. Evaluate each student answer against the question and guideline. The output MUST be a valid JSON array. For each question number provided in the input data, create a JSON object in the output array. Each object MUST have keys: "question_number" (integer), "feedback" (string evaluating the student answer AND providing a concise correct explanation/answer, using MathJax delimiters \\\\( ... \\\\) for symbols/formulas), and "mark" (string: "Correct", "Partially Correct", or "Incorrect"). Use \\n for newlines within the feedback string where appropriate, especially before the 'Correct Answer' part.

            Input Data (student answers to mark for Chapter ${chapterContext}): ${JSON.stringify(answers, null, 2)}

            Instructions for feedback content:
            - Evaluate the 'student_answer'.
            - Explain *why* the answer is correct/partially correct/incorrect, referencing relevant concepts.
            - **Crucially:** Include a clearly marked explanation section like "\\n\\n**Correct Answer:** ..." within the feedback string.
            - For calculation questions, show key steps.

            Example JSON object format in the output array:
            {
                "question_number": 1,
                "feedback": "Your definition identified the minimum energy but missed the context of reacting particles.\\n\\n**Correct Answer:** Activation energy (\\\\( E_a \\\\)) is the minimum energy that colliding particles must possess in order to react.",
                "mark": "Partially Correct"
            }
        `;

    } else if (requestPayload && typeof requestPayload === 'object') {
        // Fallback: maybe the prompt is just the stringified object?
        promptText = JSON.stringify(requestPayload);
        console.warn("Received complex object, using stringified version as prompt:", promptText);
    }


    if (!promptText) {
      return new Response(JSON.stringify({ error: 'Invalid or missing prompt data in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Prepare the request body for the *actual* Gemini API
    const geminiRequestBody = {
      contents: [{ parts: [{ text: promptText }] }],
      safetySettings: [ // Adjust as needed, BLOCK_NONE allows more content but has risks
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
      ],
      generationConfig: {
        temperature: 0.6,
        // IMPORTANT: Ask Gemini for JSON directly if the model supports it well
        // Otherwise, stick to text/plain and parse manually below
         responseMimeType: "application/json", // Try requesting JSON directly
        // responseMimeType: "text/plain", // Fallback if JSON direct request fails
      }
    };

    // 3. Call the Gemini API
    console.log("Calling Gemini API..."); // Log before the call
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiRequestBody),
    });
    console.log("Gemini API response status:", geminiResponse.status); // Log status

    // 4. Handle Gemini API Response Status
    if (!geminiResponse.ok) {
      let errorBodyText = await geminiResponse.text(); // Get raw error text
      console.error('Gemini API Error Response Body:', errorBodyText);
      // Try parsing as JSON in case error details are structured
      let errorDetails = errorBodyText;
      try { errorDetails = JSON.parse(errorBodyText); } catch(e) { /* Ignore parsing error, use raw text */ }

      return new Response(JSON.stringify({
          error: `Gemini API Error: ${geminiResponse.status} ${geminiResponse.statusText}`,
          details: errorDetails
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: geminiResponse.status, // Forward the original error status
      });
    }

    // 5. Process the SUCCESSFUL Gemini Response
    let geminiData;
    let finalResultJson;

    try {
        geminiData = await geminiResponse.json(); // Get the full JSON object from Gemini

        // **CRITICAL FIX:** Extract the actual content part containing the text/JSON
        const contentPart = geminiData?.candidates?.[0]?.content?.parts?.[0];

        if (!contentPart) {
             console.error("Unexpected Gemini response structure:", JSON.stringify(geminiData, null, 2));
             throw new Error("AI response structure missing expected content part.");
        }

        // If we requested "application/json" and got it directly in `contentPart.text` (or similar expected structure)
         if (geminiRequestBody.generationConfig.responseMimeType === 'application/json' && typeof contentPart.text === 'string') {
             // The text field should *already* contain the JSON string we asked for
             console.log("Attempting to parse JSON text from Gemini JSON response...");
             finalResultJson = JSON.parse(contentPart.text);
         } else if (contentPart.text) {
             // If we requested text/plain, or if the JSON wasn't nested in 'text'
             // We attempt to parse the text content.
             console.log("Attempting to parse raw text from Gemini as JSON...");
             finalResultJson = JSON.parse(contentPart.text);
        } else {
             // If the structure doesn't have 'text' but maybe the part itself IS the JSON? (Less common)
             console.warn("No 'text' field found in content part, attempting to use the part itself:", contentPart);
             finalResultJson = contentPart; // Assume the part itself is the JSON object/array
         }


        // **VALIDATE the final structure** (expecting an array for quiz/feedback)
        if (!Array.isArray(finalResultJson)) {
             console.error("Parsed result is not an array:", JSON.stringify(finalResultJson, null, 2));
             throw new Error("AI processing resulted in an unexpected format (expected array).");
        }

    } catch (e) {
        // Catch errors during .json() parsing or the manual JSON.parse()
        console.error('Error processing Gemini response:', e);
        console.error('Raw Gemini Response Object (if available):', JSON.stringify(geminiData, null, 2)); // Log the object causing issues
        return new Response(JSON.stringify({ error: `Failed to process AI response: ${e.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    // 6. Send the successfully extracted and parsed JSON array back to the frontend
    return new Response(JSON.stringify(finalResultJson), { // Send back the *parsed* array
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Catch errors like invalid request JSON from frontend, network errors, etc.
    console.error('Error in Edge Function request handling:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})