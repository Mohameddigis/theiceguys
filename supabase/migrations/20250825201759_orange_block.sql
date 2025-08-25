/*
  # Mise à jour des politiques RLS avec UUID admin

  1. Politiques mises à jour
    - Utilisation de l'UUID admin au lieu de l'email
    - Accès complet pour l'administrateur avec UUID: 5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21
    
  2. Tables concernées
    - delivery_drivers: Accès complet admin
    - driver_locations: Accès complet admin
    - orders: Accès complet admin
    - order_items: Accès complet admin
    - customers: Accès complet admin
    
  3. Sécurité
    - UUID spécifique pour l'admin
    - Politiques livreurs préservées
*/

-- Mettre à jour les politiques pour delivery_drivers
DROP POLICY IF EXISTS "Admin full access to delivery_drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Admins can manage all data" ON delivery_drivers;

CREATE POLICY "Admin full access to delivery_drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Mettre à jour les politiques pour driver_locations
DROP POLICY IF EXISTS "Admins can manage all driver locations" ON driver_locations;

CREATE POLICY "Admins can manage all driver locations"
  ON driver_locations
  FOR ALL
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Mettre à jour les politiques pour orders
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Mettre à jour les politiques pour order_items
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

CREATE POLICY "Admins can manage all order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Mettre à jour les politiques pour customers
DROP POLICY IF EXISTS "Admins can manage all data" ON customers;

CREATE POLICY "Admins can manage all data"
  ON customers
  FOR ALL
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);