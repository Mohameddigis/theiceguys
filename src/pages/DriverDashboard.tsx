import React, { useState, useEffect } from 'react';
import { LogOut, Package, Clock, CheckCircle, XCircle, Truck, MapPin, Phone, Download, RefreshCw, Navigation } from 'lucide-react';
import { Order, driverService } from '../lib/supabase';
import { generateOrderPDF } from '../utils/pdfGenerator';

interface DriverDashboardProps {
  driverId: string;
  driverName: string;
  onLogout: () => void;
}

function DriverDashboard({ driverId, driverName, onLogout }: DriverDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [driverId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await driverService.getDriverOrders(driverId);
      setOrders(data);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      
      // Mettre à jour le statut
      await driverService.updateOrderStatus(orderId, newStatus);
      
      // Si la commande est livrée, enregistrer la position
      if (newStatus === 'delivered') {
        recordCurrentLocation();
      }
      
      // Recharger les commandes
      await loadOrders();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateDriverStatus = async (status: 'offline' | 'available' | 'busy' | 'on_break') => {
    try {
      await driverService.updateDriverStatus(driverId, status);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut livreur:', error);
    }
  };

  const recordCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await driverService.recordDriverLocation(
              driverId,
              position.coords.latitude,
              position.coords.longitude
            );
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la position:', error);
          }
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
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

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivering': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'delivering': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return 'Confirmée';
      case 'delivering': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const canUpdateStatus = (currentStatus: Order['status'], newStatus: Order['status']) => {
    const allowedStatuses = ['delivering', 'delivered', 'cancelled'];
    return allowedStatuses.includes(newStatus);
  };

  // Séparer les commandes express et standard
  const expressOrders = orders.filter(order => order.delivery_type === 'express');
  const standardOrders = orders.filter(order => order.delivery_type === 'standard');
  const sortedOrders = [...expressOrders, ...standardOrders];

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => {
              setSelectedOrder(null);
              setTimeout(scrollToTop, 100);
            }}
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors mb-6"
          >
            <Truck className="h-5 w-5 rotate-180" />
            <span>Retour à mes livraisons</span>
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Commande {selectedOrder.order_number}</h1>
                <p className="text-slate-600">
                  {selectedOrder.delivery_type === 'express' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mr-2">
                      ⚡ EXPRESS
                    </span>
                  )}
                  Créée le {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full border flex items-center space-x-2 ${getStatusColor(selectedOrder.status)}`}>
                {getStatusIcon(selectedOrder.status)}
                <span className="font-medium">{getStatusLabel(selectedOrder.status)}</span>
              </div>
            </div>

            {/* Actions de statut pour livreur */}
            <div className="mb-8 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3">Actions livreur :</h3>
              <div className="flex flex-wrap gap-2">
                {(['delivering', 'delivered', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(selectedOrder.id, status)}
                    disabled={selectedOrder.status === status || updatingStatus === selectedOrder.id}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      selectedOrder.status === status
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : updatingStatus === selectedOrder.id
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-white border border-green-300 hover:bg-green-100 text-green-700'
                    }`}
                  >
                    {updatingStatus === selectedOrder.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    ) : (
                      getStatusIcon(status)
                    )}
                    <span>{getStatusLabel(status)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informations client */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Informations client</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-slate-400" />
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
                    <a href={`tel:${selectedOrder.customer?.phone}`} className="text-green-600 hover:underline font-medium">
                      {selectedOrder.customer?.phone}
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
                        <p className="text-sm text-orange-600 font-medium">Priorité maximale</p>
                      )}
                    </div>
                  </div>
                  {selectedOrder.delivery_date && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-slate-400" />
                      <p>{selectedOrder.delivery_date} à {selectedOrder.delivery_time}</p>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{selectedOrder.delivery_address}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline text-sm flex items-center space-x-1 mt-1"
                      >
                        <Navigation className="h-3 w-3" />
                        <span>Ouvrir dans Maps</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles commandés */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Articles à livrer</h3>
              <div className="space-y-3">
                {selectedOrder.order_items?.map((item, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium capitalize">{item.ice_type}</p>
                      <p className="text-sm text-slate-600">{item.quantity}x {item.package_size}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.total_price} MAD</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total à encaisser:</span>
                <span className="text-green-600">{selectedOrder.total} MAD</span>
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
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger bon</span>
              </button>
              <a
                href={`tel:${selectedOrder.customer?.phone}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Appeler client</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Navigation className="h-4 w-4" />
                <span>Navigation</span>
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
            <div className="flex items-center space-x-3">
              <Truck className="h-6 w-6 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Mes Livraisons</h1>
                <p className="text-slate-600">Bonjour {driverName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadOrders}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Commandes assignées</p>
                <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Commandes Express</p>
                <p className="text-2xl font-bold text-orange-600">{expressOrders.length}</p>
              </div>
              <Truck className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">En livraison</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => o.status === 'delivering').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Mes commandes ({orders.length})
            </h2>
            {expressOrders.length > 0 && (
              <p className="text-sm text-orange-600 mt-1">
                ⚡ {expressOrders.length} commande(s) express en priorité
              </p>
            )}
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-slate-600">Chargement des commandes...</p>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Aucune commande assignée</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {sortedOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{order.order_number}</h3>
                        {order.delivery_type === 'express' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            ⚡ EXPRESS
                          </span>
                        )}
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span>{getStatusLabel(order.status)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                        <div>
                          <p className="font-medium text-slate-900">{order.customer?.name}</p>
                          <p>{order.customer?.phone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Livraison</p>
                          {order.delivery_date ? (
                            <p>{order.delivery_date} à {order.delivery_time}</p>
                          ) : (
                            <p>Dès que possible</p>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Total</p>
                          <p className="text-green-600 font-semibold">{order.total} MAD</p>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-slate-600 flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{order.delivery_address}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setTimeout(scrollToTop, 100);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;