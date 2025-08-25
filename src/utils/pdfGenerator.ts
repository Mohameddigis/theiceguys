import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order } from '../lib/supabase';

export const generateOrderPDF = async (order: Order): Promise<void> => {
  // Create a temporary div for the PDF content
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.padding = '20px';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  tempDiv.style.backgroundColor = 'white';
  
  // Generate HTML content for the order
  tempDiv.innerHTML = generateOrderHTML(order);
  
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
    
    // Download the PDF
    pdf.save(`Bon_de_commande_${order.order_number}.pdf`);
    
  } finally {
    // Remove temporary div
    document.body.removeChild(tempDiv);
  }
};

const generateOrderHTML = (order: Order): string => {
  const isExpress = order.delivery_type === 'express';
  const orderDate = new Date(order.created_at).toLocaleDateString('fr-FR');
  const orderTime = new Date(order.created_at).toLocaleTimeString('fr-FR');
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0e7eac; padding-bottom: 20px;">
        <h1 style="color: #0e7eac; font-size: 28px; margin: 0;">🧊 THE ICE GUYS</h1>
        <p style="color: #666; margin: 5px 0;">Glaçons Premium - Marrakech</p>
        <p style="color: #666; margin: 0; font-size: 14px;">📍 Chrifia, Marrakech | 📞 +212 693 675 981</p>
      </div>

      <!-- Order Info -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div>
            <h2 style="color: #0e7eac; margin: 0; font-size: 24px;">BON DE COMMANDE</h2>
            <p style="margin: 5px 0; font-size: 16px;"><strong>N° ${order.order_number}</strong></p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #666;">Date: ${orderDate}</p>
            <p style="margin: 0; color: #666;">Heure: ${orderTime}</p>
          </div>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0e7eac;">
          <p style="margin: 0; font-size: 16px; color: #0e7eac;"><strong>Statut: ${getStatusLabel(order.status)}</strong></p>
        </div>
      </div>

      <!-- Customer Info -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #0e7eac; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">👤 INFORMATIONS CLIENT</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>Nom:</strong> ${order.customer?.name || 'N/A'}</p>
          ${order.customer?.contact_name ? `<p style="margin: 5px 0;"><strong>Contact:</strong> ${order.customer.contact_name}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Type:</strong> ${order.customer?.type === 'professional' ? 'Professionnel' : 'Particulier'}</p>
          <p style="margin: 5px 0;"><strong>Téléphone:</strong> ${order.customer?.phone || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
        </div>
      </div>

      <!-- Delivery Info -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #0e7eac; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">🚚 INFORMATIONS DE LIVRAISON</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>Type:</strong> ${isExpress ? 'Express (moins de 1H)' : 'Standard'}</p>
          ${order.delivery_date ? `<p style="margin: 5px 0;"><strong>Date prévue:</strong> ${order.delivery_date}</p>` : ''}
          ${order.delivery_time ? `<p style="margin: 5px 0;"><strong>Heure prévue:</strong> ${order.delivery_time}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Adresse:</strong> ${order.delivery_address}</p>
          ${order.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${order.notes}</p>` : ''}
        </div>
      </div>

      <!-- Order Items -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #0e7eac; border-bottom: 2px solid #e9ecef; padding-bottom: 8px;">🧊 PRODUITS COMMANDÉS</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #0e7eac; color: white;">
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

      <!-- Totals -->
      <div style="margin-bottom: 25px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; border: 2px solid #0e7eac;">
          <div style="text-align: right;">
            <p style="margin: 5px 0; font-size: 16px;"><strong>Sous-total:</strong> ${order.subtotal} MAD</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Frais de livraison:</strong> ${order.delivery_fee} MAD</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;">
            <p style="margin: 0; font-size: 20px; color: #0e7eac;"><strong>TOTAL: ${order.total} MAD</strong></p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef; color: #666; font-size: 14px;">
        <p style="margin: 5px 0;"><strong>Glaçons Marrakech - Glaçons Premium</strong></p>
        <p style="margin: 5px 0;">📍 Chrifia, Marrakech | 📞 +212 693 675 981</p>
        <p style="margin: 5px 0;">📧 commandes@glaconsmarrakech.com</p>
        <p style="margin: 15px 0 5px 0; font-size: 12px;">Merci de votre confiance !</p>
      </div>
    </div>
  `;
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'confirmed': return 'Confirmée';
    case 'delivering': return 'En livraison';
    case 'delivered': return 'Livrée';
    case 'cancelled': return 'Annulée';
    default: return status;
  }
};

const getIceTypeName = (iceType: string): string => {
  switch (iceType) {
    case 'nuggets': return "Nugget's";
    case 'gourmet': return 'Gourmet';
    case 'cubique': return 'Glace Paillette';
    default: return iceType;
  }
};