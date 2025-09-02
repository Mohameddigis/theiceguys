import React from 'react';
import { MapPin, Award, Users, Truck } from 'lucide-react';

function About() {
  const clients = [
    'My FIRST PROPERTY',
    'Gravity Park',
    'Paddle Square',
    'Zone Aire',
    'Table M'
  ];

  return (
    <div className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            À propos de
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
              The Ice Guys
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Basés à Chrifia, nous livrons des glaçons premium aux professionnels et particuliers. 
            Nous servons des institutions reconnues et nous nous engageons à fournir des produits 
            de la plus haute qualité.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left Column - Story */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg mr-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Notre Histoire</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                Implantés au cœur de Chrifia à Marrakech, nous avons développé notre expertise 
                dans la production et la distribution de glaçons de qualité supérieure. Notre 
                engagement envers l'excellence nous a permis de devenir le partenaire de confiance 
                de nombreux établissements prestigieux.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Que vous soyez un professionnel de l'hôtellerie, de la restauration, ou un
                particulier organisant un événement, nous mettons notre savoir-faire à votre
                service pour répondre à tous vos besoins en glaçons.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg mr-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Notre Engagement</h2>
              </div>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start">
                  <span className="block w-2 h-2 bg-brand-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Qualité premium garantie pour tous nos produits</span>
                </li>
                <li className="flex items-start">
                  <span className="block w-2 h-2 bg-brand-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Livraison rapide et fiable dans tout Marrakech</span>
                </li>
                <li className="flex items-start">
                  <span className="block w-2 h-2 bg-brand-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Service client personnalisé et réactif</span>
                </li>
                <li className="flex items-start">
                  <span className="block w-2 h-2 bg-brand-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Tarifs compétitifs pour tous types de clients</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Features & Clients */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg mr-4">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Nos Services</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Types de Glaçons</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Nugget's</li>
                    <li>• Gourmet</li>
                    <li>• Cubique</li>
                    <li>• Glace Paillette</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Conditionnements</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Sacs de 5 kg</li>
                    <li>• Sacs de 20 kg</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg mr-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Nos Clients de Confiance</h2>
              </div>
              <p className="text-slate-600 mb-4">
                Nous sommes fiers de servir des établissements reconnus à Marrakech :
              </p>
              <div className="space-y-3">
                {clients.map((client, index) => (
                  <div 
                    key={index}
                    className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-3 border-l-4 border-brand-secondary"
                  >
                    <span className="font-medium text-slate-900">{client}</span>
                  </div>
                ))}
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <span className="text-slate-600 font-medium">... et bien d'autres</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Prêt à passer commande ?</h2>
          <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
            Rejoignez nos clients satisfaits et découvrez la qualité The Ice Guys.
            Commandez dès maintenant ou contactez-nous pour plus d'informations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/212693675981"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-brand-secondary px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Contactez-nous sur WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;