/*
  # Job Applications Schema

  1. New Tables
    - `job_applications`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text)
      - `contact_method` (enum: email, phone, text)
      - `position` (text)
      - `availability` (text)
      - `resume_url` (text)
      - `interest_reason` (text)
      - `passion` (text)
      - `video_url` (text)
      - `reference1_name` (text)
      - `reference1_relationship` (text)
      - `reference1_phone` (text)
      - `reference1_email` (text)
      - `reference2_name` (text)
      - `reference2_relationship` (text)
      - `reference2_phone` (text)
      - `reference2_email` (text)
      - `additional_info` (text)
      - `status` (enum: new, reviewed, contacted, archived)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for public submission and admin access
*/

-- Create contact method enum
CREATE TYPE contact_method AS ENUM ('email', 'phone', 'text');

-- Create application status enum
CREATE TYPE application_status AS ENUM ('new', 'reviewed', 'contacted', 'archived');

-- Create job applications table
CREATE TABLE job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  contact_method contact_method NOT NULL,
  position text NOT NULL,
  availability text NOT NULL,
  resume_url text,
  interest_reason text,
  passion text,
  video_url text,
  reference1_name text,
  reference1_relationship text,
  reference1_phone text,
  reference1_email text,
  reference2_name text,
  reference2_relationship text,
  reference2_phone text,
  reference2_email text,
  additional_info text,
  status application_status NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Create policy for public submissions
CREATE POLICY "Anyone can submit job applications"
  ON job_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for admin access
CREATE POLICY "Authenticated users can view and manage job applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();