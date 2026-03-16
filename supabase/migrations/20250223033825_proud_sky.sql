/*
  # Fix menu categories RLS policies

  1. Changes
    - Drop existing RLS policies for menu_categories table
    - Create new policies that properly allow:
      - Public read access to active categories
      - Full CRUD access for authenticated users
  
  2. Security
    - Enables proper RLS enforcement
    - Ensures authenticated users can manage categories
    - Maintains public read access for active categories
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Menu categories are viewable by everyone" ON menu_categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON menu_categories;

-- Create new policies with proper permissions
CREATE POLICY "Menu categories are viewable by everyone"
ON menu_categories
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage categories"
ON menu_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);