/*
  # Fix auth.users permissions for RLS policies

  1. Security Changes
    - Add RLS policy on `auth.users` table to allow authenticated users to read their own data
    - This resolves the "permission denied for table users" error when RLS policies on other tables reference auth.uid()

  This policy is required for the delivery_drivers table RLS policies to function correctly.
*/

CREATE POLICY "Allow authenticated users to read their own user data" 
  ON auth.users 
  FOR SELECT 
  TO authenticated 
  USING (id = auth.uid());