/*
  # Create driver_locations table

  1. New Tables
    - `driver_locations`
      - `id` (uuid, primary key)
      - `driver_id` (uuid, foreign key to delivery_drivers)
      - `latitude` (real, not null)
      - `longitude` (real, not null) 
      - `address` (text, nullable)
      - `recorded_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `driver_locations` table
    - Add policies for admin and driver access
    
  3. Indexes
    - Index on driver_id for fast queries
    - Index on recorded_at for chronological sorting
*/

-- Create the driver_locations table
CREATE TABLE IF NOT EXISTS driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  latitude real NOT NULL,
  longitude real NOT NULL,
  address text,
  recorded_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded_at ON driver_locations(recorded_at DESC);

-- Admin policy - full access
CREATE POLICY "Admins can manage all driver locations"
  ON driver_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  );

-- Driver policy - can insert their own locations
CREATE POLICY "Drivers can insert their own locations"
  ON driver_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = driver_locations.driver_id
      AND EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email = delivery_drivers.email
      )
    )
  );

-- Driver policy - can read their own locations
CREATE POLICY "Drivers can read their own locations"
  ON driver_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = driver_locations.driver_id
      AND EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email = delivery_drivers.email
      )
    )
  );

-- Allow anonymous access for location recording (if needed)
CREATE POLICY "Allow anonymous location recording"
  ON driver_locations
  FOR INSERT
  TO anon
  WITH CHECK (true);