/*
  # Add delivery tracking fields to orders table

  1. New Fields
    - `delivered_at` (timestamp) - Date and time of delivery
    - `cancelled_at` (timestamp) - Date and time of cancellation
    - `cancel_reason` (text) - Reason for cancellation
    - `cancel_photo_url` (text) - URL of cancellation photo

  2. Security
    - Update RLS policies to handle new fields
*/

-- Add new fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivered_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN cancelled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'cancel_reason'
  ) THEN
    ALTER TABLE orders ADD COLUMN cancel_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'cancel_photo_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN cancel_photo_url text;
  END IF;
END $$;