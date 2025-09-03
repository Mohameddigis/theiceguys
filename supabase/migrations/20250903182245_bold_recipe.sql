/*
  # Add delivery reception fields to orders table

  1. New Columns
    - `receiver_name` (text) - Name of person who received the delivery
    - `receiver_signature` (text) - Base64 signature data
    - `amount_received` (numeric) - Amount received from customer
    - `payment_method` (text) - Payment method used (cash, card, transfer)
    - `change_given` (numeric) - Change given to customer
    - `reception_notes` (text) - Additional notes from delivery reception

  2. Changes
    - Add columns to store delivery reception data directly in orders table
    - This avoids the need for a separate delivery_receptions table
*/

-- Add delivery reception fields to orders table
DO $$
BEGIN
  -- Add receiver_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'receiver_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN receiver_name text;
  END IF;

  -- Add receiver_signature column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'receiver_signature'
  ) THEN
    ALTER TABLE orders ADD COLUMN receiver_signature text;
  END IF;

  -- Add amount_received column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'amount_received'
  ) THEN
    ALTER TABLE orders ADD COLUMN amount_received numeric(10,2);
  END IF;

  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text;
  END IF;

  -- Add change_given column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'change_given'
  ) THEN
    ALTER TABLE orders ADD COLUMN change_given numeric(10,2) DEFAULT 0;
  END IF;

  -- Add reception_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'reception_notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN reception_notes text;
  END IF;
END $$;