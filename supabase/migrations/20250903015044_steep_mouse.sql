/*
  # Fix RLS permissions for delivery drivers

  1. Security Updates
    - Enable RLS on delivery_drivers table if not already enabled
    - Add policy for drivers to read their own profile data
    - Fix admin policy to use proper user check
    - Add policy for drivers to update their own status

  2. Changes
    - Remove problematic policies that reference non-existent users table
    - Add proper policies for driver authentication and data access
*/

-- Enable RLS on delivery_drivers table
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can read own profile" ON delivery_drivers;
DROP POLICY IF EXISTS "Drivers can update own status" ON delivery_drivers;

-- Create new admin policy that checks for admin email in auth.users
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

-- Create policy for drivers to read their own profile
CREATE POLICY "Drivers can read own profile"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policy for drivers to update their own status and profile
CREATE POLICY "Drivers can update own profile"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also fix the orders table policies to use auth.users instead of users
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

-- Fix customers table policies
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

-- Fix order_items table policies
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

-- Fix driver_locations table policies
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