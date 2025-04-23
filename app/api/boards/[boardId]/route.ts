import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { boardId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await the params object
    const { boardId } = await params

    // Check if user has access to this board
    const boardAccess = await executeQuery(
      `SELECT b.*, bm.role, bm.is_starred
      FROM boards b
      JOIN board_members bm ON b.id = bm.board_id
      WHERE b.id = $1 AND bm.user_id = $2`,
      [boardId, user.id],
    )

    if (boardAccess.length === 0) {
      return NextResponse.json({ error: "Board not found or you do not have access" }, { status: 404 })
    }

    const board = boardAccess[0]

    // Get lists
    const lists = await executeQuery("SELECT * FROM lists WHERE board_id = $1 ORDER BY position ASC", [boardId])

    // Get tasks for each list
    for (const list of lists) {
      const tasks = await executeQuery(
        `SELECT t.*, u.name as assignee_name, u.image as assignee_image,
         (SELECT json_agg(json_build_object('id', lb.id, 'name', lb.name, 'color', lb.color))
          FROM task_labels tl
          JOIN labels lb ON tl.label_id = lb.id
          WHERE tl.task_id = t.id) as labels
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.list_id = $1
        ORDER BY t.position::integer ASC`,
        [list.id],
      )

      list.tasks = tasks
    }

    // Get members
    const members = await executeQuery(
      `SELECT u.id, u.name, u.email, u.image, bm.role
       FROM users u
       JOIN board_members bm ON u.id = bm.user_id
       WHERE bm.board_id = $1`,
      [boardId],
    )

    // Get labels
    const labels = await executeQuery("SELECT * FROM labels WHERE board_id = $1", [boardId])

    return NextResponse.json({
      ...board,
      lists,
      members,
      labels,
    })
  } catch (error) {
    console.error("Error fetching board:", error)
    return NextResponse.json({ error: "Failed to fetch board" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { boardId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const boardId = (await params).boardId
    const updates = await request.json()

    // Check if user has access to this board
    const boardAccess = await executeQuery(
      `SELECT bm.role
       FROM board_members bm
       WHERE bm.board_id = $1 AND bm.user_id = $2`,
      [boardId, user.id],
    )

    if (boardAccess.length === 0) {
      return NextResponse.json({ error: "Board not found or you do not have access" }, { status: 404 })
    }

    const userRole = boardAccess[0].role

    // Handle star/unstar separately - this should be allowed for all board members including VIEWERS
    if ("is_starred" in updates) {
      await executeQuery("UPDATE board_members SET is_starred = $1 WHERE board_id = $2 AND user_id = $3", [
        updates.is_starred,
        boardId,
        user.id,
      ])

      delete updates.is_starred
    }

    // Update board details - this requires higher permissions
    if (Object.keys(updates).length > 0) {
      const allowedFields = ["title", "description", "background_color"]
      const setStatements = []
      const queryParams = []

      // Only OWNER, ADMIN, and EDITOR can update board details
      if (userRole !== "OWNER" && userRole !== "ADMIN" && userRole !== "EDITOR") {
        return NextResponse.json({ error: "You do not have permission to update this board" }, { status: 403 })
      }

      let paramIndex = 1

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          setStatements.push(`${key} = $${paramIndex}`)
          queryParams.push(value)
          paramIndex++
        }
      }

      if (setStatements.length > 0) {
        // Add updated_at
        setStatements.push(`updated_at = CURRENT_TIMESTAMP`)

        // Add board ID as the last parameter
        queryParams.push(boardId)

        const query = `
          UPDATE boards
          SET ${setStatements.join(", ")}
          WHERE id = $${paramIndex}::uuid
        `

        const result = await executeQuery(query, queryParams)
      }
    }

    // Get updated board
    const board = await executeQuery(
      `SELECT b.*, bm.role, bm.is_starred
       FROM boards b
       JOIN board_members bm ON b.id = bm.board_id
       WHERE b.id = $1 AND bm.user_id = $2`,
      [boardId, user.id],
    )

    return NextResponse.json(board[0])
  } catch (error) {
    console.error("Error updating board:", error)
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { boardId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const boardId = (await params).boardId

    // Check if user is the owner
    const boardAccess = await executeQuery(
      `SELECT bm.role
       FROM board_members bm
       WHERE bm.board_id = $1 AND bm.user_id = $2`,
      [boardId, user.id],
    )

    if (boardAccess.length === 0) {
      return NextResponse.json({ error: "Board not found or you do not have access" }, { status: 404 })
    }

    const userRole = boardAccess[0].role

    // Allow both OWNER and ADMIN to delete boards
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "You do not have permission to delete this board" }, { status: 403 })
    }

    // Log what we're about to delete for debugging
    console.log(`Deleting board ${boardId} and all related data...`)

    // Delete board (cascade will handle related records)
    await executeQuery("DELETE FROM boards WHERE id = $1::uuid", [boardId])

    console.log(`Board ${boardId} deleted successfully`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting board:", error)
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 })
  }
}
