import React, { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle, Send } from 'lucide-react';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Contact depuis le site - ${formData.name}`;
    const body = `Nom: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`;
    window.open(`mailto:contact@myfirst-property.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Contactez
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
              The Ice Guys
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Une question ? Un devis personnalisé ? Notre équipe est à votre disposition 
            pour répondre à tous vos besoins en glaçons premium.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Nos Coordonnées</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Adresse</h3>
                    <p className="text-slate-600">
                      Chrifia, Marrakech<br />
                      Maroc
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">WhatsApp</h3>
                    <a 
                      href="https://wa.me/212693675981"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      +212 693 675 981
                    </a>
                    <p className="text-sm text-slate-500 mt-1">
                      Réponse rapide garantie
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-r from-brand-accent to-brand-primary rounded-lg">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Email</h3>
                    <a 
                      href="mailto:contact@myfirst-property.com"
                      className="text-brand-accent hover:text-brand-primary font-medium"
                    >
                      contact@myfirst-property.com
                    </a>
                    <p className="text-sm text-slate-500 mt-1">
                      Pour devis et commandes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Actions */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Contact Rapide</h3>
              <div className="space-y-3">
                <a
                  href="https://wa.me/212693675981?text=Bonjour, je souhaite passer une commande de glaçons"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 group"
                >
                  <MessageCircle className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Commande WhatsApp</div>
                    <div className="text-sm text-green-100">Commande directe et rapide</div>
                  </div>
                  <div className="ml-auto group-hover:translate-x-1 transition-transform">
                    <Send className="h-5 w-5" />
                  </div>
                </a>

                <a
                  href="https://wa.me/212693675981?text=Bonjour, je souhaite obtenir un devis personnalisé"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-4 rounded-xl hover:from-brand-secondary hover:to-brand-light transition-all duration-200 group"
                >
                  <Phone className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Devis Personnalisé</div>
                    <div className="text-sm text-blue-100">Tarifs adaptés à vos besoins</div>
                  </div>
                  <div className="ml-auto group-hover:translate-x-1 transition-transform">
                    <Send className="h-5 w-5" />
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Envoyez-nous un message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block font-medium text-slate-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors"
                    placeholder="Votre nom complet"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block font-medium text-slate-700 mb-2">
                    Adresse email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block font-medium text-slate-700 mb-2">
                    Votre message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors resize-none"
                    placeholder="Décrivez vos besoins, questions ou demandes spécifiques..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white py-3 px-6 rounded-lg font-semibold hover:from-brand-secondary hover:to-brand-light transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>Envoyer le message</span>
                </button>
              </form>
            </div>

            {/* Map placeholder */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Localisation</h3>
              <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">Chrifia, Marrakech</p>
                  <p className="text-sm">Zone de livraison principale</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4">
                Nous livrons dans tout Marrakech et ses environs. 
                Contactez-nous pour vérifier la disponibilité dans votre zone.
              </p>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="mt-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Horaires de Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Commandes WhatsApp</h3>
              <p className="text-blue-100">24h/24 - 7j/7</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Livraisons</h3>
              <p className="text-blue-100">Lun-Dim: 8h - 20h</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Support Client</h3>
              <p className="text-blue-100">Lun-Ven: 9h - 18h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;