import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(request: Request, { params }: { params: { labelId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params before accessing labelId
    const { labelId } = params

    // First, check if the label exists and if the user has access to it
    const labelCheck = await executeQuery(
      `SELECT l.*, b.id as board_id
       FROM labels l
       JOIN boards b ON l.board_id = b.id
       JOIN board_members bm ON b.id = bm.board_id
       WHERE l.id = $1 AND bm.user_id = $2`,
      [labelId, user.id],
    )

    if (labelCheck.length === 0) {
      return NextResponse.json({ error: "Label not found or you don't have access to it" }, { status: 404 })
    }

    // Check if the label is being used by any tasks
    const usageCheck = await executeQuery(`SELECT COUNT(*) as count FROM task_labels WHERE label_id = $1`, [labelId])

    if (Number.parseInt(usageCheck[0].count) > 0) {
      // First remove all task-label associations
      await executeQuery(`DELETE FROM task_labels WHERE label_id = $1`, [labelId])
    }

    // Now delete the label
    await executeQuery(`DELETE FROM labels WHERE id = $1`, [labelId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting label:", error)
    return NextResponse.json({ error: "Failed to delete label" }, { status: 500 })
  }
}
