import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, boardId, position } = await request.json()

    // Verify user has access to this board
    const hasAccess = await executeQuery(
      `SELECT 1 FROM board_members bm
       WHERE bm.user_id = $1 AND bm.board_id = $2`,
      [user.id, boardId],
    )

    if (hasAccess.length === 0) {
      return NextResponse.json({ error: "You do not have access to this board" }, { status: 403 })
    }

    // Create list
    const result = await executeQuery(
      `INSERT INTO lists (title, board_id, position)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, boardId, position],
    )

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating list:", error)
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 })
  }
}
