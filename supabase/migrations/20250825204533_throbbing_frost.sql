/*
  # Fix driver policies for admin access

  1. Security
    - Drop all existing policies on delivery_drivers
    - Create simple admin policy
    - Ensure RLS is enabled
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "admin_full_access_drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "drivers_read_own_data" ON delivery_drivers;
DROP POLICY IF EXISTS "drivers_update_own_status" ON delivery_drivers;

-- Ensure RLS is enabled
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for admin access
CREATE POLICY "admin_can_manage_drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (
    -- Check if user is admin by UUID
    auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid
  )
  WITH CHECK (
    -- Same check for inserts/updates
    auth.uid() = '5bdebb14-ca43-4ee5-91cb-bc8c1e2a0a21'::uuid
  );

-- Also create a policy for drivers to read their own data
CREATE POLICY "drivers_read_own_profile"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (
    -- Drivers can read their own profile by matching email
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = delivery_drivers.email
    )
  );