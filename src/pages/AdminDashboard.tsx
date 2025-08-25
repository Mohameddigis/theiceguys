import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Users, TrendingUp, Clock, CheckCircle, XCircle, Truck, Eye, Phone, Mail, MapPin, Calendar, Filter, Search, RefreshCw, LogOut, Download, UserPlus, Navigation } from 'lucide-react';
import { orderService, driverService, Order, Customer, DeliveryDriver } from '../lib/supabase';
import { generateOrderPDF } from '../utils/pdfGenerator';
import MapboxMap from '../components/MapboxMap';

interface AdminDashboardProps {
  onBack: () => void; // This will now handle logout
}

function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [driverLocations, setDriverLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDriverManagement, setShowDriverManagement] = useState(false);
  const [showDriverMap, setShowDriverMap] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });

  const handleDownloadPDF = async (order: Order) => {
    try {
      await generateOrderPDF(order);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du bon de commande');
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    loadOrders();
    loadDrivers();
    loadDriverLocations();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      console.log('Chargement des livreurs...');
      
      // Vérification de l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 Auth Debug:');
      console.log('- Current user:', user);
      console.log('- User ID:', user?.id);
      console.log('- Expected admin ID:', '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21');
      console.log('- IDs match:', user?.id === '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21');
      
      // Test direct de la requête
      console.log('🔍 Testing direct query...');
      const { data: testData, error: testError } = await supabase
        .from('delivery_drivers')
        .select('*');
      
      console.log('Direct query result:', { data: testData, error: testError });
      
      const data = await driverService.getAllDrivers();
      console.log('Livreurs récupérés:', data);
      console.log('Nombre de livreurs:', data?.length || 0);
      setDrivers(data);
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
      console.error('Détails complets:', JSON.stringify(error, null, 2));
      setDrivers([]);
    }
  };

  const loadDriverLocations = async () => {
    try {
      const data = await driverService.getAllDriversLastLocations();
      setDriverLocations(data);
    } catch (error) {
      console.error('Erreur lors du chargement des positions:', error);
    }
  };

  const createDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call the Edge Function to create driver securely
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-driver`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDriver.name,
          phone: newDriver.phone,
          email: newDriver.email,
          password_hash: newDriver.password,
          is_active: true,
          current_status: 'offline',
          adminSecret: 'Glaconsmarrakech2025.'
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Reset form and reload drivers
      setNewDriver({ name: '', phone: '', email: '', password: '' });
      await loadDrivers();
      alert('Livreur créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création du livreur:', error);
      alert('Erreur lors de la création du livreur');
    }
  };

  const createDriverOld = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await driverService.createDriver({
        name: newDriver.name,
        phone: newDriver.phone,
        email: newDriver.email,
        password_hash: newDriver.password, // En production, il faudrait hasher le mot de passe
        is_active: true,
        current_status: 'offline'
      });
      setNewDriver({ name: '', phone: '', email: '', password: '' });
      await loadDrivers();
      alert('Livreur créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création du livreur:', error);
      alert('Erreur lors de la création du livreur');
    }
  };

  const assignDriverToOrder = async (orderId: string, driverId: string) => {
    try {
      await driverService.assignDriverToOrder(orderId, driverId);
      await loadOrders();
      alert('Livreur assigné avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('Erreur lors de l\'assignation du livreur');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Find the order to get customer details
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        console.error('Commande non trouvée');
        return;
      }

      // Update status in database
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Send notification email
      await sendStatusNotification(order, newStatus);
      
      // Reload orders
      await loadOrders(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const sendStatusNotification = async (order: Order, newStatus: Order['status']) => {
    try {
      // Prepare order details for notification
      const orderDetails = {
        items: order.order_items?.map(item => ({
          iceType: item.ice_type,
          quantities: {
            '5kg': item.package_size === '5kg' ? item.quantity : 0,
            '10kg': item.package_size === '10kg' ? item.quantity : 0,
            '20kg': item.package_size === '20kg' ? item.quantity : 0,
          },
          totalPrice: item.total_price
        })) || [],
        deliveryInfo: {
          type: order.delivery_type,
          date: order.delivery_date,
          time: order.delivery_time,
          address: order.delivery_address
        },
        total: order.total,
        customerType: order.customer?.type || 'individual',
        companyName: order.customer?.type === 'professional' ? order.customer.name : undefined
      };

      const notificationData = {
        customerEmail: order.customer?.email,
        customerName: order.customer?.contact_name || order.customer?.name,
        orderNumber: order.order_number,
        newStatus: newStatus,
        orderDetails: orderDetails
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-status-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData)
      });

      if (response.ok) {
        console.log('Notification de statut envoyée avec succès');
      } else {
        console.error('Erreur lors de l\'envoi de la notification de statut');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivering': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'delivering': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'delivering': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter === '' || 
      new Date(order.created_at).toISOString().split('T')[0] === dateFilter;
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Statistiques
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0)
  };

  // Gestion des livreurs
  if (showDriverManagement) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => {
              setShowDriverManagement(false);
              setTimeout(scrollToTop, 100);
            }}
            className="flex items-center space-x-2 text-brand-primary hover:text-brand-secondary transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour au dashboard</span>
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Gestion des Livreurs</h1>

            {/* Formulaire d'ajout de livreur */}
            <div className="mb-8 p-6 bg-green-50 rounded-lg">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Ajouter un nouveau livreur</h2>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Debug Info:</strong> {drivers.length} livreur(s) chargé(s)
                </p>
                <button
                  onClick={() => {
                    console.log('🔄 Rechargement manuel des livreurs...');
                    loadDrivers();
                  }}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Recharger les livreurs
                </button>
              </div>
              <form onSubmit={createDriver} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={newDriver.password}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="submit"
                  className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Ajouter le livreur
                </button>
              </form>
            </div>

            {/* Liste des livreurs */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Livreurs ({drivers.length})</h2>
              {drivers.map((driver) => (
                <div key={driver.id} className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{driver.name}</h3>
                    <p className="text-sm text-slate-600">{driver.email} • {driver.phone}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        driver.current_status === 'available' ? 'bg-green-100 text-green-800' :
                        driver.current_status === 'busy' ? 'bg-orange-100 text-orange-800' :
                        driver.current_status === 'on_break' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {driver.current_status === 'available' ? '🟢 Disponible' :
                         driver.current_status === 'busy' ? '🟠 Occupé' :
                         driver.current_status === 'on_break' ? '🟡 En pause' :
                         '⚫ Hors ligne'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        driver.is_active ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {driver.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`tel:${driver.phone}`}
                      className="text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Carte des livreurs
  if (showDriverMap) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => {
              setShowDriverMap(false);
              setTimeout(scrollToTop, 100);
            }}
            className="flex items-center space-x-2 text-brand-primary hover:text-brand-secondary transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour au dashboard</span>
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Positions des Livreurs</h1>
            
            <div className="h-96 rounded-lg overflow-hidden">
              <MapboxMap
                onAddressSelect={() => {}}
                selectedCoordinates={undefined}
              />
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Dernières positions</h2>
              <div className="space-y-3">
                {driverLocations.map((location) => (
                  <div key={location.id} className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{location.driver?.name}</h3>
                      <p className="text-sm text-slate-600">
                        {location.address || `${location.latitude}, ${location.longitude}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(location.recorded_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary hover:text-brand-secondary transition-colors"
                    >
                      <Navigation className="h-5 w-5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => {
              setSelectedOrder(null);
              setTimeout(scrollToTop, 100);
            }}
            className="flex items-center space-x-2 text-brand-primary hover:text-brand-secondary transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour à la liste</span>
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Commande {selectedOrder.order_number}</h1>
                <p className="text-slate-600">
                  Créée le {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')} à {new Date(selectedOrder.created_at).toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full border flex items-center space-x-2 ${getStatusColor(selectedOrder.status)}`}>
                {getStatusIcon(selectedOrder.status)}
                <span className="font-medium">{getStatusLabel(selectedOrder.status)}</span>
              </div>
            </div>

            {/* Actions de statut */}
            <div className="mb-8 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3">Changer le statut :</h3>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(selectedOrder.id, status)}
                    disabled={selectedOrder.status === status}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      selectedOrder.status === status
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {getStatusIcon(status)}
                    <span>{getStatusLabel(status)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assignation de livreur */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3">Assigner un livreur :</h3>
              <div className="flex items-center space-x-4">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      assignDriverToOrder(selectedOrder.id, e.target.value);
                    }
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                  defaultValue={selectedOrder.assigned_driver_id || ''}
                >
                  <option value="">Sélectionner un livreur</option>
                  {drivers.filter(d => d.is_active).map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.current_status})
                    </option>
                  ))}
                </select>
                {selectedOrder.assigned_driver && (
                  <div className="text-sm text-slate-600">
                    Assigné à: <strong>{selectedOrder.assigned_driver.name}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informations client */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Informations client</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium">{selectedOrder.customer?.name}</p>
                      {selectedOrder.customer?.contact_name && (
                        <p className="text-sm text-slate-600">Contact: {selectedOrder.customer.contact_name}</p>
                      )}
                      <p className="text-sm text-slate-600">
                        Type: {selectedOrder.customer?.type === 'professional' ? 'Professionnel' : 'Particulier'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <a href={`tel:${selectedOrder.customer?.phone}`} className="text-brand-primary hover:underline">
                      {selectedOrder.customer?.phone}
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <a href={`mailto:${selectedOrder.customer?.email}`} className="text-brand-primary hover:underline">
                      {selectedOrder.customer?.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Informations de livraison */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Livraison</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Truck className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium">
                        {selectedOrder.delivery_type === 'express' ? 'Express (< 1H)' : 'Standard'}
                      </p>
                      {selectedOrder.delivery_type === 'express' && (
                        <p className="text-sm text-orange-600 font-medium">+100 MAD</p>
                      )}
                    </div>
                  </div>
                  {selectedOrder.delivery_date && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-slate-400" />
                      <p>{selectedOrder.delivery_date} à {selectedOrder.delivery_time}</p>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                    <p className="text-sm">{selectedOrder.delivery_address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles commandés */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Articles commandés</h3>
              <div className="space-y-3">
                {selectedOrder.order_items?.map((item, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium capitalize">{item.ice_type}</p>
                      <p className="text-sm text-slate-600">{item.quantity}x {item.package_size}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.total_price} MAD</p>
                      <p className="text-sm text-slate-600">{item.unit_price} MAD/unité</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-brand-primary">{selectedOrder.total} MAD</span>
              </div>
              <div className="text-sm text-slate-600 mt-2">
                <p>Sous-total: {selectedOrder.subtotal} MAD</p>
                <p>Frais de livraison: {selectedOrder.delivery_fee} MAD</p>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Notes spéciales:</h4>
                <p className="text-slate-700">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Actions rapides */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => handleDownloadPDF(selectedOrder)}
                className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger PDF</span>
              </button>
              <a
                href={`https://wa.me/${selectedOrder.customer?.phone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`tel:${selectedOrder.customer?.phone}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Appeler</span>
              </a>
              <a
                href={`mailto:${selectedOrder.customer?.email}`}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={onBack}
             className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
            >
             <LogOut className="h-5 w-5" />
             <span>Déconnexion</span>
            </button>
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-brand-primary" />
              <h1 className="text-2xl font-bold text-slate-900">Administration The Ice Guys</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowDriverManagement(true);
                  setTimeout(scrollToTop, 100);
                }}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Livreurs</span>
              </button>
              <button
                onClick={() => {
                  setShowDriverMap(true);
                  loadDriverLocations();
                  setTimeout(scrollToTop, 100);
                }}
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Navigation className="h-4 w-4" />
                <span>Carte</span>
              </button>
              <button
                onClick={loadOrders}
                disabled={loading}
                className="flex items-center space-x-2 bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total commandes</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-brand-primary" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Confirmées</p>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Livrées</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-brand-primary">{stats.totalRevenue} MAD</p>
              </div>
              <TrendingUp className="h-8 w-8 text-brand-primary" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="N° commande, client, email..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary appearance-none"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmées</option>
                  <option value="delivering">En livraison</option>
                  <option value="delivered">Livrées</option>
                  <option value="cancelled">Annulées</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('');
                }}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Commandes ({filteredOrders.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
              <p className="mt-2 text-slate-600">Chargement des commandes...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Aucune commande trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Livraison
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-slate-900">{order.order_number}</p>
                          <p className="text-sm text-slate-500">
                            {order.customer?.type === 'professional' ? 'Pro' : 'Part'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{order.customer?.name}</p>
                          {order.assigned_driver && (
                            <p className="text-xs text-green-600">👤 {order.assigned_driver.name}</p>
                          )}
                          <p className="text-sm text-slate-500">{order.customer?.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span>{getStatusLabel(order.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium">
                            {order.delivery_type === 'express' ? 'Express' : 'Standard'}
                          </p>
                          {order.delivery_date && (
                            <p className="text-sm text-slate-500">{order.delivery_date}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{order.total} MAD</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-900">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(order.created_at).toLocaleTimeString('fr-FR')}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setTimeout(scrollToTop, 100);
                            }}
                            className="text-brand-primary hover:text-brand-secondary transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(order)}
                            className="text-green-600 hover:text-green-700 transition-colors"
                            title="Télécharger le bon de commande"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;