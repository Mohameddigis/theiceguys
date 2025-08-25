import React from 'react';
import { MessageCircle } from 'lucide-react';

function WhatsAppWidget() {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/212693675981?text=Bonjour, je souhaite passer une commande de glaçons', '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <button
        onClick={handleWhatsAppClick}
        className="transition-all duration-300 group"
        aria-label="Contacter sur WhatsApp"
      >
        <img 
          src="https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/WhatsApp_icon.png" 
          alt="WhatsApp" 
          className="h-12 w-12 object-cover group-hover:scale-110 transition-transform"
        />
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Contactez-nous sur WhatsApp
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
}

export default WhatsAppWidget;