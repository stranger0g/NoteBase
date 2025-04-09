// supabase/functions/gemini-proxy/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts' // Ensure this helper exists

// Get Gemini API Key from environment variables
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Helper function to construct Gemini API URL
function getGeminiUrl(apiKey: string | undefined): string | null {
  if (!apiKey) return null;
  // Use a specific model known to work well, like 1.5 flash
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`Received ${req.method} request for gemini-proxy`); // Log request method

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
    const requestPayload = await req.json();
    console.log("Received payload from frontend:", JSON.stringify(requestPayload, null, 2)); // Log received payload

    // Determine the actual prompt text based on the structure sent by frontend
    let promptText: string | null = null;
    let isMarkingRequest = false; // Flag to know the context

    if (requestPayload && requestPayload.action === 'mark_quiz' && requestPayload.payload) {
         isMarkingRequest = true;
         // Handle marking: Construct the detailed marking prompt here
         const { chapterContext, answers } = requestPayload.payload;
         promptText = `
            You are an IGCSE Chemistry examiner providing feedback. Evaluate each student answer against the question and guideline. The output MUST be ONLY a valid JSON array of objects (like [{...}, {...}]), with no introductory text, code block fences (\`\`\`), or explanations outside the JSON structure itself. For each question number provided in the input data, create a JSON object in the output array. Each object MUST have keys: "question_number" (integer), "feedback" (string evaluating the student answer AND providing a concise correct explanation/answer, using MathJax delimiters \\\\( ... \\\\) for symbols/formulas), and "mark" (string: "Correct", "Partially Correct", or "Incorrect"). Use \\n for newlines within the feedback string where appropriate, especially before the 'Correct Answer:' part.

            Input Data (student answers to mark for Chapter ${chapterContext}): ${JSON.stringify(answers, null, 2)}

            Example JSON object format in the output array:
            {
                "question_number": 1,
                "feedback": "Your definition identified the minimum energy but missed the context of reacting particles.\\n\\n**Correct Answer:** Activation energy (\\\\( E_a \\\\)) is the minimum energy that colliding particles must possess in order to react.",
                "mark": "Partially Correct"
            }
        `;
         console.log("Constructed marking prompt for Gemini.");

    } else if (requestPayload && typeof requestPayload.prompt === 'string') {
        // Handle quiz generation { prompt: "..." }
        promptText = requestPayload.prompt;
        console.log("Using prompt for quiz generation.");
    }
    // Add more robust checks if other payload structures are possible

    if (!promptText) {
      console.error("Could not determine prompt text from payload:", JSON.stringify(requestPayload));
      return new Response(JSON.stringify({ error: 'Invalid or missing prompt data in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Prepare the request body for the *actual* Gemini API
    const geminiRequestBody = {
      contents: [{ parts: [{ text: promptText }] }],
      safetySettings: [
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
      ],
      generationConfig: {
        temperature: 0.6,
        // Request JSON directly from Gemini
        responseMimeType: "application/json",
      }
    };

    // 3. Call the Gemini API
    console.log(`Calling Gemini API for ${isMarkingRequest ? 'marking' : 'generation'}...`);
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiRequestBody),
    });
    console.log("Gemini API response status:", geminiResponse.status);

    // 4. Handle Gemini API Response Status
    if (!geminiResponse.ok) {
      let errorBodyText = await geminiResponse.text();
      console.error(`Gemini API Error (${geminiResponse.status}):`, errorBodyText);
      let errorDetails = errorBodyText;
      try { errorDetails = JSON.parse(errorBodyText); } catch(e) { /* Ignore parsing error */ }
      return new Response(JSON.stringify({
          error: `Gemini API Error: ${geminiResponse.status}`, details: errorDetails
      }), { status: geminiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5. Process the SUCCESSFUL Gemini Response
    let geminiData;
    let finalResultJson;

    try {
        geminiData = await geminiResponse.json(); // Get the full JSON object from Gemini
        console.log("Raw Gemini Response Object:", JSON.stringify(geminiData, null, 2)); // Log the entire response

        // Extract the actual content part containing the text/JSON
        const contentPart = geminiData?.candidates?.[0]?.content?.parts?.[0];

        if (!contentPart) {
             console.error("Unexpected Gemini response structure: Missing contentPart.");
             throw new Error("AI response structure missing expected content part.");
        }

        // Check if Gemini directly provided the parsed JSON object/array in the part
        // (This might happen if responseMimeType application/json works perfectly)
        if (typeof contentPart === 'object' && contentPart !== null && !contentPart.text) {
             console.log("Using contentPart directly as JSON result.");
             finalResultJson = contentPart; // Assume the part itself is the JSON
        }
        // Otherwise, expect the JSON string within the 'text' field
        else if (contentPart.text && typeof contentPart.text === 'string') {
            console.log("Raw contentPart.text from Gemini:", contentPart.text); // Log the raw text
            try {
                // Attempt to parse the text content as JSON
                finalResultJson = JSON.parse(contentPart.text);
                console.log("Result after JSON.parse:", JSON.stringify(finalResultJson, null, 2));
            } catch (parseError) {
                 console.error("Failed JSON.parse on contentPart.text:", parseError);
                 // If parsing fails, maybe Gemini wrapped it? Try regex extraction as fallback
                 const jsonMatch = contentPart.text.match(/```json\s*([\s\S]*?)\s*```/m) || contentPart.text.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})\s*$/m); // Match array/object possibly at end
                 if (jsonMatch && jsonMatch[1]) { // Code block content
                      console.log("Attempting regex extraction from code block...");
                      finalResultJson = JSON.parse(jsonMatch[1]);
                 } else if (jsonMatch && jsonMatch[0]) { // Simple structure match
                      console.log("Attempting regex extraction of simple structure...");
                      finalResultJson = JSON.parse(jsonMatch[0]);
                 } else {
                     throw new Error("Failed to parse contentPart.text as JSON and no fallback match found."); // Re-throw if parsing and regex fail
                 }
            }
        } else {
            console.error("Missing or invalid 'text' field in contentPart:", contentPart);
            throw new Error("AI response content part missing or has invalid 'text' field.");
        }

        // **VALIDATE the final structure** (expecting an array for BOTH quiz/feedback)
        if (!Array.isArray(finalResultJson)) {
             console.error("Processed final result is NOT an array:", JSON.stringify(finalResultJson));
             throw new Error("AI processing resulted in an unexpected format (expected array)."); // The error you saw
        }

        // Additional check for marking response structure (optional but good)
        if (isMarkingRequest && !finalResultJson.every(f => typeof f.question_number === 'number' && typeof f.feedback === 'string' && typeof f.mark === 'string')) {
             console.error("Marking response array has incorrect object structure:", JSON.stringify(finalResultJson));
             throw new Error("AI marking response array items have missing/invalid fields.");
        }
        // Additional check for generation response structure (optional but good)
         else if (!isMarkingRequest && !finalResultJson.every(q => typeof q.question === 'string' && typeof q.answer_guideline === 'string')) {
              console.error("Generation response array has incorrect object structure:", JSON.stringify(finalResultJson));
              throw new Error("AI generation response array items have missing/invalid fields.");
         }


    } catch (e) {
        // Catch errors during .json() parsing, JSON.parse(), or validation
        console.error('Error processing Gemini response:', e);
        return new Response(JSON.stringify({ error: `Failed to process AI response: ${e.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    // 6. Send the successfully extracted and parsed JSON array back to the frontend
    console.log(`Successfully processed ${isMarkingRequest ? 'marking' : 'generation'} response. Sending back JSON array.`);
    return new Response(JSON.stringify(finalResultJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Catch errors like invalid request JSON from frontend, network errors before calling Gemini, etc.
    console.error('Critical error in Edge Function request handling:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})