// js/common.js

// Supabase Configuration (Replace with your actual project details)
const SUPABASE_URL = 'https://obmssdwhrvfiqlwykujv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibXNzZHdocnZmaXFsd3lrdWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDEyNTAsImV4cCI6MjA1OTc3NzI1MH0.RptP25yB4kq4yzJl1wXkZkl70WyoQHMoZtqY4qs-IgQ';
const SUPABASE_EDGE_FUNCTION_URL = 'https://obmssdwhrvfiqlwykujv.supabase.co/functions/v1/gemini-proxy'; // URL for your gemini-proxy function

// Constants
const AVOGADRO_CONSTANT = 6.02e23;
const MOLAR_GAS_VOLUME_RTP = 24; // dm³/mol
const relativeAtomicMasses = { H: 1.0, He: 4.0, Li: 6.9, Be: 9.0, B: 10.8, C: 12.0, N: 14.0, O: 16.0, F: 19.0, Ne: 20.2, Na: 23.0, Mg: 24.3, Al: 27.0, Si: 28.1, P: 31.0, S: 32.1, Cl: 35.5, Ar: 39.9, K: 39.1, Ca: 40.1, Sc: 45.0, Ti: 47.9, V: 50.9, Cr: 52.0, Mn: 54.9, Fe: 55.8, Co: 58.9, Ni: 58.7, Cu: 63.5, Zn: 65.4, Ga: 69.7, Ge: 72.6, As: 74.9, Se: 79.0, Br: 79.9, Kr: 83.8, Rb: 85.5, Sr: 87.6, Y: 88.9, Zr: 91.2, Nb: 92.9, Mo: 95.9, Ag: 107.9, Cd: 112.4, In: 114.8, Sn: 118.7, Sb: 121.8, Te: 127.6, I: 126.9, Xe: 131.3, Cs: 132.9, Ba: 137.3, La: 138.9, Hf: 178.5, Ta: 180.9, W: 183.8, Re: 186.2, Os: 190.2, Ir: 192.2, Pt: 195.1, Au: 197.0, Hg: 200.6, Tl: 204.4, Pb: 207.2, Bi: 209.0 };

// Initialize Supabase Client (Globally accessible)
let supabase = null;
try {
    // Check if Supabase is available globally (e.g., via CDN) and keys are set
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function' && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized.");
    } else if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.warn("Supabase URL/Key not set in common.js - Auth features will not work.");
    } else if (typeof supabase === 'undefined'){
        console.error("Supabase JS library not loaded. Ensure it's included in your HTML.");
    }
} catch (error) {
    console.error("Error initializing Supabase:", error);
    supabase = null; // Ensure it's null if init fails
}


// --- Utility Functions ---

function getElementByIdValue(id, type = 'string') {
    const element = document.getElementById(id);
    if (!element) return null;
    const value = element.value.trim();
    if (type === 'number') {
        // Return null if empty or not a number, otherwise return the parsed float
        return value === '' || isNaN(parseFloat(value)) ? null : parseFloat(value);
    }
    return value;
}

function formatFormulaForMathJax(formula) {
    // Simple formatter: Add _{ } around numbers following letters/parentheses
    // and ^{ } around charges like 2+ or -
    let formatted = formula.replace(/([a-zA-Z\)])(\d+)/g, '$1_{$2}'); // Subscripts
    formatted = formatted.replace(/(\d+)([+\-])/g, '^{$1$2}'); // Charges like 2+, 3+
    formatted = formatted.replace(/([a-zA-Z])([+\-])(?![a-zA-Z])/g, '$1^{$2}'); // Charges like +, - (ensure not followed by letter)
    // Handle polyatomic ions better if needed (more complex regex might be required)
    return formatted;
}

function clearOutput(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
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
        // Re-render MathJax for the updated element
        if (typeof MathJax !== 'undefined' && typeof MathJax.typesetPromise === 'function') {
            MathJax.typesetPromise([element]).catch(err => console.error('MathJax typesetting error:', err));
        }
    }
}

function setComplexOutput(id, contentArray) { // Used in Chapter 4
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = ''; // Clear previous content
        contentArray.forEach(item => {
            const p = document.createElement('p');
            let textClass = 'info'; // Default
            if (item.type === 'error') textClass = 'error';
            else if (item.type === 'success') textClass = 'success';
            else if (item.type === 'warning') textClass = 'warning';

            // Ensure MathJax is rendered correctly within the dynamically added content
             p.innerHTML = `<strong>${item.title}:</strong> <span class="${textClass}"></span>`; // Set structure first
             p.querySelector('span').innerHTML = item.text; // Insert potentially MathJax content

            element.appendChild(p);
        });
        // Render MathJax for the entire output container after adding all paragraphs
        if (typeof MathJax !== 'undefined' && typeof MathJax.typesetPromise === 'function') {
            MathJax.typesetPromise([element]).catch(err => console.error('MathJax typesetting error:', err));
        }
    }
}

// --- MODIFIED Gemini API Call via Supabase Edge Function ---
async function callGeminiAPI(promptText) {
    if (!SUPABASE_EDGE_FUNCTION_URL || SUPABASE_EDGE_FUNCTION_URL === 'YOUR_SUPABASE_FUNCTION_INVOKE_URL') {
        console.error("Supabase Edge Function URL is not configured in js/common.js");
        throw new Error("Backend function URL not set. Please configure common.js.");
    }

    // Data to send TO YOUR EDGE FUNCTION
    const requestBodyToEdgeFunction = {
        prompt: promptText // The edge function expects an object with a 'prompt' key
    };

    try {
        console.log(`Calling Supabase Edge Function at: ${SUPABASE_EDGE_FUNCTION_URL}`);
        const response = await fetch(SUPABASE_EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                // Supabase anon key is often needed for function invocation, even without RLS,
                // depending on project settings. Include it for safety.
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${supabase?.auth?.session()?.access_token}` // Add this later IF auth is needed & supabase client is initialized
            },
            body: JSON.stringify(requestBodyToEdgeFunction),
        });

        console.log("Edge function response status:", response.status);

        if (!response.ok) {
            let errorBody = { error: `Edge Function Error: ${response.status} ${response.statusText}` }; // Default error
            try {
                // Try to parse the error response from the edge function
                const parsedError = await response.json();
                errorBody = parsedError; // Use the more detailed error if available
                 console.error('Edge Function Error Response Body:', errorBody);
            } catch (e) {
                console.error("Could not parse error response body from edge function.");
            }
             // Add specific handling for missing API key error potentially returned from edge function
             if (JSON.stringify(errorBody).includes("API key missing")) {
                 throw new Error("API Key is not configured correctly on the server. Please check Supabase secrets for the Edge Function.");
             }
            throw new Error(errorBody.error || `Edge Function Error: ${response.status} ${response.statusText}`);
        }

        // The Edge function should return the *parsed* JSON from Gemini
        const data = await response.json();

         // Check if the edge function itself forwarded an error object structure
         if (data.error) {
              console.error("Supabase Edge Function returned an error object:", data.error);
              if (data.rawResponse) console.error("Raw response from Gemini (via Edge Function):", data.rawResponse);
              throw new Error(data.error); // Throw the specific error message from the function
         }

        // Assuming the edge function successfully parsed Gemini's response and returned it
        console.log("Received data from Edge Function:", data);
        return data; // Should be the parsed JSON array/object

    } catch (error) {
        console.error('Error in callGeminiAPI function:', error);
        // Provide more specific user feedback based on error type
        if (error.message.includes("Failed to fetch") || error instanceof TypeError) {
             // Network error or URL issue
             throw new Error("Network error: Could not reach the backend function. Check the Function URL in common.js and your internet connection.");
         } else if (error.message.includes("JSON")) {
            // Catch potential JSON parsing errors if the edge function failed to send valid JSON
            throw new Error("Received an invalid response format from the backend function.");
        }
        // Re-throw other errors (like the API key missing error or specific errors from the edge func)
        throw error;
    }
}


// --- Math Helper Functions ---

function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    if (b === 0) return a;
    return gcd(b, a % b);
}

function getLowestCommonMultiple(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    if (a === 0 || b === 0) return 0;
    const commonDivisor = gcd(a, b);
    return commonDivisor === 0 ? 0 : Math.abs(a * b) / commonDivisor;
}

// --- Mr Calculation Helper ---

function calculateMrFromString(formula) {
    let totalMr = 0;
    let i = 0;
    const len = formula.length;

    function getAr(symbol) {
        const mass = relativeAtomicMasses[symbol];
        if (mass === undefined) throw new Error(`Unknown element symbol: ${symbol}`);
        return mass;
    }

    while (i < len) {
        let element = '';
        let numStr = '';
        let multiplier = 1;

        if (formula[i] === '(') { // Handle parentheses
            let parenCount = 1;
            let j = i + 1;
            // Find the matching closing parenthesis
            while (j < len && parenCount > 0) {
                if (formula[j] === '(') parenCount++;
                if (formula[j] === ')') parenCount--;
                j++;
            }
            if (parenCount !== 0) throw new Error("Mismatched parentheses in formula.");

            const segment = formula.substring(i + 1, j - 1); // Extract content inside parentheses
            const segmentMr = calculateMrFromString(segment); // Recursively calculate Mr of segment

            // Find multiplier after parenthesis
            let k = j;
            numStr = '';
            while (k < len && formula[k] >= '0' && formula[k] <= '9') {
                numStr += formula[k];
                k++;
            }
            multiplier = numStr === '' ? 1 : parseInt(numStr);
            if (isNaN(multiplier)) throw new Error("Invalid multiplier found after parentheses.");

            totalMr += segmentMr * multiplier;
            i = k; // Move index past the multiplier

        } else if (formula[i] >= 'A' && formula[i] <= 'Z') { // Handle element symbol
            element = formula[i];
            i++;
            // Check for second lowercase letter in symbol
            if (i < len && formula[i] >= 'a' && formula[i] <= 'z') {
                element += formula[i];
                i++;
            }

            // Find number multiplier after element
            numStr = '';
            while (i < len && formula[i] >= '0' && formula[i] <= '9') {
                numStr += formula[i];
                i++;
            }
            multiplier = numStr === '' ? 1 : parseInt(numStr);
            if (isNaN(multiplier)) throw new Error(`Invalid number count after element ${element}.`);

            totalMr += getAr(element) * multiplier; // Add to total Mr

        } else if (/\s/.test(formula[i])) { // Ignore whitespace
            i++;
        } else { // Handle invalid characters
            throw new Error(`Invalid character '${formula[i]}' encountered in formula at index ${i}.`);
        }
    }
    return totalMr;
}

// --- Authentication Functions (Placeholder for future use) ---

async function signUpUser(email, password) {
    if (!supabase) return { error: { message: "Supabase not initialized." } };
    console.warn("Sign up function called but full implementation depends on UI integration.");
    // Actual implementation would look like:
    // const { data, error } = await supabase.auth.signUp({ email, password });
    // return { data, error };
     return { error: { message: "Signup not fully implemented yet."}};
}

async function signInUser(email, password) {
    if (!supabase) return { error: { message: "Supabase not initialized." } };
     console.warn("Sign in function called but full implementation depends on UI integration.");
    // Actual implementation would look like:
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // return { data, error };
    return { error: { message: "Signin not fully implemented yet."}};
}

async function signOutUser() {
    if (!supabase) return { error: { message: "Supabase not initialized." } };
     console.warn("Sign out function called but full implementation depends on UI integration.");
    // Actual implementation would look like:
    // const { error } = await supabase.auth.signOut();
    // return { error };
    return { error: { message: "Signout not fully implemented yet."}};
}

async function getCurrentSession() {
    if (!supabase) { console.warn("Cannot get session: Supabase not initialized."); return null; }
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        console.log("Current session:", data.session);
        return data.session; // Returns null if no session
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}

function onAuthStateChange(callback) {
    if (!supabase) { console.warn("Cannot listen for auth changes: Supabase not initialized."); return; }
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth State Change:', event, session);
        if(callback && typeof callback === 'function') {
            callback(event, session); // Pass event and session to the provided UI update function
        }
    });
}

// Example of listening to auth changes on load (you would define handleAuthChange elsewhere)
// document.addEventListener('DOMContentLoaded', () => {
//   onAuthStateChange(handleAuthChange); // handleAuthChange would update UI based on session
// });