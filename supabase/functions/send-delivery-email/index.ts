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
    const { type, order, delivery, customerEmail } = await req.json()

    // Configuration de l'email
    const emailData = {
      to: customerEmail,
      subject: `✅ Livraison confirmée - Commande #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>🧊 The Ice Guys</h1>
            <h2>Livraison Confirmée ✅</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Bonjour,</h3>
            <p>Votre commande #${order.id} a été livrée avec succès !</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>📋 Détails de la réception</h4>
              <p><strong>Réceptionnaire:</strong> ${delivery.receiver_first_name} ${delivery.receiver_name}</p>
              <p><strong>Date de livraison:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              <p><strong>Moyen de paiement:</strong> ${
                delivery.payment_method === 'cash' ? 'Espèces' : 
                delivery.payment_method === 'card' ? 'Carte bancaire' : 'Virement'
              }</p>
              ${delivery.change_amount > 0 ? `<p><strong>Monnaie rendue:</strong> ${delivery.change_amount}€</p>` : ''}
              ${delivery.needs_invoice ? '<p><strong>Facture avec TVA:</strong> Oui</p>' : ''}
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>💰 Récapitulatif financier</h4>
              <p><strong>Montant de la commande:</strong> ${order.total_amount}€</p>
              ${delivery.needs_invoice ? `<p><strong>Total avec TVA (20%):</strong> ${delivery.total_with_tax}€</p>` : ''}
              <p><strong>Montant reçu:</strong> ${delivery.amount_received}€</p>
            </div>
            
            <p>Merci de votre confiance !</p>
            <p><strong>L'équipe The Ice Guys</strong></p>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2024 The Ice Guys - Service de livraison de glace</p>
          </div>
        </div>
      `
    }

    // Ici vous pouvez intégrer votre service d'email (SendGrid, Resend, etc.)
    console.log('Email à envoyer:', emailData)

    return new Response(
      JSON.stringify({ success: true, message: 'Email envoyé avec succès' }),
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