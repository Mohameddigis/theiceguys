import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Package, Users, TrendingUp, Clock, CheckCircle, XCircle, Truck, 
  Eye, Phone, Mail, MapPin, Calendar, Filter, Search, RefreshCw, LogOut, 
  Download, UserPlus, Navigation, Menu, X, Home, ShoppingCart, UserCheck,
  Plus, Edit, Trash2, Star, AlertCircle, DollarSign, User, MessageCircle
} from 'lucide-react';
import { orderService, driverService, Order, Customer, DeliveryDriver, supabase } from '../lib/supabase';
import { generateOrderPDF } from '../utils/pdfGenerator';

interface AdminDashboardProps {
  onBack: () => void;
}

function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
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
    loadData();
    
    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, driversData] = await Promise.all([
        orderService.getAllOrders(),
        driverService.getAllDrivers()
      ]);
      
      setOrders(ordersData);
      setDrivers(driversData);
      
      // Extract unique customers from orders
      const uniqueCustomers = ordersData.reduce((acc: Customer[], order) => {
        if (order.customer && !acc.find(c => c.id === order.customer!.id)) {
          acc.push(order.customer);
        }
        return acc;
      }, []);
      setCustomers(uniqueCustomers);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
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

  const loadOrders = async () => {
    try {
      const ordersData = await orderService.getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    }
  };

  const sendStatusNotificationEmail = async (order: Order, newStatus: Order['status']) => {
    try {
      const orderData = {
        customerEmail: order.customer!.email,
        customerName: order.customer!.name,
        orderNumber: order.order_number,
        newStatus: newStatus,
        orderDetails: {
          items: order.order_items?.map(item => ({
            iceType: getIceTypeName(item.ice_type),
            quantities: {
              '5kg': item.package_size === '5kg' ? item.quantity : 0,
              '10kg': 0, // Pas utilisé actuellement
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
          customerType: order.customer!.type
        }
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-status-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        console.log('✅ Email de notification envoyé avec succès');
      } else {
        console.error('❌ Erreur lors de l\'envoi de l\'email de notification');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
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

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingOrderStatus(orderId);
      
      // Mettre à jour le statut dans la base de données
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Recharger les commandes
      await loadOrders();
      
      // Mettre à jour la commande sélectionnée si c'est celle-ci
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      // Envoyer notification email au client
      const order = orders.find(o => o.id === orderId);
      if (order && order.customer) {
        await sendStatusNotificationEmail(order, newStatus);
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingOrderStatus(null);
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
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
    totalCustomers: customers.length,
    activeDrivers: drivers.filter(d => d.is_active).length,
    availableDrivers: drivers.filter(d => d.current_status === 'available').length
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'drivers', label: 'Livreurs', icon: Truck }
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    setSelectedOrder(null); // Réinitialiser la sélection lors du changement d'onglet
    setTimeout(scrollToTop, 100);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Commandes</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">En Attente</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Livrées</p>
              <p className="text-2xl font-bold text-slate-900">{stats.deliveredOrders}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-brand-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalRevenue} MAD</p>
            </div>
            <DollarSign className="h-8 w-8 text-brand-primary" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Clients</h3>
            <Users className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalCustomers}</p>
          <p className="text-sm text-slate-600 mt-2">Clients enregistrés</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Livreurs</h3>
            <Truck className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.activeDrivers}</p>
          <p className="text-sm text-slate-600 mt-2">Livreurs actifs</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Disponibles</h3>
            <UserCheck className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.availableDrivers}</p>
          <p className="text-sm text-slate-600 mt-2">Livreurs disponibles</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">Commandes Récentes</h3>
          <button
            onClick={() => handleTabChange('orders')}
            className="text-brand-primary hover:text-brand-secondary transition-colors text-sm font-medium"
          >
            Voir tout →
          </button>
        </div>
        
        <div className="space-y-4">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{order.order_number}</p>
                  <p className="text-sm text-slate-600">{order.customer?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{order.total} MAD</p>
                <p className="text-sm text-slate-600">
                  {new Date(order.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      {selectedOrder ? (
        // Vue détaillée de la commande
        <div className="space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => {
                setSelectedOrder(null);
                setTimeout(scrollToTop, 100);
              }}
              className="flex items-center space-x-2 text-brand-primary hover:text-brand-secondary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour aux commandes</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Commande {selectedOrder.order_number}</h1>
                <p className="text-slate-600 mt-2">
                  {selectedOrder.delivery_type === 'express' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mr-2">
                      ⚡ EXPRESS
                    </span>
                  )}
                  Créée le {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')} à {new Date(selectedOrder.created_at).toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full border flex items-center space-x-2 ${getStatusColor(selectedOrder.status)}`}>
                {getStatusIcon(selectedOrder.status)}
                <span className="font-medium">{getStatusLabel(selectedOrder.status)}</span>
              </div>
            </div>

            {/* Actions de statut */}
            <div className="mb-8 p-6 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-4">Changer le statut de la commande :</h3>
              <div className="flex flex-wrap gap-3">
                {(['confirmed', 'delivering', 'delivered', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(selectedOrder.id, status)}
                    disabled={selectedOrder.status === status || updatingOrderStatus === selectedOrder.id}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      selectedOrder.status === status
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : updatingOrderStatus === selectedOrder.id
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-white border border-blue-300 hover:bg-blue-100 text-blue-700'
                    }`}
                  >
                    {updatingOrderStatus === selectedOrder.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      getStatusIcon(status)
                    )}
                    <span>{getStatusLabel(status)}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-600 mt-3">
                💡 Le client recevra automatiquement un email de notification lors du changement de statut
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informations client */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Informations client</h3>
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <User className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">{selectedOrder.customer?.name}</p>
                        {selectedOrder.customer?.contact_name && (
                          <p className="text-sm text-slate-600">Contact: {selectedOrder.customer.contact_name}</p>
                        )}
                        <p className="text-sm text-slate-600">
                          Type: {selectedOrder.customer?.type === 'professional' ? 'Professionnel' : 'Particulier'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mb-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <a href={`tel:${selectedOrder.customer?.phone}`} className="text-brand-primary hover:underline font-medium">
                        {selectedOrder.customer?.phone}
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a href={`mailto:${selectedOrder.customer?.email}`} className="text-brand-primary hover:underline">
                        {selectedOrder.customer?.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations de livraison */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Informations de livraison</h3>
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Truck className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {selectedOrder.delivery_type === 'express' ? 'Express (< 1H)' : 'Standard'}
                        </p>
                        {selectedOrder.delivery_type === 'express' && (
                          <p className="text-sm text-orange-600 font-medium">Priorité maximale</p>
                        )}
                      </div>
                    </div>
                    {selectedOrder.delivery_date && (
                      <div className="flex items-center space-x-3 mb-3">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <p className="text-slate-700">{selectedOrder.delivery_date} à {selectedOrder.delivery_time}</p>
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-slate-400 mt-1" />
                      <div>
                        <p className="text-slate-700 font-medium">{selectedOrder.delivery_address}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.delivery_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-primary hover:underline text-sm flex items-center space-x-1 mt-1"
                        >
                          <Navigation className="h-3 w-3" />
                          <span>Ouvrir dans Maps</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles commandés */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Articles commandés</h3>
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="space-y-4">
                  {selectedOrder.order_items?.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-900 capitalize">
                          {item.ice_type === 'nuggets' ? "Nugget's" : 
                           item.ice_type === 'gourmet' ? 'Gourmet' : 
                           'Glace Paillette'}
                        </p>
                        <p className="text-sm text-slate-600">{item.quantity}x {item.package_size}</p>
                        <p className="text-xs text-slate-500">Prix unitaire: {item.unit_price} MAD</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{item.total_price} MAD</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Sous-total:</span>
                    <span className="font-medium">{selectedOrder.subtotal} MAD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Frais de livraison:</span>
                    <span className="font-medium">{selectedOrder.delivery_fee} MAD</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span className="text-slate-900">Total:</span>
                      <span className="text-brand-primary">{selectedOrder.total} MAD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-slate-900 mb-2">Notes spéciales:</h4>
                <p className="text-slate-700">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Actions rapides */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => handleDownloadPDF(selectedOrder)}
                className="bg-brand-primary hover:bg-brand-secondary text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger bon de commande</span>
              </button>
              <a
                href={`tel:${selectedOrder.customer?.phone}`}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Appeler client</span>
              </a>
              <a
                href={`mailto:${selectedOrder.customer?.email}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Envoyer email</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        // Liste des commandes
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmées</option>
                  <option value="delivering">En livraison</option>
                  <option value="delivered">Livrées</option>
                  <option value="cancelled">Annulées</option>
                </select>
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

          {/* Orders List */}
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
                            <p className="text-sm text-slate-500">{order.customer?.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span>{getStatusLabel(order.status)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-900">{order.total} MAD</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-slate-900">
                            {new Date(order.created_at).toLocaleDateString('fr-FR')}
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
      )}
    </div>
  );

  const renderCustomers = () => {
    const filteredCustomers = customers.filter(customer => {
      const matchesSearch = searchTerm === '' || 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = statusFilter === 'all' || customer.type === statusFilter;
      
      return matchesSearch && matchesType;
    });

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Clients</p>
                <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Professionnels</p>
                <p className="text-2xl font-bold text-slate-900">{customers.filter(c => c.type === 'professional').length}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Particuliers</p>
                <p className="text-2xl font-bold text-slate-900">{customers.filter(c => c.type === 'individual').length}</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-brand-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">CA Total Clients</p>
                <p className="text-2xl font-bold text-slate-900">
                  {customers.reduce((total, customer) => {
                    const customerOrders = orders.filter(o => o.customer_id === customer.id && o.status === 'delivered');
                    return total + customerOrders.reduce((sum, o) => sum + o.total, 0);
                  }, 0)} MAD
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-brand-primary" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, email, téléphone..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type de client</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option value="all">Tous les types</option>
                <option value="professional">Professionnels</option>
                <option value="individual">Particuliers</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Clients ({filteredCustomers.length})
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Professionnels</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Particuliers</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => {
              const customerOrders = orders.filter(o => o.customer_id === customer.id);
              const totalSpent = customerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
              const lastOrderDate = customerOrders.length > 0 
                ? new Date(Math.max(...customerOrders.map(o => new Date(o.created_at).getTime())))
                : null;
              
              return (
                <div key={customer.id} className="bg-slate-50 rounded-lg p-6 border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{customer.name}</h3>
                      {customer.contact_name && (
                        <p className="text-sm text-slate-600">Contact: {customer.contact_name}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Inscrit le {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.type === 'professional' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {customer.type === 'professional' ? 'Pro' : 'Part'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${customer.phone}`} className="hover:text-brand-primary transition-colors">{customer.phone}</a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${customer.email}`} className="hover:text-brand-primary transition-colors">{customer.email}</a>
                    </div>
                    {lastOrderDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Dernière commande: {lastOrderDate.toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun client trouvé</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDrivers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Livreurs ({drivers.length})</h2>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Ajouter</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => {
            const driverOrders = orders.filter(o => o.assigned_driver_id === driver.id);
            const completedOrders = driverOrders.filter(o => o.status === 'delivered').length;
            
            return (
              <div key={driver.id} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{driver.name}</h3>
                    <p className="text-sm text-slate-600">{driver.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
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
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{driver.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      driver.is_active ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-slate-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{driverOrders.length}</p>
                      <p className="text-xs text-slate-600">Assignées</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
                      <p className="text-xs text-slate-600">Livrées</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <button className="text-blue-600 hover:text-blue-700 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <a
                    href={`tel:${driver.phone}`}
                    className="text-green-600 hover:text-green-700 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <button className="text-red-600 hover:text-red-700 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-brand-primary" />
            <span className="text-xl font-bold text-slate-900">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-brand-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button
            onClick={onBack}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-slate-400 hover:text-slate-600"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'orders' && 'Commandes'}
                  {activeTab === 'customers' && 'Clients'}
                  {activeTab === 'drivers' && 'Livreurs'}
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={loadData}
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

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'drivers' && renderDrivers()}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;