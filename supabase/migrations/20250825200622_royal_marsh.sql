/*
  # Corriger les politiques RLS pour delivery_drivers

  1. Sécurité
    - Supprimer les anciennes politiques conflictuelles
    - Créer une politique INSERT pour les admins authentifiés
    - Maintenir les politiques SELECT et UPDATE existantes
    - Assurer que seuls les admins peuvent créer des livreurs

  2. Politiques
    - INSERT: Seuls les admins avec email 'commandes@glaconsmarrakech.com'
    - SELECT: Admins + livreurs peuvent lire leurs propres données
    - UPDATE: Admins + livreurs peuvent modifier leurs propres données
*/

-- Supprimer les anciennes politiques qui pourraient causer des conflits
DROP POLICY IF EXISTS "Admins can manage all drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read their own data" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update their own status" ON delivery_drivers;

-- Créer les nouvelles politiques RLS
CREATE POLICY "Admins can manage all drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = uid() 
      AND users.email = 'commandes@glaconsmarrakech.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = uid() 
      AND users.email = 'commandes@glaconsmarrakech.com'
    )
  );

-- Politique pour que les livreurs puissent lire leurs propres données
CREATE POLICY "Drivers can read their own data"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = uid() 
      AND users.email = delivery_drivers.email
    )
  );

-- Politique pour que les livreurs puissent modifier leur statut
CREATE POLICY "Drivers can update their own status"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = uid() 
      AND users.email = delivery_drivers.email
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = uid() 
      AND users.email = delivery_drivers.email
    )
  );

-- S'assurer que RLS est activé
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;