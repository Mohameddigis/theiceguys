/*
  # Corriger les permissions RLS pour les livreurs

  1. Sécurité
    - Activer RLS sur la table `delivery_drivers` 
    - Ajouter une politique pour permettre aux livreurs de lire leur propre profil
    - Permettre aux livreurs de mettre à jour leur propre statut

  2. Modifications
    - Politique SELECT pour que les livreurs puissent lire leurs données
    - Politique UPDATE pour que les livreurs puissent modifier leur statut
    - Maintien des politiques admin existantes
*/

-- Activer RLS sur la table delivery_drivers si pas déjà fait
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux livreurs de lire leur propre profil
CREATE POLICY "Drivers can read own profile" 
  ON delivery_drivers 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Politique pour permettre aux livreurs de mettre à jour leur propre statut
CREATE POLICY "Drivers can update own status" 
  ON delivery_drivers 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique pour permettre aux admins de lire tous les livreurs
CREATE POLICY "Admins can read all drivers, drivers can read own data"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (
    -- Admin peut tout lire
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'commandes@glaconsmarrakech.com'
    )
    OR
    -- Livreur peut lire ses propres données via email
    email = (
      SELECT users.email FROM users 
      WHERE users.id = auth.uid()
    )::text
  );

-- Politique pour permettre seulement aux admins de créer des livreurs
CREATE POLICY "Only admins can create drivers"
  ON delivery_drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'commandes@glaconsmarrakech.com'
    )
  );

-- Politique pour permettre seulement aux admins de supprimer des livreurs
CREATE POLICY "Only admins can delete drivers"
  ON delivery_drivers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'commandes@glaconsmarrakech.com'
    )
  );

-- Politique pour permettre seulement aux admins de modifier les livreurs
CREATE POLICY "Only admins can update drivers"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'commandes@glaconsmarrakech.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'commandes@glaconsmarrakech.com'
    )
  );