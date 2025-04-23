import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { boardId: string; memberId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { boardId, memberId } = params
    const { role } = await request.json()

    // Check if the current user has permission to update members
    const userAccess = await executeQuery("SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      user.id,
    ])

    if (userAccess.length === 0) {
      return NextResponse.json({ error: "Board not found or you do not have access" }, { status: 404 })
    }

    const userRole = userAccess[0].role

    // Only owners and admins can update member roles
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "You do not have permission to update member roles" }, { status: 403 })
    }

    // Check if the member exists
    const memberCheck = await executeQuery("SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      memberId,
    ])

    if (memberCheck.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const currentRole = memberCheck[0].role

    // Prevent non-owners from modifying owners
    if (userRole !== "OWNER" && currentRole === "OWNER") {
      return NextResponse.json({ error: "Only owners can modify other owners" }, { status: 403 })
    }

    // Prevent changing own role if owner
    if (user.id === memberId && userRole === "OWNER" && role !== "OWNER") {
      return NextResponse.json({ error: "Owners cannot downgrade their own role" }, { status: 403 })
    }

    // Update the member's role
    const validRoles = ["OWNER", "ADMIN", "EDITOR", "MEMBER", "VIEWER"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    await executeQuery("UPDATE board_members SET role = $1 WHERE board_id = $2 AND user_id = $3", [
      role,
      boardId,
      memberId,
    ])

    // Get the updated member
    const updatedMember = await executeQuery(
      `SELECT u.id, u.name, u.email, u.image, bm.role, bm.joined_at
       FROM users u
       JOIN board_members bm ON u.id = bm.user_id
       WHERE bm.board_id = $1 AND u.id = $2`,
      [boardId, memberId],
    )

    return NextResponse.json(updatedMember[0])
  } catch (error) {
    console.error("Error updating board member:", error)
    return NextResponse.json({ error: "Failed to update board member" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { boardId: string; memberId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { boardId, memberId } = params

    // Check if the current user has permission to remove members
    const userAccess = await executeQuery("SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      user.id,
    ])

    if (userAccess.length === 0) {
      return NextResponse.json({ error: "Board not found or you do not have access" }, { status: 404 })
    }

    const userRole = userAccess[0].role

    // Check if the member exists
    const memberCheck = await executeQuery("SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      memberId,
    ])

    if (memberCheck.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const memberRole = memberCheck[0].role

    // Handle different permission scenarios
    if (user.id === memberId) {
      // Users can remove themselves, unless they are the last owner
      if (memberRole === "OWNER") {
        // Check if this is the last owner
        const ownerCount = await executeQuery(
          "SELECT COUNT(*) as count FROM board_members WHERE board_id = $1 AND role = 'OWNER'",
          [boardId],
        )

        if (ownerCount[0].count <= 1) {
          return NextResponse.json(
            { error: "Cannot remove the last owner. Transfer ownership first." },
            { status: 403 },
          )
        }
      }
    } else {
      // Removing another user
      // Only owners and admins can remove members
      if (userRole !== "OWNER" && userRole !== "ADMIN") {
        return NextResponse.json({ error: "You do not have permission to remove members" }, { status: 403 })
      }

      // Admins cannot remove owners
      if (userRole === "ADMIN" && memberRole === "OWNER") {
        return NextResponse.json({ error: "Admins cannot remove owners" }, { status: 403 })
      }
    }

    // Remove the member
    await executeQuery("DELETE FROM board_members WHERE board_id = $1 AND user_id = $2", [boardId, memberId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing board member:", error)
    return NextResponse.json({ error: "Failed to remove board member" }, { status: 500 })
  }
}
