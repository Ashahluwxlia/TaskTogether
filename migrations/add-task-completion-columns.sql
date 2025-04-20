-- Add completed and completed_at columns to tasks table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed') THEN
        ALTER TABLE tasks ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_at') THEN
        ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
END
$$;

-- Update existing tasks to have completed = false
UPDATE tasks SET completed = FALSE WHERE completed IS NULL;
