import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  current_status: 'offline' | 'available' | 'busy' | 'on_break';
  created_at: string;
  updated_at: string;
}

export interface DriverLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  address?: string;
  recorded_at: string;
}

export interface Customer {
  id: string;
  type: 'professional' | 'individual';
  name: string;
  contact_name?: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  assigned_driver_id?: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'delivering' | 'delivered' | 'cancelled';
  delivery_type: 'standard' | 'express';
  delivery_date?: string;
  delivery_time?: string;
  delivery_address: string;
  delivery_coordinates?: [number, number];
  notes?: string;
  driver_notes?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  assigned_driver?: DeliveryDriver;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  ice_type: 'nuggets' | 'gourmet' | 'cubique';
  package_size: '5kg' | '20kg';
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// Fonctions utilitaires pour les commandes
export const orderService = {
  // Créer un client
  async createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Créer une commande avec ses articles
  async createOrder(orderData: {
    customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
    order: Omit<Order, 'id' | 'customer_id' | 'order_number' | 'created_at' | 'updated_at'>;
    items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[];
  }) {
    try {
      // 1. Créer ou récupérer le client
      let customer;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', orderData.customer.email)
        .eq('phone', orderData.customer.phone)
        .maybeSingle();

      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        customer = await this.createCustomer(orderData.customer);
      }

      // 2. Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          ...orderData.order,
          customer_id: customer.id,
          // Convertir les coordonnées au format PostgreSQL point (longitude,latitude)
          delivery_coordinates: orderData.order.delivery_coordinates 
            ? `(${orderData.order.delivery_coordinates[0]},${orderData.order.delivery_coordinates[1]})`
            : null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Créer les articles de commande
      const orderItems = orderData.items.map(item => ({
        ...item,
        order_id: order.id
      }));

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      return {
        ...order,
        customer,
        order_items: items
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Récupérer les commandes d'un client
  async getCustomerOrders(customerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_items(*)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Mettre à jour le statut d'une commande
  async updateOrderStatus(orderId: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Récupérer toutes les commandes (pour admin)
  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Fonctions utilitaires pour les livreurs
export const driverService = {
  // Récupérer tous les livreurs
  async getAllDrivers() {
    console.log('Service: Récupération des livreurs...');
    const { data, error } = await supabase
      .from('delivery_drivers')
      .select('*')
      .order('name');

    console.log('Supabase response:', { data, error });
    if (error) throw error;
    return data;
  },

  // Créer un nouveau livreur
  async createDriver(driverData: Omit<DeliveryDriver, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('delivery_drivers')
      .insert([driverData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour un livreur
  async updateDriver(driverId: string, updates: Partial<DeliveryDriver>) {
    const { data, error } = await supabase
      .from('delivery_drivers')
      .update(updates)
      .eq('id', driverId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Assigner un livreur à une commande
  async assignDriverToOrder(orderId: string, driverId: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ assigned_driver_id: driverId })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour le statut d'une commande (pour les livreurs)
  async updateOrderStatus(orderId: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Récupérer les commandes d'un livreur
  async getDriverOrders(driverId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_items(*),
        assigned_driver:delivery_drivers(*)
      `)
      .eq('assigned_driver_id', driverId)
      .in('status', ['confirmed', 'preparing', 'delivering'])
      .order('delivery_type', { ascending: false }) // Express en premier
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Enregistrer la position d'un livreur
  async recordDriverLocation(driverId: string, latitude: number, longitude: number, address?: string) {
    const { data, error } = await supabase
      .from('driver_locations')
      .insert([{
        driver_id: driverId,
        latitude,
        longitude,
        address
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Récupérer la dernière position d'un livreur
  async getDriverLastLocation(driverId: string) {
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Récupérer toutes les dernières positions des livreurs
  async getAllDriversLastLocations() {
    const { data, error } = await supabase
      .from('driver_locations')
      .select(`
        *,
        driver:delivery_drivers(*)
      `)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    
    // Garder seulement la dernière position de chaque livreur
    const lastLocations = new Map();
    data?.forEach(location => {
      if (!lastLocations.has(location.driver_id)) {
        lastLocations.set(location.driver_id, location);
      }
    });
    
    return Array.from(lastLocations.values());
  }
};