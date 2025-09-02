/*
  # Fix delivery_drivers RLS permissions

  1. Security Changes
    - Enable RLS on `delivery_drivers` table
    - Add policy for drivers to read their own profile
    - Add policy for drivers to update their own status
    - Add policy for admins to manage all drivers

  2. Problem Resolution
    - Fixes 403 permission denied error when drivers try to access their profile
    - Allows authenticated drivers to read only their own data
    - Maintains admin access for management operations
*/

-- Enable RLS on delivery_drivers table
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

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