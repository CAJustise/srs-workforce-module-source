/*
  # Add subcategories support to menu_categories

  1. Changes
    - Add parent_id column to menu_categories table
    - Add index for better performance
    - Add constraint to prevent circular references
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add parent_id column to menu_categories
ALTER TABLE menu_categories
  ADD COLUMN parent_id uuid REFERENCES menu_categories(id);

-- Add index for better performance
CREATE INDEX idx_menu_categories_parent_id ON menu_categories(parent_id);

-- Add constraint to prevent circular references
ALTER TABLE menu_categories
  ADD CONSTRAINT menu_categories_no_circular_ref
  CHECK (parent_id != id);

-- Add comment
COMMENT ON COLUMN menu_categories.parent_id IS 'Reference to parent category for subcategories. NULL means top-level category.';