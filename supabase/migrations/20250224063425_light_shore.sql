-- Drop existing trigger and function
DROP TRIGGER IF EXISTS validate_wine_bottle_price_trigger ON menu_items;
DROP FUNCTION IF EXISTS validate_wine_bottle_price();

-- Create improved function to validate bottle prices
CREATE OR REPLACE FUNCTION validate_wine_bottle_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the item has a bottle price
  IF NEW.bottle_price IS NOT NULL THEN
    -- Check if the item is in a wine category or subcategory
    IF NOT EXISTS (
      WITH RECURSIVE category_tree AS (
        -- Base case: direct category
        SELECT id, name, parent_id
        FROM menu_categories
        WHERE id = NEW.category_id
        
        UNION ALL
        
        -- Recursive case: parent categories
        SELECT mc.id, mc.name, mc.parent_id
        FROM menu_categories mc
        INNER JOIN category_tree ct ON mc.id = ct.parent_id
      )
      SELECT 1 
      FROM category_tree 
      WHERE name = 'Wine'
    ) THEN
      RAISE EXCEPTION 'Bottle price can only be set for wine items';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER validate_wine_bottle_price_trigger
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_wine_bottle_price();

-- Add comment
COMMENT ON FUNCTION validate_wine_bottle_price() IS 
  'Validates that bottle prices are only set for wine items, checking both direct categories and parent categories';