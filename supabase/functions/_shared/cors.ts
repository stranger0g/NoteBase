// supabase/functions/_shared/cors.ts
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Or replace '*' with your specific Cloudflare Pages URL for better security
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }