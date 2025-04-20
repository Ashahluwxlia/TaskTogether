-- Ensure position column is integer and not null
ALTER TABLE tasks 
  ALTER COLUMN position TYPE integer USING position::integer,
  ALTER COLUMN position SET NOT NULL;

-- Fix any null positions by setting them to the maximum position + 1 in their list
UPDATE tasks t1
SET position = COALESCE(
  (SELECT MAX(position) + 1 FROM tasks t2 WHERE t2.list_id = t1.list_id),
  0
)
WHERE position IS NULL;

-- Reindex positions to ensure they are sequential within each list
WITH ranked_tasks AS (
  SELECT 
    id,
    list_id,
    ROW_NUMBER() OVER (PARTITION BY list_id ORDER BY position) - 1 as new_position
  FROM tasks
)
UPDATE tasks t
SET position = rt.new_position
FROM ranked_tasks rt
WHERE t.id = rt.id;
