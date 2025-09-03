/*
  # Fix infinite recursion in delivery_drivers RLS policies

  1. Problem
    - Infinite recursion detected in policy for relation "delivery_drivers"
    - Policies are referencing the delivery_drivers table within their own conditions

  2. Solution
    - Drop all existing problematic policies on delivery_drivers table
    - Create simple, non-recursive policies that use auth.uid() directly
    - Ensure policies don't reference delivery_drivers table in their conditions

  3. New Policies
    - Simple admin policy using auth.users table
    - Simple driver policy using direct auth.uid() comparison
    - Remove all recursive references to delivery_drivers table
*/

-- Drop all existing policies on delivery_drivers to remove recursion
DROP POLICY IF EXISTS "Admins can manage all drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can manage all driver profiles" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own profile" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update own profile" ON delivery_drivers;

-- Create simple, non-recursive policies
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

-- Simple policy for drivers to access their own profile
CREATE POLICY "Drivers can read own profile"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Drivers can update own profile"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);