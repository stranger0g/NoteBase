// supabase/functions/_shared/cors.ts

// !! REPLACE with your actual GitHub Pages URL !!
const ALLOWED_ORIGIN = 'https://stranger0g.github.io'; // Or your custom domain

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  // Consider adding Allow-Methods explicitly if needed
  // 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}