import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DeleteDriverRequest {
  driverId: string;
  adminSecret: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { driverId, adminSecret }: DeleteDriverRequest = await req.json()

    console.log('🗑️ Suppression livreur demandée:', { driverId, hasAdminSecret: !!adminSecret })

    // Verify admin secret
    if (adminSecret !== 'TheIceGuys2025.') {
      console.log('❌ Secret admin incorrect')
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
      console.error('❌ Variables d\'environnement manquantes')
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

    // 1. Check if driver has active orders
    console.log('🔍 Vérification des commandes actives...')
    const { data: activeOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('assigned_driver_id', driverId)
      .in('status', ['confirmed', 'delivering'])

    if (ordersError) {
      console.error('❌ Erreur vérification commandes:', ordersError)
      return new Response(
        JSON.stringify({ success: false, error: `Erreur vérification commandes: ${ordersError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    if (activeOrders && activeOrders.length > 0) {
      console.log('⚠️ Livreur a des commandes actives:', activeOrders.length)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Impossible de supprimer ce livreur car il a ${activeOrders.length} commande(s) en cours` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // 2. Delete driver from delivery_drivers table
    console.log('🗑️ Suppression du profil livreur...')
    const { error: driverError } = await supabase
      .from('delivery_drivers')
      .delete()
      .eq('id', driverId)

    if (driverError) {
      console.error('❌ Erreur suppression livreur:', driverError)
      return new Response(
        JSON.stringify({ success: false, error: `Erreur suppression livreur: ${driverError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // 3. Delete user from auth.users table
    console.log('👤 Suppression utilisateur Auth...')
    const { error: authError } = await supabase.auth.admin.deleteUser(driverId)

    if (authError) {
      console.error('❌ Erreur suppression Auth:', authError)
      return new Response(
        JSON.stringify({ success: false, error: `Erreur suppression utilisateur: ${authError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('✅ Livreur supprimé avec succès')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Livreur supprimé avec succès'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Erreur générale dans delete-driver:', error)
    return new Response(
      JSON.stringify({ success: false, error: `Erreur serveur: ${error.message}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})