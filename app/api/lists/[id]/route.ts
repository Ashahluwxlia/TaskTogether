import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly handle params
    const listId = await params.id // Await the params.id

    const updates = await request.json()

    // Verify user has access to this list
    const hasAccess = await executeQuery(
      `SELECT 1 FROM board_members bm
      JOIN boards b ON bm.board_id = b.id
      JOIN lists l ON b.id = l.board_id
      WHERE bm.user_id = $1 AND l.id = $2`,
      [user.id, listId],
    )

    if (hasAccess.length === 0) {
      return NextResponse.json({ error: "You do not have access to this list" }, { status: 403 })
    }

    // Build update query dynamically
    const setStatements = []
    const queryParams = []

    let paramIndex = 1

    for (const [key, value] of Object.entries(updates)) {
      if (key === "title" || key === "position") {
        setStatements.push(`${key} = $${paramIndex}`)
        queryParams.push(value)
        paramIndex++
      }
    }

    if (setStatements.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Add updated_at
    setStatements.push(`updated_at = CURRENT_TIMESTAMP`)

    // Add list ID as the last parameter
    queryParams.push(listId)

    const query = `
     UPDATE lists
     SET ${setStatements.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING *
   `

    const result = await executeQuery(query, queryParams)

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating list:", error)
    return NextResponse.json({ error: "Failed to update list" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    // Properly handle params
    const listId = await params.id // Await the params.id

    console.log("DELETE list request received for list ID:", listId)
    console.log("User:", user?.id)

    if (!user) {
      console.log("Unauthorized: No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!listId) {
      console.log("Bad request: No list ID provided")
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    // Verify user has access to this list and is an admin or owner
    const hasAccess = await executeQuery(
      `SELECT bm.role, b.id as board_id
      FROM board_members bm
      JOIN boards b ON bm.board_id = b.id
      JOIN lists l ON b.id = l.board_id
      WHERE bm.user_id = $1 AND l.id = $2`,
      [user.id, listId],
    )

    console.log("Access check result:", hasAccess)

    if (hasAccess.length === 0) {
      console.log("Forbidden: User does not have access to this list")
      return NextResponse.json({ error: "You do not have access to this list" }, { status: 403 })
    }

    const userRole = hasAccess[0].role
    console.log("User role:", userRole)

    // Only owners and admins can delete lists
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      console.log("Forbidden: User does not have permission to delete this list")
      return NextResponse.json({ error: "You do not have permission to delete this list" }, { status: 403 })
    }

    // Delete list (cascade will handle related tasks)
    console.log("Deleting list:", listId)
    const deleteResult = await executeQuery("DELETE FROM lists WHERE id = $1 RETURNING id", [listId])
    console.log("Delete result:", deleteResult)

    return NextResponse.json({ success: true, deletedId: listId })
  } catch (error) {
    console.error("Error deleting list:", error)
    return NextResponse.json({ error: "Failed to delete list", details: String(error) }, { status: 500 })
  }
}
