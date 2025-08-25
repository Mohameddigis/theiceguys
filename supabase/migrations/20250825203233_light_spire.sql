/*
  # Corriger les politiques RLS pour l'accès admin aux livreurs

  1. Supprimer les anciennes politiques
  2. Créer une politique admin simple et claire
  3. Vérifier que l'UUID admin est correct
*/

-- Supprimer toutes les anciennes politiques admin pour delivery_drivers
DROP POLICY IF EXISTS "Admin complete access" ON delivery_drivers;
DROP POLICY IF EXISTS "Admin complete access to delivery_drivers" ON delivery_drivers;

-- Créer une politique admin claire et simple
CREATE POLICY "Admin full access to drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Vérifier que RLS est activé
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Afficher les politiques actuelles pour vérification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'delivery_drivers';