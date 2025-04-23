import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { createBoardInvitationEmail } from "@/lib/email-templates"
import crypto from "crypto"

export async function GET(request: Request, { params }: { params: { boardId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params before accessing boardId
    const { boardId } = await params

    // Check if the user has access to this board
    const hasAccess = await executeQuery("SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      user.id,
    ])

    if (hasAccess.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch board members with user details
    const members = await executeQuery(
      `SELECT bm.*, u.id as user_id, u.name, u.email, u.image
       FROM board_members bm
       JOIN users u ON bm.user_id = u.id
       WHERE bm.board_id = $1`,
      [boardId],
    )

    // Transform the data to include user object
    const formattedMembers = members.map((member) => ({
      id: member.id,
      boardId: member.board_id,
      userId: member.user_id,
      role: member.role,
      joinedAt: member.created_at,
      user: {
        id: member.user_id,
        name: member.name,
        email: member.email,
        image: member.image,
      },
    }))

    return NextResponse.json(formattedMembers)
  } catch (error) {
    console.error("Error fetching board members:", error)
    return NextResponse.json({ error: "Failed to fetch board members" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { boardId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params before accessing boardId
    const { boardId } = await params
    const { email, role } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if the current user has permission to add members
    const userAccess = await executeQuery("SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      user.id,
    ])

    if (userAccess.length === 0) {
      return NextResponse.json({ error: "Board not found or you do not have access" }, { status: 404 })
    }

    const userRole = userAccess[0].role

    // Only owners and admins can add members
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "You do not have permission to add members" }, { status: 403 })
    }

    // Get board details
    const board = await executeQuery("SELECT title FROM boards WHERE id = $1", [boardId])

    if (board.length === 0) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    // Check if the user exists
    const invitedUser = await executeQuery("SELECT id, name FROM users WHERE email = $1", [email])

    if (invitedUser.length === 0) {
      // User doesn't exist, send invitation email
      // In a real app, you might create a pending invitation record
      try {
        await sendEmail({
          to: email,
          subject: `You've been invited to join a board on TaskTogether`,
          html: createBoardInvitationEmail(
            "New User", // Default name for new users
            user.name,
            board[0].title,
            `${process.env.NEXT_PUBLIC_APP_URL}/register?email=${encodeURIComponent(email)}&redirect=/boards/${boardId}`,
          ),
        })
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError)
        // Continue with the process even if email fails
      }

      return NextResponse.json({ message: "Invitation sent to user" })
    }

    const invitedUserId = invitedUser[0].id

    // Check if the user is already a member
    const existingMember = await executeQuery("SELECT id FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      invitedUserId,
    ])

    if (existingMember.length > 0) {
      return NextResponse.json({ error: "User is already a member of this board" }, { status: 400 })
    }

    // Create a board invitation
    const validRoles = ["ADMIN", "EDITOR"]
    const memberRole = validRoles.includes(role) ? role : "EDITOR"

    // Generate a unique invitation ID
    const invitationId = crypto.randomUUID()

    // Create the invitation record
    await executeQuery(
      `INSERT INTO board_invitations 
       (id, board_id, recipient_id, sender_id, role, status, message, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [invitationId, boardId, invitedUserId, user.id, memberRole, "PENDING", null],
    )

    // Create notification for the invitation
    await executeQuery(
      `INSERT INTO notifications 
       (user_id, type, content, entity_type, entity_id, read, created_at, invitation_id) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
      [
        invitedUserId,
        "BOARD_INVITATION",
        `You have been invited to join the board "${board[0].title}"`,
        "BOARD",
        boardId,
        false,
        invitationId, // Add the invitationId here
      ],
    )

    // Try to send email notification
    try {
      await sendEmail({
        to: email,
        subject: `You've been added to a board on TaskTogether`,
        html: createBoardInvitationEmail(
          invitedUser[0].name || email.split("@")[0], // Use name if available, or email username
          user.name,
          board[0].title,
          `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitationId}`,
        ),
      })
    } catch (emailError) {
      console.error("Error sending notification email:", emailError)
      // Continue with the process even if email fails
    }

    // Return the invitation data instead of member data
    return NextResponse.json({
      message: "Invitation sent successfully",
      invitationId,
      boardId,
      recipientId: invitedUserId,
      recipientEmail: email,
      role: memberRole,
    })
  } catch (error) {
    console.error("Error adding board member:", error)
    return NextResponse.json({ error: "Failed to add board member" }, { status: 500 })
  }
}
