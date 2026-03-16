-- Add food-specific columns to menu_items
ALTER TABLE menu_items
  -- Add allergen information
  ADD COLUMN allergens text[] DEFAULT '{}',
  -- Add dietary information
  ADD COLUMN is_vegetarian boolean DEFAULT false,
  ADD COLUMN is_vegan boolean DEFAULT false,
  ADD COLUMN is_gluten_free boolean DEFAULT false,
  ADD COLUMN spice_level smallint CHECK (spice_level >= 0 AND spice_level <= 5),
  -- Add portion size/serving info
  ADD COLUMN portion_size text,
  ADD COLUMN serves integer CHECK (serves > 0);

-- Add constraint to ensure alcohol_content is only set for drinks
ALTER TABLE menu_items
  ADD CONSTRAINT alcohol_content_drinks_only
  CHECK (
    (menu_type = 'drinks' AND alcohol_content IS NOT NULL) OR
    (menu_type = 'food' AND alcohol_content IS NULL)
  );

-- Create index for faster filtering by menu type
CREATE INDEX menu_items_menu_type_idx ON menu_items(menu_type);

-- Create index for category lookups
CREATE INDEX menu_items_category_id_idx ON menu_items(category_id);

COMMENT ON COLUMN menu_items.allergens IS 'Array of allergens present in the dish';
COMMENT ON COLUMN menu_items.is_vegetarian IS 'Indicates if the dish is vegetarian';
COMMENT ON COLUMN menu_items.is_vegan IS 'Indicates if the dish is vegan';
COMMENT ON COLUMN menu_items.is_gluten_free IS 'Indicates if the dish is gluten-free';
COMMENT ON COLUMN menu_items.spice_level IS 'Spice level from 0 (not spicy) to 5 (very spicy)';
COMMENT ON COLUMN menu_items.portion_size IS 'Description of portion size';
COMMENT ON COLUMN menu_items.serves IS 'Number of people the dish serves';