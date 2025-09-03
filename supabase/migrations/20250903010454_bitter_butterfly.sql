/*
  # Fix delivery drivers RLS policies

  This migration safely recreates the RLS policies for the delivery_drivers table
  by dropping existing policies first to avoid conflicts.

  1. Security
    - Enable RLS on delivery_drivers table (if not already enabled)
    - Drop existing policies to avoid conflicts
    - Recreate policies for drivers and admins
*/

-- Enable RLS on delivery_drivers table (safe if already enabled)
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Drivers can read own profile" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update own status" ON delivery_drivers;
DROP POLICY IF EXISTS "Admins can manage all drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Admins can read all drivers, drivers can read own data" ON delivery_drivers;
DROP POLICY IF EXISTS "Only admins can create drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Only admins can delete drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Only admins can update drivers" ON delivery_drivers;

-- Allow drivers to read their own profile
CREATE POLICY "Drivers can read own profile"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow drivers to update their own status
CREATE POLICY "Drivers can update own status"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to manage all drivers
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  );