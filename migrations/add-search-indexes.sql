-- Add text search indexes for enhanced global search functionality

-- Create GIN indexes for text search on tasks
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_tasks_description_search ON tasks USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- Create GIN indexes for text search on boards
CREATE INDEX IF NOT EXISTS idx_boards_name_search ON boards USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_boards_description_search ON boards USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- Create GIN indexes for text search on labels
CREATE INDEX IF NOT EXISTS idx_labels_name_search ON labels USING gin(to_tsvector('english', name));

-- Create GIN indexes for text search on users
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_users_email_search ON users USING gin(to_tsvector('english', email));

-- Create GIN indexes for text search on comments
CREATE INDEX IF NOT EXISTS idx_comments_content_search ON comments USING gin(to_tsvector('english', content));

-- Create GIN indexes for text search on task attachments
CREATE INDEX IF NOT EXISTS idx_task_attachments_name_search ON task_attachments USING gin(to_tsvector('english', name));
