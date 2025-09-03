import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReceptionConfirmationRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  receptionData: {
    receiverName: string;
    amountReceived: number;
    paymentMethod: 'cash' | 'card' | 'transfer';
    changeGiven: number;
    notes?: string;
    receptionDate: string;
  };
  pdfBase64: string; // PDF as base64 string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerEmail, customerName, orderNumber, receptionData, pdfBase64 }: ReceptionConfirmationRequest = await req.json()

    console.log('📧 Envoi bon de réception:', { customerEmail, orderNumber })

    // Generate reception confirmation email HTML
    const emailHtml = generateReceptionConfirmationEmail(customerName, orderNumber, receptionData);

    // Convert base64 PDF to attachment
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Send email using Resend with PDF attachment
    const emailResponse = await sendEmailWithResend({
      from: 'The Ice Guys <commandes@glaconsmarrakech.com>',
      to: customerEmail,
      subject: `Bon de réception The Ice Guys - ${orderNumber}`,
      html: emailHtml,
      attachments: [{
        filename: `Bon_de_reception_${orderNumber}.pdf`,
        content: pdfBuffer
      }]
    });

    // Also send a copy to the business
    await sendEmailWithResend({
      from: 'The Ice Guys <commandes@glaconsmarrakech.com>',
      to: 'commandes@glaconsmarrakech.com',
      subject: `Livraison confirmée - ${orderNumber}`,
      html: generateBusinessReceptionNotification(customerName, orderNumber, receptionData),
      attachments: [{
        filename: `Bon_de_reception_${orderNumber}.pdf`,
        content: pdfBuffer
      }]
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Bon de réception envoyé avec succès' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du bon de réception:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function sendEmailWithResend({ from, to, subject, html, attachments }: {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Uint8Array;
  }>;
}) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_f6zTKvXm_JCsqkjYnNpYtC8Cg1dpXdUo8';
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const emailData: any = {
    from,
    to,
    subject,
    html,
  };

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    emailData.attachments = attachments.map(att => ({
      filename: att.filename,
      content: Array.from(att.content)
    }));
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email via Resend: ${error}`);
  }

  return response.json();
}

function generateReceptionConfirmationEmail(customerName: string, orderNumber: string, receptionData: any): string {
  const receptionDate = new Date(receptionData.receptionDate).toLocaleDateString('fr-FR');
  const receptionTime = new Date(receptionData.receptionDate).toLocaleTimeString('fr-FR');
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bon de réception</title>
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
            .order-number {
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
            .success-message {
                background: #f0fdf4;
                border: 2px solid #16a34a;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: center;
            }
            .success-message h3 {
                color: #16a34a;
                margin: 0 0 10px 0;
                font-size: 20px;
            }
            .reception-details { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0; 
                border-left: 5px solid #16a34a; 
            }
            .reception-details h4 {
                color: #16a34a;
                margin-top: 0;
                font-size: 16px;
            }
            .payment-info {
                background: #f0fdf4;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #16a34a;
                margin: 15px 0;
            }
            .footer { 
                text-align: center; 
                padding: 30px; 
                background: #f8f9fa; 
                border-top: 1px solid #e9ecef;
            }
            .whatsapp-btn { 
                display: inline-block; 
                background: #25d366; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 30px; 
                margin: 15px 10px;
                font-weight: bold;
                font-size: 16px;
                transition: background-color 0.3s;
            }
            .whatsapp-btn:hover {
                background: #128c7e;
            }
            .contact-info {
                margin: 20px 0;
                font-size: 14px;
                color: #666;
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
                <h1>🧊 The Ice Guys</h1>
                <h2>Livraison Confirmée</h2>
                <div class="order-number">Commande N° ${orderNumber}</div>
            </div>
            
            <div class="content">
                <div class="success-message">
                    <h3>✅ Livraison Réceptionnée avec Succès !</h3>
                    <p>Votre commande a été livrée et réceptionnée le ${receptionDate} à ${receptionTime}</p>
                </div>
                
                <p>Bonjour <strong>${customerName}</strong>,</p>
                <p>Nous confirmons que votre commande The Ice Guys a été livrée et réceptionnée avec succès. Vous trouverez ci-joint le bon de réception officiel avec tous les détails.</p>
                
                <div class="reception-details">
                    <h4>📝 Détails de la réception</h4>
                    <p><strong>Réceptionné par:</strong> ${receptionData.receiverName}</p>
                    <p><strong>Date et heure:</strong> ${receptionDate} à ${receptionTime}</p>
                    ${receptionData.notes ? `<p><strong>Notes:</strong> ${receptionData.notes}</p>` : ''}
                    
                    <div class="payment-info">
                        <h4 style="margin-top: 0;">💰 Paiement confirmé</h4>
                        <p><strong>Moyen de paiement:</strong> ${getPaymentLabel(receptionData.paymentMethod)}</p>
                        <p><strong>Montant reçu:</strong> ${receptionData.amountReceived} MAD</p>
                        ${receptionData.paymentMethod === 'cash' && receptionData.changeGiven > 0 ? 
                          `<p><strong>Monnaie rendue:</strong> ${receptionData.changeGiven} MAD</p>` : ''}
                    </div>
                </div>
                
                <div style="background: #e0f2fe; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                    <h4 style="color: #0ea5e9; margin-top: 0;">📎 Document joint</h4>
                    <p>Le bon de réception officiel est joint à cet email en format PDF. Ce document certifie la bonne livraison et réception de votre commande.</p>
                </div>
                
                <div class="footer">
                    <p><strong>Merci de votre confiance !</strong></p>
                    <p>Pour toute question concernant cette livraison :</p>
                    <a href="https://wa.me/212693675981" class="whatsapp-btn">💬 WhatsApp: +212 693 675 981</a>
                    
                    <div class="contact-info">
                        <p>📧 <strong>Email:</strong> commandes@glaconsmarrakech.com</p>
                        <p>🌐 <strong>Site web:</strong> https://glaconsmarrakech.com</p>
                        <p>📍 <strong>Adresse:</strong> Chrifia, Marrakech</p>
                    </div>
                    
                    <div class="company-info">
                        <p><strong>The Ice Guys - Premium Ice Marrakech</strong></p>
                        <p>Votre partenaire de confiance pour des glaçons de qualité supérieure.</p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateBusinessReceptionNotification(customerName: string, orderNumber: string, receptionData: any): string {
  const receptionDate = new Date(receptionData.receptionDate).toLocaleDateString('fr-FR');
  const receptionTime = new Date(receptionData.receptionDate).toLocaleTimeString('fr-FR');
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Livraison confirmée</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #f8f9fa;
            }
            .container {
                background-color: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: linear-gradient(135deg, #16a34a, #059669); 
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .content { padding: 30px; }
            .reception-details { 
                background: #f0fdf4; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
                border-left: 4px solid #16a34a; 
            }
            .payment-summary {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Livraison Confirmée</h1>
                <h2>Commande N° ${orderNumber}</h2>
            </div>
            
            <div class="content">
                <h3>📋 Résumé de la réception</h3>
                
                <div class="reception-details">
                    <p><strong>Client:</strong> ${customerName}</p>
                    <p><strong>Réceptionné par:</strong> ${receptionData.receiverName}</p>
                    <p><strong>Date et heure:</strong> ${receptionDate} à ${receptionTime}</p>
                    ${receptionData.notes ? `<p><strong>Notes:</strong> ${receptionData.notes}</p>` : ''}
                    
                    <div class="payment-summary">
                        <h4 style="margin-top: 0;">💰 Détails du paiement</h4>
                        <p><strong>Moyen:</strong> ${getPaymentLabel(receptionData.paymentMethod)}</p>
                        <p><strong>Montant reçu:</strong> ${receptionData.amountReceived} MAD</p>
                        ${receptionData.paymentMethod === 'cash' && receptionData.changeGiven > 0 ? 
                          `<p><strong>Monnaie rendue:</strong> ${receptionData.changeGiven} MAD</p>` : ''}
                    </div>
                </div>
                
                <p><strong>Le bon de réception signé est joint à cet email.</strong></p>
                <p>La commande est maintenant terminée et le stock a été automatiquement mis à jour.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function getPaymentLabel(method: string): string {
  switch (method) {
    case 'cash': return 'Espèces';
    case 'card': return 'Carte bancaire';
    case 'transfer': return 'Virement';
    default: return method;
  }
}