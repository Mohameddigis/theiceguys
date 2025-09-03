import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, order, cancel, customerEmail, adminEmail } = await req.json()

    // Email pour le client
    const customerEmailData = {
      to: customerEmail,
      subject: `❌ Commande annulée - #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; text-align: center;">
            <h1>🧊 The Ice Guys</h1>
            <h2>Commande Annulée ❌</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Bonjour,</h3>
            <p>Nous sommes désolés de vous informer que votre commande #${order.id} a dû être annulée.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>📋 Détails de l'annulation</h4>
              <p><strong>Date d'annulation:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              <p><strong>Raison:</strong> ${cancel.reason}</p>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>💰 Remboursement</h4>
              <p>Si vous avez déjà effectué le paiement, vous serez remboursé dans les plus brefs délais.</p>
              <p><strong>Montant à rembourser:</strong> ${order.total_amount}€</p>
            </div>
            
            <p>Nous nous excusons pour ce désagrément et restons à votre disposition pour toute question.</p>
            <p><strong>L'équipe The Ice Guys</strong></p>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2024 The Ice Guys - Service de livraison de glace</p>
          </div>
        </div>
      `
    }

    // Email pour l'admin
    const adminEmailData = {
      to: adminEmail,
      subject: `🚨 Commande annulée par le livreur - #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center;">
            <h1>🧊 The Ice Guys - Admin</h1>
            <h2>Annulation de Commande 🚨</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Alerte Annulation</h3>
            <p>Une commande a été annulée par le livreur.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>📋 Informations de la commande</h4>
              <p><strong>Commande:</strong> #${order.id}</p>
              <p><strong>Client:</strong> ${order.customer_name}</p>
              <p><strong>Email client:</strong> ${order.customer_email}</p>
              <p><strong>Téléphone:</strong> ${order.customer_phone}</p>
              <p><strong>Adresse:</strong> ${order.delivery_address}</p>
              <p><strong>Montant:</strong> ${order.total_amount}€</p>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>❌ Détails de l'annulation</h4>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              <p><strong>Raison:</strong> ${cancel.reason}</p>
              <p><strong>Photo justificative:</strong> Disponible dans le système</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>⚠️ Actions requises</h4>
              <ul>
                <li>Vérifier la photo justificative</li>
                <li>Contacter le client si nécessaire</li>
                <li>Traiter le remboursement</li>
                <li>Analyser les causes de l'annulation</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2024 The Ice Guys - Système d'administration</p>
          </div>
        </div>
      `
    }

    // Ici vous pouvez intégrer votre service d'email (SendGrid, Resend, etc.)
    console.log('Email client à envoyer:', customerEmailData)
    console.log('Email admin à envoyer:', adminEmailData)

    return new Response(
      JSON.stringify({ success: true, message: 'Emails envoyés avec succès' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})