/*
  # Add foreign key relationship between orders and delivery_drivers

  1. Foreign Key Constraint
    - Add foreign key constraint linking orders.assigned_driver_id to delivery_drivers.id
    - This enables Supabase to perform joins between orders and delivery_drivers tables
  
  2. Security
    - No RLS changes needed as tables already have proper policies
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_assigned_driver_id_fkey'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_assigned_driver_id_fkey
    FOREIGN KEY (assigned_driver_id)
    REFERENCES delivery_drivers(id)
    ON DELETE SET NULL;
  END IF;
END $$;