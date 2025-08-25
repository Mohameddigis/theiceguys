/*
  # Accès complet administrateur pour delivery_drivers

  1. Sécurité
    - Supprime toutes les politiques RLS existantes
    - Crée une politique unique donnant accès complet à l'admin
    - Maintient la sécurité pour les livreurs (lecture seule de leurs données)

  2. Permissions administrateur
    - INSERT : Créer de nouveaux livreurs
    - SELECT : Voir tous les livreurs
    - UPDATE : Modifier tous les livreurs
    - DELETE : Supprimer des livreurs
*/

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Admins can manage all drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read their own data" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update their own status" ON delivery_drivers;

-- Politique complète pour l'administrateur (toutes opérations)
CREATE POLICY "Admin full access to delivery_drivers"
  ON delivery_drivers
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

-- Politique pour les livreurs (lecture de leurs propres données)
CREATE POLICY "Drivers can read own data"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = delivery_drivers.email
    )
  );

-- Politique pour les livreurs (modification de leur statut uniquement)
CREATE POLICY "Drivers can update own status"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = delivery_drivers.email
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = delivery_drivers.email
    )
  );