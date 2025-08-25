import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateDriverRequest {
  name: string;
  phone: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  current_status: 'offline' | 'available' | 'busy' | 'on_break';
  adminSecret: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, phone, email, password_hash, is_active, current_status, adminSecret }: CreateDriverRequest = await req.json()

    // Verify admin secret
    if (adminSecret !== 'Glaconsmarrakech2025.') {
      return new Response(
        JSON.stringify({ success: false, error: 'Accès non autorisé' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        },
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert new driver
    const { data, error } = await supabase
      .from('delivery_drivers')
      .insert([{
        name,
        phone,
        email,
        password_hash,
        is_active,
        current_status
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating driver:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in create-driver function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})