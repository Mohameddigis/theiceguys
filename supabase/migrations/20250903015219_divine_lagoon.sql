/*
  # Fix auth.users permissions for RLS policies

  1. Security Changes
    - Add policy to allow authenticated users to read their own user data from auth.users
    - This resolves the "permission denied for table users" error when RLS policies reference auth.uid()

  This migration fixes the 403 error that occurs when delivery_drivers table policies
  try to access auth.users but the authenticated role lacks permission to read from it.
*/

-- Allow authenticated users to read their own user data from auth.users
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read their own user data" 
  ON auth.users 
  FOR SELECT 
  TO authenticated 
  USING (id = auth.uid());