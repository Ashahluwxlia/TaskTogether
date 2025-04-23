import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

// DELETE: Soft delete a chat message
export async function DELETE(request: NextRequest, { params }: { params: { teamId: string; messageId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, messageId } = params

    // Check if user is a member of the team
    const teamMember = await executeQuery("SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2", [
      teamId,
      user.id,
    ])

    if (teamMember.length === 0) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 })
    }

    // Check if message exists and belongs to the team
    const message = await executeQuery("SELECT * FROM team_chat_messages WHERE id = $1 AND team_id = $2", [
      messageId,
      teamId,
    ])

    if (message.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Check if user is the sender or an admin
    const isAdmin = teamMember[0].role === "ADMIN" || teamMember[0].role === "OWNER"
    const isSender = message[0].sender_id === user.id

    if (!isSender && !isAdmin) {
      return NextResponse.json({ error: "You cannot delete this message" }, { status: 403 })
    }

    // Soft delete the message
    await executeQuery("UPDATE team_chat_messages SET is_deleted = true WHERE id = $1", [messageId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team chat message:", error)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
