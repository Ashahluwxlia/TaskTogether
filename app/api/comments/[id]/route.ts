import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id
    const { content } = await request.json()

    // Verify user is the author
    const comment = await executeQuery("SELECT * FROM comments WHERE id = $1", [commentId])

    if (comment.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment[0].author_id !== user.id) {
      return NextResponse.json({ error: "You can only edit your own comments" }, { status: 403 })
    }

    // Update comment
    const result = await executeQuery(
      `UPDATE comments
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [content, commentId],
    )

    // Get author details
    const updatedComment = {
      ...result[0],
      author_name: user.name,
      author_image: user.image,
    }

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id

    // Verify user is the author or has admin rights
    const commentData = await executeQuery(
      `SELECT c.*, t.list_id
       FROM comments c
       JOIN tasks t ON c.task_id = t.id
       WHERE c.id = $1`,
      [commentId],
    )

    if (commentData.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const comment = commentData[0]

    // Check if user is author
    const isAuthor = comment.author_id === user.id

    // If not author, check if user is admin or owner
    let hasAdminRights = false

    if (!isAuthor) {
      const boardAccess = await executeQuery(
        `SELECT bm.role
         FROM board_members bm
         JOIN boards b ON bm.board_id = b.id
         JOIN lists l ON b.id = l.board_id
         WHERE bm.user_id = $1 AND l.id = $2`,
        [user.id, comment.list_id],
      )

      if (boardAccess.length > 0) {
        const role = boardAccess[0].role
        hasAdminRights = role === "OWNER" || role === "ADMIN"
      }
    }

    if (!isAuthor && !hasAdminRights) {
      return NextResponse.json({ error: "You do not have permission to delete this comment" }, { status: 403 })
    }

    // Delete comment
    await executeQuery("DELETE FROM comments WHERE id = $1", [commentId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
