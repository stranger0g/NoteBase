// supabase/functions/gemini-proxy/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts' // We'll create this helper

// Ensure you have your Gemini API Key set as an environment variable in Supabase
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

serve(async (req: Request) => {
  // Handle CORS preflight requests (essential for browser calls)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Check if API key is set (important!)
  if (!GEMINI_API_KEY) {
    console.error("Gemini API Key environment variable not set.");
    return new Response(JSON.stringify({ error: 'Server configuration error: API key missing' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    // 1. Get the prompt data sent from the frontend
    const requestBody = await req.json();
    const promptText = requestBody?.prompt; // Assuming frontend sends { prompt: "..." }

    if (!promptText) {
      return new Response(JSON.stringify({ error: 'Missing prompt in request body' }), {
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
        // IMPORTANT: Request text from Gemini, parsing happens in backend/frontend
        responseMimeType: "text/plain",
      }
    };

    // 3. Call the Gemini API (using the key from env var)
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiRequestBody),
    });

    // 4. Handle Gemini API Response
    if (!geminiResponse.ok) {
      let errorBody;
      try { errorBody = await geminiResponse.json(); } catch (e) { errorBody = await geminiResponse.text(); }
      console.error('Gemini API Error Response:', errorBody);
      // Forward a generic error or specific details if safe
      return new Response(JSON.stringify({ error: `Gemini API Error: ${geminiResponse.status}`, details: errorBody }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: geminiResponse.status, // Forward the status
      });
    }

    // 5. Get the text content from Gemini's response
    const geminiDataText = await geminiResponse.text();

    // --- Attempt to parse the JSON from the text response ---
    let responseData;
    try {
        // Try direct parsing first
        responseData = JSON.parse(geminiDataText);
    } catch (parseError) {
        console.warn("Direct JSON parsing failed, attempting extraction:", parseError);
        // Attempt to extract JSON manually if direct parsing fails
        // Look for ```json ... ``` block or simple {...} or [...] structure
        const jsonMatch = geminiDataText.match(/```json\s*([\s\S]*?)\s*```/m) || geminiDataText.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})/m);
        if (jsonMatch && jsonMatch[1]) { // Code block content
             try { responseData = JSON.parse(jsonMatch[1]); } catch (e) { /* Failed again */ }
        } else if (jsonMatch && jsonMatch[0]) { // Simple structure match
             try { responseData = JSON.parse(jsonMatch[0]); } catch (e) { /* Failed again */ }
        }

         // If parsing still failed, return the raw text with an error indicator
         if (!responseData) {
            console.error("Failed to parse or extract valid JSON from Gemini response:", geminiDataText);
            return new Response(JSON.stringify({ error: 'Failed to parse AI response as JSON', rawResponse: geminiDataText }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500, // Internal Server Error type situation
            });
        }
    }
    // --- End JSON Parsing ---

    // 6. Send the successfully parsed JSON back to the frontend
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})