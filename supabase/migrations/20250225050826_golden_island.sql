/*
  # Add Tasting Menu Support

  1. New Tables
    - `tasting_menus`: Stores tasting menu information (e.g., Captain's Table, Prix Fixe)
    - `tasting_menu_courses`: Stores course information for each tasting menu
    - `tasting_menu_items`: Stores items available for each course

  2. Structure
    - Supports fixed price menus with multiple courses
    - Allows for optional courses with multiple choices
    - Maintains course order and descriptions
*/

-- Create tasting menu types enum
CREATE TYPE tasting_menu_type AS ENUM ('fixed', 'prix_fixe');

-- Create tasting menus table
CREATE TABLE tasting_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  menu_type tasting_menu_type NOT NULL,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasting menu courses table
CREATE TABLE tasting_menu_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid REFERENCES tasting_menus(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer NOT NULL,
  allows_choice boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasting menu items table
CREATE TABLE tasting_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES tasting_menu_courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  ingredients text[] DEFAULT '{}',
  allergens text[] DEFAULT '{}',
  is_vegetarian boolean DEFAULT false,
  is_vegan boolean DEFAULT false,
  is_gluten_free boolean DEFAULT false,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasting_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasting_menu_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasting_menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active tasting menus"
  ON tasting_menus
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage tasting menus"
  ON tasting_menus
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view tasting menu courses"
  ON tasting_menu_courses
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage tasting menu courses"
  ON tasting_menu_courses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view active tasting menu items"
  ON tasting_menu_items
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage tasting menu items"
  ON tasting_menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_tasting_menus_updated_at
  BEFORE UPDATE ON tasting_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasting_menu_courses_updated_at
  BEFORE UPDATE ON tasting_menu_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasting_menu_items_updated_at
  BEFORE UPDATE ON tasting_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO tasting_menus (name, description, price, menu_type, display_order) VALUES
('Captain''s Table', 'A luxurious seven-course journey through our finest offerings', 115.00, 'fixed', 1),
('Prix Fixe', 'Choose your own three-course adventure', 75.00, 'prix_fixe', 2);

-- Insert courses for Captain's Table
WITH menu AS (SELECT id FROM tasting_menus WHERE name = 'Captain''s Table' LIMIT 1)
INSERT INTO tasting_menu_courses (menu_id, name, description, display_order, allows_choice) VALUES
((SELECT id FROM menu), 'First Course', 'Begin your journey', 1, false),
((SELECT id FROM menu), 'Amuse-Bouche', 'A delightful bite', 2, false),
((SELECT id FROM menu), 'Second Course', 'Continue the experience', 3, false),
((SELECT id FROM menu), 'Third Course', 'Savor the moment', 4, false),
((SELECT id FROM menu), 'Main Course', 'The pinnacle of flavor', 5, false),
((SELECT id FROM menu), 'Dessert', 'A sweet finale', 6, false);

-- Insert courses for Prix Fixe
WITH menu AS (SELECT id FROM tasting_menus WHERE name = 'Prix Fixe' LIMIT 1)
INSERT INTO tasting_menu_courses (menu_id, name, description, display_order, allows_choice) VALUES
((SELECT id FROM menu), 'Starter', 'Choose your beginning', 1, true),
((SELECT id FROM menu), 'Main Course', 'Select your main dish', 2, true),
((SELECT id FROM menu), 'Dessert', 'Pick your perfect ending', 3, true);