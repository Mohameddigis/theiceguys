import React from 'react';
import { MapPin, MessageCircle, Mail, Clock } from 'lucide-react';

interface FooterProps {
  onPageChange?: (page: string) => void;
}

function Footer({ onPageChange }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <img 
              src="https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/Logo%20The%20Ice%20Guys%20Fond%20blanc%20long.pdf.png"
              alt="The Ice Guys"
              className="h-12 w-auto mb-4"
            />
            <p className="text-slate-300 mb-4 max-w-md">
              Votre partenaire de confiance pour des glaçons de qualité supérieure à Marrakech.
              Livraison rapide pour professionnels et particuliers.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://wa.me/212693675981"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 p-3 rounded-lg transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-brand-light mt-0.5" />
                <div>
                  <p className="text-slate-300">Chrifia, Marrakech</p>
                  <p className="text-slate-400 text-sm">Maroc</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-5 w-5 text-green-400" />
                <a 
                  href="https://wa.me/212693675981"
                  className="text-slate-300 hover:text-white"
                >
                  +212 693 675 981
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-brand-light" />
                <a 
                  href="mailto:contact@myfirst-property.com"
                  className="text-slate-300 hover:text-white"
                >
                  contact@myfirst-property.com
                </a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Nos Services</h3>
            <div className="space-y-2">
              <p className="text-slate-300">Types de glaçons :</p>
              <ul className="text-slate-400 text-sm space-y-1 ml-4">
                <li>• Nuggets</li>
                <li>• Gourmet</li>
                <li>• Glace Paillette</li>
              </ul>
              <p className="text-slate-300 mt-3">Conditionnements :</p>
              <ul className="text-slate-400 text-sm space-y-1 ml-4">
                <li>• Sacs de 5 kg</li>
                <li>• Sacs de 20 kg</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Horaires */}
        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-brand-light" />
            <h3 className="text-lg font-semibold">Horaires de Service</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-medium text-slate-300">Commandes WhatsApp</p>
              <p className="text-slate-400">24h/24 - 7j/7</p>
            </div>
            <div>
              <p className="font-medium text-slate-300">Livraisons</p>
              <p className="text-slate-400">Lun-Dim: 8h - 20h</p>
            </div>
            <div>
              <p className="font-medium text-slate-300">Support Client</p>
              <p className="text-slate-400">Lun-Dim: 9h - 18h</p>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 mb-4">
            <button
              onClick={() => onPageChange?.('admin')}
              className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <span>Administration</span>
            </button>
            <span className="hidden sm:block text-slate-600">|</span>
            <button
              onClick={() => onPageChange?.('driver')}
              className="inline-flex items-center space-x-2 text-slate-400 hover:text-green-400 transition-colors text-sm"
            >
              <span>🚚 Espace Livreur</span>
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-8 text-center">
          <p className="text-slate-400">
            © 2025 The Ice Guys. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>

  );
}

export default Footer;