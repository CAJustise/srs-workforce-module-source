/*
  # Add tasting menu template management
  
  1. Changes
    - Safely adds template management if not already exists
    - Adds sample templates if none exist
    - Ensures all policies and triggers are in place
  
  2. Safety
    - Uses IF NOT EXISTS checks to prevent conflicts
    - Preserves existing data
*/

-- Only create tables if they don't exist
DO $$ 
BEGIN
  -- Create tasting menu templates table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tasting_menu_templates') THEN
    CREATE TABLE tasting_menu_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      menu_type tasting_menu_type NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE tasting_menu_templates ENABLE ROW LEVEL SECURITY;

    -- Create policies
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

    -- Create trigger
    CREATE TRIGGER update_tasting_menu_templates_updated_at
      BEFORE UPDATE ON tasting_menu_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Create course templates table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tasting_menu_course_templates') THEN
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
    ALTER TABLE tasting_menu_course_templates ENABLE ROW LEVEL SECURITY;

    -- Create policies
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

    -- Create trigger
    CREATE TRIGGER update_tasting_menu_course_templates_updated_at
      BEFORE UPDATE ON tasting_menu_course_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert sample templates if none exist
DO $$
DECLARE
  classic_template_id uuid;
  prix_fixe_template_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tasting_menu_templates LIMIT 1) THEN
    -- Insert Classic Tasting Menu template
    INSERT INTO tasting_menu_templates (name, description, menu_type)
    VALUES ('Classic Tasting Menu', 'A traditional multi-course tasting menu structure', 'fixed')
    RETURNING id INTO classic_template_id;

    -- Insert Prix Fixe template
    INSERT INTO tasting_menu_templates (name, description, menu_type)
    VALUES ('Prix Fixe Template', 'Standard three-course prix fixe format', 'prix_fixe')
    RETURNING id INTO prix_fixe_template_id;

    -- Insert Classic Tasting Menu courses
    INSERT INTO tasting_menu_course_templates (template_id, name, description, display_order, allows_choice) VALUES
    (classic_template_id, 'Amuse-Bouche', 'A delightful bite to begin', 1, false),
    (classic_template_id, 'First Course', 'Light and refreshing starter', 2, false),
    (classic_template_id, 'Second Course', 'Building flavors', 3, false),
    (classic_template_id, 'Main Course', 'The centerpiece of the experience', 4, false),
    (classic_template_id, 'Pre-Dessert', 'Palate cleanser', 5, false),
    (classic_template_id, 'Dessert', 'Sweet finale', 6, false);

    -- Insert Prix Fixe courses
    INSERT INTO tasting_menu_course_templates (template_id, name, description, display_order, allows_choice) VALUES
    (prix_fixe_template_id, 'Appetizer', 'Choose your starter', 1, true),
    (prix_fixe_template_id, 'Main Course', 'Select your entrée', 2, true),
    (prix_fixe_template_id, 'Dessert', 'Pick your dessert', 3, true);
  END IF;
END $$;