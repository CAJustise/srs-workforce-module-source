/*
  # Fix RLS policies for menu categories

  1. Changes
    - Add RLS policies for menu_categories table to allow:
      - Public read access for active categories
      - Full access for authenticated users
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Menu categories are viewable by everyone" ON menu_categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON menu_categories;

-- Create new policies
CREATE POLICY "Menu categories are viewable by everyone"
ON menu_categories
FOR SELECT
USING (active = true);

CREATE POLICY "Authenticated users can manage categories"
ON menu_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);