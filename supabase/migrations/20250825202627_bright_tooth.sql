/*
  # Debug et correction de l'accès admin aux livreurs

  1. Vérification des politiques existantes
  2. Suppression et recréation des politiques admin
  3. Test de l'accès en lecture pour l'UUID admin
*/

-- Supprimer toutes les politiques existantes pour delivery_drivers
DROP POLICY IF EXISTS "Admin full access to delivery_drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own data" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update own status" ON delivery_drivers;

-- Créer une politique admin complète et simple
CREATE POLICY "Admin complete access to delivery_drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Créer les politiques pour les livreurs (lecture seule de leurs données)
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

-- Politique pour que les livreurs puissent mettre à jour leur statut
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

-- Vérifier que RLS est bien activé
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;