-- Start a transaction
BEGIN;

-- For each list, update task positions to be sequential starting from 0
WITH lists_with_tasks AS (
  SELECT DISTINCT list_id FROM tasks
),
numbered_tasks AS (
  SELECT 
    t.id,
    t.list_id,
    ROW_NUMBER() OVER (PARTITION BY t.list_id ORDER BY t.position, t.created_at) - 1 AS new_position
  FROM tasks t
  JOIN lists_with_tasks l ON t.list_id = l.list_id
)
UPDATE tasks t
SET 
  position = nt.new_position,
  updated_at = CURRENT_TIMESTAMP
FROM numbered_tasks nt
WHERE t.id = nt.id AND t.position != nt.new_position;

-- Log the results
SELECT list_id, COUNT(*) as task_count, array_agg(position ORDER BY position) as positions
FROM tasks
GROUP BY list_id
ORDER BY list_id;

-- Commit the transaction
COMMIT;
