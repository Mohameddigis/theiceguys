/*
  # Vérification et correction de l'accès admin aux livreurs

  1. Vérification des politiques existantes
  2. Suppression des politiques conflictuelles
  3. Création d'une politique admin claire
  4. Test de la politique
*/

-- Afficher les politiques actuelles pour delivery_drivers
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'delivery_drivers';

-- Supprimer toutes les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Admin full access to drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Admins can manage all data" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own data" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update own status" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers read own data" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers update own status" ON delivery_drivers;

-- Créer une politique admin simple et claire
CREATE POLICY "admin_full_access_drivers"
ON delivery_drivers
FOR ALL
TO authenticated
USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Créer les politiques pour les livreurs (accès limité à leurs propres données)
CREATE POLICY "drivers_read_own_data"
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

CREATE POLICY "drivers_update_own_status"
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

-- Vérifier que RLS est activé
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Afficher les nouvelles politiques
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'delivery_drivers';