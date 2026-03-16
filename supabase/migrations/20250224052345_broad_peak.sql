/*
  # Fix alcohol content constraint

  1. Changes
    - Drop existing constraint that was too strict
    - Add new constraint that allows NULL values for food items
    - Add comment explaining the constraint

  2. Security
    - No changes to RLS policies
*/

-- Drop the existing constraint
ALTER TABLE menu_items
  DROP CONSTRAINT IF EXISTS alcohol_content_drinks_only;

-- Add new constraint that allows NULL values for food items
ALTER TABLE menu_items
  ADD CONSTRAINT alcohol_content_drinks_only
  CHECK (
    (menu_type = 'drinks') OR
    (menu_type = 'food' AND alcohol_content IS NULL)
  );

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT alcohol_content_drinks_only ON menu_items IS 
  'Ensures alcohol content is only set for drink items and is NULL for food items';