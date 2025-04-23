import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const taskId = formData.get("taskId") as string
    const file = formData.get("file") as File

    if (!taskId || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    // In a real app, you would upload the file to a storage service
    // For this example, we'll simulate it with a placeholder URL
    const fileUrl = `/api/files/${Date.now()}-${file.name}`

    // Create attachment record
    const result = await executeQuery(
      `INSERT INTO attachments (task_id, uploaded_by, name, url, type, size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [taskId, user.id, file.name, fileUrl, file.type, file.size],
    )

    // Add uploader name
    const attachment = {
      ...result[0],
      uploader_name: user.name,
    }

    return NextResponse.json(attachment)
  } catch (error) {
    console.error("Error uploading attachment:", error)
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 })
  }
}
