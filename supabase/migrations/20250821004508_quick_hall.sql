/*
  # Remove 10kg package size from database

  1. Changes
    - Remove '10kg' from package_size enum
    - This will affect the order_items table which uses this enum

  Note: This migration will fail if there are existing records with '10kg' package_size.
  Make sure to update or remove those records first if they exist.
*/

-- First, let's create a new enum without 10kg
CREATE TYPE package_size_new AS ENUM ('5kg', '20kg');

-- Update the order_items table to use the new enum
-- Note: This assumes no existing data uses '10kg'
ALTER TABLE order_items 
  ALTER COLUMN package_size TYPE package_size_new 
  USING package_size::text::package_size_new;

-- Drop the old enum and rename the new one
DROP TYPE package_size;
ALTER TYPE package_size_new RENAME TO package_size;