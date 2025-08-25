import React, { useState } from 'react';
import { Menu, X, MessageCircle } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

function Header({ currentPage, onPageChange }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (page: string) => {
    onPageChange(page);
    setIsMenuOpen(false);
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/212123456789', '_blank');
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center"
            >
              <img
                src="https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/Logo%20Noour%20(500%20x%20150%20px)%20(3).png"
                alt="Glaçons Marrakech"
                className="h-16 w-auto"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'text-brand-primary bg-brand-light/10'
                  : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'about'
                  ? 'text-brand-primary bg-brand-light/10'
                  : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
              }`}
            >
              À propos
            </button>
            <button
              onClick={() => handleNavClick('blog')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'blog'
                  ? 'text-brand-primary bg-brand-light/10'
                  : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
              }`}
            >
              Blog
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'contact'
                  ? 'text-brand-primary bg-brand-light/10'
                  : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-brand-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <button
                onClick={() => handleNavClick('home')}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                  currentPage === 'home'
                    ? 'text-brand-primary bg-brand-light/10'
                    : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
                }`}
              >
                Accueil
              </button>
              <button
                onClick={() => handleNavClick('about')}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                  currentPage === 'about'
                    ? 'text-brand-primary bg-brand-light/10'
                    : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
                }`}
              >
                À propos
              </button>
              <button
                onClick={() => handleNavClick('blog')}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                  currentPage === 'blog'
                    ? 'text-brand-primary bg-brand-light/10'
                    : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
                }`}
              >
                Blog
              </button>
              <button
                onClick={() => handleNavClick('contact')}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                  currentPage === 'contact'
                    ? 'text-brand-primary bg-brand-light/10'
                    : 'text-gray-700 hover:text-brand-primary hover:bg-gray-50'
                }`}
              >
                Contact
              </button>
              
              {/* WhatsApp button in mobile menu */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleWhatsAppClick}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-green-600 hover:text-green-700 hover:bg-green-50 w-full transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;