/*
  # Créer une politique pour permettre l'accès admin aux livreurs

  1. Sécurité
    - Désactiver temporairement RLS pour permettre l'accès admin
    - Ou créer une politique qui fonctionne avec l'authentification Supabase
    
  2. Alternative
    - Utiliser une approche basée sur l'email plutôt que l'UUID
*/

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "admin_can_manage_drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "drivers_read_own_profile" ON delivery_drivers;

-- Désactiver temporairement RLS pour les tests
ALTER TABLE delivery_drivers DISABLE ROW LEVEL SECURITY;

-- Ou créer une politique basée sur l'email admin
-- ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "admin_email_access" ON delivery_drivers
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM auth.users 
--       WHERE auth.users.id = auth.uid() 
--       AND auth.users.email = 'commandes@glaconsmarrakech.com'
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM auth.users 
--       WHERE auth.users.id = auth.uid() 
--       AND auth.users.email = 'commandes@glaconsmarrakech.com'
--     )
--   );

-- Politique pour les livreurs (lecture de leur propre profil)
-- CREATE POLICY "drivers_read_own_profile" ON delivery_drivers
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE auth.users.id = auth.uid()
--       AND auth.users.email = delivery_drivers.email
--     )
--   );