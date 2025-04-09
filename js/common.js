// js/common.js

// URL for your Supabase Edge Function (deployed in previous steps)
const SUPABASE_EDGE_FUNCTION_URL = 'https://obmssdwhrvfiqlwykujv.supabase.co/functions/v1/gemini-proxy'; // PASTE THE URL FROM STEP 3.6 HERE

// Constants used in various chapters
const AVOGADRO_CONSTANT = 6.02e23;
const MOLAR_GAS_VOLUME_RTP = 24; // dm³/mol
const relativeAtomicMasses = { H: 1.0, He: 4.0, Li: 6.9, Be: 9.0, B: 10.8, C: 12.0, N: 14.0, O: 16.0, F: 19.0, Ne: 20.2, Na: 23.0, Mg: 24.3, Al: 27.0, Si: 28.1, P: 31.0, S: 32.1, Cl: 35.5, Ar: 39.9, K: 39.1, Ca: 40.1, Sc: 45.0, Ti: 47.9, V: 50.9, Cr: 52.0, Mn: 54.9, Fe: 55.8, Co: 58.9, Ni: 58.7, Cu: 63.5, Zn: 65.4, Ga: 69.7, Ge: 72.6, As: 74.9, Se: 79.0, Br: 79.9, Kr: 83.8, Rb: 85.5, Sr: 87.6, Y: 88.9, Zr: 91.2, Nb: 92.9, Mo: 95.9, Ag: 107.9, Cd: 112.4, In: 114.8, Sn: 118.7, Sb: 121.8, Te: 127.6, I: 126.9, Xe: 131.3, Cs: 132.9, Ba: 137.3, La: 138.9, Hf: 178.5, Ta: 180.9, W: 183.8, Re: 186.2, Os: 190.2, Ir: 192.2, Pt: 195.1, Au: 197.0, Hg: 200.6, Tl: 204.4, Pb: 207.2, Bi: 209.0 };

// --- Utility Functions ---

function getElementByIdValue(id, type = 'string') {
    const element = document.getElementById(id);
    if (!element) return null;
    const value = element.value.trim();
    if (type === 'number') {
        return value === '' || isNaN(parseFloat(value)) ? null : parseFloat(value);
    }
    return value;
}

function formatFormulaForMathJax(formula) {
     // Simple formatter: Add _{ } around numbers following letters/parentheses
     // and ^{ } around charges like 2+ or -
     formula = formula.replace(/([a-zA-Z\)])(\d+)/g, '$1_{$2}'); // Subscripts
     formula = formula.replace(/(\d+)([+\-])/g, '^{$1$2}'); // Charges like 2+, 3+
     formula = formula.replace(/([a-zA-Z])([+\-])/g, '$1^{$2}'); // Charges like +, -
     // Handle polyatomic ions better if needed (more complex regex might be required)
     return formula;
}

function clearOutput(id) {
    const el = document.getElementById(id); if (el) el.innerHTML = '';
}

function setOutput(id, message, type = 'info') {
    const element = document.getElementById(id);
    if (element) {
        let finalClass = type;
        // Specific color logic for Delta H output
        if (id === 'deltaHOutput' && message.includes('\\( \\Delta H =')) {
            const deltaHMatch = message.match(/=\s*([+-]?[\d.]+)\s*kJ\/mol/);
            if (deltaHMatch) {
                const deltaHValue = parseFloat(deltaHMatch[1]);
                if (deltaHValue < 0) finalClass = 'error'; // Exo = Red
                else if (deltaHValue > 0) finalClass = 'info'; // Endo = Blue (Primary)
                else finalClass = 'success'; // Neutral = Green
            }
        }

        element.innerHTML = `<span class="${finalClass}">${message}</span>`;
        // Check if MathJax is available and ready before trying to typeset
        if (typeof MathJax !== 'undefined' && MathJax.startup?.promise) {
             MathJax.startup.promise.then(() => {
                 MathJax.typesetPromise([element]).catch(err => console.error('MathJax typesetting error:', err));
             });
        } else if (typeof MathJax !== 'undefined' && typeof MathJax.typesetPromise === 'function') {
             // Fallback for older MathJax or different loading scenario
             MathJax.typesetPromise([element]).catch(err => console.error('MathJax typesetting error:', err));
        }
    }
}


function setComplexOutput(id, contentArray) { // Used in Chapter 4
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = '';
        contentArray.forEach(item => {
            const p = document.createElement('p');
            let textClass = 'info'; // Default
            if (item.type === 'error') textClass = 'error';
            else if (item.type === 'success') textClass = 'success';
            else if (item.type === 'warning') textClass = 'warning';

            p.innerHTML = `<strong>${item.title}:</strong> <span class="${textClass}">${item.text}</span>`;
            element.appendChild(p);
        });
         // Check if MathJax is available and ready before trying to typeset
         if (typeof MathJax !== 'undefined' && MathJax.startup?.promise) {
              MathJax.startup.promise.then(() => {
                  MathJax.typesetPromise([element]).catch(err => console.error('MathJax typesetting error:', err));
              });
         } else if (typeof MathJax !== 'undefined' && typeof MathJax.typesetPromise === 'function') {
              MathJax.typesetPromise([element]).catch(err => console.error('MathJax typesetting error:', err));
         }
    }
}


// --- MODIFIED Gemini API Call (targets Supabase Edge Function) ---
async function callGeminiAPI(promptOrData) { // Accepts either a prompt string or the marking data object
    if (!SUPABASE_EDGE_FUNCTION_URL || SUPABASE_EDGE_FUNCTION_URL === 'YOUR_SUPABASE_FUNCTION_INVOKE_URL') {
        throw new Error("Supabase Edge Function URL not set correctly in js/common.js");
    }

    // Data to send TO YOUR EDGE FUNCTION
    // The Edge function expects either { prompt: "..." } or { action: "mark_quiz", payload: ... }
    let requestBodyToEdgeFunction;
    if (typeof promptOrData === 'string') {
        requestBodyToEdgeFunction = { prompt: promptOrData }; // For quiz generation
    } else if (typeof promptOrData === 'object' && promptOrData !== null) {
        // Assume it's the marking data structure passed from quiz.js
        // The Edge Function needs to know how to interpret this structure
        requestBodyToEdgeFunction = promptOrData; // Send the object directly
    } else {
         throw new Error("Invalid data type passed to callGeminiAPI. Expected string or object.");
    }


    console.log(`Calling Supabase Edge Function at: ${SUPABASE_EDGE_FUNCTION_URL}`); // Log the URL being called

    try {
        const response = await fetch(SUPABASE_EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // If you add authentication later, you'll need to add:
                // 'Authorization': `Bearer ${supabaseClient?.auth?.session()?.access_token || ''}`,
                // Optionally include anon key if Row Level Security needs it (unlikely for basic function call)
                // 'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify(requestBodyToEdgeFunction),
        });

        console.log("Edge function response status:", response.status); // Log the HTTP status

        // Try to get the response body regardless of status for better debugging
        let responseBodyText = await response.text();
        let responseData = null;

        // Try parsing the response text as JSON
        try {
            responseData = JSON.parse(responseBodyText);
        } catch (e) {
            // If parsing fails, keep responseData null, but log the raw text
            console.error("Failed to parse edge function response as JSON. Raw text:", responseBodyText);
            // If the status was actually okay, but parsing failed, this indicates a backend issue
            if (response.ok) {
                 throw new Error("Backend function returned non-JSON response despite OK status.");
            }
        }

        if (!response.ok) {
            console.error('Edge Function Error Response:', responseData || responseBodyText); // Show parsed or raw error
            const detailMessage = responseData?.error || responseData?.message || responseBodyText || 'Unknown error from edge function.';
            // Add specific handling for missing API key error from edge function
            if (typeof detailMessage === 'string' && detailMessage.includes("API key missing")) {
                throw new Error("API Key is not configured correctly on the server. Please check Supabase secrets.");
            }
            throw new Error(`Edge Function Error: ${response.status} ${response.statusText}. ${detailMessage}`);
        }

        // If response.ok and parsing succeeded (responseData is not null)
         if (responseData) {
              console.log("Received data from Edge Function:", responseData); // Log successful data
              // Check if the edge function specifically returned an error structure even with 200 OK
              if (responseData.error) {
                  console.error("Edge function returned an error structure with 200 OK:", responseData.error);
                   if (responseData.rawResponse) console.error("Raw response from Gemini (reported by Edge Function):", responseData.rawResponse);
                   throw new Error(responseData.error);
              }
              return responseData; // Should be the parsed JSON array/object
         } else {
             // This case should ideally not be reached if response.ok is true
             // but handles the scenario where parsing failed despite 200 OK
             throw new Error("Received OK status from Edge Function but failed to parse the response body.");
         }


    } catch (error) {
        console.error('Error calling Supabase Edge Function:', error);
        // Provide more specific user feedback
         if (error.message.includes("Failed to fetch")) {
            throw new Error("Network error: Could not reach the backend function. Check your internet connection and the function URL.");
        } else if (error.message.includes("JSON.parse")) {
             throw new Error("Error processing response from backend. Invalid format received.");
        }
        // Re-throw other errors or wrap them
        throw new Error(`Frontend Error: ${error.message}`);
    }
}


// --- Math Helper Functions ---
function gcd(a, b) {
    a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); if (b === 0) return a; return gcd(b, a % b);
}
function getLowestCommonMultiple(a, b) {
    a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); if (a === 0 || b === 0) return 0; const commonDivisor = gcd(a,b); return commonDivisor === 0 ? 0 : Math.abs(a*b)/commonDivisor;
}

// Helper for Mr Calculation
function calculateMrFromString(formula) {
    let totalMr = 0; let i = 0;
    const len = formula.length;

    function getAr(symbol) {
        const mass = relativeAtomicMasses[symbol];
        if (mass === undefined) throw new Error(`Unknown element: ${symbol}`);
        return mass;
    }

    while (i < len) {
        let element = ''; let numStr = ''; let multiplier = 1;

        if (formula[i] === '(') {
            let parenCount = 1;
            let j = i + 1;
            while (j < len && parenCount > 0) {
                if (formula[j] === '(') parenCount++;
                if (formula[j] === ')') parenCount--;
                j++;
            }
            if (parenCount !== 0) throw new Error("Mismatched parentheses.");
            const segment = formula.substring(i + 1, j - 1);
            const segmentMr = calculateMrFromString(segment);

            let k = j; numStr = '';
            while (k < len && formula[k] >= '0' && formula[k] <= '9') {
                numStr += formula[k]; k++;
            }
            multiplier = numStr === '' ? 1 : parseInt(numStr);
            if (isNaN(multiplier)) throw new Error("Invalid multiplier after parentheses.");

            totalMr += segmentMr * multiplier;
            i = k;

        } else if (formula[i] >= 'A' && formula[i] <= 'Z') {
            element = formula[i];
            i++;
            if (i < len && formula[i] >= 'a' && formula[i] <= 'z') {
                element += formula[i]; i++;
            }

            numStr = '';
            while (i < len && formula[i] >= '0' && formula[i] <= '9') {
                numStr += formula[i]; i++;
            }
            multiplier = numStr === '' ? 1 : parseInt(numStr);
            if (isNaN(multiplier)) throw new Error(`Invalid number after element ${element}.`);

            totalMr += getAr(element) * multiplier;

        } else if (/\s/.test(formula[i])) { // Allow spaces in formula string
            i++;
        } else {
            throw new Error(`Invalid character '${formula[i]}' at index ${i} in formula.`);
        }
    }
    // Return Mr rounded to 1 decimal place, typical for IGCSE
    return parseFloat(totalMr.toFixed(1));
 }


// --- CORRECTED Supabase Client Initialization ---
// Replace with your actual Supabase Project URL and Anon Key
const SUPABASE_URL = 'https://obmssdwhrvfiqlwykujv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibXNzZHdocnZmaXFsd3lrdWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDEyNTAsImV4cCI6MjA1OTc3NzI1MH0.RptP25yB4kq4yzJl1wXkZkl70WyoQHMoZtqY4qs-IgQ';

// Declare supabaseClient variable in a scope accessible by other functions if needed
let supabaseClient = null;

try {
    // Check if the Supabase library object exists (usually loaded via CDN script)
    // The global object is typically named 'supabase' by their CDN script.
    // Ensure URL and Key are actually replaced before trying to init
    if (typeof supabase !== 'undefined' && supabase.createClient &&
        SUPABASE_URL && SUPABASE_ANON_KEY &&
        SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY')
    {
        // Assign the created client instance to supabaseClient
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized successfully.");
    } else if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL' || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
         console.warn("Supabase URL/Key placeholders not replaced in common.js - Authentication features require these actual values.");
    } else if (typeof supabase === 'undefined' || !supabase.createClient) {
         console.error("Supabase library (supabase-js) not loaded correctly. Check the <script> tag in your HTML.");
    }
} catch(error) {
    console.error("Error initializing Supabase client:", error);
    supabaseClient = null; // Ensure it's null on error
}

// --- Authentication Functions Placeholder (Use supabaseClient) ---
async function signUpUser(email, password) {
    if (!supabaseClient) {
        console.error("Supabase client not available for signup.");
        return { error: { message: "Supabase client not initialized." } };
    }
    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        console.log("Signup successful (check email verification if enabled)", data);
        return { data, error: null };
    } catch (error) {
        console.error("Sign up error:", error);
        return { data: null, error };
    }
}

async function signInUser(email, password) {
    if (!supabaseClient) {
        console.error("Supabase client not available for signin.");
        return { error: { message: "Supabase client not initialized." } };
    }
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log("Sign in successful", data);
        return { data, error: null };
    } catch (error) {
        console.error("Sign in error:", error);
        return { data: null, error };
    }
}

async function signOutUser() {
    if (!supabaseClient) {
        console.error("Supabase client not available for signout.");
        return { error: { message: "Supabase client not initialized." } };
     }
     try {
         const { error } = await supabaseClient.auth.signOut();
         if (error) throw error;
         console.log("Sign out successful");
         return { error: null };
     } catch (error) {
         console.error("Sign out error:", error);
         return { error };
     }
}

async function getCurrentSession() {
    if (!supabaseClient){
        console.error("Supabase client not available for getSession.");
        return null;
    }
     try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return data.session; // Returns null if no session
     } catch (error) {
         console.error("Error getting session:", error);
         return null;
     }
}

function onAuthStateChange(callback) {
     if (!supabaseClient) {
         console.error("Supabase client not available for onAuthStateChange.");
         return { data: { subscription: null } }; // Return object similar to Supabase structure
     }
     // Returns a subscription object with an unsubscribe method
     const { data: subscription } = supabaseClient.auth.onAuthStateChange((event, session) => {
         console.log('Auth State Change Event:', event, session);
         if (callback && typeof callback === 'function') {
             callback(event, session); // Pass event and session to your UI update function
         }
     });
     return subscription; // Return the subscription object so it can be unsubscribed later if needed
 }

// Example of how to export if using modules (not strictly needed if just using script tags)
// export { getElementByIdValue, formatFormulaForMathJax, callGeminiAPI, ... };