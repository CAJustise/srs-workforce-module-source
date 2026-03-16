/*
  # Add image metadata and categories

  1. New Tables
    - `image_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `active` (boolean)
    - `image_metadata`
      - `id` (uuid, primary key)
      - `storage_id` (text) - References the storage object name
      - `display_name` (text)
      - `category_id` (uuid) - References image_categories
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public viewing and authenticated management
*/

-- Create image categories table
CREATE TABLE image_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create image metadata table
CREATE TABLE image_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  category_id uuid REFERENCES image_categories(id),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE image_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for image_categories
CREATE POLICY "Anyone can view active image categories"
  ON image_categories
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage image categories"
  ON image_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for image_metadata
CREATE POLICY "Anyone can view image metadata"
  ON image_metadata
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage image metadata"
  ON image_metadata
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_image_categories_updated_at
  BEFORE UPDATE ON image_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_metadata_updated_at
  BEFORE UPDATE ON image_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO image_categories (name, description) VALUES
('Food', 'Food and dish photography'),
('Drinks', 'Cocktails and beverage photography'),
('Interior', 'Interior and ambiance shots'),
('Events', 'Event and special occasion photos'),
('Staff', 'Team member photos'),
('Misc', 'Miscellaneous images');