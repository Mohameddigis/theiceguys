import { supabase, supabaseAdmin } from './supabase';

export interface ColdRoomStock {
  id: string;
  ice_type: 'nuggets' | 'gourmet' | 'cubique';
  package_size: '5kg' | '20kg';
  quantity: number;
  last_updated: string;
  updated_by?: string;
}

export interface DriverStockAssignment {
  id: string;
  driver_id: string;
  ice_type: 'nuggets' | 'gourmet' | 'cubique';
  package_size: '5kg' | '20kg';
  quantity_assigned: number;
  quantity_remaining: number;
  assignment_date: string;
  assigned_by?: string;
  created_at: string;
  driver?: {
    name: string;
    phone: string;
  };
}

export interface StockMovement {
  id: string;
  movement_type: 'production' | 'assignment' | 'delivery' | 'adjustment';
  ice_type: 'nuggets' | 'gourmet' | 'cubique';
  package_size: '5kg' | '20kg';
  quantity_change: number;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export const stockService = {
  // Gestion du stock en chambre froide
  async getColdRoomStock(): Promise<ColdRoomStock[]> {
    const { data, error } = await supabaseAdmin
      .from('cold_room_stock')
      .select('*')
      .order('ice_type')
      .order('package_size');

    if (error) throw error;
    return data || [];
  },

  async updateColdRoomStock(
    iceType: ColdRoomStock['ice_type'],
    packageSize: ColdRoomStock['package_size'],
    quantity: number,
    notes?: string
  ): Promise<ColdRoomStock> {
    // Récupérer le stock actuel
    const { data: currentStock } = await supabaseAdmin
      .from('cold_room_stock')
      .select('quantity')
      .eq('ice_type', iceType)
      .eq('package_size', packageSize)
      .single();

    const oldQuantity = currentStock?.quantity || 0;
    const quantityChange = quantity - oldQuantity;

    // Mettre à jour le stock
    const { data, error } = await supabaseAdmin
      .from('cold_room_stock')
      .upsert({
        ice_type: iceType,
        package_size: packageSize,
        quantity: quantity
      })
      .select()
      .single();

    if (error) throw error;

    // Enregistrer le mouvement de stock
    if (quantityChange !== 0) {
      await this.recordStockMovement({
        movement_type: quantityChange > 0 ? 'production' : 'adjustment',
        ice_type: iceType,
        package_size: packageSize,
        quantity_change: quantityChange,
        notes: notes || `Mise à jour manuelle du stock`
      });
    }

    return data;
  },

  // Gestion des assignations aux livreurs
  async getDriverAssignments(date?: string): Promise<DriverStockAssignment[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabaseAdmin
      .from('driver_stock_assignments')
      .select(`
        *,
        driver:delivery_drivers(name, phone)
      `)
      .eq('assignment_date', targetDate)
      .order('driver_id');

    if (error) throw error;
    return data || [];
  },

  async assignStockToDriver(
    driverId: string,
    assignments: Array<{
      ice_type: ColdRoomStock['ice_type'];
      package_size: ColdRoomStock['package_size'];
      quantity: number;
    }>,
    date?: string
  ): Promise<void> {
    const assignmentDate = date || new Date().toISOString().split('T')[0];

    // Supprimer les anciennes assignations du jour
    await supabaseAdmin
      .from('driver_stock_assignments')
      .delete()
      .eq('driver_id', driverId)
      .eq('assignment_date', assignmentDate);

    // Créer les nouvelles assignations
    const assignmentData = assignments.map(assignment => ({
      driver_id: driverId,
      ice_type: assignment.ice_type,
      package_size: assignment.package_size,
      quantity_assigned: assignment.quantity,
      quantity_remaining: assignment.quantity,
      assignment_date: assignmentDate
    }));

    const { error } = await supabaseAdmin
      .from('driver_stock_assignments')
      .insert(assignmentData);

    if (error) throw error;

    // Enregistrer les mouvements de stock
    for (const assignment of assignments) {
      await this.recordStockMovement({
        movement_type: 'assignment',
        ice_type: assignment.ice_type,
        package_size: assignment.package_size,
        quantity_change: -assignment.quantity,
        notes: `Assignation au livreur pour le ${assignmentDate}`
      });

      // Déduire du stock en chambre froide
      await this.adjustColdRoomStock(
        assignment.ice_type,
        assignment.package_size,
        -assignment.quantity
      );
    }
  },

  async updateDriverRemainingStock(
    assignmentId: string,
    quantityRemaining: number
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('driver_stock_assignments')
      .update({ quantity_remaining: quantityRemaining })
      .eq('id', assignmentId);

    if (error) throw error;
  },

  // Ajustement automatique du stock
  async adjustColdRoomStock(
    iceType: ColdRoomStock['ice_type'],
    packageSize: ColdRoomStock['package_size'],
    quantityChange: number
  ): Promise<void> {
    const { data: currentStock } = await supabaseAdmin
      .from('cold_room_stock')
      .select('quantity')
      .eq('ice_type', iceType)
      .eq('package_size', packageSize)
      .single();

    const newQuantity = Math.max(0, (currentStock?.quantity || 0) + quantityChange);

    await supabaseAdmin
      .from('cold_room_stock')
      .upsert({
        ice_type: iceType,
        package_size: packageSize,
        quantity: newQuantity
      });
  },

  // Gestion des mouvements de stock
  async getStockMovements(limit = 50): Promise<StockMovement[]> {
    const { data, error } = await supabaseAdmin
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async recordStockMovement(movement: Omit<StockMovement, 'id' | 'created_at' | 'created_by'>): Promise<void> {
    const { error } = await supabaseAdmin
      .from('stock_movements')
      .insert({
        ...movement,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) throw error;
  },

  // Statistiques de stock
  async getStockStats() {
    const [coldRoomStock, todayAssignments, movements] = await Promise.all([
      this.getColdRoomStock(),
      this.getDriverAssignments(),
      this.getStockMovements(10)
    ]);

    const totalColdRoomStock = coldRoomStock.reduce((sum, item) => sum + item.quantity, 0);
    const totalAssignedToday = todayAssignments.reduce((sum, item) => sum + item.quantity_assigned, 0);
    const totalRemainingWithDrivers = todayAssignments.reduce((sum, item) => sum + item.quantity_remaining, 0);

    return {
      totalColdRoom: totalColdRoomStock,
      totalAssignedToday,
      totalRemainingWithDrivers,
      totalInCirculation: totalAssignedToday,
      recentMovements: movements
    };
  },

  // Vérifier la disponibilité pour une commande
  async checkStockAvailability(orderItems: Array<{
    ice_type: string;
    package_size: string;
    quantity: number;
  }>): Promise<{
    available: boolean;
    shortages: Array<{
      ice_type: string;
      package_size: string;
      needed: number;
      available: number;
      shortage: number;
    }>;
  }> {
    const coldRoomStock = await this.getColdRoomStock();
    const todayAssignments = await this.getDriverAssignments();

    // Calculer le stock total disponible (chambre froide + livreurs)
    const totalAvailable = new Map<string, number>();
    
    // Stock en chambre froide
    coldRoomStock.forEach(stock => {
      const key = `${stock.ice_type}-${stock.package_size}`;
      totalAvailable.set(key, stock.quantity);
    });

    // Stock chez les livreurs
    todayAssignments.forEach(assignment => {
      const key = `${assignment.ice_type}-${assignment.package_size}`;
      const current = totalAvailable.get(key) || 0;
      totalAvailable.set(key, current + assignment.quantity_remaining);
    });

    const shortages: Array<{
      ice_type: string;
      package_size: string;
      needed: number;
      available: number;
      shortage: number;
    }> = [];

    let allAvailable = true;

    orderItems.forEach(item => {
      const key = `${item.ice_type}-${item.package_size}`;
      const available = totalAvailable.get(key) || 0;
      
      if (available < item.quantity) {
        allAvailable = false;
        shortages.push({
          ice_type: item.ice_type,
          package_size: item.package_size,
          needed: item.quantity,
          available,
          shortage: item.quantity - available
        });
      }
    });

    return {
      available: allAvailable,
      shortages
    };
  }
};