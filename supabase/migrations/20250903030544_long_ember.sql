/*
  # Create delivery_receptions table

  1. New Tables
    - `delivery_receptions`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `driver_id` (uuid, foreign key to delivery_drivers)
      - `receiver_name` (text, name of person who received)
      - `receiver_signature` (text, base64 signature data)
      - `amount_received` (numeric, amount paid by customer)
      - `payment_method` (enum, cash/card/transfer)
      - `change_given` (numeric, change given for cash payments)
      - `reception_notes` (text, optional notes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `delivery_receptions` table
    - Add policies for admins and drivers to manage receptions

  3. Changes
    - Add `has_reception` boolean field to orders table
    - Create payment_method enum type
*/

-- Create payment_method enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create delivery_receptions table
CREATE TABLE IF NOT EXISTS delivery_receptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  receiver_name text NOT NULL,
  receiver_signature text NOT NULL,
  amount_received numeric(10,2) NOT NULL CHECK (amount_received > 0),
  payment_method payment_method NOT NULL DEFAULT 'cash',
  change_given numeric(10,2) NOT NULL DEFAULT 0 CHECK (change_given >= 0),
  reception_notes text,
  created_at timestamptz DEFAULT now()
);

-- Add has_reception field to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'has_reception'
  ) THEN
    ALTER TABLE orders ADD COLUMN has_reception boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_receptions_order_id ON delivery_receptions(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_receptions_driver_id ON delivery_receptions(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_receptions_created_at ON delivery_receptions(created_at DESC);

-- Enable RLS
ALTER TABLE delivery_receptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_receptions
CREATE POLICY "Admins can manage all delivery receptions"
  ON delivery_receptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uid() AND users.email = 'commandes@glaconsmarrakech.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uid() AND users.email = 'commandes@glaconsmarrakech.com'
    )
  );

CREATE POLICY "Drivers can manage all delivery receptions"
  ON delivery_receptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = uid()
    )
  );

-- Create unique constraint to prevent duplicate receptions for same order
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_receptions_order_unique 
ON delivery_receptions(order_id);