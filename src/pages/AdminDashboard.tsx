import React, { useState, useEffect } from 'react';
import { LogOut, Package, Users, Truck, Search, Plus, Edit, Trash2, Eye, Download, RefreshCw, MessageCircle, Phone, Mail, Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, User, Building2 } from 'lucide-react';
import { Order, Customer, DeliveryDriver, orderService, driverService, supabaseAdmin } from '../lib/supabase';
import { generateOrderPDF } from '../utils/pdfGenerator';

interface AdminDashboardProps {
  onBack: () => void;
}

interface MergedClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'professional' | 'individual';
  contact_name?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  created_at: string;
  updated_at: string;
}

function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<MergedClient[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateDriverModal, setShowCreateDriverModal] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    is_active: true,
    current_status: 'offline' as const
  });
  const [creatingDriver, setCreatingDriver] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        await loadOrders();
      } else if (activeTab === 'clients') {
        await loadClients();
      } else if (activeTab === 'drivers') {
        await loadDrivers();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const allOrders = await orderService.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    }
  };

  const loadClients = async () => {
    try {
      // Récupérer tous les clients avec leurs commandes
      const { data: allCustomers, error } = await supabaseAdmin
        .from('customers')
        .select(`
          *,
          orders(id, total, created_at)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Grouper les clients par email et fusionner
      const clientsMap = new Map<string, MergedClient>();

      allCustomers?.forEach(customer => {
        const email = customer.email.toLowerCase();
        const orderCount = customer.orders?.length || 0;
        const totalSpent = customer.orders?.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0) || 0;
        const lastOrderDate = customer.orders?.length > 0 
          ? customer.orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : customer.created_at;

        if (clientsMap.has(email)) {
          // Fusionner avec le client existant
          const existing = clientsMap.get(email)!;
          const isNewer = new Date(customer.updated_at) > new Date(existing.updated_at);
          
          clientsMap.set(email, {
            ...existing,
            // Utiliser les infos du client le plus récent
            name: isNewer ? customer.name : existing.name,
            phone: isNewer ? customer.phone : existing.phone,
            type: isNewer ? customer.type : existing.type,
            contact_name: isNewer ? customer.contact_name : existing.contact_name,
            updated_at: isNewer ? customer.updated_at : existing.updated_at,
            // Additionner les statistiques
            orderCount: existing.orderCount + orderCount,
            totalSpent: existing.totalSpent + totalSpent,
            lastOrderDate: new Date(lastOrderDate) > new Date(existing.lastOrderDate) ? lastOrderDate : existing.lastOrderDate
          });
        } else {
          // Nouveau client
          clientsMap.set(email, {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            type: customer.type,
            contact_name: customer.contact_name,
            orderCount,
            totalSpent,
            lastOrderDate,
            created_at: customer.created_at,
            updated_at: customer.updated_at
          });
        }
      });

      setClients(Array.from(clientsMap.values()).sort((a, b) => 
        new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
      ));
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const { data: allDrivers, error } = await supabaseAdmin
        .from('delivery_drivers')
        .select('*')
        .order('name');

      if (error) throw error;
      setDrivers(allDrivers || []);
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const assignDriverToOrder = async (orderId: string, driverId: string) => {
    try {
      await driverService.assignDriverToOrder(orderId, driverId || null);
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    }
  };

  const createDriver = async () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.email || !newDriver.password) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreatingDriver(true);
    try {
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

      if (result.success) {
        alert('Livreur créé avec succès ! Un email de bienvenue a été envoyé.');
        setShowCreateDriverModal(false);
        setNewDriver({
          name: '',
          phone: '',
          email: '',
          password: '',
          is_active: true,
          current_status: 'offline'
        });
        await loadDrivers();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création du livreur:', error);
      alert('Erreur lors de la création du livreur');
    } finally {
      setCreatingDriver(false);
    }
  };

  const deleteDriver = async (driverId: string, driverName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le livreur "${driverName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
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

      if (result.success) {
        alert('Livreur supprimé avec succès');
        await loadDrivers();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du livreur:', error);
      alert('Erreur lors de la suppression du livreur');
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

  const getIceTypeName = (iceType: string): string => {
    switch (iceType) {
      case 'nuggets': return "Nugget's";
      case 'gourmet': return 'Gourmet';
      case 'cubique': return 'Glace Paillette';
      default: return iceType;
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm)
  );

  const sidebarItems = [
    { id: 'orders', label: 'Commandes', icon: Package, count: orders.length },
    { id: 'clients', label: 'Clients', icon: Users, count: clients.length },
    { id: 'drivers', label: 'Livreurs', icon: Truck, count: drivers.length }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar fixe */}
      <div className="w-64 bg-white shadow-lg border-r border-slate-200 fixed left-0 top-0 h-full z-30">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg w-10 h-10 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-600">The Ice Guys</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchTerm('');
                    setSelectedOrder(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activeTab === item.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Déconnexion */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button
            onClick={onBack}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 ml-64">
        {/* Header fixe */}
        <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
                <p className="text-slate-600">
                  {activeTab === 'orders' && `${orders.length} commande(s) au total`}
                  {activeTab === 'clients' && `${clients.length} client(s) unique(s)`}
                  {activeTab === 'drivers' && `${drivers.length} livreur(s) enregistré(s)`}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Rechercher ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary w-64"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {activeTab === 'drivers' && (
                    <button
                      onClick={() => setShowCreateDriverModal(true)}
                      className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Nouveau livreur</span>
                    </button>
                  )}
                  
                  <button
                    onClick={loadData}
                    disabled={loading}
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Actualiser</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              <span className="ml-3 text-slate-600">Chargement...</span>
            </div>
          ) : (
            <>
              {/* Onglet Commandes */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {selectedOrder ? (
                    /* Détail de commande */
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <button
                              onClick={() => setSelectedOrder(null)}
                              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors mb-4"
                            >
                              <Package className="h-4 w-4 rotate-180" />
                              <span>Retour à la liste</span>
                            </button>
                            <h1 className="text-2xl font-bold">Commande {selectedOrder.order_number}</h1>
                            <p className="text-blue-100">
                              Créée le {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')} à {new Date(selectedOrder.created_at).toLocaleTimeString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold">{selectedOrder.total} MAD</div>
                            <div className="text-blue-100">Total</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Informations client */}
                          <div className="space-y-6">
                            <div className="bg-slate-50 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2 text-blue-600" />
                                Informations client
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <p className="font-medium text-slate-900">{selectedOrder.customer?.name}</p>
                                  {selectedOrder.customer?.contact_name && (
                                    <p className="text-sm text-slate-600">Contact: {selectedOrder.customer.contact_name}</p>
                                  )}
                                  <p className="text-sm text-slate-600">
                                    Type: {selectedOrder.customer?.type === 'professional' ? '🏢 Professionnel' : '👤 Particulier'}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <Phone className="h-4 w-4 text-green-600" />
                                  <span className="text-slate-700">{selectedOrder.customer?.phone}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <Mail className="h-4 w-4 text-blue-600" />
                                  <span className="text-slate-700">{selectedOrder.customer?.email}</span>
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
                                        <p className="font-medium text-slate-900">{getIceTypeName(item.ice_type)}</p>
                                        <p className="text-sm text-slate-600">{item.quantity}x {item.package_size}</p>
                                        <p className="text-xs text-slate-500">{item.unit_price} MAD/unité</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-green-600">{item.total_price} MAD</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Informations de livraison et actions */}
                          <div className="space-y-6">
                            <div className="bg-slate-50 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                <Truck className="h-5 w-5 mr-2 text-orange-600" />
                                Livraison
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
                                  <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                                    {getStatusIcon(selectedOrder.status)}
                                    <span className="ml-1">{getStatusLabel(selectedOrder.status)}</span>
                                  </div>
                                </div>
                                
                                {selectedOrder.delivery_date && (
                                  <div className="flex items-center space-x-3">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span>{selectedOrder.delivery_date} à {selectedOrder.delivery_time}</span>
                                  </div>
                                )}

                                <div className="flex items-start space-x-3">
                                  <MapPin className="h-4 w-4 text-red-500 mt-1" />
                                  <span className="text-slate-700">{selectedOrder.delivery_address}</span>
                                </div>

                                {selectedOrder.assigned_driver && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="font-medium text-green-800">Livreur assigné:</p>
                                    <p className="text-green-700">{selectedOrder.assigned_driver.name}</p>
                                    <p className="text-sm text-green-600">{selectedOrder.assigned_driver.phone}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions admin */}
                            <div className="bg-slate-50 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions</h3>
                              <div className="space-y-3">
                                {/* Changer le statut */}
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-2">Statut de la commande</label>
                                  <select
                                    value={selectedOrder.status}
                                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as Order['status'])}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                                  >
                                    <option value="pending">En attente</option>
                                    <option value="confirmed">Confirmée</option>
                                    <option value="delivering">En livraison</option>
                                    <option value="delivered">Livrée</option>
                                    <option value="cancelled">Annulée</option>
                                  </select>
                                </div>

                                {/* Assigner un livreur */}
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-2">Assigner un livreur</label>
                                  <select
                                    value={selectedOrder.assigned_driver_id || ''}
                                    onChange={(e) => assignDriverToOrder(selectedOrder.id, e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                                  >
                                    <option value="">Aucun livreur assigné</option>
                                    {drivers.filter(d => d.is_active).map(driver => (
                                      <option key={driver.id} value={driver.id}>
                                        {driver.name} ({driver.current_status})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Télécharger PDF */}
                                <button
                                  onClick={() => generateOrderPDF(selectedOrder)}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Télécharger PDF</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {selectedOrder.notes && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-slate-900 mb-2">Notes du client:</h4>
                            <p className="text-slate-700">{selectedOrder.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Liste des commandes */
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Commande</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Livraison</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {filteredOrders.map((order) => (
                              <tr key={order.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-medium text-slate-900">{order.order_number}</p>
                                    <p className="text-sm text-slate-500">
                                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                    {order.delivery_type === 'express' && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                                        ⚡ Express
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-medium text-slate-900">{order.customer?.name}</p>
                                    <p className="text-sm text-slate-500">{order.customer?.phone}</p>
                                    <p className="text-xs text-slate-400">
                                      {order.customer?.type === 'professional' ? '🏢 Pro' : '👤 Part'}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    {order.delivery_date ? (
                                      <p className="text-sm text-slate-700">{order.delivery_date}</p>
                                    ) : (
                                      <p className="text-sm text-orange-600 font-medium">ASAP</p>
                                    )}
                                    <p className="text-xs text-slate-500 truncate max-w-32">{order.delivery_address}</p>
                                    {order.assigned_driver && (
                                      <p className="text-xs text-green-600">👤 {order.assigned_driver.name}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border font-medium ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    <span>{getStatusLabel(order.status)}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-green-600">{order.total} MAD</p>
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-brand-primary hover:bg-brand-secondary text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Voir</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {filteredOrders.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                          <p className="text-lg font-medium">Aucune commande trouvée</p>
                          <p className="text-sm">
                            {searchTerm ? 'Essayez de modifier votre recherche' : 'Les nouvelles commandes apparaîtront ici'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Clients */}
              {activeTab === 'clients' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Commandes</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total dépensé</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dernière commande</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredClients.map((client) => (
                          <tr key={client.email} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900">{client.name}</p>
                                {client.contact_name && (
                                  <p className="text-sm text-slate-500">Contact: {client.contact_name}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Mail className="h-3 w-3 text-blue-600" />
                                  <span className="text-sm text-slate-700">{client.email}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-3 w-3 text-green-600" />
                                  <span className="text-sm text-slate-700">{client.phone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                client.type === 'professional' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {client.type === 'professional' ? (
                                  <>
                                    <Building2 className="h-3 w-3 mr-1" />
                                    Professionnel
                                  </>
                                ) : (
                                  <>
                                    <User className="h-3 w-3 mr-1" />
                                    Particulier
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-center">
                                <p className="font-semibold text-slate-900">{client.orderCount}</p>
                                <p className="text-xs text-slate-500">commande(s)</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-green-600">{client.totalSpent.toFixed(2)} MAD</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-700">
                                {new Date(client.lastOrderDate).toLocaleDateString('fr-FR')}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <a
                                  href={`tel:${client.phone}`}
                                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                                  title="Appeler"
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a
                                  href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </a>
                                <a
                                  href={`mailto:${client.email}`}
                                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                                  title="Email"
                                >
                                  <Mail className="h-3 w-3" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredClients.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">Aucun client trouvé</p>
                      <p className="text-sm">
                        {searchTerm ? 'Essayez de modifier votre recherche' : 'Les clients apparaîtront ici après leurs premières commandes'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Livreurs */}
              {activeTab === 'drivers' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Livreur</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">État</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Créé le</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredDrivers.map((driver) => (
                          <tr key={driver.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-900">{driver.name}</p>
                                <p className="text-sm text-slate-500">{driver.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3 w-3 text-green-600" />
                                <span className="text-sm text-slate-700">{driver.phone}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                driver.current_status === 'available' ? 'bg-green-100 text-green-800' :
                                driver.current_status === 'busy' ? 'bg-orange-100 text-orange-800' :
                                driver.current_status === 'on_break' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {driver.current_status === 'available' && '🟢 Disponible'}
                                {driver.current_status === 'busy' && '🟠 Occupé'}
                                {driver.current_status === 'on_break' && '🟡 En pause'}
                                {driver.current_status === 'offline' && '⚫ Hors ligne'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                driver.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {driver.is_active ? '✅ Actif' : '❌ Inactif'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-700">
                                {new Date(driver.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <a
                                  href={`tel:${driver.phone}`}
                                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                                  title="Appeler"
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a
                                  href={`https://wa.me/${driver.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </a>
                                <button
                                  onClick={() => deleteDriver(driver.id, driver.name)}
                                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredDrivers.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">Aucun livreur trouvé</p>
                      <p className="text-sm">
                        {searchTerm ? 'Essayez de modifier votre recherche' : 'Cliquez sur "Nouveau livreur" pour ajouter un livreur'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de création de livreur */}
      {showCreateDriverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Nouveau Livreur</h3>
                <button
                  onClick={() => setShowCreateDriverModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                    placeholder="Nom du livreur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe *</label>
                  <input
                    type="password"
                    value={newDriver.password}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary"
                    placeholder="Mot de passe sécurisé"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newDriver.is_active}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-slate-300 text-brand-primary focus:ring-brand-secondary"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                    Livreur actif
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setShowCreateDriverModal(false)}
                  className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={createDriver}
                  disabled={creatingDriver}
                  className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {creatingDriver ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Créer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;