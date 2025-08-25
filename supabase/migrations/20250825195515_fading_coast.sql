/*
  # Create driver_locations table

  1. New Tables
    - `driver_locations`
      - `id` (uuid, primary key)
      - `driver_id` (uuid, foreign key to delivery_drivers)
      - `latitude` (double precision)
      - `longitude` (double precision)
      - `address` (text, optional)
      - `recorded_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `driver_locations` table
    - Add policy for admins to read all locations
    - Add policy for drivers to insert their own locations
    - Add policy for drivers to read their own locations

  3. Indexes
    - Index on driver_id for faster queries
    - Index on recorded_at for time-based queries
*/

-- Create driver_locations table
CREATE TABLE IF NOT EXISTS driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  recorded_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded_at ON driver_locations(recorded_at DESC);

-- Policies for admins (full access)
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

-- Policies for drivers (can insert and read their own locations)
CREATE POLICY "Drivers can insert their own locations"
  ON driver_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = driver_locations.driver_id
      AND delivery_drivers.email IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Drivers can read their own locations"
  ON driver_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = driver_locations.driver_id
      AND delivery_drivers.email IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );