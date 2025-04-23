import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await params before destructuring
      const { taskId } = params

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

    // Get all labels for this task
    const labels = await executeQuery(
      `SELECT l.* FROM labels l
       JOIN task_labels tl ON l.id = tl.label_id
       WHERE tl.task_id = $1
       ORDER BY l.name`,
      [taskId],
    )

    return NextResponse.json(labels)
  } catch (error) {
    console.error("Error fetching task labels:", error)
    return NextResponse.json({ error: "Failed to fetch task labels" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await params before destructuring
    const   taskId = await params.taskId
    const { labelIds } = await request.json()

    if (!labelIds || !Array.isArray(labelIds) || labelIds.length === 0) {
      return NextResponse.json({ error: "Label IDs are required" }, { status: 400 })
    }

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

    // Add the labels to the task
    for (const labelId of labelIds) {
      // Check if the label is already assigned to the task
      const existingLabel = await executeQuery(
        `SELECT 1 FROM task_labels
         WHERE task_id = $1 AND label_id = $2`,
        [taskId, labelId],
      )

      if (existingLabel.length === 0) {
        await executeQuery(
          `INSERT INTO task_labels (task_id, label_id)
           VALUES ($1, $2)`,
          [taskId, labelId],
        )
      }
    }

    // Get all labels for this task
    const labels = await executeQuery(
      `SELECT l.* FROM labels l
       JOIN task_labels tl ON l.id = tl.label_id
       WHERE tl.task_id = $1
       ORDER BY l.name`,
      [taskId],
    )

    return NextResponse.json(labels)
  } catch (error) {
    console.error("Error adding labels to task:", error)
    return NextResponse.json({ error: "Failed to add labels to task" }, { status: 500 })
  }
}
