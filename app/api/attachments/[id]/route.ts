import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const attachmentId = params.id

    // Get attachment details
    const attachmentData = await executeQuery(
      `SELECT a.*, t.list_id
       FROM attachments a
       JOIN tasks t ON a.task_id = t.id
       WHERE a.id = $1`,
      [attachmentId],
    )

    if (attachmentData.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    const attachment = attachmentData[0]

    // Check if user is uploader
    const isUploader = attachment.uploaded_by === user.id

    // If not uploader, check if user is admin or owner
    let hasAdminRights = false

    if (!isUploader) {
      const boardAccess = await executeQuery(
        `SELECT bm.role
         FROM board_members bm
         JOIN boards b ON bm.board_id = b.id
         JOIN lists l ON b.id = l.board_id
         WHERE bm.user_id = $1 AND l.id = $2`,
        [user.id, attachment.list_id],
      )

      if (boardAccess.length > 0) {
        const role = boardAccess[0].role
        hasAdminRights = role === "OWNER" || role === "ADMIN"
      }
    }

    if (!isUploader && !hasAdminRights) {
      return NextResponse.json({ error: "You do not have permission to delete this attachment" }, { status: 403 })
    }

    // In a real app, you would delete the file from storage service

    // Delete attachment record
    await executeQuery("DELETE FROM attachments WHERE id = $1", [attachmentId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting attachment:", error)
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 })
  }
}
