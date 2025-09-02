/*
  # Fix RLS permissions for delivery_drivers table

  1. Security Changes
    - Enable RLS on `delivery_drivers` table
    - Add policy for drivers to read their own profile
    - Add policy for drivers to update their own status
    - Add policy for admins to manage all drivers

  2. Notes
    - Fixes 403 permission denied error when drivers try to access their profile
    - Ensures proper security isolation between drivers
    - Maintains admin access for management operations
*/

-- Enable RLS on delivery_drivers table
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Drivers can read own profile" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update own status" ON delivery_drivers;
DROP POLICY IF EXISTS "Admins can manage all drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "drivers_can_read_own_profile" ON delivery_drivers;
DROP POLICY IF EXISTS "drivers_can_update_own_status" ON delivery_drivers;
DROP POLICY IF EXISTS "admins_can_manage_all_drivers" ON delivery_drivers;

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