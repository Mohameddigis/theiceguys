/*
  # Création des tables pour les livreurs

  1. Nouvelles Tables
    - `delivery_drivers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text)
      - `email` (text, unique)
      - `password_hash` (text)
      - `is_active` (boolean)
      - `current_status` (enum)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `driver_locations`
      - `id` (uuid, primary key)
      - `driver_id` (uuid, foreign key)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `address` (text, optional)
      - `recorded_at` (timestamp)

  2. Modifications
    - Ajout de `assigned_driver_id` à la table `orders`
    - Ajout de `driver_notes` à la table `orders`

  3. Sécurité
    - Enable RLS sur toutes les nouvelles tables
    - Politiques pour les admins et les livreurs
*/

-- Créer le type enum pour le statut des livreurs
DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('offline', 'available', 'busy', 'on_break');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Créer la table des livreurs
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  current_status driver_status DEFAULT 'offline',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table des positions des livreurs
CREATE TABLE IF NOT EXISTS driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  address text,
  recorded_at timestamptz DEFAULT now()
);

-- Ajouter les colonnes manquantes à la table orders si elles n'existent pas
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

-- Activer RLS sur les nouvelles tables
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Politiques pour delivery_drivers
CREATE POLICY "Admins can manage all drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uid() AND users.email = 'admin@glaconsmarrakech.com'
    )
  );

CREATE POLICY "Drivers can read own data"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (id::text = uid()::text);

CREATE POLICY "Drivers can update own status"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (id::text = uid()::text)
  WITH CHECK (id::text = uid()::text);

-- Politiques pour driver_locations
CREATE POLICY "Admins can manage all locations"
  ON driver_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uid() AND users.email = 'admin@glaconsmarrakech.com'
    )
  );

CREATE POLICY "Drivers can insert own locations"
  ON driver_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = driver_locations.driver_id
      AND delivery_drivers.id::text = uid()::text
    )
  );

CREATE POLICY "Drivers can read own locations"
  ON driver_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = driver_locations.driver_id
      AND delivery_drivers.id::text = uid()::text
    )
  );

-- Créer la fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger pour delivery_drivers
DROP TRIGGER IF EXISTS update_delivery_drivers_updated_at ON delivery_drivers;
CREATE TRIGGER update_delivery_drivers_updated_at
  BEFORE UPDATE ON delivery_drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer quelques livreurs de test
INSERT INTO delivery_drivers (name, phone, email, password_hash, is_active, current_status) VALUES
  ('Ahmed Benali', '+212661234567', 'ahmed.livreur@glaconsmarrakech.com', 'Ahmed2025', true, 'available'),
  ('Youssef Alami', '+212662345678', 'youssef.livreur@glaconsmarrakech.com', 'Youssef2025', true, 'offline'),
  ('Omar Tazi', '+212663456789', 'omar.livreur@glaconsmarrakech.com', 'Omar2025', true, 'available')
ON CONFLICT (email) DO NOTHING;

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_email ON delivery_drivers(email);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_status ON delivery_drivers(current_status);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded_at ON driver_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver ON orders(assigned_driver_id);