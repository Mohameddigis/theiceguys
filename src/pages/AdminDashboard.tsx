import React, { useState, useEffect } from 'react';
import { LogOut, Package, Clock, CheckCircle, XCircle, Truck, Phone, Download, RefreshCw, User, Calendar, AlertCircle, Shield, UserPlus, Users, MapPin } from 'lucide-react';
import { Order, DeliveryDriver, orderService, driverService, supabaseAdmin } from '../lib/supabase';
import { generateOrderPDF } from '../utils/pdfGenerator';

interface AdminDashboardProps {
  onBack: () => void;
}

function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers'>('orders');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [assigningOrder, setAssigningOrder] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [assigningDriver, setAssigningDriver] = useState(false);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    is_active: true,
    current_status: 'offline' as const
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadOrders(), loadDrivers()]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      console.log('📦 Chargement des commandes...');
      const data = await orderService.getAllOrders();
      console.log('✅ Commandes chargées:', data?.length || 0);
      setOrders(data || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des commandes:', error);
      setOrders([]);
    }
  };

  const loadDrivers = async () => {
    try {
      console.log('🚚 Chargement des livreurs...');
      const data = await driverService.getAllDrivers();
      console.log('✅ Livreurs chargés:', data?.length || 0);
      setDrivers(data || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des livreurs:', error);
      setDrivers([]);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      
      // Mettre à jour le statut
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Recharger les commandes
      await loadOrders();
      
      // Mettre à jour la commande sélectionnée si c'est celle-ci
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const assignDriverToOrder = async (orderId: string, driverId: string) => {
    try {
      setAssigningDriver(true);
      
      // Assigner le livreur à la commande
      await driverService.assignDriverToOrder(orderId, driverId);
      
      // Recharger les commandes
      await loadOrders();
      
      // Fermer le modal
      setShowAssignDriver(null);
      
      alert('Livreur assigné avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'assignation du livreur:', error);
      alert('Erreur lors de l\'assignation du livreur');
    } finally {
      setAssigningDriver(false);
    }
  };

  const createDriver = async () => {
    try {
      console.log('🚚 Création du livreur...');
      
      // Validation des données
      if (!newDriver.name || !newDriver.phone || !newDriver.email || !newDriver.password) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Appel à la fonction edge pour créer le livreur
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-driver`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newDriver,
          adminSecret: 'TheIceGuys2025.'
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création du livreur');
      }

      console.log('✅ Livreur créé avec succès:', result.data);
      
      // Recharger les livreurs
      await loadDrivers();
      
      // Reset form
      setNewDriver({
        name: '',
        phone: '',
        email: '',
        password: '',
        is_active: true,
        current_status: 'offline'
      });
      
      setShowCreateDriver(false);
      alert('Livreur créé avec succès ! Un email de bienvenue a été envoyé.');
    } catch (error) {
      console.error('❌ Erreur lors de la création du livreur:', error);
      alert(`Erreur lors de la création du livreur: ${error.message}`);
    }
  };

  const deleteDriver = async (driverId: string, driverName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le livreur "${driverName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      console.log('🗑️ Suppression du livreur...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-driver`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          adminSecret: 'TheIceGuys2025.'
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression du livreur');
      }

      console.log('✅ Livreur supprimé avec succès');
      
      // Recharger les livreurs
      await loadDrivers();
      
      alert('Livreur supprimé avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du livreur:', error);
      alert(`Erreur lors de la suppression du livreur: ${error.message}`);
    }
  };

  const handleDownloadPDF = async (order: Order) => {
    try {
      await generateOrderPDF(order);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du bon de commande');
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      setAssigningOrder(true);
      
      // Assigner le livreur à la commande
      await driverService.assignDriverToOrder(orderId, driverId);
      
      // Mettre à jour le statut de la commande à "confirmed"
      await driverService.updateOrderStatus(orderId, 'confirmed');
      
      // Recharger les données
      await Promise.all([loadOrders(), loadDrivers()]);
      
      // Fermer le modal
      setShowAssignModal(false);
      setOrderToAssign(null);
      
      alert('Commande assignée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('Erreur lors de l\'assignation de la commande');
    } finally {
      setAssigningOrder(false);
    }
  };

  const openAssignModal = (order: Order) => {
    setOrderToAssign(order);
    setShowAssignModal(true);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-200';
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
      case 'preparing': return <Package className="h-4 w-4" />;
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
      case 'preparing': return 'En préparation';
      case 'delivering': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getDriverStatusColor = (status: DeliveryDriver['current_status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'on_break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDriverStatusLabel = (status: DeliveryDriver['current_status']) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'busy': return 'Occupé';
      case 'on_break': return 'En pause';
      case 'offline': return 'Hors ligne';
      default: return status;
    }
  };

  const getIceTypeName = (iceType: string): string => {
    switch (iceType) {
      case 'nuggets': return "Nugget's";
      case 'gourmet': return 'Gourmet';
      case 'cubique': return 'Glace Paillette';
      default: return iceType;
    }
  };

  // Statistiques
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    express: orders.filter(o => o.delivery_type === 'express').length
  };

  const driverStats = {
    total: drivers.length,
    active: drivers.filter(d => d.is_active).length,
    available: drivers.filter(d => d.current_status === 'available').length,
    busy: drivers.filter(d => d.current_status === 'busy').length
  };

  // Modal d'assignation de livreur
  const AssignDriverModal = ({ order }: { order: Order }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Assigner un livreur
            </h3>
            <button
              onClick={() => setShowAssignDriver(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">Commande {order.order_number}</h4>
            <p className="text-sm text-slate-600">
              Client: {order.customer?.name} | Total: {order.total} MAD
            </p>
            {order.delivery_type === 'express' && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  ⚡ EXPRESS
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-slate-900">Livreurs disponibles :</h4>
            {drivers.filter(d => d.is_active && d.current_status === 'available').length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Truck className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>Aucun livreur disponible</p>
                <p className="text-sm">Tous les livreurs sont occupés ou hors ligne</p>
              </div>
            ) : (
              drivers
                .filter(d => d.is_active && d.current_status === 'available')
                .map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => assignDriverToOrder(order.id, driver.id)}
                    disabled={assigningDriver}
                    className="w-full p-4 text-left bg-slate-50 hover:bg-green-50 rounded-lg border border-slate-200 hover:border-green-300 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{driver.name}</p>
                        <p className="text-sm text-slate-600">{driver.phone}</p>
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border font-medium mt-1 ${getDriverStatusColor(driver.current_status)}`}>
                          <span>{getDriverStatusLabel(driver.current_status)}</span>
                        </div>
                      </div>
                      <div className="text-green-600">
                        <Truck className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                ))
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowAssignDriver(null)}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Modal de création de livreur
  const CreateDriverModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Créer un nouveau livreur
            </h3>
            <button
              onClick={() => setShowCreateDriver(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet *</label>
              <input
                type="text"
                value={newDriver.name}
                onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom du livreur"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone *</label>
              <input
                type="tel"
                value={newDriver.phone}
                onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+212 6XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
              <input
                type="email"
                value={newDriver.email}
                onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe *</label>
              <input
                type="password"
                value={newDriver.password}
                onChange={(e) => setNewDriver(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mot de passe sécurisé"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={newDriver.is_active}
                onChange={(e) => setNewDriver(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                Livreur actif
              </label>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowCreateDriver(false)}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={createDriver}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header fixe */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setTimeout(scrollToTop, 100);
                }}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Package className="h-5 w-5 rotate-180" />
                <span>Retour aux commandes</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1">{getStatusLabel(selectedOrder.status)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* En-tête de commande */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Commande {selectedOrder.order_number}</h1>
                  <p className="text-blue-100">
                    {selectedOrder.delivery_type === 'express' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white mr-2">
                        ⚡ EXPRESS
                      </span>
                    )}
                    Créée le {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')} à {new Date(selectedOrder.created_at).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{selectedOrder.total} MAD</div>
                  <div className="text-blue-100 text-sm">Total</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Actions admin */}
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Actions administrateur :
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(['confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status || updatingStatus === selectedOrder.id}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        selectedOrder.status === status
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : updatingStatus === selectedOrder.id
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-white border border-blue-300 hover:bg-blue-100 text-blue-700'
                      }`}
                    >
                      {updatingStatus === selectedOrder.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        getStatusIcon(status)
                      )}
                      <span>{getStatusLabel(status)}</span>
                    </button>
                  ))}
                </div>
                
                {/* Assignation de livreur */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">
                      Livreur assigné: {selectedOrder.assigned_driver?.name || 'Aucun'}
                    </p>
                    {selectedOrder.assigned_driver && (
                      <p className="text-sm text-slate-600">
                        {selectedOrder.assigned_driver.phone} - 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${getDriverStatusColor(selectedOrder.assigned_driver.current_status)}`}>
                          {getDriverStatusLabel(selectedOrder.assigned_driver.current_status)}
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAssignDriver(selectedOrder)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{selectedOrder.assigned_driver ? 'Changer' : 'Assigner'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations client */}
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Informations client
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-slate-900 text-lg">{selectedOrder.customer?.name}</p>
                        {selectedOrder.customer?.contact_name && (
                          <p className="text-sm text-slate-600">Contact: {selectedOrder.customer.contact_name}</p>
                        )}
                        <p className="text-sm text-slate-600">
                          Type: {selectedOrder.customer?.type === 'professional' ? '🏢 Professionnel' : '👤 Particulier'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-green-600" />
                        <a 
                          href={`tel:${selectedOrder.customer?.phone}`} 
                          className="text-green-600 hover:text-green-700 font-medium text-lg"
                        >
                          {selectedOrder.customer?.phone}
                        </a>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <a 
                          href={`mailto:${selectedOrder.customer?.email}`} 
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {selectedOrder.customer?.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Articles commandés */}
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Package className="h-5 w-5 mr-2 text-blue-600" />
                      Articles commandés
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.order_items?.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-slate-900 capitalize">{getIceTypeName(item.ice_type)}</p>
                              <p className="text-sm text-slate-600">{item.quantity}x {item.package_size}</p>
                              <p className="text-xs text-slate-500">{item.unit_price} MAD/unité</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-600 text-lg">{item.total_price} MAD</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Informations de livraison */}
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Truck className="h-5 w-5 mr-2 text-orange-600" />
                      Informations de livraison
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedOrder.delivery_type === 'express' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedOrder.delivery_type === 'express' ? '⚡ Express' : '📅 Standard'}
                        </div>
                      </div>
                      
                      {selectedOrder.delivery_type === 'express' ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-orange-800 font-medium">🚨 Livraison prioritaire</p>
                          <p className="text-orange-700 text-sm">À livrer en moins d'1 heure</p>
                        </div>
                      ) : (
                        selectedOrder.delivery_date && (
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            <div>
                              <p className="font-medium">{selectedOrder.delivery_date}</p>
                              <p className="text-sm text-slate-600">{selectedOrder.delivery_time}</p>
                            </div>
                          </div>
                        )
                      )}

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-slate-900">{selectedOrder.delivery_address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions rapides</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleDownloadPDF(selectedOrder)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium"
                      >
                        <Download className="h-5 w-5" />
                        <span>Télécharger bon de commande</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes spéciales */}
              {selectedOrder.notes && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-slate-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Notes spéciales du client :
                  </h4>
                  <p className="text-slate-700">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Résumé total */}
              <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Total de la commande</h3>
                    <p className="text-blue-100">Sous-total: {selectedOrder.subtotal} MAD + Livraison: {selectedOrder.delivery_fee} MAD</p>
                  </div>
                  <div className="text-3xl font-bold">{selectedOrder.total} MAD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar fixe */}
      <div className="w-64 bg-white shadow-lg border-r border-slate-200 fixed h-full z-30">
        <div className="p-6">
          {/* Logo/Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full w-10 h-10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Administration</h1>
              <p className="text-sm text-slate-600">The Ice Guys</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Package className="h-5 w-5" />
              <span>Commandes</span>
              <span className={`ml-auto px-2 py-1 rounded-full text-xs font-bold ${
                activeTab === 'orders'
                  ? 'bg-white/20 text-white'
                  : 'bg-brand-primary text-white'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('drivers')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'drivers'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Truck className="h-5 w-5" />
              <span>Livreurs</span>
              <span className={`ml-auto px-2 py-1 rounded-full text-xs font-bold ${
                activeTab === 'drivers'
                  ? 'bg-white/20 text-white'
                  : 'bg-green-500 text-white'
              }`}>
                {drivers.length}
              </span>
            </button>
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content avec margin pour la sidebar */}
      <div className="flex-1 ml-64">
      {/* Header fixe */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {activeTab === 'orders' ? '📦 Gestion des Commandes' : '🚚 Gestion des Livreurs'}
              </h2>
              <p className="text-slate-600">
                {activeTab === 'orders' 
                  ? `${orders.length} commande(s) au total`
                  : `${drivers.length} livreur(s) dans l'équipe`
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
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
        {activeTab === 'orders' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{orderStats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Confirmées</p>
                  <p className="text-2xl font-bold text-blue-600">{orderStats.confirmed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">En livraison</p>
                  <p className="text-2xl font-bold text-orange-600">{orderStats.delivering}</p>
                </div>
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Livrées</p>
                  <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Express</p>
                  <p className="text-2xl font-bold text-orange-600">{orderStats.express}</p>
                </div>
                <div className="text-orange-600">⚡</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{driverStats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{driverStats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{driverStats.available}</p>
                </div>
                <Truck className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Occupés</p>
                  <p className="text-2xl font-bold text-orange-600">{driverStats.busy}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        {activeTab === 'orders' ? (
          /* Liste des commandes */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-lg font-semibold text-slate-900">
                Toutes les commandes ({orders.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Chargement des commandes...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Aucune commande</p>
                <p className="text-sm">Les nouvelles commandes apparaîtront ici</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {orders.map((order) => (
                  <div key={order.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="font-semibold text-slate-900 text-lg">{order.order_number}</h3>
                          {order.delivery_type === 'express' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                              ⚡ EXPRESS
                            </span>
                          )}
                          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs border font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span>{getStatusLabel(order.status)}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="font-medium text-slate-900 flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {order.customer?.name}
                            </p>
                            {order.customer?.contact_name && (
                              <p className="text-slate-600">Contact: {order.customer.contact_name}</p>
                            )}
                            <p className="text-slate-600 flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {order.customer?.phone}
                            </p>
                          </div>
                          
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="font-medium text-slate-900 flex items-center">
                              <Truck className="h-4 w-4 mr-1" />
                              Livreur
                            </p>
                            {order.assigned_driver ? (
                              <div>
                                <p className="text-slate-600">{order.assigned_driver.name}</p>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs border font-medium mt-1 ${getDriverStatusColor(order.assigned_driver.current_status)}`}>
                                  <span>{getDriverStatusLabel(order.assigned_driver.current_status)}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-red-600 font-medium">Non assigné</p>
                            )}
                          </div>
                          
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="font-medium text-slate-900 flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Livraison
                            </p>
                            {order.delivery_date ? (
                              <p className="text-slate-600">{order.delivery_date} à {order.delivery_time}</p>
                            ) : (
                              <p className="text-orange-600 font-medium">Dès que possible</p>
                            )}
                          </div>
                          
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="font-medium text-slate-900">Total</p>
                            <p className="text-blue-600 font-bold text-lg">{order.total} MAD</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-slate-700 flex items-start space-x-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
                            <span>{order.delivery_address}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setTimeout(scrollToTop, 100);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Voir détails
                        </button>
                        
                        {!order.assigned_driver && (
                          <button
                            onClick={() => setShowAssignDriver(order)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                          >
                            <UserPlus className="h-3 w-3" />
                            <span>Assigner</span>
                          </button>
                        )}
                        
                        {order.assigned_driver && order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivering')}
                            disabled={updatingStatus === order.id}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            {updatingStatus === order.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <Truck className="h-3 w-3" />
                            )}
                            <span>Démarrer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Liste des livreurs */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Livreurs ({drivers.length})
              </h2>
              <button
                onClick={() => setShowCreateDriver(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nouveau livreur</span>
              </button>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Chargement des livreurs...</p>
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Aucun livreur</p>
                <p className="text-sm mb-4">Créez votre premier livreur pour commencer</p>
                <button
                  onClick={() => setShowCreateDriver(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Créer un livreur
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {drivers.map((driver) => {
                  const assignedOrders = orders.filter(o => o.assigned_driver_id === driver.id && ['confirmed', 'delivering'].includes(o.status));
                  
                  return (
                    <div key={driver.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="font-semibold text-slate-900 text-lg">{driver.name}</h3>
                            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs border font-medium ${getDriverStatusColor(driver.current_status)}`}>
                              <span>{getDriverStatusLabel(driver.current_status)}</span>
                            </div>
                            {!driver.is_active && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactif
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="font-medium text-slate-900 flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                Contact
                              </p>
                              <p className="text-slate-600">{driver.phone}</p>
                              <p className="text-slate-600 text-xs">{driver.email}</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="font-medium text-slate-900 flex items-center">
                                <Package className="h-4 w-4 mr-1" />
                                Commandes actives
                              </p>
                              <p className="text-orange-600 font-bold text-lg">{assignedOrders.length}</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="font-medium text-slate-900">Créé le</p>
                              <p className="text-slate-600">{new Date(driver.created_at).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                          
                          {assignedOrders.length > 0 && (
                            <div className="mt-3 bg-orange-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-orange-800 mb-2">Commandes assignées :</p>
                              <div className="space-y-1">
                                {assignedOrders.map(order => (
                                  <div key={order.id} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-700">{order.order_number}</span>
                                    <span className={`px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                      {getStatusLabel(order.status)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => deleteDriver(driver.id, driver.name)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Modal d'assignation */}
      {showAssignModal && orderToAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Assigner la commande {orderToAssign.order_number}
                </h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setOrderToAssign(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Client :</strong> {orderToAssign.customer?.name}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Adresse :</strong> {orderToAssign.delivery_address}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Total :</strong> {orderToAssign.total} MAD
                </p>
                {orderToAssign.delivery_type === 'express' && (
                  <p className="text-sm text-orange-600 font-semibold">
                    ⚡ Livraison Express - Priorité
                  </p>
                )}
              </div>
              
              <div className="space-y-2 mb-6">
                <h4 className="font-medium text-slate-900">Sélectionner un livreur :</h4>
                {drivers
                  .filter(driver => driver.is_active && driver.current_status === 'available')
                  .map(driver => (
                    <button
                      key={driver.id}
                      onClick={() => handleAssignDriver(orderToAssign.id, driver.id)}
                      disabled={assigningOrder}
                      className="w-full text-left p-3 bg-slate-50 hover:bg-green-50 rounded-lg border border-slate-200 hover:border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{driver.name}</p>
                          <p className="text-sm text-slate-600">{driver.phone}</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Disponible
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {orders.filter(o => o.assigned_driver_id === driver.id && ['confirmed', 'delivering'].includes(o.status)).length} commande(s)
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                
                {drivers.filter(driver => driver.is_active && driver.current_status === 'available').length === 0 && (
                  <div className="text-center py-4 text-slate-500">
                    <p>Aucun livreur disponible actuellement</p>
                    <p className="text-sm">Les livreurs doivent être actifs et disponibles</p>
                  </div>
                )}
              </div>
              
              {assigningOrder && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-slate-600 mt-2">Attribution en cours...</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setOrderToAssign(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateDriver && <CreateDriverModal />}
      {showAssignDriver && <AssignDriverModal order={showAssignDriver} />}
    </div>
  );
}

export default AdminDashboard;