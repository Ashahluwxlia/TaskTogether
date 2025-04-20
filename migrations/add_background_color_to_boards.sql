-- Add background_color column to boards table
ALTER TABLE boards ADD COLUMN IF NOT EXISTS background_color VARCHAR(50);

-- Update existing boards to have default background color
UPDATE boards SET background_color = '#ffffff' WHERE background_color IS NULL;
