import React from 'react';
import { Building2, Users, ArrowRight, Snowflake, Star, Truck, Clock, Shield } from 'lucide-react';

interface HeroProps {
  onOrderClick: (type: 'professional' | 'individual') => void;
}

function Hero({ onOrderClick }: HeroProps) {
  const features = [
    {
      icon: Shield,
      title: 'Qualité Premium',
      description: 'Glaçons de qualité supérieure, produits selon les normes les plus strictes'
    },
    {
      icon: Truck,
      title: 'Livraison Rapide',
      description: 'Livraison standard ou express dans tout Marrakech'
    },
    {
      icon: Clock,
      title: 'Service 24/7',
      description: 'Commandes WhatsApp disponibles 24h/24, 7j/7'
    }
  ];

  const testimonials = [
    {
      name: 'My FIRST PROPERTY',
      text: 'Service impeccable et glaçons de qualité exceptionnelle. The Ice Guys est notre partenaire de confiance !',
      rating: 5
    },
    {
      name: 'Gravity Park',
      text: 'Livraisons toujours à temps et produits conformes à nos attentes. The Ice Guys est très professionnel.',
      rating: 5
    },
    {
      name: 'Table M',
      text: 'Excellent rapport qualité-prix. Nous recommandons vivement The Ice Guys.',
      rating: 5
    }
  ];

  const iceTypes = [
    {
      name: "Nugget's",
      description: 'Parfaits pour cocktails',
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/nugget-verre.png'
    },
    {
      name: 'Gourmet',
      description: 'Idéaux pour événements',
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/gourmet-verre.png'
    },
    {
      name: 'Glace Paillette',
      description: 'Idéales pour présentation',
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/glace-en-paillettes-110145.jpg'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background with image and overlays */}
        <div className="absolute inset-0">
          {/* Background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/000341.webp)'
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
              {/* Mobile: Image logo */}
              <div className="block sm:hidden">
                <img 
                  src="https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/icon%20ice%20guys.png"
                  alt="The Ice Guys"
                  className="w-72 h-auto mx-auto drop-shadow-lg animate-pulse hover:animate-bounce transition-all duration-300"
                />
              </div>
              
              {/* Desktop: Text title */}
              <h1 className="hidden sm:block w-[90%] mx-auto text-5xl sm:text-6xl lg:text-8xl font-bold leading-tight drop-shadow-lg">
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

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                THE ICE
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-light via-brand-secondary to-white">
                GUYS
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Nos Types de Glaçons</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Découvrez notre gamme complète de glaçons adaptés à tous vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {iceTypes.map((ice, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 relative overflow-hidden">
                  <img 
                    src={ice.image} 
                    alt={ice.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{ice.name}</h3>
                  <p className="text-slate-600">{ice.description}</p>
                  <div className="mt-4 flex items-center text-sm text-brand-primary font-medium">
                    <span>Disponible en 5kg, 20kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Ce que disent nos clients</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              La satisfaction de nos clients est notre priorité absolue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl p-8 hover:bg-slate-100 transition-colors duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">"{testimonial.text}"</p>
                <div className="font-semibold text-brand-primary">{testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-brand-primary to-brand-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Clients satisfaits</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2000+</div>
              <div className="text-blue-100">Commandes livrées</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Service disponible</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Qualité garantie</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Prêt à passer commande ?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Rejoignez nos clients satisfaits et découvrez la qualité The Ice Guys. 
            Commandez dès maintenant ou contactez-nous pour plus d'informations.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => onOrderClick('professional')}
              className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Commander - Professionnel
            </button>
            <button
              onClick={() => onOrderClick('individual')}
              className="bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-all duration-300 hover:scale-105"
            >
              Commander - Particulier
            </button>
          </div>
          <div className="mt-8">
            <a
              href="https://wa.me/212693675981"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
            >
              <span>Ou contactez-nous directement sur WhatsApp</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Hero;