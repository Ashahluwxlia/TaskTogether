import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

// GET: Fetch chat messages for a team
export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await params before accessing teamId
    const resolvedParams = await Promise.resolve(params)
    const teamId = resolvedParams.teamId

    // Check if user is a member of the team
    const teamMember = await executeQuery("SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2", [
      teamId,
      user.id,
    ])

    if (teamMember.length === 0) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 })
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Get total count for pagination
    const countResult = await executeQuery(
      "SELECT COUNT(*) as total FROM team_chat_messages WHERE team_id = $1 AND is_deleted = false",
      [teamId],
    )
    const total = Number.parseInt(countResult[0].total)

    // Fix 2: Correct the SQL query by properly defining table aliases
    const messages = await executeQuery(
      `SELECT m.id, m.team_id, m.sender_id, m.content, m.created_at, m.updated_at, m.is_deleted, 
u.name as sender_name, 
u.image as sender_image
FROM team_chat_messages m
JOIN users u ON m.sender_id = u.id
WHERE m.team_id = $1 AND m.is_deleted = false
ORDER BY m.created_at DESC
LIMIT $2 OFFSET $3`,
      [teamId, limit, offset],
    )

    return NextResponse.json({
      messages: messages.reverse(),
      hasMore: offset + messages.length < total,
      total,
    })
  } catch (error) {
    console.error("Error fetching team chat messages:", error)
    return NextResponse.json({ error: "Failed to fetch team chat messages" }, { status: 500 })
  }
}

// POST: Send a new chat message
export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await params before accessing teamId
    const resolvedParams = await Promise.resolve(params)
    const teamId = resolvedParams.teamId

    // Check if user is a member of the team
    const teamMember = await executeQuery("SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2", [
      teamId,
      user.id,
    ])

    if (teamMember.length === 0) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 })
    }

    // Get message content from request body
    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 })
    }

    // Insert new message
    const result = await executeQuery(
      `INSERT INTO team_chat_messages (team_id, sender_id, content, created_at, updated_at, is_deleted)
  VALUES ($1, $2, $3, NOW(), NOW(), false)
  RETURNING id, team_id, sender_id, content, created_at, updated_at, is_deleted`,
      [teamId, user.id, content],
    )

    if (result.length === 0) {
      throw new Error("Failed to create message")
    }

    // Get sender information
    const senderInfo = await executeQuery("SELECT name, image FROM users WHERE id = $1", [user.id])

    // Combine message with sender info
    const newMessage = {
      ...result[0],
      sender_name: senderInfo[0].name,
      sender_image: senderInfo[0].image,
    }

    return NextResponse.json(newMessage)
  } catch (error) {
    console.error("Error sending team chat message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

// DELETE handler to soft delete a message
export async function DELETE(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await params before accessing teamId
    const resolvedParams = await Promise.resolve(params)
    const teamId = resolvedParams.teamId

    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get("messageId")

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 })
    }

    // Check if user is a member of the team
    const isMember = await executeQuery("SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1", [
      teamId,
      user.id,
    ])

    if (isMember.length === 0) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 })
    }

    // Check if user is the sender of the message or has admin rights
    const message = await executeQuery("SELECT sender_id FROM team_chat_messages WHERE id = $1 AND team_id = $2", [
      messageId,
      teamId,
    ])

    if (message.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    const isAdmin = await executeQuery(
      "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND role IN ('ADMIN', 'OWNER') LIMIT 1",
      [teamId, user.id],
    )

    if (message[0].sender_id !== user.id && isAdmin.length === 0) {
      return NextResponse.json({ error: "You don't have permission to delete this message" }, { status: 403 })
    }

    // Soft delete the message
    await executeQuery("UPDATE team_chat_messages SET is_deleted = true WHERE id = $1", [messageId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team chat message:", error)
    return NextResponse.json({ error: "Failed to delete chat message" }, { status: 500 })
  }
}
