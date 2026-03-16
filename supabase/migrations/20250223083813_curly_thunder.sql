/*
  # Add Storage Bucket for Images

  1. New Storage Bucket
    - Creates a public bucket named 'images' for storing menu and event images
  
  2. Security
    - Enables public read access
    - Restricts write/delete access to authenticated users only
*/

-- Enable storage by creating the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Allow public read access to files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update their uploaded files
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Allow authenticated users to delete their uploaded files
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');