-- Add cascade delete constraints to ensure proper cleanup when deleting lists and boards

-- First, check if the constraints already exist and drop them if they do
DO $$
BEGIN
    -- Drop existing constraints on tasks (for list_id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_list_id_fkey' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_list_id_fkey;
    END IF;

    -- Drop existing constraints on lists (for board_id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lists_board_id_fkey' 
        AND table_name = 'lists'
    ) THEN
        ALTER TABLE lists DROP CONSTRAINT lists_board_id_fkey;
    END IF;

    -- Drop existing constraints on labels (for board_id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'labels_board_id_fkey' 
        AND table_name = 'labels'
    ) THEN
        ALTER TABLE labels DROP CONSTRAINT labels_board_id_fkey;
    END IF;

    -- Drop existing constraints on board_members (for board_id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'board_members_board_id_fkey' 
        AND table_name = 'board_members'
    ) THEN
        ALTER TABLE board_members DROP CONSTRAINT board_members_board_id_fkey;
    END IF;
END
$$;

-- Re-add constraints with CASCADE DELETE

-- When a list is deleted, delete all its tasks
ALTER TABLE tasks
ADD CONSTRAINT tasks_list_id_fkey
FOREIGN KEY (list_id)
REFERENCES lists(id)
ON DELETE CASCADE;

-- When a board is deleted, delete all its lists
ALTER TABLE lists
ADD CONSTRAINT lists_board_id_fkey
FOREIGN KEY (board_id)
REFERENCES boards(id)
ON DELETE CASCADE;

-- When a board is deleted, delete all its labels
ALTER TABLE labels
ADD CONSTRAINT labels_board_id_fkey
FOREIGN KEY (board_id)
REFERENCES boards(id)
ON DELETE CASCADE;

-- When a board is deleted, delete all its members
ALTER TABLE board_members
ADD CONSTRAINT board_members_board_id_fkey
FOREIGN KEY (board_id)
REFERENCES boards(id)
ON DELETE CASCADE;

-- Add indexes to improve deletion performance
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_labels_board_id ON labels(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON board_members(board_id);
