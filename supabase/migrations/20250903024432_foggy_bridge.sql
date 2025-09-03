/*
  # Add Stock Management System

  1. New Tables
    - `cold_room_stock`
      - `id` (uuid, primary key)
      - `ice_type` (enum: nuggets, gourmet, cubique)
      - `package_size` (enum: 5kg, 20kg)
      - `quantity` (integer)
      - `last_updated` (timestamp)
      - `updated_by` (uuid, references users)
    
    - `driver_stock_assignments`
      - `id` (uuid, primary key)
      - `driver_id` (uuid, references delivery_drivers)
      - `ice_type` (enum: nuggets, gourmet, cubique)
      - `package_size` (enum: 5kg, 20kg)
      - `quantity_assigned` (integer)
      - `quantity_remaining` (integer)
      - `assignment_date` (date)
      - `assigned_by` (uuid, references users)
      - `created_at` (timestamp)

    - `stock_movements`
      - `id` (uuid, primary key)
      - `movement_type` (enum: production, assignment, delivery, adjustment)
      - `ice_type` (enum: nuggets, gourmet, cubique)
      - `package_size` (enum: 5kg, 20kg)
      - `quantity_change` (integer, can be negative)
      - `reference_id` (uuid, nullable - order_id or assignment_id)
      - `notes` (text, nullable)
      - `created_by` (uuid, references users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for admin access
    - Add policies for driver read access to their own assignments

  3. Enums
    - Add movement_type enum
*/

-- Create movement_type enum
CREATE TYPE movement_type AS ENUM ('production', 'assignment', 'delivery', 'adjustment');

-- Create cold_room_stock table
CREATE TABLE IF NOT EXISTS cold_room_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ice_type ice_type NOT NULL,
  package_size package_size NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(ice_type, package_size)
);

-- Create driver_stock_assignments table
CREATE TABLE IF NOT EXISTS driver_stock_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  ice_type ice_type NOT NULL,
  package_size package_size NOT NULL,
  quantity_assigned integer NOT NULL DEFAULT 0,
  quantity_remaining integer NOT NULL DEFAULT 0,
  assignment_date date NOT NULL DEFAULT CURRENT_DATE,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(driver_id, ice_type, package_size, assignment_date)
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_type movement_type NOT NULL,
  ice_type ice_type NOT NULL,
  package_size package_size NOT NULL,
  quantity_change integer NOT NULL,
  reference_id uuid NULL,
  notes text NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cold_room_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_stock_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Policies for cold_room_stock
CREATE POLICY "Admins can manage cold room stock"
  ON cold_room_stock
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'commandes@glaconsmarrakech.com'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'commandes@glaconsmarrakech.com'
  ));

CREATE POLICY "Drivers can read cold room stock"
  ON cold_room_stock
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM delivery_drivers 
    WHERE delivery_drivers.id = auth.uid()
  ));

-- Policies for driver_stock_assignments
CREATE POLICY "Admins can manage driver assignments"
  ON driver_stock_assignments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'commandes@glaconsmarrakech.com'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'commandes@glaconsmarrakech.com'
  ));

CREATE POLICY "Drivers can read own assignments"
  ON driver_stock_assignments
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update own remaining quantities"
  ON driver_stock_assignments
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Policies for stock_movements
CREATE POLICY "Admins can manage stock movements"
  ON stock_movements
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'commandes@glaconsmarrakech.com'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'commandes@glaconsmarrakech.com'
  ));

CREATE POLICY "Drivers can read relevant stock movements"
  ON stock_movements
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM delivery_drivers 
    WHERE delivery_drivers.id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cold_room_stock_type_size ON cold_room_stock(ice_type, package_size);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver_date ON driver_stock_assignments(driver_id, assignment_date);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_date ON driver_stock_assignments(assignment_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- Insert initial stock data
INSERT INTO cold_room_stock (ice_type, package_size, quantity) VALUES
  ('nuggets', '5kg', 100),
  ('nuggets', '20kg', 50),
  ('gourmet', '5kg', 80),
  ('gourmet', '20kg', 40),
  ('cubique', '5kg', 120),
  ('cubique', '20kg', 60)
ON CONFLICT (ice_type, package_size) DO NOTHING;

-- Create trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_cold_room_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cold_room_stock_updated_at
  BEFORE UPDATE ON cold_room_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_cold_room_stock_timestamp();