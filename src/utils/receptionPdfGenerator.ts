import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '../lib/supabase';

export interface ReceptionData {
  receiverName: string;
  signature: string;
  amountReceived: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  changeGiven: number;
  notes?: string;
  receptionDate: string;
}

export const generateReceptionPDF = async (order: Order, receptionData: ReceptionData): Promise<Blob> => {
  // Create a temporary div for the PDF content
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.padding = '20px';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  tempDiv.style.backgroundColor = 'white';
  
  // Generate HTML content for the reception
  tempDiv.innerHTML = generateReceptionHTML(order, receptionData);
  
  // Add to DOM temporarily
  document.body.appendChild(tempDiv);
  
  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    // Add first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Return PDF as blob instead of downloading
    return pdf.output('blob');
    
  } finally {
    // Remove temporary div
    document.body.removeChild(tempDiv);
  }
};

const generateReceptionHTML = (order: Order, receptionData: ReceptionData): string => {
  const receptionDate = new Date(receptionData.receptionDate).toLocaleDateString('fr-FR');
  const receptionTime = new Date(receptionData.receptionDate).toLocaleTimeString('fr-FR');
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #16a34a; padding-bottom: 20px;">
        <h1 style="color: #16a34a; font-size: 28px; margin: 0;">🧊 THE ICE GUYS</h1>
        <p style="color: #666; margin: 5px 0;">Premium Ice - Marrakech</p>
        <p style="color: #666; margin: 0; font-size: 14px;">📍 Chrifia, Marrakech | 📞 +212 693 675 981</p>
      </div>

      <!-- Reception Info -->
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #16a34a;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div>
            <h2 style="color: #16a34a; margin: 0; font-size: 24px;">✅ BON DE RÉCEPTION</h2>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Commande N° ${order.order_number}</strong></p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #666;">Date: ${receptionDate}</p>
            <p style="margin: 0; color: #666;">Heure: ${receptionTime}</p>
          </div>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #16a34a;">
          <p style="margin: 0; font-size: 16px; color: #16a34a;"><strong>✅ LIVRAISON CONFIRMÉE ET RÉCEPTIONNÉE</strong></p>
        </div>
      </div>

      <!-- Customer Info -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #16a34a; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">👤 INFORMATIONS CLIENT</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>Nom:</strong> ${order.customer?.name || 'N/A'}</p>
          ${order.customer?.contact_name ? `<p style="margin: 5px 0;"><strong>Contact:</strong> ${order.customer.contact_name}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Type:</strong> ${order.customer?.type === 'professional' ? 'Professionnel' : 'Particulier'}</p>
          <p style="margin: 5px 0;"><strong>Téléphone:</strong> ${order.customer?.phone || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
        </div>
      </div>

      <!-- Reception Info -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #16a34a; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">📝 INFORMATIONS DE RÉCEPTION</h3>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; border: 1px solid #16a34a;">
          <p style="margin: 5px 0;"><strong>Réceptionné par:</strong> ${receptionData.receiverName}</p>
          <p style="margin: 5px 0;"><strong>Date de réception:</strong> ${receptionDate} à ${receptionTime}</p>
          <p style="margin: 5px 0;"><strong>Adresse de livraison:</strong> ${order.delivery_address}</p>
          ${receptionData.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${receptionData.notes}</p>` : ''}
        </div>
      </div>

      <!-- Delivery Info -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #16a34a; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">🚚 INFORMATIONS DE LIVRAISON</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>Type:</strong> ${order.delivery_type === 'express' ? 'Express (moins de 1H)' : 'Standard'}</p>
          ${order.delivery_date ? `<p style="margin: 5px 0;"><strong>Date prévue:</strong> ${order.delivery_date}</p>` : ''}
          ${order.delivery_time ? `<p style="margin: 5px 0;"><strong>Heure prévue:</strong> ${order.delivery_time}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Adresse:</strong> ${order.delivery_address}</p>
        </div>
      </div>

      <!-- Order Items -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #16a34a; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">🧊 PRODUITS LIVRÉS</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #16a34a; color: white;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Produit</th>
              <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Quantité</th>
              <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Taille</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">Prix unitaire</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items?.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-transform: capitalize;">${getIceTypeName(item.ice_type)}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.package_size}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">${item.unit_price} MAD</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee; font-weight: bold;">${item.total_price} MAD</td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #666;">Aucun produit</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Payment Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #16a34a; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">💰 DÉTAILS DU PAIEMENT</h3>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; border: 2px solid #16a34a;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 5px 0; font-size: 16px;"><strong>Moyen de paiement:</strong> ${getPaymentLabel(receptionData.paymentMethod)}</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>Montant reçu:</strong> ${receptionData.amountReceived} MAD</p>
              ${receptionData.paymentMethod === 'cash' && receptionData.changeGiven > 0 ? 
                `<p style="margin: 5px 0; font-size: 16px;"><strong>Monnaie rendue:</strong> ${receptionData.changeGiven} MAD</p>` : ''}
            </div>
            <div style="text-align: right;">
              <p style="margin: 5px 0; font-size: 16px;"><strong>Sous-total:</strong> ${order.subtotal} MAD</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>Frais de livraison:</strong> ${order.delivery_fee} MAD</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;">
              <p style="margin: 0; font-size: 20px; color: #16a34a;"><strong>TOTAL PAYÉ: ${order.total} MAD</strong></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Signature -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #16a34a; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">✍️ SIGNATURE DU RÉCEPTIONNAIRE</h3>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center;">
          <p style="margin: 0 0 15px 0; font-weight: bold;">Réceptionné par: ${receptionData.receiverName}</p>
          <div style="border: 2px solid #16a34a; border-radius: 8px; padding: 10px; background: white; min-height: 120px; display: flex; align-items: center; justify-content: center;">
            <img src="${receptionData.signature}" style="max-width: 100%; max-height: 100px;" alt="Signature du réceptionnaire" />
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">
            Signature électronique - ${receptionDate} à ${receptionTime}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef; color: #666; font-size: 14px;">
        <p style="margin: 5px 0;"><strong>The Ice Guys - Premium Ice</strong></p>
        <p style="margin: 5px 0;">📍 Chrifia, Marrakech | 📞 +212 693 675 981</p>
        <p style="margin: 5px 0;">📧 commandes@glaconsmarrakech.com</p>
        <p style="margin: 15px 0 5px 0; font-size: 12px; color: #16a34a; font-weight: bold;">
          ✅ Livraison confirmée et réceptionnée avec succès !
        </p>
        <p style="margin: 5px 0; font-size: 12px;">
          Ce document certifie la bonne réception des produits commandés.
        </p>
      </div>
    </div>
  `;
};

const getIceTypeName = (iceType: string): string => {
  switch (iceType) {
    case 'nuggets': return "Nugget's";
    case 'gourmet': return 'Gourmet';
    case 'cubique': return 'Glace Paillette';
    default: return iceType;
  }
};

const getPaymentLabel = (method: string): string => {
  switch (method) {
    case 'cash': return 'Espèces';
    case 'card': return 'Carte bancaire';
    case 'transfer': return 'Virement';
    default: return method;
  }
};