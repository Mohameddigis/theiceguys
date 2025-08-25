/*
  # Corriger l'accès admin aux livreurs

  1. Problème identifié
    - L'admin ne peut pas récupérer la liste des livreurs
    - Politique RLS bloque les requêtes SELECT

  2. Solution
    - Supprimer les anciennes politiques conflictuelles
    - Créer une politique admin claire et simple
    - Vérifier que l'UUID admin est correct

  3. Sécurité
    - Maintenir RLS pour les autres utilisateurs
    - Accès complet uniquement pour l'UUID admin spécifique
*/

-- Supprimer toutes les anciennes politiques pour repartir sur une base propre
DROP POLICY IF EXISTS "Admin full access to delivery_drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Admins can manage all data" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own data" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update own status" ON delivery_drivers;

-- Créer une politique admin simple et claire
CREATE POLICY "Admin complete access"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Politique pour que les livreurs puissent lire leurs propres données
CREATE POLICY "Drivers read own data"
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
CREATE POLICY "Drivers update own status"
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