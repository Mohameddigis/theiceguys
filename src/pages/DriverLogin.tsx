import React, { useState } from 'react';
import { ArrowLeft, Truck, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DriverLoginProps {
  onLogin: (driverId: string, driverName: string) => void;
  onBack: () => void;
}

function DriverLogin({ onLogin, onBack }: DriverLoginProps) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Livreurs de test (en production, cela viendrait de la base de données)
  const TEST_DRIVERS = [
    { id: '1', email: 'ahmed.livreur@glaconsmarrakech.com', password: 'Ahmed2025', name: 'Ahmed Benali' },
    { id: '2', email: 'youssef.livreur@glaconsmarrakech.com', password: 'Youssef2025', name: 'Youssef Alami' },
    { id: '3', email: 'omar.livreur@glaconsmarrakech.com', password: 'Omar2025', name: 'Omar Tazi' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        setError('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      // Get driver info from delivery_drivers table
      const { data: driverData, error: driverError } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (driverError || !driverData) {
        setError('Profil livreur non trouvé');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Store driver session
      localStorage.setItem('driver_authenticated', 'true');
      localStorage.setItem('driver_id', driverData.id);
      localStorage.setItem('driver_name', driverData.name);
      localStorage.setItem('driver_login_time', Date.now().toString());
      
      // Mettre le statut du livreur à "available" lors de la connexion
      await supabase
        .from('delivery_drivers')
        .update({ current_status: 'available' })
        .eq('id', driverData.id);
      
      onLogin(driverData.id, driverData.name);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Espace Livreur</h1>
            <p className="text-slate-600">The Ice Guys - Connexion livreur</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email livreur
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
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:scale-105'
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
              className="flex items-center space-x-2 text-slate-600 hover:text-green-600 transition-colors mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour au site</span>
            </button>
          </div>

          {/* Security notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              🚚 Espace réservé aux livreurs The Ice Guys
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverLogin;