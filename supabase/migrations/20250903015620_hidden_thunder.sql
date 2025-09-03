/*
  # Update driver permissions to admin level

  1. Security Updates
    - Give drivers full access to all tables like admins
    - Drivers can read/write all data in the system
    - Dashboard filtering will be handled at application level
    
  2. Tables Updated
    - customers: Full access for drivers
    - orders: Full access for drivers  
    - order_items: Full access for drivers
    - delivery_drivers: Full access for drivers
    - driver_locations: Full access for drivers
    
  3. Application Logic
    - Driver dashboard will filter to show only assigned orders
    - Database level permissions allow full access
*/

-- Give drivers full access to customers table
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

-- Give drivers full access to orders table
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

-- Give drivers full access to order_items table
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

-- Give drivers full access to delivery_drivers table
CREATE POLICY "Drivers can manage all driver profiles"
  ON delivery_drivers
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

-- Give drivers full access to driver_locations table
CREATE POLICY "Drivers can manage all driver locations"
  ON driver_locations
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