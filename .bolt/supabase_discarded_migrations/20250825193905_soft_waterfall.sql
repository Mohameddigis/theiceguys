/*
  # Système de gestion des livreurs

  1. Nouvelles Tables
    - `delivery_drivers` - Informations des livreurs
    - `driver_locations` - Historique des positions des livreurs
    
  2. Modifications
    - Ajouter `assigned_driver_id` à la table `orders`
    - Ajouter `driver_status` pour suivre l'état du livreur
    
  3. Sécurité
    - Enable RLS sur toutes les nouvelles tables
    - Politiques pour les livreurs et administrateurs
*/

-- Créer la table des livreurs
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  current_status text DEFAULT 'offline' CHECK (current_status IN ('offline', 'available', 'busy', 'on_break')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table des positions des livreurs
CREATE TABLE IF NOT EXISTS driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  address text,
  recorded_at timestamptz DEFAULT now()
);

-- Ajouter les colonnes pour l'assignation des livreurs aux commandes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'assigned_driver_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN assigned_driver_id uuid REFERENCES delivery_drivers(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'driver_notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN driver_notes text;
  END IF;
END $$;

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_email ON delivery_drivers(email);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_status ON delivery_drivers(current_status);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded_at ON driver_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver ON orders(assigned_driver_id);

-- Enable RLS
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour delivery_drivers
CREATE POLICY "Admins can manage all drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = 'admin@glaconsmarrakech.com'
  ));

CREATE POLICY "Drivers can read own data"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Drivers can update own data"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Politiques RLS pour driver_locations
CREATE POLICY "Admins can manage all locations"
  ON driver_locations
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = 'admin@glaconsmarrakech.com'
  ));

CREATE POLICY "Drivers can manage own locations"
  ON driver_locations
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM delivery_drivers
    WHERE delivery_drivers.id = driver_locations.driver_id
    AND auth.uid()::text = delivery_drivers.id::text
  ));

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_delivery_drivers_updated_at
  BEFORE UPDATE ON delivery_drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer quelques livreurs de test
INSERT INTO delivery_drivers (name, phone, email, password_hash) VALUES
('Ahmed Benali', '+212661234567', 'ahmed.livreur@glaconsmarrakech.com', '$2a$10$example_hash_1'),
('Youssef Alami', '+212662345678', 'youssef.livreur@glaconsmarrakech.com', '$2a$10$example_hash_2'),
('Omar Tazi', '+212663456789', 'omar.livreur@glaconsmarrakech.com', '$2a$10$example_hash_3')
ON CONFLICT (email) DO NOTHING;