/*
  # Fix Job Listings Schema

  1. Changes
    - Remove type column constraint
    - Update job_listings table structure to match new requirements
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop the type column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_listings' AND column_name = 'type'
  ) THEN
    ALTER TABLE job_listings DROP COLUMN type;
  END IF;
END $$;

-- Add any missing columns and update constraints
ALTER TABLE job_listings
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN department_id SET NOT NULL,
  ALTER COLUMN job_type_id SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_listings_department_id ON job_listings(department_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_job_type_id ON job_listings(job_type_id);

-- Add comments
COMMENT ON TABLE job_listings IS 'Stores job listings with their details and requirements';
COMMENT ON COLUMN job_listings.title IS 'Job position title';
COMMENT ON COLUMN job_listings.description IS 'Detailed job description and responsibilities';
COMMENT ON COLUMN job_listings.requirements IS 'Array of job requirements';
COMMENT ON COLUMN job_listings.benefits IS 'Array of job benefits';
COMMENT ON COLUMN job_listings.department_id IS 'Reference to job_departments';
COMMENT ON COLUMN job_listings.job_type_id IS 'Reference to job_types';
COMMENT ON COLUMN job_listings.salary_min IS 'Minimum salary amount';
COMMENT ON COLUMN job_listings.salary_max IS 'Maximum salary amount';
COMMENT ON COLUMN job_listings.salary_type IS 'Salary type: hourly or yearly';