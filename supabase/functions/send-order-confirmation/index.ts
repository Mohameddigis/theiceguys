import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderConfirmationRequest {
  customerEmail: string;
  customerName: string;
  orderDetails: {
    orderNumber: string;
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
    const { customerEmail, customerName, orderDetails }: OrderConfirmationRequest = await req.json()

    // Generate order confirmation email HTML
    const emailHtml = generateOrderConfirmationEmail(customerName, orderDetails);

    // Send email using Resend API
    const emailResponse = await sendEmailWithResend({
      from: 'The Ice Guys <commandes@theiceguys.com>',
      to: customerEmail,
      subject: `Confirmation de commande The Ice Guys - ${orderDetails.orderNumber}`,
      html: emailHtml
    });

    // Also send a copy to the business
    await sendEmailWithResend({
      from: 'The Ice Guys <commandes@theiceguys.com>',
      to: 'commandes@theiceguys.com',
      subject: `Nouvelle commande The Ice Guys - ${orderDetails.orderNumber}`,
      html: generateBusinessNotificationEmail(customerName, orderDetails)
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Email de confirmation envoyé' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
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

function generateOrderConfirmationEmail(customerName: string, orderDetails: any): string {
  const isExpress = orderDetails.deliveryInfo.type === 'express';
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de commande</title>
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
                background: linear-gradient(135deg, #0e7eac, #2595c3); 
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
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
            }
            .order-details { 
                background: #f8f9fa; 
                padding: 25px; 
                border-radius: 10px; 
                margin: 25px 0; 
                border-left: 5px solid #0e7eac; 
            }
            .order-details h3 {
                color: #0e7eac;
                margin-top: 0;
                font-size: 20px;
            }
            .order-details h4 {
                color: #333;
                margin: 20px 0 10px 0;
                font-size: 16px;
            }
            .item { 
                background: white;
                padding: 15px; 
                border-radius: 8px;
                margin: 10px 0;
                border: 1px solid #e9ecef;
            }
            .item-name {
                font-weight: bold;
                color: #0e7eac;
                font-size: 16px;
            }
            .item-details {
                color: #666;
                margin: 5px 0;
                font-size: 14px;
            }
            .item-price {
                font-weight: bold;
                color: #333;
                text-align: right;
                font-size: 16px;
            }
            .delivery-info {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            .express-badge {
                background: linear-gradient(135deg, #ff6b35, #f7931e);
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                display: inline-block;
                margin-left: 10px;
            }
            .total { 
                font-size: 24px; 
                font-weight: bold; 
                color: #0e7eac; 
                text-align: right; 
                margin-top: 25px; 
                padding: 20px;
                background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
                border-radius: 10px;
                border: 2px solid #0e7eac;
            }
            .next-steps {
                background: #e8f5e8;
                padding: 20px;
                border-radius: 10px;
                margin: 25px 0;
                border-left: 5px solid #28a745;
            }
            .next-steps h3 {
                color: #28a745;
                margin-top: 0;
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
                <h2>Confirmation de commande</h2>
                <div class="order-number">Commande N° ${orderDetails.orderNumber}</div>
            </div>
            
            <div class="content">
                <div class="greeting">
                    <p>Bonjour <strong>${customerName}</strong>,</p>
                    <p>Nous avons bien reçu votre commande et nous vous remercions de votre confiance ! Notre équipe va traiter votre demande dans les plus brefs délais.</p>
                </div>
                
                <div class="order-details">
                    <h3>📋 Détails de votre commande</h3>
                    
                    ${orderDetails.customerType === 'professional' && orderDetails.companyName ? 
                      `<p><strong>🏢 Entreprise:</strong> ${orderDetails.companyName}</p>` : ''}
                    
                    <h4>🧊 Produits commandés:</h4>
                    ${orderDetails.items.map((item: any) => `
                        <div class="item">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <div class="item-name">${item.iceType}</div>
                                    <div class="item-details">
                                        ${item.quantities['5kg'] > 0 ? `• ${item.quantities['5kg']} sac(s) de 5kg<br>` : ''}
                                        ${item.quantities['10kg'] > 0 ? `• ${item.quantities['10kg']} sac(s) de 10kg<br>` : ''}
                                        ${item.quantities['20kg'] > 0 ? `• ${item.quantities['20kg']} sac(s) de 20kg<br>` : ''}
                                    </div>
                                </div>
                                <div class="item-price">${item.totalPrice} MAD</div>
                            </div>
                        </div>
                    `).join('')}
                    
                    <h4>🚚 Informations de livraison:</h4>
                    <div class="delivery-info">
                        <p><strong>Type:</strong> 
                            ${isExpress ? 'Livraison Express (moins de 1H)' : 'Livraison Standard'}
                            ${isExpress ? '<span class="express-badge">+100 MAD</span>' : ''}
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
                
                <div class="next-steps">
                    <h3>📞 Prochaines étapes</h3>
                    <p><strong>Notre équipe va vous contacter sous peu</strong> pour confirmer les détails de livraison et finaliser votre commande.</p>
                    
                    ${isExpress ? 
                      '<p><strong>⚡ Livraison Express:</strong> Votre commande sera livrée dans moins d\'1 heure après confirmation par notre équipe.</p>' :
                      '<p><strong>📅 Livraison Standard:</strong> Votre commande sera livrée à la date et heure convenues après confirmation.</p>'
                    }
                    
                    <p><strong>💡 Conseil:</strong> Gardez votre téléphone à portée de main, nous vous appellerons bientôt !</p>
                </div>
                
                <div class="footer">
                    <p><strong>Une question ? Contactez-nous immédiatement :</strong></p>
                    <a href="https://wa.me/212693675981" class="whatsapp-btn">💬 WhatsApp: +212 693 675 981</a>
                    
                    <div class="contact-info">
                        <p>📧 <strong>Email:</strong> commandes@theiceguys.com</p>
                        <p>🌐 <strong>Site web:</strong> https://glaconsmarrakech.com</p>
                        <p>📍 <strong>Adresse:</strong> Chrifia, Marrakech</p>
                    </div>
                    
                    <div class="company-info">
                        <p><strong>Merci de faire confiance à The Ice Guys !</strong></p>
                       <p><strong>Merci de faire confiance à The Ice Guys !</strong></p>
                        <p>Votre partenaire de confiance pour des glaçons de qualité supérieure à Marrakech.<br>
                       Nous servons les professionnels et particuliers avec la qualité que vous méritez.</p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateBusinessNotificationEmail(customerName: string, orderDetails: any): string {
  const isExpress = orderDetails.deliveryInfo.type === 'express';
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle commande reçue</title>
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
                background: linear-gradient(135deg, #dc3545, #c82333); 
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .content { padding: 30px; }
            .order-details { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
                border-left: 4px solid #dc3545; 
            }
            .urgent {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .total { 
                font-size: 20px; 
                font-weight: bold; 
                color: #dc3545; 
                text-align: right; 
                margin-top: 20px; 
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 Nouvelle Commande Reçue</h1>
                <h2>Commande N° ${orderDetails.orderNumber}</h2>
            </div>
            
            <div class="content">
                ${isExpress ? `
                    <div class="urgent">
                        <h3>⚡ COMMANDE EXPRESS - ACTION IMMÉDIATE REQUISE</h3>
                        <p><strong>Cette commande doit être livrée en moins d'1 heure !</strong></p>
                    </div>
                ` : ''}
                
                <div class="order-details">
                    <h3>👤 Informations Client</h3>
                    <p><strong>Nom:</strong> ${customerName}</p>
                    ${orderDetails.customerType === 'professional' && orderDetails.companyName ? 
                      `<p><strong>Entreprise:</strong> ${orderDetails.companyName}</p>` : ''}
                    <p><strong>Type:</strong> ${orderDetails.customerType === 'professional' ? 'Professionnel' : 'Particulier'}</p>
                    
                    <h3>🧊 Produits</h3>
                    ${orderDetails.items.map((item: any) => `
                        <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
                            <strong>${item.iceType}</strong><br>
                            ${item.quantities['5kg'] > 0 ? `• ${item.quantities['5kg']}x 5kg ` : ''}
                            ${item.quantities['10kg'] > 0 ? `• ${item.quantities['10kg']}x 10kg ` : ''}
                            ${item.quantities['20kg'] > 0 ? `• ${item.quantities['20kg']}x 20kg ` : ''}
                            <br><em>${item.totalPrice} MAD</em>
                        </div>
                    `).join('')}
                    
                    <h3>🚚 Livraison</h3>
                    <p><strong>Type:</strong> ${isExpress ? 'EXPRESS (< 1H)' : 'Standard'}</p>
                    ${!isExpress && orderDetails.deliveryInfo.date ? 
                      `<p><strong>Date:</strong> ${orderDetails.deliveryInfo.date}</p>
                       <p><strong>Heure:</strong> ${orderDetails.deliveryInfo.time}</p>` : ''}
                    <p><strong>Adresse:</strong> ${orderDetails.deliveryInfo.address}</p>
                    
                    <div class="total">
                        Total: ${orderDetails.total} MAD
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p><strong>Action requise:</strong> Contacter le client pour confirmer la commande</p>
                    <a href="https://wa.me/212693675981" style="display: inline-block; background: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 10px;">
                        Traiter la commande
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}