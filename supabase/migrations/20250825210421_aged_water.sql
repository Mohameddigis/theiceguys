/*
  # Fix driver locations foreign key relationship

  1. Database Changes
    - Add foreign key constraint between driver_locations.driver_id and delivery_drivers.id
    - Remove password_hash column from delivery_drivers table (managed by Supabase Auth)
  
  2. Security
    - Maintain existing RLS policies
    - Ensure proper relationships for joins
*/

-- Add foreign key constraint to driver_locations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'driver_locations_driver_id_fkey'
    AND table_name = 'driver_locations'
  ) THEN
    ALTER TABLE driver_locations 
    ADD CONSTRAINT driver_locations_driver_id_fkey 
    FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Remove password_hash column from delivery_drivers if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_drivers' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE delivery_drivers DROP COLUMN password_hash;
  END IF;
END $$;