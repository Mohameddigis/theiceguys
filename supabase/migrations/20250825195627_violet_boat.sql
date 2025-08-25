/*
  # Create delivery_drivers table

  1. New Tables
    - `delivery_drivers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text, required)
      - `email` (text, unique, required)
      - `password_hash` (text, required)
      - `is_active` (boolean, default true)
      - `current_status` (enum: offline, available, busy, on_break)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `delivery_drivers` table
    - Add policy for admin to manage all drivers
    - Add policy for drivers to read their own data
    - Add policy for drivers to update their own status

  3. Sample Data
    - Create 3 test drivers with credentials
*/

-- Create enum for driver status
CREATE TYPE driver_status AS ENUM ('offline', 'available', 'busy', 'on_break');

-- Create delivery_drivers table
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

-- Enable RLS
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  );

CREATE POLICY "Drivers can read their own data"
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

CREATE POLICY "Drivers can update their own status"
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

-- Create trigger for updated_at
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_email ON delivery_drivers(email);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_status ON delivery_drivers(current_status);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_active ON delivery_drivers(is_active);

-- Insert sample drivers
INSERT INTO delivery_drivers (name, phone, email, password_hash, is_active, current_status) VALUES
  ('Ahmed Benali', '+212661234567', 'ahmed.livreur@glaconsmarrakech.com', 'Ahmed2025', true, 'offline'),
  ('Youssef Alami', '+212662345678', 'youssef.livreur@glaconsmarrakech.com', 'Youssef2025', true, 'offline'),
  ('Omar Tazi', '+212663456789', 'omar.livreur@glaconsmarrakech.com', 'Omar2025', true, 'offline')
ON CONFLICT (email) DO NOTHING;