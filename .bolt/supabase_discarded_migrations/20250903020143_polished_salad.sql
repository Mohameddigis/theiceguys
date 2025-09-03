/*
  # Fix delivery_drivers RLS permissions

  1. Security Changes
    - Drop all existing problematic RLS policies on delivery_drivers
    - Enable RLS on delivery_drivers table
    - Add simple, non-recursive policies for drivers and admins
    - Ensure drivers can read their own profile without recursion

  2. New Policies
    - Admins can manage all drivers (using auth.users email check)
    - Drivers can read and update their own profile (using direct auth.uid() comparison)
    - No recursive references to delivery_drivers table in policies
*/

-- Drop all existing policies on delivery_drivers to start fresh
DROP POLICY IF EXISTS "Admins can manage all drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own profile" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update own profile" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can manage all driver locations" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can manage all customers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can manage all orders" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can manage all order items" ON delivery_drivers;

-- Ensure RLS is enabled on delivery_drivers
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for delivery_drivers
CREATE POLICY "Admin full access to drivers"
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

-- Update other tables to use the same pattern for driver permissions
-- Fix customers table policies
DROP POLICY IF EXISTS "Drivers can manage all customers" ON customers;
CREATE POLICY "Drivers can manage all customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers 
      WHERE delivery_drivers.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_drivers 
      WHERE delivery_drivers.id = auth.uid()
    )
  );

-- Fix orders table policies
DROP POLICY IF EXISTS "Drivers can manage all orders" ON orders;
CREATE POLICY "Drivers can manage all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers 
      WHERE delivery_drivers.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_drivers 
      WHERE delivery_drivers.id = auth.uid()
    )
  );

-- Fix order_items table policies
DROP POLICY IF EXISTS "Drivers can manage all order items" ON order_items;
CREATE POLICY "Drivers can manage all order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers 
      WHERE delivery_drivers.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_drivers 
      WHERE delivery_drivers.id = auth.uid()
    )
  );

-- Fix admin policies to use auth.users consistently
DROP POLICY IF EXISTS "Admins can manage all data" ON customers;
CREATE POLICY "Admins can manage all data"
  ON customers
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

DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders"
  ON orders
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

DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;
CREATE POLICY "Admins can manage all order items"
  ON order_items
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

DROP POLICY IF EXISTS "Admins can manage all driver locations" ON driver_locations;
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  );