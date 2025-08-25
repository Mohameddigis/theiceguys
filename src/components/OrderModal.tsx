import React from 'react';
import { Building2, Users, ArrowRight, Snowflake } from 'lucide-react';

interface HeroProps {
  onOrderClick: (type: 'professional' | 'individual') => void;
}

function Hero({ onOrderClick }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background with image and overlays */}
      <div className="absolute inset-0">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://boutique.erisay-traiteur.fr/wp-content/uploads/2015/03/glacons-e1601543034905.jpg)'
          }}
        ></div>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        {/* Gradient overlay with brand colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-brand-light/20"></div>
        {/* Animated ice crystals */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <Snowflake className="h-4 w-4 text-white/20" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main content */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h1 className="w-[90%] mx-auto text-5xl sm:text-6xl lg:text-8xl font-bold leading-tight drop-shadow-lg">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-light to-brand-secondary">
                GLAÇONS
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-light via-brand-secondary to-white">
                MARRAKECH
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Votre partenaire de confiance pour des glaçons de qualité supérieure. 
              Livraison rapide pour professionnels et particuliers.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => onOrderClick('professional')}
              className="group bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-3 w-full sm:w-auto"
            >
              <Building2 className="h-6 w-6" />
              <span>Professionnel</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onOrderClick('individual')}
              className="group bg-white/95 backdrop-blur-sm text-slate-900 border-2 border-white/50 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:border-brand-secondary hover:bg-white transition-all duration-300 hover:scale-105 flex items-center space-x-3 w-full sm:w-auto"
            >
              <Users className="h-6 w-6" />
              <span>Particulier</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;