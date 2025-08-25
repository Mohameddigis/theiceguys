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

Deno.serve(async (req) => {
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration serveur manquante' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Create user in Supabase Auth
    console.log('Creating user in Supabase Auth...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password_hash,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        phone,
        role: 'driver'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ success: false, error: `Erreur création utilisateur: ${authError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    console.log('Auth user created:', authUser.user?.id)

    // 2. Insert new driver in delivery_drivers table
    console.log('Creating driver record...')
    const { data, error } = await supabase
      .from('delivery_drivers')
      .insert([{
        id: authUser.user!.id, // Use the same ID as the auth user
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
      
      // If driver creation fails, delete the auth user to maintain consistency
      await supabase.auth.admin.deleteUser(authUser.user!.id)
      
      return new Response(
        JSON.stringify({ success: false, error: `Erreur création livreur: ${error.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    console.log('Driver created successfully:', data.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          ...data,
          auth_user_id: authUser.user!.id
        },
        message: 'Livreur et utilisateur créés avec succès'
      }),
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