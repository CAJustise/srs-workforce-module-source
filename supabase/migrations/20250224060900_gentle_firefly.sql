/*
  # Fix Wine Bottle Price Validation

  1. Changes
    - Create trigger function to validate bottle prices for wine items
    - Add trigger to enforce the validation
    - Add index for better performance
*/

-- Create function to validate bottle prices
CREATE OR REPLACE FUNCTION validate_wine_bottle_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the item has a bottle price but is not in a wine category
  IF NEW.bottle_price IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM menu_categories 
      WHERE id = NEW.category_id AND name = 'Wine'
    ) THEN
      RAISE EXCEPTION 'Bottle price can only be set for wine items';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS validate_wine_bottle_price_trigger ON menu_items;
CREATE TRIGGER validate_wine_bottle_price_trigger
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_wine_bottle_price();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- Add comment
COMMENT ON FUNCTION validate_wine_bottle_price() IS 
  'Validates that bottle prices are only set for wine items';