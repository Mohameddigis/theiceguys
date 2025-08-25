/*
  # Mise à jour des politiques RLS pour les livreurs
  
  1. Sécurité renforcée
    - Seuls les admins peuvent créer/modifier/supprimer des livreurs
    - Les livreurs peuvent seulement lire leurs propres informations
    
  2. Politiques mises à jour
    - CREATE : Admin uniquement
    - READ : Admin + livreur pour ses propres données
    - UPDATE : Admin uniquement
    - DELETE : Admin uniquement
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage all drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own data" ON delivery_drivers;

-- Politique pour la création (Admin uniquement)
CREATE POLICY "Only admins can create drivers"
  ON delivery_drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  );

-- Politique pour la lecture (Admin + livreur pour ses propres données)
CREATE POLICY "Admins can read all drivers, drivers can read own data"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (
    -- Admin peut tout voir
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
    OR
    -- Livreur peut voir ses propres données
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Politique pour la mise à jour (Admin uniquement)
CREATE POLICY "Only admins can update drivers"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  );

-- Politique pour la suppression (Admin uniquement)
CREATE POLICY "Only admins can delete drivers"
  ON delivery_drivers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  );

-- Mise à jour des politiques pour driver_locations
DROP POLICY IF EXISTS "Admins can manage all driver locations" ON driver_locations;
DROP POLICY IF EXISTS "Drivers can insert own locations" ON driver_locations;

-- Admin peut tout gérer
CREATE POLICY "Admins can manage all driver locations"
  ON driver_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  );

-- Livreurs peuvent insérer leurs propres positions
CREATE POLICY "Drivers can insert own locations"
  ON driver_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_drivers 
      WHERE delivery_drivers.id = driver_locations.driver_id 
      AND delivery_drivers.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );