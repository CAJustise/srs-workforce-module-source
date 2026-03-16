/*
  # Add Job Departments and Types

  1. New Tables
    - `job_departments`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `job_types`
      - `id` (uuid, primary key) 
      - `name` (text)
      - `code` (text) - e.g. 'W2', '1099'
      - `description` (text)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to job_listings
    - Add department_id (foreign key)
    - Add job_type_id (foreign key)
    - Add salary_min (decimal)
    - Add salary_max (decimal)
    - Add salary_type (text) - e.g. 'hourly', 'yearly'
    - Add department_id (uuid)
    - Add job_type_id (uuid)

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create job_departments table
CREATE TABLE job_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create job_types table
CREATE TABLE job_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to job_listings
ALTER TABLE job_listings
  ADD COLUMN department_id uuid REFERENCES job_departments(id),
  ADD COLUMN job_type_id uuid REFERENCES job_types(id),
  ADD COLUMN salary_min decimal(10,2),
  ADD COLUMN salary_max decimal(10,2),
  ADD COLUMN salary_type text CHECK (salary_type IN ('hourly', 'yearly'));

-- Enable RLS on new tables
ALTER TABLE job_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;

-- Create policies for job_departments
CREATE POLICY "Anyone can view active job departments"
  ON job_departments
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage job departments"
  ON job_departments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for job_types
CREATE POLICY "Anyone can view active job types"
  ON job_types
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage job types"
  ON job_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_job_departments_updated_at
  BEFORE UPDATE ON job_departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_types_updated_at
  BEFORE UPDATE ON job_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default job types
INSERT INTO job_types (name, code, description) VALUES
('W-2 Employee', 'W2', 'Traditional employment with benefits eligibility'),
('1099 Contractor', '1099', 'Independent contractor position'),
('Part-Time W-2', 'PTW2', 'Part-time employment with pro-rated benefits'),
('Seasonal', 'SEASONAL', 'Temporary position for peak seasons');

-- Insert default departments
INSERT INTO job_departments (name, description) VALUES
('Front of House', 'Customer-facing service positions including servers, hosts, and bartenders'),
('Back of House', 'Kitchen and food preparation positions'),
('Management', 'Supervisory and leadership positions'),
('Administration', 'Office and administrative support roles');