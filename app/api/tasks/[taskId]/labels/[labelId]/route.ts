import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { taskId: string; labelId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await params before destructuring
    const taskId = params.taskId
    const labelId = params.labelId

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

    // Remove the label from the task
    await executeQuery(
      `DELETE FROM task_labels
       WHERE task_id = $1 AND label_id = $2`,
      [taskId, labelId],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing label from task:", error)
    return NextResponse.json({ error: "Failed to remove label from task" }, { status: 500 })
  }
}
