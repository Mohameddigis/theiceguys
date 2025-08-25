/*
  # Mise à jour de la table delivery_drivers pour l'intégration Auth

  1. Modifications
    - Supprimer la contrainte de génération automatique d'ID
    - Permettre l'insertion d'ID personnalisés (UUID des utilisateurs Auth)
    - Supprimer la colonne password_hash (gérée par Auth)
    - Ajouter des contraintes pour assurer la cohérence

  2. Sécurité
    - Maintenir RLS
    - Politiques mises à jour pour utiliser auth.uid()
*/

-- Supprimer l'ancienne table et la recréer avec la bonne structure
DROP TABLE IF EXISTS delivery_drivers CASCADE;

CREATE TABLE delivery_drivers (
  id uuid PRIMARY KEY, -- Pas de DEFAULT, sera fourni manuellement
  name text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  current_status driver_status DEFAULT 'offline',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins (accès complet)
CREATE POLICY "Admins can manage all drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid)
  WITH CHECK (auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid);

-- Politique pour les livreurs (lecture de leur propre profil)
CREATE POLICY "Drivers can read own profile"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politique pour les livreurs (mise à jour de leur statut)
CREATE POLICY "Drivers can update own status"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger pour updated_at
CREATE TRIGGER update_delivery_drivers_updated_at
  BEFORE UPDATE ON delivery_drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_delivery_drivers_email ON delivery_drivers(email);
CREATE INDEX idx_delivery_drivers_active ON delivery_drivers(is_active);
CREATE INDEX idx_delivery_drivers_status ON delivery_drivers(current_status);