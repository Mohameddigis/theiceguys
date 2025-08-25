/*
  # Remove 10kg package size from database

  1. Changes
    - Remove '10kg' from package_size enum
    - Update any existing order_items that use '10kg' to '20kg'
    - Recreate the enum without '10kg'

  2. Security
    - This migration will update existing data
    - Backup recommended before running
*/

-- First, update any existing order_items that use '10kg' to '20kg'
UPDATE order_items 
SET package_size = '20kg' 
WHERE package_size = '10kg';

-- Create new enum without '10kg'
CREATE TYPE package_size_new AS ENUM ('5kg', '20kg');

-- Update the table to use the new enum
ALTER TABLE order_items 
ALTER COLUMN package_size TYPE package_size_new 
USING package_size::text::package_size_new;

-- Drop the old enum
DROP TYPE package_size;

-- Rename the new enum to the original name
ALTER TYPE package_size_new RENAME TO package_size;