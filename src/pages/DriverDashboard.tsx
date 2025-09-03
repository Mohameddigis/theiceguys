import React, { useState, useEffect } from 'react';
import { LogOut, Package, Clock, CheckCircle, XCircle, Truck, MapPin, Phone, Download, RefreshCw, Navigation, User, Calendar, AlertCircle } from 'lucide-react';
import { Order, driverService, supabase } from '../lib/supabase';
import { generateOrderPDF } from '../utils/pdfGenerator';
import DeliveryReceptionModal from '../components/DeliveryReceptionModal';
import { generateReceptionPDF } from '../utils/receptionPdfGenerator';
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
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [processingReception, setProcessingReception] = useState(false);

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
    loadDriverStatus();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [driverId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const driverOrders = await driverService.getDriverOrders(driverId);
      setOrders(driverOrders);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
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
    // Si le statut est "delivered", ouvrir le modal de réception
    if (newStatus === 'delivered') {
      setShowReceptionModal(true);
      return;
    }

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

  const handleReceptionComplete = async (receptionData: {
    receiverName: string;
    signature: string;
    amountReceived: number;
    paymentMethod: 'cash' | 'card' | 'transfer';
    changeGiven: number;
    notes?: string;
  }) => {
    if (!selectedOrder) return;

    try {
      setProcessingReception(true);

      // 1. Enregistrer la réception en base
      const { data: reception, error: receptionError } = await supabase
        .from('delivery_receptions')
        .insert([{
          order_id: selectedOrder.id,
          driver_id: driverId,
          receiver_name: receptionData.receiverName,
          receiver_signature: receptionData.signature,
          amount_received: receptionData.amountReceived,
          payment_method: receptionData.paymentMethod,
          change_given: receptionData.changeGiven,
          reception_notes: receptionData.notes
        }])
        .select()
        .single();

      if (receptionError) throw receptionError;

      // 2. Mettre à jour le statut de la commande
      await driverService.updateOrderStatus(selectedOrder.id, 'delivered');

      // 3. Marquer la commande comme ayant une réception
      await supabase
        .from('orders')
        .update({ has_reception: true })
        .eq('id', selectedOrder.id);

      // 4. Décompter le stock du livreur
      await deductDriverStock(selectedOrder);

      // 5. Générer le PDF de réception
      const pdfBlob = await generateReceptionPDF(selectedOrder, {
        ...receptionData,
        receptionDate: new Date().toISOString()
      });

      // 6. Convertir le PDF en base64 pour l'email
      const pdfBase64 = await blobToBase64(pdfBlob);

      // 7. Envoyer l'email avec le bon de réception
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reception-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: selectedOrder.customer?.email,
          customerName: selectedOrder.customer?.name,
          orderNumber: selectedOrder.order_number,
          receptionData: {
            ...receptionData,
            receptionDate: new Date().toISOString()
          },
          pdfBase64: pdfBase64.split(',')[1] // Remove data:application/pdf;base64, prefix
        })
      });

      // 8. Enregistrer la position de livraison
      recordCurrentLocation();

      // 9. Recharger les commandes et fermer le modal
      await loadOrders();
      setShowReceptionModal(false);
      setSelectedOrder(null);
      
      alert('✅ Livraison confirmée avec succès ! Le bon de réception a été envoyé au client.');
      
    } catch (error) {
      console.error('Erreur lors de la confirmation de réception:', error);
      alert('❌ Erreur lors de la confirmation de réception. Veuillez réessayer.');
    } finally {
      setProcessingReception(false);
    }
  };

  const deductDriverStock = async (order: Order) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Récupérer les assignations du livreur pour aujourd'hui
      const { data: assignments, error } = await supabase
        .from('driver_stock_assignments')
        .select('*')
        .eq('driver_id', driverId)
        .eq('assignment_date', today);

      if (error) throw error;

      // Décompter les quantités livrées
      for (const item of order.order_items || []) {
        const assignment = assignments?.find(a => 
          a.ice_type === item.ice_type && a.package_size === item.package_size
        );

        if (assignment) {
          const newRemaining = Math.max(0, assignment.quantity_remaining - item.quantity);
          
          await supabase
            .from('driver_stock_assignments')
            .update({ quantity_remaining: newRemaining })
            .eq('id', assignment.id);

          // Enregistrer le mouvement de stock
          await stockService.recordStockMovement({
            movement_type: 'delivery',
            ice_type: item.ice_type,
            package_size: item.package_size,
            quantity_change: -item.quantity,
            reference_id: order.id,
            notes: `Livraison commande ${order.order_number}`
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la déduction du stock:', error);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
  const sortedOrders = [...expressOrders, ...standardOrders];

  // Statistiques
  const stats = {
    total: orders.length,
    express: expressOrders.length,
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Express</p>
                <p className="text-2xl font-bold text-orange-600">{stats.express}</p>
              </div>
              <div className="text-orange-600">⚡</div>
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
                <p className="text-sm text-slate-600">En livraison</p>
                <p className="text-2xl font-bold text-orange-600">{stats.delivering}</p>
              </div>
              <Truck className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Mes commandes assignées ({orders.length})
              </h2>
              {stats.express > 0 && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {stats.express} commande(s) express en priorité
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-slate-600">Chargement des commandes...</p>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">Aucune commande assignée</p>
              <p className="text-sm">Les nouvelles commandes apparaîtront ici automatiquement</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {sortedOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-semibold text-slate-900 text-lg">{order.order_number}</h3>
                        {order.delivery_type === 'express' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            ⚡ EXPRESS - PRIORITÉ
                          </span>
                        )}
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs border font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span>{getStatusLabel(order.status)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                          <p className="text-green-600 font-bold text-lg">{order.total} MAD</p>
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
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Voir détails
                      </button>
                      
                      {order.status === 'confirmed' && (
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
                      
                      {order.status === 'delivering' && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            updateOrderStatus(order.id, 'delivered');
                          }}
                          disabled={updatingStatus === order.id}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                        >
                          {updatingStatus === order.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          <span>Livré</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message d'encouragement */}
        {orders.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">Excellente journée de livraison ! 🚚</h3>
            <p className="text-green-100">
              Vous avez {orders.length} commande(s) à livrer. 
              {stats.express > 0 && ` Attention aux ${stats.express} commande(s) express !`}
            </p>
          </div>
        )}
      </div>

      {/* Modal de réception */}
      {showReceptionModal && selectedOrder && (
        <DeliveryReceptionModal
          order={selectedOrder}
          driverId={driverId}
          onClose={() => setShowReceptionModal(false)}
          onComplete={handleReceptionComplete}
        />
      )}

      {/* Loading overlay pour le traitement de la réception */}
      {processingReception && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-slate-900">Traitement de la réception...</p>
            <p className="text-sm text-slate-600">Génération du bon de réception et envoi par email</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;