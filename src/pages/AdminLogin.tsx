import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        setError('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      if (data.user && data.user.email === 'commandes@glaconsmarrakech.com') {
        // Store admin session
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_login_time', Date.now().toString());
        onLogin();
      } else {
        setError('Accès non autorisé - Compte administrateur requis');
        await supabase.auth.signOut();
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    }
    
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Administration</h1>
            <p className="text-slate-600">The Ice Guys - Connexion sécurisée</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email administrateur
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors"
                  placeholder="commandes@glaconsmarrakech.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-colors"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-lg hover:scale-105'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connexion...</span>
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Back button */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-slate-600 hover:text-brand-primary transition-colors mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour au site</span>
            </button>
          </div>

          {/* Security notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              🔒 Connexion sécurisée - Accès réservé aux administrateurs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;