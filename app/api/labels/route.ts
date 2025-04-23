import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get("boardId")

    if (!boardId) {
      // If no boardId is provided, return only the user's personal labels
      const userLabels = await executeQuery(
        `SELECT l.* FROM labels l
         WHERE l.created_by = $1 AND l.board_id IS NULL`,
        [user.id],
      )
      return NextResponse.json(userLabels)
    }

    // Check if the user is a member of the board
    const boardMember = await executeQuery(`SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2`, [
      boardId,
      user.id,
    ])

    if (boardMember.length === 0) {
      return NextResponse.json({ error: "You don't have access to this board" }, { status: 403 })
    }

    // Get all board members
    const boardMembers = await executeQuery(`SELECT user_id FROM board_members WHERE board_id = $1`, [boardId])

    const memberIds = boardMembers.map((member) => member.user_id)

    // Get labels that are:
    // 1. Associated with this specific board
    // 2. Personal labels of users who are members of this board
    const labels = await executeQuery(
      `SELECT l.* FROM labels l
       WHERE (l.board_id = $1) OR 
             (l.board_id IS NULL AND l.created_by = ANY($2))`,
      [boardId, memberIds],
    )

    return NextResponse.json(labels)
  } catch (error) {
    console.error("Error fetching labels:", error)
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, color, boardId } = await request.json()

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    // If boardId is provided, verify the user has access to the board
    if (boardId) {
      const boardMember = await executeQuery(`SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2`, [
        boardId,
        user.id,
      ])

      if (boardMember.length === 0) {
        return NextResponse.json({ error: "You don't have access to this board" }, { status: 403 })
      }
    }

    // Create the label
    const [label] = await executeQuery(
      `INSERT INTO labels (name, color, board_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, color, board_id, created_by`,
      [name, color, boardId || null, user.id],
    )

    return NextResponse.json(label)
  } catch (error) {
    console.error("Error creating label:", error)
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 })
  }
}
