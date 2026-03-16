/*
  # Menu Items Schema

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `price` (decimal)
      - `image_url` (text)
      - `menu_type` (text, required) - e.g., 'food', 'drinks'
      - `show_price` (boolean)
      - `show_description` (boolean)
      - `active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `menu_items` table
    - Add policy for public read access
    - Add policy for authenticated admin users to manage items
*/

CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2),
  image_url text,
  menu_type text NOT NULL,
  show_price boolean DEFAULT true,
  show_description boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active menu items
CREATE POLICY "Menu items are viewable by everyone" ON menu_items
  FOR SELECT
  USING (active = true);

-- Allow authenticated users to manage menu items
CREATE POLICY "Authenticated users can manage menu items" ON menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();