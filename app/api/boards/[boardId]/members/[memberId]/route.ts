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
    const memberCheck = await executeQuery(
      "SELECT bm.role, bm.user_id FROM board_members bm WHERE bm.board_id = $1 AND bm.id = $2",
      [boardId, memberId],
    )

    if (memberCheck.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const currentRole = memberCheck[0].role
    const memberId_userId = memberCheck[0].user_id

    // Prevent non-owners from modifying owners
    if (userRole !== "OWNER" && currentRole === "OWNER") {
      return NextResponse.json({ error: "Only owners can modify other owners" }, { status: 403 })
    }

    // Prevent changing own role if owner
    if (user.id === memberId_userId && userRole === "OWNER" && role !== "OWNER") {
      return NextResponse.json({ error: "Owners cannot downgrade their own role" }, { status: 403 })
    }

    // If changing from OWNER to another role, ensure there's at least one other owner
    if (currentRole === "OWNER" && role !== "OWNER") {
      const ownerCount = await executeQuery(
        "SELECT COUNT(*) as count FROM board_members WHERE board_id = $1 AND role = 'OWNER'",
        [boardId],
      )

      if (ownerCount[0].count <= 1) {
        return NextResponse.json(
          { error: "Cannot change the last owner. Promote another member to Owner first." },
          { status: 403 },
        )
      }
    }

    // Update the member's role
    const validRoles = ["OWNER", "ADMIN", "EDITOR"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    await executeQuery("UPDATE board_members SET role = $1 WHERE board_id = $2 AND id = $3", [role, boardId, memberId])

    // Get the updated member
    const updatedMember = await executeQuery(
      `SELECT bm.id, bm.role, bm.user_id as "userId", bm.board_id as "boardId", 
       u.id as "user.id", u.name as "user.name", u.email as "user.email", u.image as "user.image"
       FROM board_members bm
       JOIN users u ON bm.user_id = u.id
       WHERE bm.board_id = $1 AND bm.id = $2`,
      [boardId, memberId],
    )

    // Transform the result to match the expected structure
    const result =
      updatedMember.length > 0
        ? {
            id: updatedMember[0].id,
            role: updatedMember[0].role,
            userId: updatedMember[0].userId,
            boardId: updatedMember[0].boardId,
            user: {
              id: updatedMember[0]["user.id"],
              name: updatedMember[0]["user.name"],
              email: updatedMember[0]["user.email"],
              image: updatedMember[0]["user.image"],
            },
          }
        : null

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating board member:", error)
    return NextResponse.json({ error: "Failed to update board member" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { boardId: string; memberId: string } }) {
  // Redirect PUT requests to PATCH handler for compatibility
  return PATCH(request, { params })
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
    const memberCheck = await executeQuery("SELECT role, user_id FROM board_members WHERE board_id = $1 AND id = $2", [
      boardId,
      memberId,
    ])

    if (memberCheck.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const memberRole = memberCheck[0].role
    const memberId_userId = memberCheck[0].user_id

    // Handle different permission scenarios
    if (user.id === memberId_userId) {
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
    await executeQuery("DELETE FROM board_members WHERE board_id = $1 AND id = $2", [boardId, memberId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing board member:", error)
    return NextResponse.json({ error: "Failed to remove board member" }, { status: 500 })
  }
}
