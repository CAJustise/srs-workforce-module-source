/*
  # Create storage buckets for resumes and videos
*/

-- Create resumes bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Create videos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false);

-- Allow authenticated users to manage resumes
CREATE POLICY "Authenticated users can manage resumes"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

-- Allow authenticated users to manage videos
CREATE POLICY "Authenticated users can manage videos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- Allow public to upload resumes and videos
CREATE POLICY "Public can upload resumes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Public can upload videos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'videos');