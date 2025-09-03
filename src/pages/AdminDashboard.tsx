import React, { useState, useEffect } from 'react';
import { LogOut, Package, Users, Truck, Plus, Edit, Trash2, Eye, RefreshCw, Calendar, Clock, MapPin, Phone, Mail, Download, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Order, DeliveryDriver, orderService, driverService, supabaseAdmin } from '../lib/supabase';
import { generateOrderPDF } from '../utils/pdfGenerator';

interface AdminDashboardProps {
  onBack: () => void;
}

function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DeliveryDriver | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<string | null>(null);

  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    is_active: true,
    current_status: 'offline' as const
  });

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    loadData();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, driversData] = await Promise.all([
        loadOrders(),
        loadDrivers()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      console.log('📋 Chargement des commandes...');
      
      // Utiliser supabaseAdmin pour contourner RLS
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          order_items(*),
          assigned_driver:delivery_drivers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors du chargement des commandes:', error);
        throw error;
      }

      console.log('✅ Commandes chargées:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📊 Première commande:', data[0]);
        console.log('🚚 Livreur assigné à la première commande:', data[0].assigned_driver);
      }
      
      setOrders(data || []);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur dans loadOrders:', error);
      setOrders([]);
      return [];
    }
  };

  const loadDrivers = async () => {
    try {
      console.log('🚚 Chargement des livreurs...');
      const data = await driverService.getAllDrivers();
      console.log('✅ Livreurs chargés:', data?.length || 0);
      setDrivers(data || []);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur dans loadDrivers:', error);
      setDrivers([]);
      return [];
    }
  };

  const handleCreateDriver = async () => {
    try {
      console.log('🔧 Création d\'un nouveau livreur...');
      
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

      console.log('✅ Livreur créé avec succès');
      
      // Reset form
      setNewDriver({
        name: '',
        phone: '',
        email: '',
        password: '',
        is_active: true,
        current_status: 'offline'
      });
      setShowDriverForm(false);
      
      // Reload drivers
      await loadDrivers();
      
      alert('Livreur créé avec succès ! Un email de bienvenue a été envoyé.');
    } catch (error) {
      console.error('❌ Erreur lors de la création du livreur:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livreur ? Cette action est irréversible.')) {
      return;
    }

    try {
      console.log('🗑️ Suppression du livreur:', driverId);
      
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
      
      // Reload drivers
      await loadDrivers();
      
      alert('Livreur supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du livreur:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      
      // Utiliser supabaseAdmin pour contourner RLS
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select(`
          *,
          customer:customers(*),
          order_items(*),
          assigned_driver:delivery_drivers(*)
        `)
        .single();

      if (error) throw error;

      // Mettre à jour la liste des commandes
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? data : order
        )
      );

      // Mettre à jour la commande sélectionnée si c'est celle-ci
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(data);
      }

      // Envoyer une notification par email au client
      if (data.customer?.email) {
        try {
          await sendStatusNotification(data, newStatus);
        } catch (emailError) {
          console.error('Erreur envoi notification email:', emailError);
          // Ne pas faire échouer l'opération si l'email échoue
        }
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      setAssigningDriver(orderId);
      
      // Utiliser supabaseAdmin pour contourner RLS
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ assigned_driver_id: driverId })
        .eq('id', orderId)
        .select(`
          *,
          customer:customers(*),
          order_items(*),
          assigned_driver:delivery_drivers(*)
        `)
        .single();

      if (error) throw error;

      // Mettre à jour la liste des commandes
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? data : order
        )
      );

      // Mettre à jour la commande sélectionnée si c'est celle-ci
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(data);
      }

      console.log('✅ Livreur assigné avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'assignation du livreur:', error);
      alert('Erreur lors de l\'assignation du livreur');
    } finally {
      setAssigningDriver(null);
    }
  };

  const sendStatusNotification = async (order: Order, newStatus: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-status-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: order.customer?.email,
          customerName: order.customer?.name,
          orderNumber: order.order_number,
          newStatus: newStatus,
          orderDetails: {
            items: order.order_items?.map(item => ({
              iceType: getIceTypeName(item.ice_type),
              quantities: {
                '5kg': item.package_size === '5kg' ? item.quantity : 0,
                '10kg': 0,
                '20kg': item.package_size === '20kg' ? item.quantity : 0
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
            companyName: order.customer?.type === 'professional' ? order.customer?.name : undefined
          }
        })
      });

      if (response.ok) {
        console.log('✅ Notification email envoyée');
      } else {
        console.error('❌ Erreur envoi notification email');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
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

  // Statistiques des commandes
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    express: orders.filter(o => o.delivery_type === 'express').length,
    assigned: orders.filter(o => o.assigned_driver_id).length,
    unassigned: orders.filter(o => !o.assigned_driver_id && o.status !== 'delivered' && o.status !== 'cancelled').length
  };

  // Statistiques des livreurs
  const driverStats = {
    total: drivers.length,
    active: drivers.filter(d => d.is_active).length,
    available: drivers.filter(d => d.current_status === 'available').length,
    busy: drivers.filter(d => d.current_status === 'busy').length
  };

  // Séparer les commandes assignées et non assignées
  const unassignedOrders = orders.filter(order => 
    !order.assigned_driver_id && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled'
  );
  
  const assignedOrders = orders.filter(order => 
    order.assigned_driver_id && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled'
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

        <div className="max-w-6xl mx-auto px-4 py-8">
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
              {/* Actions administrateur */}
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Actions administrateur :
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, status)}
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
                <div className="border-t pt-4">
                  <h4 className="font-medium text-slate-900 mb-2">Assigner un livreur :</h4>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedOrder.assigned_driver_id || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignDriver(selectedOrder.id, e.target.value);
                        }
                      }}
                      disabled={assigningDriver === selectedOrder.id}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">
                        {selectedOrder.assigned_driver_id ? 
                          `Assigné à: ${selectedOrder.assigned_driver?.name || 'Livreur inconnu'}` : 
                          'Sélectionner un livreur'
                        }
                      </option>
                      {drivers.filter(d => d.is_active).map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({getDriverStatusLabel(driver.current_status)})
                        </option>
                      ))}
                    </select>
                    {assigningDriver === selectedOrder.id && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  {selectedOrder.assigned_driver && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-800 font-medium">
                        ✅ Assigné à: {selectedOrder.assigned_driver.name}
                      </p>
                      <p className="text-green-700 text-sm">
                        📞 {selectedOrder.assigned_driver.phone} | 
                        📧 {selectedOrder.assigned_driver.email}
                      </p>
                    </div>
                  )}
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
                          className="text-green-600 hover:text-green-700 font-medium"
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
                      
                      <a
                        href={`tel:${selectedOrder.customer?.phone}`}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium"
                      >
                        <Phone className="h-5 w-5" />
                        <span>Appeler le client</span>
                      </a>
                      
                      <a
                        href={`https://wa.me/${selectedOrder.customer?.phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span>WhatsApp client</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes spéciales */}
              {selectedOrder.notes && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-slate-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Notes spéciales :
                  </h4>
                  <p className="text-slate-700">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Résumé total */}
              <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Total de la commande</h3>
                    <p className="text-blue-100">Sous-total: {selectedOrder.subtotal} MAD | Livraison: {selectedOrder.delivery_fee} MAD</p>
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
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-10 h-10 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Administration</h1>
                <p className="text-slate-600">The Ice Guys</p>
              </div>
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
              
              <button
                onClick={onBack}
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
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-200 rounded-lg p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="h-5 w-5 inline mr-2" />
            Gestion des Commandes
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'drivers'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="h-5 w-5 inline mr-2" />
            Gestion des Livreurs
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            {/* Statistiques des commandes */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                    <p className="text-sm text-slate-600">Express</p>
                    <p className="text-2xl font-bold text-red-600">{orderStats.express}</p>
                  </div>
                  <div className="text-red-600 text-2xl">⚡</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Non assignées</p>
                    <p className="text-2xl font-bold text-purple-600">{orderStats.unassigned}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Commandes non assignées */}
            {unassignedOrders.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                      Commandes non assignées ({unassignedOrders.length})
                    </h2>
                    <div className="text-sm text-red-600 font-medium">
                      Action requise
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-slate-200">
                  {unassignedOrders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="font-semibold text-slate-900 text-lg">{order.order_number}</h3>
                            {order.delivery_type === 'express' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                ⚡ EXPRESS - URGENT
                              </span>
                            )}
                            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs border font-medium ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span>{getStatusLabel(order.status)}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="font-medium text-slate-900">{order.customer?.name}</p>
                              <p className="text-slate-600">{order.customer?.phone}</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="font-medium text-slate-900 flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                Livraison
                              </p>
                              {order.delivery_date ? (
                                <p className="text-slate-600">{order.delivery_date} à {order.delivery_time}</p>
                              ) : (
                                <p className="text-red-600 font-medium">Dès que possible</p>
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
                          
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignDriver(order.id, e.target.value);
                              }
                            }}
                            disabled={assigningDriver === order.id}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Assigner livreur</option>
                            {drivers.filter(d => d.is_active && d.current_status === 'available').map(driver => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name}
                              </option>
                            ))}
                          </select>
                          
                          {assigningDriver === order.id && (
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commandes assignées */}
            {assignedOrders.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Commandes assignées ({assignedOrders.length})
                    </h2>
                  </div>
                </div>
                
                <div className="divide-y divide-slate-200">
                  {assignedOrders.map((order) => (
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
                              <p className="text-slate-600 flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1" />
                                {order.customer?.phone}
                              </p>
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <p className="font-medium text-slate-900 flex items-center">
                                <Truck className="h-4 w-4 mr-1 text-green-600" />
                                Livreur assigné
                              </p>
                              <p className="text-green-700 font-medium">{order.assigned_driver?.name || 'Erreur'}</p>
                              <p className="text-green-600 text-xs">{order.assigned_driver?.phone}</p>
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
                          
                          <select
                            value={order.assigned_driver_id || ''}
                            onChange={(e) => {
                              if (e.target.value && e.target.value !== order.assigned_driver_id) {
                                handleAssignDriver(order.id, e.target.value);
                              }
                            }}
                            disabled={assigningDriver === order.id}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Changer livreur</option>
                            {drivers.filter(d => d.is_active).map(driver => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name} ({getDriverStatusLabel(driver.current_status)})
                              </option>
                            ))}
                          </select>
                          
                          {assigningDriver === order.id && (
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toutes les commandes */}
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
                              <p className="text-slate-600 flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1" />
                                {order.customer?.phone}
                              </p>
                            </div>
                            
                            <div className={`rounded-lg p-3 ${
                              order.assigned_driver_id 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                            }`}>
                              <p className="font-medium text-slate-900 flex items-center">
                                <Truck className={`h-4 w-4 mr-1 ${order.assigned_driver_id ? 'text-green-600' : 'text-red-600'}`} />
                                Livreur
                              </p>
                              {order.assigned_driver_id && order.assigned_driver ? (
                                <>
                                  <p className="text-green-700 font-medium">{order.assigned_driver.name}</p>
                                  <p className="text-green-600 text-xs">{order.assigned_driver.phone}</p>
                                </>
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
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setTimeout(scrollToTop, 100);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Gérer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drivers Tab */}
        {activeTab === 'drivers' && (
          <div className="space-y-8">
            {/* Statistiques des livreurs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <p className="text-2xl font-bold text-blue-600">{driverStats.available}</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Occupés</p>
                    <p className="text-2xl font-bold text-orange-600">{driverStats.busy}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Bouton ajouter livreur */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowDriverForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Ajouter un livreur</span>
              </button>
            </div>

            {/* Formulaire nouveau livreur */}
            {showDriverForm && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingDriver ? 'Modifier le livreur' : 'Nouveau livreur'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowDriverForm(false);
                      setEditingDriver(null);
                      setNewDriver({
                        name: '',
                        phone: '',
                        email: '',
                        password: '',
                        is_active: true,
                        current_status: 'offline'
                      });
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet *</label>
                    <input
                      type="text"
                      value={newDriver.name}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nom du livreur"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      value={newDriver.phone}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newDriver.email}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe *</label>
                    <input
                      type="password"
                      value={newDriver.password}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Mot de passe sécurisé"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Statut initial</label>
                    <select
                      value={newDriver.current_status}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, current_status: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="offline">Hors ligne</option>
                      <option value="available">Disponible</option>
                      <option value="busy">Occupé</option>
                      <option value="on_break">En pause</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={newDriver.is_active}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-slate-700">
                      Livreur actif
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDriverForm(false);
                      setEditingDriver(null);
                      setNewDriver({
                        name: '',
                        phone: '',
                        email: '',
                        password: '',
                        is_active: true,
                        current_status: 'offline'
                      });
                    }}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateDriver}
                    disabled={!newDriver.name || !newDriver.phone || !newDriver.email || !newDriver.password}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      newDriver.name && newDriver.phone && newDriver.email && newDriver.password
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {editingDriver ? 'Modifier' : 'Créer le livreur'}
                  </button>
                </div>
              </div>
            )}

            {/* Liste des livreurs */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <h2 className="text-lg font-semibold text-slate-900">
                  Livreurs ({drivers.length})
                </h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-slate-600">Chargement des livreurs...</p>
                </div>
              ) : drivers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">Aucun livreur</p>
                  <p className="text-sm">Ajoutez votre premier livreur</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
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
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">{driver.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">{driver.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">
                                Créé le {new Date(driver.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingDriver(driver);
                              setNewDriver({
                                name: driver.name,
                                phone: driver.phone,
                                email: driver.email,
                                password: '',
                                is_active: driver.is_active,
                                current_status: driver.current_status
                              });
                              setShowDriverForm(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;