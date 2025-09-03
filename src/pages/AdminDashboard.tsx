import React, { useState, useEffect } from 'react';
import { 
  LogOut, Package, Clock, CheckCircle, XCircle, Truck, MapPin, Phone, Download, 
  RefreshCw, Navigation, User, Calendar, AlertCircle, Plus, Trash2, Edit, 
  Search, Filter, Users, Building2, MessageCircle, Mail, Eye, ChevronDown,
  SortAsc, SortDesc, Calendar as CalendarIcon, DollarSign, TrendingUp,
  UserCheck, UserX, Activity, Bell, Warehouse, Archive, BarChart3, 
  TrendingDown, Minus, PlusCircle, History, Target
} from 'lucide-react';
import { Order, Customer, DeliveryDriver, orderService, driverService, supabase, supabaseAdmin } from '../lib/supabase';
import { stockService, ColdRoomStock, DriverStockAssignment, StockMovement } from '../lib/stockService';
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

interface OrderFilters {
  status: string;
  deliveryType: string;
  dateRange: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ClientFilters {
  type: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface DriverFilters {
  status: string;
  search: string;
  isActive: string;
}

function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'clients' | 'drivers' | 'stock'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<MergedClient[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [coldRoomStock, setColdRoomStock] = useState<ColdRoomStock[]>([]);
  const [driverAssignments, setDriverAssignments] = useState<DriverStockAssignment[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockStats, setStockStats] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<string | null>(null);
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showDriverAssignment, setShowDriverAssignment] = useState(false);
  const [selectedAssignmentDate, setSelectedAssignmentDate] = useState(new Date().toISOString().split('T')[0]);

  // États pour les filtres
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({
    status: '',
    deliveryType: '',
    dateRange: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [clientFilters, setClientFilters] = useState<ClientFilters>({
    type: '',
    search: '',
    sortBy: 'lastOrderDate',
    sortOrder: 'desc'
  });

  const [driverFilters, setDriverFilters] = useState<DriverFilters>({
    status: '',
    search: '',
    isActive: ''
  });

  // État pour les ajustements de stock
  const [stockAdjustment, setStockAdjustment] = useState({
    ice_type: 'nuggets' as ColdRoomStock['ice_type'],
    package_size: '5kg' as ColdRoomStock['package_size'],
    quantity: 0,
    notes: ''
  });

  // État pour l'assignation aux livreurs
  const [driverAssignment, setDriverAssignment] = useState({
    driver_id: '',
    assignments: [] as Array<{
      ice_type: ColdRoomStock['ice_type'];
      package_size: ColdRoomStock['package_size'];
      quantity: number;
    }>
  });

  // État pour le nouveau livreur
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
    setupRealtimeSubscriptions();
    
    return () => {
      // Cleanup subscriptions
      supabase.removeAllChannels();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'stock') {
      loadStockData();
    }
  }, [activeTab, selectedAssignmentDate]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setupRealtimeSubscriptions = () => {
    // Écouter les changements sur les commandes
    supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          if (activeTab === 'orders') {
            loadOrders();
          }
        }
      )
      .subscribe();

    // Écouter les changements sur les livreurs
    supabase
      .channel('drivers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'delivery_drivers' },
        () => {
          if (activeTab === 'drivers') {
            loadDrivers();
          }
        }
      )
      .subscribe();
  };

  const loadStockData = async () => {
    try {
      const [stock, assignments, movements, stats] = await Promise.all([
        stockService.getColdRoomStock(),
        stockService.getDriverAssignments(selectedAssignmentDate),
        stockService.getStockMovements(20),
        stockService.getStockStats()
      ]);
      
      setColdRoomStock(stock);
      setDriverAssignments(assignments);
      setStockMovements(movements);
      setStockStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des données de stock:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOrders(),
        loadClients(),
        loadDrivers(),
        ...(activeTab === 'stock' ? [loadStockData()] : [])
      ]);
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
    setUpdatingStatus(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const assignDriverToOrder = async (orderId: string, driverId: string) => {
    setAssigningDriver(orderId);
    try {
      await driverService.assignDriverToOrder(orderId, driverId || null);
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    } finally {
      setAssigningDriver(null);
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
        setShowCreateDriver(false);
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

  const handleStockAdjustment = async () => {
    try {
      await stockService.updateColdRoomStock(
        stockAdjustment.ice_type,
        stockAdjustment.package_size,
        stockAdjustment.quantity,
        stockAdjustment.notes
      );
      
      setStockAdjustment({
        ice_type: 'nuggets',
        package_size: '5kg',
        quantity: 0,
        notes: ''
      });
      setShowStockAdjustment(false);
      await loadStockData();
      alert('Stock mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      alert('Erreur lors de la mise à jour du stock');
    }
  };

  const handleDriverStockAssignment = async () => {
    try {
      if (!driverAssignment.driver_id || driverAssignment.assignments.length === 0) {
        alert('Veuillez sélectionner un livreur et au moins un produit');
        return;
      }

      await stockService.assignStockToDriver(
        driverAssignment.driver_id,
        driverAssignment.assignments.filter(a => a.quantity > 0),
        selectedAssignmentDate
      );
      
      setDriverAssignment({
        driver_id: '',
        assignments: []
      });
      setShowDriverAssignment(false);
      await loadStockData();
      alert('Stock assigné avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('Erreur lors de l\'assignation du stock');
    }
  };

  const addAssignmentItem = () => {
    setDriverAssignment(prev => ({
      ...prev,
      assignments: [...prev.assignments, {
        ice_type: 'nuggets',
        package_size: '5kg',
        quantity: 0
      }]
    }));
  };

  const removeAssignmentItem = (index: number) => {
    setDriverAssignment(prev => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index)
    }));
  };

  const updateAssignmentItem = (index: number, field: string, value: any) => {
    setDriverAssignment(prev => ({
      ...prev,
      assignments: prev.assignments.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
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

  // Fonctions de filtrage
  const getFilteredOrders = () => {
    let filtered = [...orders];

    // Filtres
    if (orderFilters.status) {
      filtered = filtered.filter(order => order.status === orderFilters.status);
    }
    if (orderFilters.deliveryType) {
      filtered = filtered.filter(order => order.delivery_type === orderFilters.deliveryType);
    }
    if (orderFilters.search) {
      const search = orderFilters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(search) ||
        order.customer?.name.toLowerCase().includes(search) ||
        order.delivery_address.toLowerCase().includes(search)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (orderFilters.sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'total':
          aValue = parseFloat(a.total);
          bValue = parseFloat(b.total);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.order_number;
          bValue = b.order_number;
      }

      if (orderFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getFilteredClients = () => {
    let filtered = [...clients];

    if (clientFilters.type) {
      filtered = filtered.filter(client => client.type === clientFilters.type);
    }
    if (clientFilters.search) {
      const search = clientFilters.search.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search) ||
        client.phone.includes(search)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (clientFilters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'orderCount':
          aValue = a.orderCount;
          bValue = b.orderCount;
          break;
        case 'totalSpent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case 'lastOrderDate':
        default:
          aValue = new Date(a.lastOrderDate);
          bValue = new Date(b.lastOrderDate);
      }

      if (clientFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getFilteredDrivers = () => {
    let filtered = [...drivers];

    if (driverFilters.status) {
      filtered = filtered.filter(driver => driver.current_status === driverFilters.status);
    }
    if (driverFilters.isActive !== '') {
      const isActive = driverFilters.isActive === 'true';
      filtered = filtered.filter(driver => driver.is_active === isActive);
    }
    if (driverFilters.search) {
      const search = driverFilters.search.toLowerCase();
      filtered = filtered.filter(driver =>
        driver.name.toLowerCase().includes(search) ||
        driver.email.toLowerCase().includes(search) ||
        driver.phone.includes(search)
      );
    }

    return filtered;
  };

  // Statistiques
  const getOrderStats = () => {
    const filtered = getFilteredOrders();
    return {
      total: filtered.length,
      pending: filtered.filter(o => o.status === 'pending').length,
      confirmed: filtered.filter(o => o.status === 'confirmed').length,
      delivering: filtered.filter(o => o.status === 'delivering').length,
      delivered: filtered.filter(o => o.status === 'delivered').length,
      cancelled: filtered.filter(o => o.status === 'cancelled').length,
      totalRevenue: filtered.reduce((sum, o) => sum + parseFloat(o.total), 0),
      urgentOrders: filtered.filter(o => o.delivery_type === 'express').length
    };
  };

  const getClientStats = () => {
    const filtered = getFilteredClients();
    return {
      total: filtered.length,
      professional: filtered.filter(c => c.type === 'professional').length,
      individual: filtered.filter(c => c.type === 'individual').length,
      totalRevenue: filtered.reduce((sum, c) => sum + c.totalSpent, 0),
      averageOrderValue: filtered.length > 0 ? filtered.reduce((sum, c) => sum + c.totalSpent, 0) / filtered.reduce((sum, c) => sum + c.orderCount, 0) : 0
    };
  };

  const getDriverStats = () => {
    const filtered = getFilteredDrivers();
    return {
      total: filtered.length,
      active: filtered.filter(d => d.is_active).length,
      available: filtered.filter(d => d.current_status === 'available').length,
      busy: filtered.filter(d => d.current_status === 'busy').length,
      offline: filtered.filter(d => d.current_status === 'offline').length
    };
  };

  const getStockStats = () => {
    if (!stockStats) return {
      totalColdRoom: 0,
      totalAssignedToday: 0,
      totalRemainingWithDrivers: 0,
      lowStockItems: 0
    };

    const lowStockItems = coldRoomStock.filter(item => item.quantity < 20).length;
    
    return {
      ...stockStats,
      lowStockItems
    };
  };

  const orderStats = getOrderStats();
  const clientStats = getClientStats();
  const driverStats = getDriverStats();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg w-8 h-8 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-xs text-slate-600">The Ice Guys</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>

              <button
                onClick={onBack}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('orders');
                setTimeout(scrollToTop, 100);
              }}
              className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Package className="h-5 w-5" />
              <span className="font-medium">Commandes</span>
              <span className="text-xs text-slate-500">{orderStats.pending + orderStats.confirmed}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('clients');
                setTimeout(scrollToTop, 100);
              }}
              className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'clients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">Clients</span>
              <span className="text-xs text-slate-500">{clientStats.total}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('drivers');
                setTimeout(scrollToTop, 100);
              }}
              className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'drivers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Truck className="h-5 w-5" />
              <span className="font-medium">Livreurs</span>
              <span className="text-xs text-slate-500">{driverStats.available}/{driverStats.total}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('stock');
                setTimeout(scrollToTop, 100);
              }}
              className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stock'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Warehouse className="h-5 w-5" />
              <span className="font-medium">Stock</span>
              {stockStats && getStockStats().lowStockItems > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {getStockStats().lowStockItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Chargement...</span>
          </div>
        ) : (
          <div>
            {/* En-tête de section */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
                  {activeTab === 'orders' && (
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-slate-600">{orderStats.total} commandes</span>
                      <span className="text-slate-600">{orderStats.totalRevenue.toFixed(2)} MAD de CA</span>
                      {orderStats.urgentOrders > 0 && (
                        <span className="font-medium text-red-600">{orderStats.urgentOrders} urgentes</span>
                      )}
                    </div>
                  )}

                  {activeTab === 'clients' && (
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-slate-600">{clientStats.total} clients</span>
                      <span className="text-slate-600">{clientStats.totalRevenue.toFixed(2)} MAD de CA total</span>
                      <span className="text-slate-600">Panier moyen: {clientStats.averageOrderValue.toFixed(2)} MAD</span>
                    </div>
                  )}

                  {activeTab === 'drivers' && (
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-slate-600">{driverStats.available} disponibles</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-slate-600">{driverStats.busy} occupés</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'stock' && stockStats && (
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-slate-600">{getStockStats().totalColdRoom} unités en stock</span>
                      <span className="text-slate-600">{getStockStats().totalAssignedToday} assignées aujourd'hui</span>
                      {getStockStats().lowStockItems > 0 && (
                        <span className="font-medium text-orange-600">{getStockStats().lowStockItems} stocks faibles</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* Filtres */}
                  {(activeTab === 'orders' || activeTab === 'clients') && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                        showFilters 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Filter className="h-4 w-4" />
                      <span>Filtres</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {/* Actions spécifiques */}
                  {activeTab === 'drivers' && (
                    <button
                      onClick={() => setShowCreateDriver(true)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Nouveau livreur</span>
                    </button>
                  )}

                  {activeTab === 'stock' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowStockAdjustment(true)}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Archive className="h-4 w-4" />
                        <span>Ajuster stock</span>
                      </button>
                      <button
                        onClick={() => setShowDriverAssignment(true)}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Truck className="h-4 w-4" />
                        <span>Assigner aux livreurs</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Panneau de filtres */}
              {showFilters && (activeTab === 'orders' || activeTab === 'clients') && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {activeTab === 'orders' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Statut</label>
                        <select
                          value={orderFilters.status}
                          onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Tous les statuts</option>
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="delivering">En livraison</option>
                          <option value="delivered">Livrée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Type de livraison</label>
                        <select
                          value={orderFilters.deliveryType}
                          onChange={(e) => setOrderFilters(prev => ({ ...prev, deliveryType: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Tous les types</option>
                          <option value="standard">Standard</option>
                          <option value="express">Express</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Trier par</label>
                        <select
                          value={orderFilters.sortBy}
                          onChange={(e) => setOrderFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="created_at">Date de création</option>
                          <option value="total">Montant</option>
                          <option value="status">Statut</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ordre</label>
                        <button
                          onClick={() => setOrderFilters(prev => ({ 
                            ...prev, 
                            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                          }))}
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          {orderFilters.sortOrder === 'asc' ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          )}
                          <span>{orderFilters.sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'clients' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Type de client</label>
                        <select
                          value={clientFilters.type}
                          onChange={(e) => setClientFilters(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Tous les types</option>
                          <option value="professional">Professionnel</option>
                          <option value="individual">Particulier</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Recherche</label>
                        <input
                          type="text"
                          placeholder="Nom, email, téléphone..."
                          value={clientFilters.search}
                          onChange={(e) => setClientFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Trier par</label>
                        <select
                          value={clientFilters.sortBy}
                          onChange={(e) => setClientFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="lastOrderDate">Dernière commande</option>
                          <option value="name">Nom</option>
                          <option value="orderCount">Nombre de commandes</option>
                          <option value="totalSpent">Montant total</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ordre</label>
                        <button
                          onClick={() => setClientFilters(prev => ({ 
                            ...prev, 
                            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                          }))}
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          {clientFilters.sortOrder === 'asc' ? (
                            <SortAsc className="h-4 w-4" />
                          ) : (
                            <SortDesc className="h-4 w-4" />
                          )}
                          <span>{clientFilters.sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'orders' && (
              <div>
                {selectedOrder ? (
                  /* Détail de commande */
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <button
                            onClick={() => setSelectedOrder(null)}
                            className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors mb-4"
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
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {selectedOrder.delivery_type === 'express' ? '🚨 URGENT' : '📅 Standard'}
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
                                  disabled={updatingStatus === selectedOrder.id}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                                  disabled={assigningDriver === selectedOrder.id}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                          {getFilteredOrders().map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-slate-900">{order.order_number}</p>
                                  <p className="text-sm text-slate-500">
                                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                  </p>
                                  {order.delivery_type === 'express' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                      🚨 URGENT
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
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
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
                    
                    {getFilteredOrders().length === 0 && (
                      <div className="p-8 text-center text-slate-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-lg font-medium">Aucune commande trouvée</p>
                        <p className="text-sm">
                          {orderFilters.search || orderFilters.status || orderFilters.deliveryType ? 'Essayez de modifier vos filtres' : 'Les nouvelles commandes apparaîtront ici'}
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
                      {getFilteredClients().map((client) => (
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
                
                {getFilteredClients().length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">Aucun client trouvé</p>
                    <p className="text-sm">
                      {clientFilters.search || clientFilters.type ? 'Essayez de modifier vos filtres' : 'Les clients apparaîtront ici après leurs premières commandes'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Livreurs */}
            {activeTab === 'drivers' && (
              <div>
                {/* Filtres pour les livreurs */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
                      <select
                        value={driverFilters.status}
                        onChange={(e) => setDriverFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tous les statuts</option>
                        <option value="available">Disponible</option>
                        <option value="busy">Occupé</option>
                        <option value="on_break">En pause</option>
                        <option value="offline">Hors ligne</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">État</label>
                      <select
                        value={driverFilters.isActive}
                        onChange={(e) => setDriverFilters(prev => ({ ...prev, isActive: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tous</option>
                        <option value="true">Actif</option>
                        <option value="false">Inactif</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Recherche</label>
                      <input
                        type="text"
                        placeholder="Nom, email, téléphone..."
                        value={driverFilters.search}
                        onChange={(e) => setDriverFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

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
                        {getFilteredDrivers().map((driver) => (
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
                  
                  {getFilteredDrivers().length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">Aucun livreur trouvé</p>
                      <p className="text-sm">
                        {driverFilters.search || driverFilters.status || driverFilters.isActive ? 'Essayez de modifier vos filtres' : 'Cliquez sur "Nouveau livreur" pour ajouter un livreur'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Onglet Stock */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                {/* Contrôles de date pour les assignations */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Gestion du stock</h3>
                    <div className="flex items-center space-x-3">
                      <label className="text-sm font-medium text-slate-700">Date d'assignation :</label>
                      <input
                        type="date"
                        value={selectedAssignmentDate}
                        onChange={(e) => setSelectedAssignmentDate(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Statistiques de stock */}
                {stockStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-600">Stock chambre froide</p>
                          <p className="text-xl font-bold text-blue-600">{getStockStats().totalColdRoom}</p>
                        </div>
                        <Warehouse className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-600">Assigné aujourd'hui</p>
                          <p className="text-xl font-bold text-orange-600">{getStockStats().totalAssignedToday}</p>
                        </div>
                        <Truck className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-600">Chez les livreurs</p>
                          <p className="text-xl font-bold text-green-600">{getStockStats().totalRemainingWithDrivers}</p>
                        </div>
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-600">Stocks faibles</p>
                          <p className="text-xl font-bold text-red-600">{getStockStats().lowStockItems}</p>
                        </div>
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Stock en chambre froide */}
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-blue-50">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                        <Warehouse className="h-5 w-5 mr-2 text-blue-600" />
                        Stock Chambre Froide
                      </h3>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-4">
                        {coldRoomStock.map((stock) => (
                          <div key={`${stock.ice_type}-${stock.package_size}`} className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-slate-900 capitalize">
                                  {getIceTypeName(stock.ice_type)} - {stock.package_size}
                                </h4>
                                <p className="text-sm text-slate-600">
                                  Mis à jour: {new Date(stock.last_updated).toLocaleString('fr-FR')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${
                                  stock.quantity < 20 ? 'text-red-600' : 
                                  stock.quantity < 50 ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                  {stock.quantity}
                                </p>
                                <p className="text-xs text-slate-500">unités</p>
                                {stock.quantity < 20 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                    Stock faible
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Assignations du jour */}
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-green-50">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                        <Truck className="h-5 w-5 mr-2 text-green-600" />
                        Assignations Livreurs ({selectedAssignmentDate})
                      </h3>
                    </div>
                    
                    <div className="p-6">
                      {driverAssignments.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">
                          <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                          <p>Aucune assignation pour cette date</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(
                            driverAssignments.reduce((acc, assignment) => {
                              const driverName = assignment.driver?.name || 'Livreur inconnu';
                              if (!acc[driverName]) {
                                acc[driverName] = [];
                              }
                              acc[driverName].push(assignment);
                              return acc;
                            }, {} as Record<string, DriverStockAssignment[]>)
                          ).map(([driverName, assignments]) => (
                            <div key={driverName} className="bg-slate-50 rounded-lg p-4">
                              <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                {driverName}
                              </h4>
                              <div className="space-y-2">
                                {assignments.map((assignment) => (
                                  <div key={assignment.id} className="flex items-center justify-between bg-white rounded p-3">
                                    <div>
                                      <span className="font-medium capitalize">
                                        {getIceTypeName(assignment.ice_type)} - {assignment.package_size}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold">
                                        {assignment.quantity_remaining}/{assignment.quantity_assigned}
                                      </p>
                                      <p className="text-xs text-slate-500">restant/assigné</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Historique des mouvements */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <History className="h-5 w-5 mr-2 text-slate-600" />
                      Historique des Mouvements
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    {stockMovements.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">
                        <History className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>Aucun mouvement de stock</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stockMovements.map((movement) => (
                          <div key={movement.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                movement.movement_type === 'production' ? 'bg-green-100' :
                                movement.movement_type === 'assignment' ? 'bg-blue-100' :
                                movement.movement_type === 'delivery' ? 'bg-orange-100' :
                                'bg-slate-100'
                              }`}>
                                {movement.movement_type === 'production' && <PlusCircle className="h-4 w-4 text-green-600" />}
                                {movement.movement_type === 'assignment' && <Truck className="h-4 w-4 text-blue-600" />}
                                {movement.movement_type === 'delivery' && <CheckCircle className="h-4 w-4 text-orange-600" />}
                                {movement.movement_type === 'adjustment' && <Edit className="h-4 w-4 text-slate-600" />}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 capitalize">
                                  {getIceTypeName(movement.ice_type)} - {movement.package_size}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {new Date(movement.created_at).toLocaleString('fr-FR')}
                                </p>
                                {movement.notes && (
                                  <p className="text-xs text-slate-500">{movement.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${
                                movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                              </p>
                              <p className="text-xs text-slate-500 capitalize">{movement.movement_type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de création de livreur */}
      {showCreateDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Nouveau Livreur</h3>
                <button
                  onClick={() => setShowCreateDriver(false)}
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom du livreur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe *</label>
                  <input
                    type="password"
                    value={newDriver.password}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setShowCreateDriver(false)}
                  className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={createDriver}
                  disabled={creatingDriver}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
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

      {/* Modal d'ajustement de stock */}
      {showStockAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Ajuster le Stock</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type de glaçon</label>
                <select
                  value={stockAdjustment.ice_type}
                  onChange={(e) => setStockAdjustment(prev => ({ ...prev, ice_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="nuggets">Nugget's</option>
                  <option value="gourmet">Gourmet</option>
                  <option value="cubique">Glace Paillette</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Conditionnement</label>
                <select
                  value={stockAdjustment.package_size}
                  onChange={(e) => setStockAdjustment(prev => ({ ...prev, package_size: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5kg">5kg</option>
                  <option value="20kg">20kg</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nouvelle quantité</label>
                <input
                  type="number"
                  min="0"
                  value={stockAdjustment.quantity}
                  onChange={(e) => setStockAdjustment(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optionnel)</label>
                <textarea
                  value={stockAdjustment.notes}
                  onChange={(e) => setStockAdjustment(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Raison de l'ajustement..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowStockAdjustment(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleStockAdjustment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'assignation aux livreurs */}
      {showDriverAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Assigner Stock aux Livreurs</h3>
              <p className="text-sm text-slate-600">Date: {selectedAssignmentDate}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Livreur</label>
                <select
                  value={driverAssignment.driver_id}
                  onChange={(e) => setDriverAssignment(prev => ({ ...prev, driver_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un livreur</option>
                  {drivers.filter(d => d.is_active).map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-900">Produits à assigner</h4>
                  <button
                    onClick={addAssignmentItem}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {driverAssignment.assignments.map((assignment, index) => (
                    <div key={index} className="grid grid-cols-4 gap-3 items-center bg-slate-50 rounded-lg p-3">
                      <select
                        value={assignment.ice_type}
                        onChange={(e) => updateAssignmentItem(index, 'ice_type', e.target.value)}
                        className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="nuggets">Nugget's</option>
                        <option value="gourmet">Gourmet</option>
                        <option value="cubique">Paillette</option>
                      </select>

                      <select
                        value={assignment.package_size}
                        onChange={(e) => updateAssignmentItem(index, 'package_size', e.target.value)}
                        className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="5kg">5kg</option>
                        <option value="20kg">20kg</option>
                      </select>

                      <input
                        type="number"
                        min="0"
                        value={assignment.quantity}
                        onChange={(e) => updateAssignmentItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder="Qté"
                      />

                      <button
                        onClick={() => removeAssignmentItem(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {driverAssignment.assignments.length === 0 && (
                  <div className="text-center text-slate-500 py-4">
                    <p className="text-sm">Aucun produit ajouté</p>
                    <button
                      onClick={addAssignmentItem}
                      className="mt-2 text-blue-600 hover:text-blue-700 transition-colors text-sm"
                    >
                      Ajouter un produit
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDriverAssignment(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDriverStockAssignment}
                disabled={!driverAssignment.driver_id || driverAssignment.assignments.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;