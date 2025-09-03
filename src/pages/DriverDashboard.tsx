import React, { useState, useEffect } from 'react';
import { LogOut, Package, Clock, CheckCircle, XCircle, Truck, MapPin, Phone, Download, RefreshCw, Navigation, User, Calendar, AlertCircle, Archive, Activity } from 'lucide-react';
import { Order, driverService, supabase } from '../lib/supabase';
import DeliveryModal from '../components/DeliveryModal';
import { generateOrderPDF } from '../utils/pdfGenerator';
import { stockService } from '../lib/stockService';

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
  const [driverStatus, setDriverStatus] = useState<'offline' | 'available' | 'busy' | 'on_break'>('available');
  const [activeTab, setActiveTab] = useState<'active' | 'delivered'>('active');
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [modalMode, setModalMode] = useState<'deliver' | 'cancel'>('deliver');
  const [showModal, setShowModal] = useState(false);

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
    loadDeliveredOrders();
    loadDriverStatus();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(() => {
      loadOrders();
      if (activeTab === 'delivered') {
        loadDeliveredOrders();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [driverId, activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const driverOrders = await driverService.getDriverOrders(driverId);
      // Trier par priorité et urgence
      const sortedOrders = sortOrdersByPriority(driverOrders);
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveredOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          order_items(*),
          assigned_driver:delivery_drivers(*)
        `)
        .eq('assigned_driver_id', driverId)
        .eq('status', 'delivered')
        .order('updated_at', { ascending: false })
        .limit(20); // Limiter aux 20 dernières livraisons

      if (error) throw error;
      setDeliveredOrders(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes livrées:', error);
    }
  };

  // Fonction de tri par priorité et urgence
  const sortOrdersByPriority = (orders: Order[]): Order[] => {
    return orders.sort((a, b) => {
      // 1. Priorité absolue : commandes en livraison
      if (a.status === 'delivering' && b.status !== 'delivering') return -1;
      if (b.status === 'delivering' && a.status !== 'delivering') return 1;
      
      // 2. Priorité express
      if (a.delivery_type === 'express' && b.delivery_type !== 'express') return -1;
      if (b.delivery_type === 'express' && a.delivery_type !== 'express') return 1;
      
      // 3. Pour les commandes express : par heure de création (plus ancien en premier)
      if (a.delivery_type === 'express' && b.delivery_type === 'express') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      
      // 4. Pour les commandes standard : par date/heure de livraison prévue
      if (a.delivery_date && b.delivery_date) {
        const dateA = new Date(`${a.delivery_date} ${a.delivery_time || '00:00'}`);
        const dateB = new Date(`${b.delivery_date} ${b.delivery_time || '00:00'}`);
        
        // Commandes du jour en premier
        const today = new Date().toISOString().split('T')[0];
        const isAToday = a.delivery_date === today;
        const isBToday = b.delivery_date === today;
        
        if (isAToday && !isBToday) return -1;
        if (isBToday && !isAToday) return 1;
        
        return dateA.getTime() - dateB.getTime();
      }
      
      // 5. Fallback : par heure de création
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  };

  // Calculer l'urgence d'une commande
  const getOrderUrgency = (order: Order): { level: 'critical' | 'high' | 'medium' | 'low', message: string } => {
    const now = new Date();
    
    if (order.delivery_type === 'express') {
      const createdAt = new Date(order.created_at);
      const minutesSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      if (minutesSinceCreated > 45) {
        return { level: 'critical', message: 'URGENT - Délai dépassé !' };
      } else if (minutesSinceCreated > 30) {
        return { level: 'high', message: 'Très urgent - Moins de 30min' };
      } else {
        return { level: 'medium', message: 'Express - Moins de 1H' };
      }
    }
    
    if (order.delivery_date) {
      const deliveryDateTime = new Date(`${order.delivery_date} ${order.delivery_time || '00:00'}`);
      const hoursUntilDelivery = (deliveryDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilDelivery < 0) {
        return { level: 'critical', message: 'RETARD - Livraison prévue dépassée' };
      } else if (hoursUntilDelivery < 2) {
        return { level: 'high', message: 'Urgent - Moins de 2H' };
      } else if (hoursUntilDelivery < 6) {
        return { level: 'medium', message: 'Bientôt - Moins de 6H' };
      }
    }
    
    return { level: 'low', message: 'Normal' };
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const loadDriverStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('current_status')
        .eq('id', driverId)
        .single();

      if (error) throw error;
      if (data) {
        setDriverStatus(data.current_status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du statut:', error);
    }
  };

  const updateDriverStatus = async (newStatus: typeof driverStatus) => {
    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ current_status: newStatus })
        .eq('id', driverId);

      if (error) throw error;
      setDriverStatus(newStatus);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      
      // Mettre à jour le statut avec l'heure actuelle
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'delivered' && { delivered_at: new Date().toISOString() }),
          ...(newStatus === 'cancelled' && { cancelled_at: new Date().toISOString() })
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      
      // Si la commande est livrée, enregistrer la position
      if (newStatus === 'delivered') {
        recordCurrentLocation();
      }
      
      // Recharger les commandes
      await loadOrders();
      if (activeTab === 'delivered') {
        await loadDeliveredOrders();
      }
      
      // Mettre à jour la commande sélectionnée si c'est celle-ci
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, updated_at: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Gérer la confirmation de livraison avec modal
  const handleDeliveryConfirmation = async (deliveryData: any) => {
    try {
      setUpdatingStatus(deliveryData.orderId);
      
      // 1. Mettre à jour le statut de la commande
      const { error: statusError } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryData.orderId);

      if (statusError) throw statusError;

      // 2. Enregistrer les données de réception
      const { error: receptionError } = await supabase
        .from('delivery_receptions')
        .insert({
          order_id: deliveryData.orderId,
          driver_id: driverId,
          receiver_name: `${deliveryData.receiverFirstName} ${deliveryData.receiverName}`,
          receiver_signature: deliveryData.signature,
          amount_received: deliveryData.amountReceived,
          payment_method: deliveryData.paymentMethod,
          change_given: deliveryData.changeAmount || 0,
          reception_notes: deliveryData.notes || null
        });

      if (receptionError) throw receptionError;

      // 3. Enregistrer la position actuelle
      recordCurrentLocation();

      // 4. Recharger les données
      await loadOrders();
      await loadDeliveredOrders();
      
      // 5. Fermer le modal
      setShowModal(false);
      setSelectedOrderForModal(null);
      
      alert('✅ Livraison confirmée avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la confirmation de livraison:', error);
      alert('❌ Erreur lors de la confirmation de livraison');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Gérer l'annulation avec modal
  const handleCancellationConfirmation = async (cancelData: any) => {
    try {
      setUpdatingStatus(cancelData.orderId);
      
      // 1. Mettre à jour le statut de la commande
      const { error: statusError } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          cancel_reason: cancelData.reason
        })
        .eq('id', cancelData.orderId);

      if (statusError) throw statusError;

      // 2. Recharger les données
      await loadOrders();
      
      // 3. Fermer le modal
      setShowModal(false);
      setSelectedOrderForModal(null);
      
      alert('❌ Commande annulée avec succès');
      
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      alert('❌ Erreur lors de l\'annulation');
    } finally {
      setUpdatingStatus(null);
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

  const getDriverStatusColor = (status: typeof driverStatus) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'on_break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDriverStatusLabel = (status: typeof driverStatus) => {
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

  // Séparer les commandes par priorité
  const expressOrders = orders.filter(order => order.delivery_type === 'express');
  const standardOrders = orders.filter(order => order.delivery_type === 'standard');
  const criticalOrders = orders.filter(order => getOrderUrgency(order).level === 'critical');

  // Statistiques
  const stats = {
    total: orders.length,
    express: expressOrders.length,
    critical: criticalOrders.length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length
  };

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
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
              >
                <Truck className="h-5 w-5 rotate-180" />
                <span>Retour à mes livraisons</span>
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
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Commande {selectedOrder.order_number}</h1>
                  <p className="text-green-100">
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
                  <div className="text-green-100 text-sm">Total à encaisser</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Actions de statut pour livreur */}
              <div className="mb-8 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-green-600" />
                  Actions livreur :
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivering')}
                    disabled={selectedOrder.status === 'delivering' || updatingStatus === selectedOrder.id}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      selectedOrder.status === 'delivering'
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <span>En livraison</span>
                  </button>
                  
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    disabled={selectedOrder.status === 'delivered' || updatingStatus === selectedOrder.id}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      selectedOrder.status === 'delivered'
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Livrée</span>
                  </button>
                  
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    disabled={selectedOrder.status === 'cancelled' || updatingStatus === selectedOrder.id}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      selectedOrder.status === 'cancelled'
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Annuler</span>
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  💡 Mettez à jour le statut selon l'avancement de votre livraison
                </p>
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
                      <div className="pt-3">
                        <a
                          href={`tel:${selectedOrder.customer?.phone}`}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium"
                        >
                          <Phone className="h-5 w-5" />
                          <span>Appeler le client</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Articles commandés */}
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Package className="h-5 w-5 mr-2 text-blue-600" />
                      Articles à livrer
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
                              <p className="font-semibold text-green-600 text-lg">{item.total_price} MAD</p>
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
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 mb-2">{selectedOrder.delivery_address}</p>
                            <div className="flex flex-col space-y-2">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm font-medium"
                              >
                                <Navigation className="h-4 w-4" />
                                <span>Ouvrir dans Google Maps</span>
                              </a>
                              <a
                                href={`https://waze.com/ul?q=${encodeURIComponent(selectedOrder.delivery_address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm font-medium"
                              >
                                <Navigation className="h-4 w-4" />
                                <span>Ouvrir dans Waze</span>
                              </a>
                            </div>
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
              <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Total de la commande</h3>
                    <p className="text-green-100">Montant à encaisser</p>
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
    <div className="min-h-screen bg-slate-50">
      {/* Header fixe */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full w-10 h-10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Mes Livraisons</h1>
                <p className="text-slate-600">Bonjour {driverName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Statut du livreur */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">Statut:</span>
                <select
                  value={driverStatus}
                  onChange={(e) => updateDriverStatus(e.target.value as typeof driverStatus)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getDriverStatusColor(driverStatus)}`}
                >
                  <option value="available">Disponible</option>
                  <option value="busy">Occupé</option>
                  <option value="on_break">En pause</option>
                  <option value="offline">Hors ligne</option>
                </select>
              </div>
              
              <button
                onClick={loadOrders}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                title="Actualiser les commandes"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Actives</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Express</p>
                <p className="text-2xl font-bold text-orange-600">{stats.express}</p>
              </div>
              <div className="text-orange-600 text-2xl">⚡</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Critiques</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <div className="text-red-600 text-2xl">🚨</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.delivering}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Confirmées</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                  activeTab === 'active'
                    ? 'text-green-600 bg-green-50 border-b-2 border-green-600'
                    : 'text-slate-600 hover:text-green-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Commandes Actives</span>
                  {stats.total > 0 && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      {stats.total}
                    </span>
                  )}
                  {stats.express > 0 && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      {stats.express} ⚡
                    </span>
                  )}
                  {stats.critical > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                      {stats.critical} 🚨
                    </span>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('delivered')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                  activeTab === 'delivered'
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Archive className="h-5 w-5" />
                  <span>Mes Livraisons</span>
                  {deliveredOrders.length > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {deliveredOrders.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'active' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Chargement des commandes...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucune commande active</h3>
                <p className="text-slate-600">Vous n'avez actuellement aucune commande assignée.</p>
              </div>
            ) : (
              orders.map((order, index) => {
                const urgency = getOrderUrgency(order);
                const priority = index + 1;
                
                return (
                  <div 
                    key={order.id} 
                    className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                      urgency.level === 'critical' 
                        ? 'border-red-500 animate-pulse' 
                        : urgency.level === 'high'
                        ? 'border-orange-400'
                        : urgency.level === 'medium'
                        ? 'border-yellow-400'
                        : 'border-slate-200 hover:border-green-300'
                    }`}
                    onClick={() => {
                      setSelectedOrder(order);
                      setTimeout(scrollToTop, 100);
                    }}
                  >
                    <div className="p-6">
                      {/* Header avec priorité */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            urgency.level === 'critical' ? 'bg-red-600' :
                            urgency.level === 'high' ? 'bg-orange-500' :
                            urgency.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            {priority}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{order.order_number}</h3>
                            <div className="flex items-center space-x-2">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1">{getStatusLabel(order.status)}</span>
                              </div>
                              {order.delivery_type === 'express' && (
                                <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                                  ⚡ EXPRESS
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">{order.total} MAD</div>
                          <div className={`text-xs font-medium px-2 py-1 rounded-full border ${getUrgencyColor(urgency.level)}`}>
                            {urgency.message}
                          </div>
                        </div>
                      </div>

                      {/* Informations principales */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{order.customer?.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <a 
                              href={`tel:${order.customer?.phone}`} 
                              className="text-green-600 hover:text-green-700 font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.customer?.phone}
                            </a>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {order.delivery_type === 'express' ? (
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span className="text-orange-700 font-medium">Livraison immédiate</span>
                            </div>
                          ) : (
                            order.delivery_date && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700">{order.delivery_date} à {order.delivery_time}</span>
                              </div>
                            )
                          )}
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                            <span className="text-slate-700 text-sm">{order.delivery_address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions rapides */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'delivering');
                            }}
                            disabled={order.status === 'delivering' || updatingStatus === order.id}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                              order.status === 'delivering'
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                            }`}
                          >
                            <Truck className="h-3 w-3" />
                            <span>En livraison</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'delivered');
                            }}
                            disabled={order.status === 'delivered' || updatingStatus === order.id}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                              order.status === 'delivered'
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Livrée</span>
                          </button>
                          
                          <a
                            href={`tel:${order.customer?.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center space-x-1"
                          >
                            <Phone className="h-3 w-3" />
                            <span>Appeler</span>
                          </a>
                          
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center space-x-1"
                          >
                            <Navigation className="h-3 w-3" />
                            <span>GPS</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {deliveredOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Archive className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucune livraison effectuée</h3>
                <p className="text-slate-600">Vos livraisons terminées apparaîtront ici.</p>
              </div>
            ) : (
              deliveredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl shadow-lg border border-slate-200 transition-all duration-300 hover:shadow-xl cursor-pointer"
                  onClick={() => {
                    setSelectedOrder(order);
                    setTimeout(scrollToTop, 100);
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{order.order_number}</h3>
                          <div className="flex items-center space-x-2">
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Livrée
                            </div>
                            {order.delivery_type === 'express' && (
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                ⚡ EXPRESS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">{order.total} MAD</div>
                        <div className="text-xs text-slate-500">
                          Livrée le {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString('fr-FR') : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{order.customer?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span className="text-slate-700">{order.customer?.phone}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-700">
                            {order.delivered_at ? new Date(order.delivered_at).toLocaleTimeString('fr-FR') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                          <span className="text-slate-700 text-sm">{order.delivery_address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de livraison/annulation */}
      {showModal && selectedOrderForModal && (
        <DeliveryModal
          order={selectedOrderForModal}
          mode={modalMode}
          onConfirm={modalMode === 'deliver' ? handleDeliveryConfirmation : handleCancellationConfirmation}
          onCancel={() => {
            setShowModal(false);
            setSelectedOrderForModal(null);
          }}
        />
      )}
    </div>
  );
}

export default DriverDashboard;