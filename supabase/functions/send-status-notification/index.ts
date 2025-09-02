import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatusNotificationRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  newStatus: string;
  orderDetails: {
    items: Array<{
      iceType: string;
      quantities: {
        '5kg': number;
        '10kg': number;
        '20kg': number;
      };
      totalPrice: number;
    }>;
    deliveryInfo: {
      type: 'standard' | 'express';
      date?: string;
      time?: string;
      address: string;
    };
    total: number;
    customerType: 'professional' | 'individual';
    companyName?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerEmail, customerName, orderNumber, newStatus, orderDetails }: StatusNotificationRequest = await req.json()

    // Generate status notification email HTML
    const emailHtml = generateStatusNotificationEmail(customerName, orderNumber, newStatus, orderDetails);

    // Send email using Resend API
    const emailResponse = await sendEmailWithResend({
      from: 'The Ice Guys <onboarding@resend.dev>',
      to: customerEmail,
      subject: `Mise à jour de votre commande The Ice Guys - ${orderNumber}`,
      html: emailHtml
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Notification envoyée avec succès' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function sendEmailWithResend({ from, to, subject, html }: {
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not configured');
  }
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email via Resend: ${error}`);
  }

  return response.json();
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'confirmed':
      return {
        title: 'Commande Confirmée ✅',
        message: 'Votre commande a été confirmée et est en cours de traitement.',
        color: '#2563eb',
        icon: '✅',
        nextStep: 'Nous préparons actuellement votre commande.'
      };
    case 'delivering':
      return {
        title: 'Commande en Livraison 🚚',
        message: 'Votre commande est en route vers votre adresse !',
        color: '#ea580c',
        icon: '🚚',
        nextStep: 'Notre livreur arrivera bientôt à votre adresse.'
      };
    case 'delivered':
      return {
        title: 'Commande Livrée 🎉',
        message: 'Votre commande a été livrée avec succès !',
        color: '#16a34a',
        icon: '🎉',
        nextStep: 'Merci de votre confiance. N\'hésitez pas à nous recontacter pour vos prochains besoins.'
      };
    case 'cancelled':
      return {
        title: 'Commande Annulée ❌',
        message: 'Votre commande a été annulée.',
        color: '#dc2626',
        icon: '❌',
        nextStep: 'Si vous avez des questions, n\'hésitez pas à nous contacter.'
      };
    default:
      return {
        title: 'Mise à jour de votre commande',
        message: 'Le statut de votre commande a été mis à jour.',
        color: '#6b7280',
        icon: '📋',
        nextStep: 'Nous vous tiendrons informé des prochaines étapes.'
      };
  }
}

function generateStatusNotificationEmail(customerName: string, orderNumber: string, newStatus: string, orderDetails: any): string {
  const statusInfo = getStatusInfo(newStatus);
  const isExpress = orderDetails.deliveryInfo.type === 'express';
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mise à jour de commande</title>
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
                background: linear-gradient(135deg, ${statusInfo.color}, ${statusInfo.color}dd); 
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
            .status-badge {
                background: rgba(255, 255, 255, 0.2);
                padding: 15px 25px;
                border-radius: 30px;
                display: inline-block;
                font-weight: bold;
                font-size: 18px;
                margin-top: 10px;
            }
            .content { 
                padding: 30px; 
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
            }
            .status-update {
                background: linear-gradient(135deg, ${statusInfo.color}15, ${statusInfo.color}05);
                border-left: 5px solid ${statusInfo.color};
                padding: 25px;
                border-radius: 10px;
                margin: 25px 0;
            }
            .status-update h3 {
                color: ${statusInfo.color};
                margin-top: 0;
                font-size: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .next-step {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 4px solid ${statusInfo.color};
            }
            .next-step h4 {
                color: ${statusInfo.color};
                margin-top: 0;
                font-size: 16px;
            }
            .order-summary {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin: 25px 0;
            }
            .order-summary h3 {
                color: #333;
                margin-top: 0;
                font-size: 18px;
            }
            .item {
                background: white;
                padding: 12px;
                border-radius: 6px;
                margin: 8px 0;
                border: 1px solid #e9ecef;
            }
            .item-name {
                font-weight: bold;
                color: ${statusInfo.color};
                font-size: 14px;
            }
            .item-details {
                color: #666;
                margin: 3px 0;
                font-size: 12px;
            }
            .delivery-info {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
                margin-top: 15px;
            }
            .total {
                font-size: 18px;
                font-weight: bold;
                color: ${statusInfo.color};
                text-align: right;
                margin-top: 15px;
                padding: 15px;
                background: ${statusInfo.color}10;
                border-radius: 8px;
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
                <h1>${statusInfo.icon} The Ice Guys</h1>
                <h2>Mise à jour de commande</h2>
                <div class="status-badge">${statusInfo.title}</div>
            </div>
            
            <div class="content">
                <div class="greeting">
                    <p>Bonjour <strong>${customerName}</strong>,</p>
                </div>
                
                <div class="status-update">
                    <h3>${statusInfo.icon} ${statusInfo.title}</h3>
                    <p><strong>${statusInfo.message}</strong></p>
                    <p>Commande N° <strong>${orderNumber}</strong></p>
                </div>
                
                <div class="next-step">
                    <h4>📋 Prochaine étape :</h4>
                    <p>${statusInfo.nextStep}</p>
                </div>
                
                <div class="order-summary">
                    <h3>📋 Récapitulatif de votre commande</h3>
                    
                    ${orderDetails.customerType === 'professional' && orderDetails.companyName ? 
                      `<p><strong>🏢 Entreprise:</strong> ${orderDetails.companyName}</p>` : ''}
                    
                    <h4>🧊 Produits commandés:</h4>
                    ${orderDetails.items.map((item: any) => `
                        <div class="item">
                            <div class="item-name">${item.iceType}</div>
                            <div class="item-details">
                                ${item.quantities['5kg'] > 0 ? `• ${item.quantities['5kg']} sac(s) de 5kg<br>` : ''}
                                ${item.quantities['10kg'] > 0 ? `• ${item.quantities['10kg']} sac(s) de 10kg<br>` : ''}
                                ${item.quantities['20kg'] > 0 ? `• ${item.quantities['20kg']} sac(s) de 20kg<br>` : ''}
                                <strong>${item.totalPrice} MAD</strong>
                            </div>
                        </div>
                    `).join('')}
                    
                    <h4>🚚 Informations de livraison:</h4>
                    <div class="delivery-info">
                        <p><strong>Type:</strong> 
                            ${isExpress ? 'Livraison Express (moins de 1H)' : 'Livraison Standard'}
                        </p>
                        ${!isExpress && orderDetails.deliveryInfo.date ? 
                          `<p><strong>📅 Date:</strong> ${orderDetails.deliveryInfo.date}</p>
                           <p><strong>🕐 Heure:</strong> ${orderDetails.deliveryInfo.time}</p>` : ''}
                        <p><strong>📍 Adresse:</strong> ${orderDetails.deliveryInfo.address}</p>
                    </div>
                    
                    <div class="total">
                        💰 Total: ${orderDetails.total} MAD
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>Une question ? Contactez-nous :</strong></p>
                    <a href="https://wa.me/212693675981" class="whatsapp-btn">💬 WhatsApp: +212 693 675 981</a>
                    
                    <div class="contact-info">
                        <p>📧 <strong>Email:</strong> commandes@theiceguys.com</p>
                        <p>🌐 <strong>Site web:</strong> https://theiceguys.com</p>
                        <p>📍 <strong>Adresse:</strong> Chrifia, Marrakech</p>
                    </div>
                    
                    <div class="company-info">
                        <p><strong>Merci de faire confiance à Glaçons Marrakech !</strong></p>
                       <p><strong>Merci de faire confiance à The Ice Guys !</strong></p>
                        <p>Votre partenaire de confiance pour des glaçons de qualité supérieure à Marrakech.</p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}