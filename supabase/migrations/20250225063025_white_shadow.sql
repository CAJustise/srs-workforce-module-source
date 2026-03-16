/*
  # Add display order to tasting menus

  1. Changes
    - Add display_order column to tasting_menus table
    - Add index for better performance
    - Add comment explaining the column
*/

-- Add display_order column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasting_menus' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE tasting_menus 
      ADD COLUMN display_order integer NOT NULL DEFAULT 0;

    -- Add index for better performance
    CREATE INDEX idx_tasting_menus_display_order ON tasting_menus(display_order);

    -- Add comment
    COMMENT ON COLUMN tasting_menus.display_order IS 'Order in which the menu should be displayed. Lower numbers appear first.';
  END IF;
END $$;