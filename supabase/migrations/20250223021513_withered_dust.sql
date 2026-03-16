/*
  # Add ingredients and alcohol scale

  1. Changes
    - Add `ingredients` array column to menu_items table
    - Add `alcohol_content` integer column (1-5 scale) for drinks
    - Add `garnish` text column for presentation details
    
  2. Notes
    - Ingredients stored as text array for flexible ingredient lists
    - Alcohol content uses 1-5 scale (null for non-alcoholic/food items)
    - Garnish details help with presentation consistency
*/

-- Add new columns to menu_items table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'ingredients'
  ) THEN
    ALTER TABLE menu_items 
      ADD COLUMN ingredients text[] DEFAULT '{}',
      ADD COLUMN alcohol_content smallint CHECK (alcohol_content >= 1 AND alcohol_content <= 5),
      ADD COLUMN garnish text;
  END IF;
END $$;