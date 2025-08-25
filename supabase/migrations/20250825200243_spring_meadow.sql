/*
  # Add foreign key relationship between orders and delivery_drivers

  1. Schema Changes
    - Add assigned_driver_id column to orders table if it doesn't exist
    - Add foreign key constraint linking orders.assigned_driver_id to delivery_drivers.id
  
  2. Security
    - No RLS changes needed, existing policies will handle the new relationship
  
  3. Notes
    - This enables proper joins between orders and delivery_drivers tables
    - Allows drivers to see their assigned orders with full driver information
*/

-- First, ensure the assigned_driver_id column exists in orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'assigned_driver_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN assigned_driver_id uuid;
  END IF;
END $$;

-- Add the foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_assigned_driver_id_fkey'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT orders_assigned_driver_id_fkey
    FOREIGN KEY (assigned_driver_id) REFERENCES public.delivery_drivers(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance on driver queries
CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver_id 
ON public.orders(assigned_driver_id);