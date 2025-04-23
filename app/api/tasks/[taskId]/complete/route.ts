import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params
    const { completed } = await request.json()

    // Verify user has access to this task
    const hasAccess = await executeQuery(
      `SELECT 1 FROM board_members bm
       JOIN boards b ON bm.board_id = b.id
       JOIN lists l ON b.id = l.board_id
       JOIN tasks t ON l.id = t.list_id
       WHERE bm.user_id = $1 AND t.id = $2`,
      [user.id, taskId],
    )

    if (hasAccess.length === 0) {
      return NextResponse.json({ error: "You do not have access to this task" }, { status: 403 })
    }

    // Update the task completion status
    const result = await executeQuery(
      `UPDATE tasks
       SET completed = $1, 
           completed_at = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [completed, completed ? new Date().toISOString() : null, taskId],
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Log activity
    const taskData = result[0]
    await executeQuery(
      `INSERT INTO activities (user_id, entity_type, entity_id, action, created_at, board_id)
       VALUES ($1, 'TASK', $2, $3, NOW(), (SELECT board_id FROM lists WHERE id = $4))`,
      [user.id, taskId, completed ? "COMPLETED" : "REOPENED", taskData.list_id],
    )

    return NextResponse.json(taskData)
  } catch (error) {
    console.error("Error updating task completion status:", error)
    return NextResponse.json({ error: "Failed to update task completion status" }, { status: 500 })
  }
}
