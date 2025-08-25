/*
  # Corriger la politique de lecture des livreurs pour l'admin

  1. Problème
    - L'admin peut créer des livreurs via Edge Function (bypass RLS)
    - Mais ne peut pas les lire via le client (RLS actif)
    - Politique SELECT manquante pour l'admin

  2. Solution
    - Ajouter une politique SELECT spécifique pour l'admin
    - Permettre à l'UUID admin de lire tous les livreurs
    - Conserver les autres politiques existantes

  3. Sécurité
    - Seul l'UUID admin peut lire tous les livreurs
    - Les livreurs ne peuvent lire que leurs propres données
    - RLS reste activé pour la protection
*/

-- Supprimer l'ancienne politique admin si elle existe
DROP POLICY IF EXISTS "Admin full access to delivery_drivers" ON delivery_drivers;

-- Créer une politique SELECT spécifique pour l'admin
CREATE POLICY "Admin can read all drivers"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Créer une politique INSERT pour l'admin (via Edge Function)
CREATE POLICY "Admin can create drivers"
  ON delivery_drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Créer une politique UPDATE pour l'admin
CREATE POLICY "Admin can update all drivers"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Créer une politique DELETE pour l'admin
CREATE POLICY "Admin can delete drivers"
  ON delivery_drivers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Conserver la politique de lecture pour les livreurs
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

-- Conserver la politique de mise à jour pour les livreurs
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