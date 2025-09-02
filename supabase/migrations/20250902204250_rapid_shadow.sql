/*
  # Fix admin permissions for delivery drivers

  1. Security Updates
    - Update RLS policies for delivery_drivers table
    - Allow admin user to read all drivers
    - Fix permission denied errors

  2. Changes
    - Update existing policies to use correct admin email
    - Ensure admin can access all driver data
*/

-- Update the admin policies to use the correct admin email
DROP POLICY IF EXISTS "Admins can read all drivers, drivers can read own data" ON delivery_drivers;
DROP POLICY IF EXISTS "Only admins can create drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Only admins can update drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Only admins can delete drivers" ON delivery_drivers;
DROP POLICY IF EXISTS "Admins can manage all driver locations" ON driver_locations;

-- Create new policies with correct admin email
CREATE POLICY "Admins can read all drivers, drivers can read own data"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (
    (EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))) 
    OR 
    (email = (( SELECT auth.users.email
       FROM auth.users
      WHERE (auth.users.id = auth.uid())))::text)
  );

CREATE POLICY "Only admins can create drivers"
  ON delivery_drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  );

CREATE POLICY "Only admins can update drivers"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  )
  WITH CHECK (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  );

CREATE POLICY "Only admins can delete drivers"
  ON delivery_drivers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  );

CREATE POLICY "Admins can manage all driver locations"
  ON driver_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  )
  WITH CHECK (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  );

-- Also update orders and customers policies to use correct admin email
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all data" ON customers;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  )
  WITH CHECK (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  );

CREATE POLICY "Admins can manage all data"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  )
  WITH CHECK (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  );

CREATE POLICY "Admins can manage all order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  )
  WITH CHECK (
    EXISTS ( SELECT 1
       FROM auth.users
      WHERE ((auth.users.id = auth.uid()) AND ((auth.users.email)::text = 'commandes@glaconsmarrakech.com'::text)))
  );