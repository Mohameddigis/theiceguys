/*
  # Add delivery reception system

  1. New Tables
    - `delivery_receptions`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `driver_id` (uuid, foreign key to delivery_drivers)
      - `receiver_name` (text)
      - `receiver_signature` (text, base64 signature)
      - `amount_received` (numeric)
      - `payment_method` (enum: cash, card, transfer)
      - `change_given` (numeric)
      - `reception_notes` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `delivery_receptions` table
    - Add policies for drivers and admins

  3. Changes
    - Add payment_method enum type
    - Update orders table to track reception status
*/

-- Create payment method enum
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer');

-- Create delivery receptions table
CREATE TABLE IF NOT EXISTS delivery_receptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  receiver_name text NOT NULL,
  receiver_signature text NOT NULL, -- Base64 encoded signature
  amount_received numeric(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  change_given numeric(10,2) NOT NULL DEFAULT 0,
  reception_notes text,
  created_at timestamptz DEFAULT now()
);

-- Add reception tracking to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'has_reception'
  ) THEN
    ALTER TABLE orders ADD COLUMN has_reception boolean DEFAULT false;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE delivery_receptions ENABLE ROW LEVEL SECURITY;

-- Policies for delivery_receptions
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

CREATE POLICY "Drivers can manage own delivery receptions"
  ON delivery_receptions
  FOR ALL
  TO authenticated
  USING (driver_id = uid())
  WITH CHECK (driver_id = uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_receptions_order_id ON delivery_receptions(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_receptions_driver_id ON delivery_receptions(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_receptions_created_at ON delivery_receptions(created_at DESC);