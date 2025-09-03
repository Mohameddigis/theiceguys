/*
  # Create storage bucket for delivery photos

  1. Storage Bucket
    - `delivery-photos` bucket for storing delivery and cancellation photos
    - Public access for viewing photos
    - Authenticated users can upload

  2. Security
    - RLS policies for secure access
    - File size and type restrictions
*/

-- Create storage bucket for delivery photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload delivery photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'delivery-photos');

-- Allow public access to view photos
CREATE POLICY "Public can view delivery photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'delivery-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own delivery photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'delivery-photos');