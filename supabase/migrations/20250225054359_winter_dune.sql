/*
  # Add tasting menu templates

  1. New Tables
    - `tasting_menu_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `menu_type` (tasting_menu_type)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `tasting_menu_course_templates`
      - `id` (uuid, primary key)
      - `template_id` (uuid, references tasting_menu_templates)
      - `name` (text)
      - `description` (text)
      - `display_order` (integer)
      - `allows_choice` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage templates
*/

-- Create tasting menu templates table
CREATE TABLE tasting_menu_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  menu_type tasting_menu_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasting menu course templates table
CREATE TABLE tasting_menu_course_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES tasting_menu_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer NOT NULL,
  allows_choice boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasting_menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasting_menu_course_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for tasting_menu_templates
CREATE POLICY "Authenticated users can view templates"
  ON tasting_menu_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage templates"
  ON tasting_menu_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for tasting_menu_course_templates
CREATE POLICY "Authenticated users can view course templates"
  ON tasting_menu_course_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage course templates"
  ON tasting_menu_course_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_tasting_menu_templates_updated_at
  BEFORE UPDATE ON tasting_menu_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasting_menu_course_templates_updated_at
  BEFORE UPDATE ON tasting_menu_course_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample templates
INSERT INTO tasting_menu_templates (name, description, menu_type) VALUES
('Classic Tasting Menu', 'A traditional multi-course tasting menu structure', 'fixed'),
('Prix Fixe Template', 'Standard three-course prix fixe format', 'prix_fixe');

-- Insert sample course templates for Classic Tasting Menu
WITH template AS (SELECT id FROM tasting_menu_templates WHERE name = 'Classic Tasting Menu' LIMIT 1)
INSERT INTO tasting_menu_course_templates (template_id, name, description, display_order, allows_choice) VALUES
((SELECT id FROM template), 'Amuse-Bouche', 'A delightful bite to begin', 1, false),
((SELECT id FROM template), 'First Course', 'Light and refreshing starter', 2, false),
((SELECT id FROM template), 'Second Course', 'Building flavors', 3, false),
((SELECT id FROM template), 'Main Course', 'The centerpiece of the experience', 4, false),
((SELECT id FROM template), 'Pre-Dessert', 'Palate cleanser', 5, false),
((SELECT id FROM template), 'Dessert', 'Sweet finale', 6, false);

-- Insert sample course templates for Prix Fixe Template
WITH template AS (SELECT id FROM tasting_menu_templates WHERE name = 'Prix Fixe Template' LIMIT 1)
INSERT INTO tasting_menu_course_templates (template_id, name, description, display_order, allows_choice) VALUES
((SELECT id FROM template), 'Appetizer', 'Choose your starter', 1, true),
((SELECT id FROM template), 'Main Course', 'Select your entrée', 2, true),
((SELECT id FROM template), 'Dessert', 'Pick your dessert', 3, true);