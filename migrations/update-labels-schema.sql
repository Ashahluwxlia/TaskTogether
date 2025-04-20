-- Add created_by column to labels table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'labels' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE labels ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX idx_labels_created_by ON labels(created_by);
    END IF;
END $$;

-- Update existing labels to set created_by to the board owner where possible
UPDATE labels l
SET created_by = (
    SELECT bm.user_id 
    FROM board_members bm 
    WHERE bm.board_id = l.board_id AND bm.role = 'OWNER'
    LIMIT 1
)
WHERE l.created_by IS NULL AND l.board_id IS NOT NULL;
