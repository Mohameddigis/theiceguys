import React from 'react';
import { CheckCircle, MessageCircle, Phone, Mail, ArrowLeft, Package, Clock, Star } from 'lucide-react';

interface ThankYouPageProps {
  onBack: () => void;
  orderNumber?: string;
  customerType: 'professional' | 'individual';
}

function ThankYouPage({ onBack, orderNumber, customerType }: ThankYouPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Merci pour votre commande !
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Votre demande a été envoyée avec succès via WhatsApp. 
            Notre équipe va vous contacter très prochainement.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - What happens next */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Prochaines étapes</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Confirmation rapide</h3>
                  <p className="text-slate-600 text-sm">
                    Notre équipe va examiner votre commande et vous contacter dans les 15 minutes pour confirmer les détails.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Préparation</h3>
                  <p className="text-slate-600 text-sm">
                    Nous préparons vos glaçons de qualité premium selon vos spécifications.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Livraison</h3>
                  <p className="text-slate-600 text-sm">
                    Livraison à l'adresse indiquée selon le créneau choisi (Express ou Standard).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Support */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg mr-4">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Besoin d'aide ?</h2>
            </div>

            <div className="space-y-4">
              <p className="text-slate-600 mb-6">
                Notre équipe est disponible pour répondre à toutes vos questions.
              </p>

              <a
                href="https://wa.me/212693675981"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <MessageCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-green-700">WhatsApp</p>
                  <p className="text-sm text-slate-600">+212 693 675 981</p>
                </div>
              </a>

              <a
                href="tel:+212693675981"
                className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <Phone className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-blue-700">Téléphone</p>
                  <p className="text-sm text-slate-600">+212 693 675 981</p>
                </div>
              </a>

              <a
                href="mailto:commandes@glaconsmarrakech.com"
                className="flex items-center space-x-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
              >
                <Mail className="h-6 w-6 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-slate-700">Email</p>
                  <p className="text-sm text-slate-600">commandes@glaconsmarrakech.com</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Order Reference */}
        {orderNumber && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-brand-primary mr-2" />
              <h3 className="text-lg font-semibold text-slate-900">Référence de commande</h3>
            </div>
            <p className="text-2xl font-bold text-brand-primary">{orderNumber}</p>
            <p className="text-sm text-slate-600 mt-2">
              Gardez cette référence pour le suivi de votre commande
            </p>
          </div>
        )}

        {/* Testimonials */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Ce que disent nos clients
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-3">
                "Service impeccable et glaçons de qualité exceptionnelle !"
              </p>
              <p className="font-semibold text-brand-primary">My FIRST PROPERTY</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-3">
                "Livraisons toujours à temps, très professionnel."
              </p>
              <p className="font-semibold text-brand-primary">Gravity Park</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-3">
                "Excellent rapport qualité-prix, je recommande !"
              </p>
              <p className="font-semibold text-brand-primary">Table M</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl p-8 text-center text-white mb-8">
          <h2 className="text-3xl font-bold mb-4">Merci de votre confiance !</h2>
          <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
            {customerType === 'professional' 
              ? "Nous sommes fiers de servir votre entreprise avec des glaçons de qualité premium."
              : "Nous sommes ravis de vous compter parmi nos clients satisfaits."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onBack}
              className="bg-white text-brand-secondary px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour à l'accueil</span>
            </button>
            <a
              href="https://wa.me/212693675981"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Nous contacter</span>
            </a>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-slate-600">
          <p className="mb-2">
            <strong>The Ice Guys</strong> - Premium Ice Marrakech
          </p>
          <p className="text-sm">
            📍 Chrifia, Marrakech | 📞 +212 693 675 981 | 📧 commandes@glaconsmarrakech.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default ThankYouPage;