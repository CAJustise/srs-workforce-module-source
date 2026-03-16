/*
  # Add menu categories and ordering

  1. New Tables
    - `menu_categories`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `menu_type` (text, required) - 'food' or 'drinks'
      - `display_order` (integer, required) - controls category display order
      - `active` (boolean) - for temporarily disabling categories
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add category_id to menu_items table
    - Add foreign key constraint
    
  3. Security
    - Enable RLS on menu_categories
    - Add policies for public viewing and admin management
*/

-- Create menu_categories table
CREATE TABLE menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  menu_type text NOT NULL CHECK (menu_type IN ('food', 'drinks')),
  display_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add category_id to menu_items
ALTER TABLE menu_items
  ADD COLUMN category_id uuid REFERENCES menu_categories(id);

-- Enable RLS on menu_categories
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active categories
CREATE POLICY "Menu categories are viewable by everyone" ON menu_categories
  FOR SELECT
  USING (active = true);

-- Allow authenticated users to manage categories
CREATE POLICY "Authenticated users can manage categories" ON menu_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();