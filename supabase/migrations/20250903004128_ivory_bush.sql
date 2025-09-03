/*
  # Remove preparing status from order_status enum

  1. Database Changes
    - Remove 'preparing' from order_status enum
    - Update any existing orders with 'preparing' status to 'confirmed'
  
  2. Security
    - No RLS changes needed
*/

-- First, update any existing orders with 'preparing' status to 'confirmed'
UPDATE orders 
SET status = 'confirmed' 
WHERE status = 'preparing';

-- Create new enum without 'preparing'
CREATE TYPE order_status_new AS ENUM ('pending', 'confirmed', 'delivering', 'delivered', 'cancelled');

-- Update the orders table to use the new enum
ALTER TABLE orders 
ALTER COLUMN status TYPE order_status_new 
USING status::text::order_status_new;

-- Drop the old enum and rename the new one
DROP TYPE order_status;
ALTER TYPE order_status_new RENAME TO order_status;