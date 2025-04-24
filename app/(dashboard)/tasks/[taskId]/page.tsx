import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { notFound } from "next/navigation"
import { UnifiedTaskDetail } from "@/components/unified-task-detail"

export const dynamic = "force-dynamic"

interface TaskDetailPageProps {
  params: {
    taskId: string
  }
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Ensure params is properly awaited
  const { taskId } = await Promise.resolve(params)

  // Get task with related data
  const taskResult = await executeQuery(
    `SELECT t.*, 
           l.title as list_title, 
           b.title as board_title,
           b.id as board_id,
           u.name as assignee_name,
           u.image as assignee_image
    FROM tasks t
    JOIN lists l ON t.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.id = $1`,
    [taskId],
  )

  if (taskResult.length === 0) {
    notFound()
  }

  const task = taskResult[0]

  // Check if user has access to this task's board
  const hasAccess = await executeQuery(
    `SELECT 1 FROM board_members
    WHERE board_id = $1 AND user_id = $2`,
    [task.board_id, user.id],
  )

  if (hasAccess.length === 0) {
    notFound()
  }

  // Get labels for this task
  const labels = await executeQuery(
    `SELECT l.* FROM labels l
    JOIN task_labels tl ON l.id = tl.label_id
    WHERE tl.task_id = $1`,
    [taskId],
  )

  // Get comments for this task
  const comments = await executeQuery(
    `SELECT c.*, u.name as author_name, u.image as author_image
   FROM comments c
   JOIN users u ON c.author_id = u.id
   WHERE c.task_id = $1
   ORDER BY c.created_at DESC`,
    [taskId],
  )

  // Get attachments for this task
  const attachments = await executeQuery(
    `SELECT a.*, u.name as uploader_name
     FROM task_attachments a
     JOIN users u ON a.created_by = u.id
     WHERE a.task_id = $1
     ORDER BY a.created_at DESC`,
    [taskId],
  )

  // Get board members for assignment
  const boardMembers = await executeQuery(
    `SELECT u.id, u.name, u.email, u.image, bm.role
    FROM board_members bm
    JOIN users u ON bm.user_id = u.id
    WHERE bm.board_id = $1`,
    [task.board_id],
  )

  // Get all lists from the same board for moving the task
  const lists = await executeQuery(`SELECT id, title FROM lists WHERE board_id = $1 ORDER BY position`, [task.board_id])

  // Get all labels from the board
  const boardLabels = await executeQuery(`SELECT * FROM labels WHERE board_id = $1`, [task.board_id])

  return (
    <UnifiedTaskDetail
      user={user}
      task={{
        ...task,
        labels,
        comments,
        attachments,
      }}
      boardMembers={boardMembers}
      lists={lists}
      labels={boardLabels}
      currentUser={user}
    />
  )
}
