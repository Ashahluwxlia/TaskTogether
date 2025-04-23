import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await the params object
    const resolvedParams = await Promise.resolve(params)
    const { taskId } = resolvedParams

    // Verify the user has access to the task
    const [board] = await executeQuery(
      `SELECT b.id 
       FROM boards b
       JOIN board_members bm ON b.id = bm.board_id
       JOIN lists l ON b.id = l.board_id
       JOIN tasks t ON l.id = t.list_id
       WHERE bm.user_id = $1 AND t.id = $2`,
      [user.id, taskId],
    )

    if (!board) {
      return NextResponse.json({ error: "You do not have access to this task" }, { status: 403 })
    }

    // Fetch all attachments for this task
    const attachments = await executeQuery(
      `SELECT ta.*, u.name as uploader_name
       FROM task_attachments ta
       JOIN users u ON ta.created_by = u.id
       WHERE ta.task_id = $1
       ORDER BY ta.created_at DESC`,
      [taskId],
    )

    return NextResponse.json(attachments)
  } catch (error) {
    console.error("Error fetching task attachments:", error)
    return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 })
  }
}
