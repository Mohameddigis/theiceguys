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
  password: string;
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
    const { name, phone, email, password, is_active, current_status, adminSecret }: CreateDriverRequest = await req.json()

    console.log('🔧 Données reçues:', { name, phone, email, is_active, current_status, hasAdminSecret: !!adminSecret })

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
    
    console.log('🔧 Variables d\'environnement:', { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length,
      keyLength: supabaseServiceKey?.length
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables d\'environnement manquantes:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
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
    console.log('👤 Création utilisateur Auth...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        phone,
        role: 'driver'
      }
    })

    if (authError) {
      console.error('❌ Erreur création Auth:', authError)
      return new Response(
        JSON.stringify({ success: false, error: `Erreur création utilisateur: ${authError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('✅ Utilisateur Auth créé:', authUser.user?.id)

    // 2. Insert new driver in delivery_drivers table
    console.log('🚚 Création enregistrement livreur...')
    const { data, error } = await supabase
      .from('delivery_drivers')
      .insert([{
        id: authUser.user!.id, // Use the same ID as the auth user
        name,
        phone,
        email,
        is_active,
        current_status
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur création livreur:', error)
      
      // If driver creation fails, delete the auth user to maintain consistency
      console.log('🧹 Suppression utilisateur Auth suite à l\'erreur...')
      await supabase.auth.admin.deleteUser(authUser.user!.id)
      
      return new Response(
        JSON.stringify({ success: false, error: `Erreur création livreur: ${error.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('✅ Livreur créé avec succès:', data.id)

    // 3. Send welcome email to the new driver
    console.log('📧 Envoi email de bienvenue...')
    try {
      await sendDriverWelcomeEmail(email, name, password)
      console.log('✅ Email de bienvenue envoyé')
    } catch (emailError) {
      console.error('⚠️ Erreur envoi email (livreur créé quand même):', emailError)
      // Don't fail the entire operation if email fails
    }

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
    console.error('❌ Erreur générale dans create-driver:', error)
    return new Response(
      JSON.stringify({ success: false, error: `Erreur serveur: ${error.message}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function sendDriverWelcomeEmail(driverEmail: string, driverName: string, password: string) {
  // Get Resend API key from environment variables
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_f6zTKvXm_JCsqkjYnNpYtC8Cg1dpXdUo8';
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const emailHtml = generateDriverWelcomeEmail(driverName, driverEmail, password);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'The Ice Guys <commandes@glaconsmarrakech.com>',
      to: driverEmail,
      subject: 'Bienvenue chez The Ice Guys - Vos identifiants livreur',
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send welcome email: ${error}`);
  }

  return response.json();
}

function generateDriverWelcomeEmail(driverName: string, driverEmail: string, password: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue chez The Ice Guys</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 0; 
                background-color: #f8f9fa;
            }
            .container {
                background-color: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin: 20px;
            }
            .header { 
                background: linear-gradient(135deg, #16a34a, #059669); 
                color: white; 
                padding: 40px 30px; 
                text-align: center; 
            }
            .header h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: bold;
            }
            .header h2 {
                margin: 0 0 15px 0;
                font-size: 20px;
                font-weight: normal;
                opacity: 0.9;
            }
            .welcome-badge {
                background: rgba(255, 255, 255, 0.2);
                padding: 10px 20px;
                border-radius: 25px;
                display: inline-block;
                font-weight: bold;
                font-size: 16px;
            }
            .content { 
                padding: 30px; 
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
            }
            .credentials-box { 
                background: #f0f9ff; 
                padding: 25px; 
                border-radius: 10px; 
                margin: 25px 0; 
                border-left: 5px solid #0ea5e9; 
                border: 2px solid #0ea5e9;
            }
            .credentials-box h3 {
                color: #0ea5e9;
                margin-top: 0;
                font-size: 20px;
            }
            .credential-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                margin: 10px 0;
                border: 1px solid #e0f2fe;
            }
            .credential-label {
                font-weight: bold;
                color: #0ea5e9;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .credential-value {
                font-family: 'Courier New', monospace;
                background: #f8fafc;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                font-size: 16px;
                color: #1e293b;
                word-break: break-all;
            }
            .instructions {
                background: #fef3c7;
                padding: 20px;
                border-radius: 10px;
                margin: 25px 0;
                border-left: 5px solid #f59e0b;
            }
            .instructions h3 {
                color: #d97706;
                margin-top: 0;
            }
            .step {
                margin: 10px 0;
                padding: 10px 0;
            }
            .step-number {
                display: inline-block;
                background: #16a34a;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                line-height: 24px;
                margin-right: 10px;
            }
            .footer { 
                text-align: center; 
                padding: 30px; 
                background: #f8f9fa; 
                border-top: 1px solid #e9ecef;
            }
            .login-btn { 
                display: inline-block; 
                background: #16a34a; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 30px; 
                margin: 15px 10px;
                font-weight: bold;
                font-size: 16px;
                transition: background-color 0.3s;
            }
            .login-btn:hover {
                background: #15803d;
            }
            .contact-info {
                margin: 20px 0;
                font-size: 14px;
                color: #666;
            }
            .security-notice {
                background: #fef2f2;
                border: 1px solid #fecaca;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .security-notice h4 {
                color: #dc2626;
                margin-top: 0;
                font-size: 16px;
            }
            .company-info {
                font-size: 12px;
                color: #888;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚚 The Ice Guys</h1>
                <h2>Bienvenue dans l'équipe !</h2>
                <div class="welcome-badge">Espace Livreur Créé</div>
            </div>
            
            <div class="content">
                <div class="greeting">
                    <p>Bonjour <strong>${driverName}</strong>,</p>
                    <p>Félicitations ! Votre compte livreur The Ice Guys a été créé avec succès. Vous faites maintenant partie de notre équipe de livraison premium à Marrakech.</p>
                </div>
                
                <div class="credentials-box">
                    <h3>🔐 Vos identifiants de connexion</h3>
                    <p>Utilisez ces identifiants pour accéder à votre espace livreur :</p>
                    
                    <div class="credential-item">
                        <div class="credential-label">📧 Email de connexion :</div>
                        <div class="credential-value">${driverEmail}</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">🔑 Mot de passe :</div>
                        <div class="credential-value">${password}</div>
                    </div>
                </div>
                
                <div class="instructions">
                    <h3>📋 Comment accéder à votre espace livreur</h3>
                    
                    <div class="step">
                        <span class="step-number">1</span>
                        <strong>Accédez au site :</strong> Rendez-vous sur notre site web
                    </div>
                    
                    <div class="step">
                        <span class="step-number">2</span>
                        <strong>Espace livreur :</strong> Cliquez sur "Administration" en bas de page, puis "Espace Livreur"
                    </div>
                    
                    <div class="step">
                        <span class="step-number">3</span>
                        <strong>Connexion :</strong> Utilisez vos identifiants ci-dessus pour vous connecter
                    </div>
                    
                    <div class="step">
                        <span class="step-number">4</span>
                        <strong>Commandes :</strong> Consultez vos livraisons assignées et mettez à jour leur statut
                    </div>
                </div>
                
                <div class="security-notice">
                    <h4>🔒 Sécurité importante</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Gardez vos identifiants confidentiels</li>
                        <li>Ne partagez jamais votre mot de passe</li>
                        <li>Déconnectez-vous après chaque session</li>
                        <li>Contactez l'administration en cas de problème</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p><strong>Prêt à commencer ? Connectez-vous dès maintenant :</strong></p>
                    <a href="https://glaconsmarrakech.com#driver" class="login-btn">🚚 Accéder à mon espace livreur</a>
                    
                    <div class="contact-info">
                        <p><strong>Support technique :</strong></p>
                        <p>📧 <strong>Email :</strong> support@glaconsmarrakech.com</p>
                        <p>💬 <strong>WhatsApp :</strong> +212 693 675 981</p>
                        <p>🌐 <strong>Site web :</strong> https://glaconsmarrakech.com</p>
                    </div>
                    
                    <div class="company-info">
                        <p><strong>Bienvenue dans l'équipe The Ice Guys !</strong></p>
                        <p>Ensemble, nous livrons l'excellence à Marrakech.<br>
                        Merci de rejoindre notre équipe de livraison premium.</p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}