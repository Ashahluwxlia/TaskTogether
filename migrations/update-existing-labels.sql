-- This migration updates existing labels to set the created_by field
-- to the board creator's ID if it's not already set

-- For each label without a creator, set the creator to the board creator
UPDATE labels
SET created_by = boards.created_by
FROM boards
WHERE labels.board_id = boards.id
AND labels.created_by IS NULL;
