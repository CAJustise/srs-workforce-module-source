-- Add bottle_price column to menu_items
ALTER TABLE menu_items
  ADD COLUMN bottle_price decimal(10,2);

-- Add comment
COMMENT ON COLUMN menu_items.bottle_price IS 'Price per bottle for wine items. NULL for non-wine items.';