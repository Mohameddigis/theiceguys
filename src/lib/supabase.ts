import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
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
  order_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  delivery_type: 'standard' | 'express';
  delivery_date?: string;
  delivery_time?: string;
  delivery_address: string;
  delivery_coordinates?: [number, number];
  notes?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
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