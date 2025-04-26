import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { sendBoardInvitationEmail } from "@/lib/notification-service"
import { createNotification } from "@/lib/notifications"

export async function POST(req: NextRequest, { params }: { params: { boardId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const boardId = params.boardId
    const { recipientId, role, message } = await req.json()

    // Verify the board exists
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    // Check if the user has permission to invite members
    const userMembership = board.members[0]
    if (!userMembership || !["ADMIN", "OWNER"].includes(userMembership.role)) {
      return NextResponse.json({ error: "You don't have permission to invite members to this board" }, { status: 403 })
    }

    // Check if the recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    })

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Check if the recipient is already a member of the board
    const existingMembership = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId: recipientId,
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: "User is already a member of this board" }, { status: 400 })
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.boardInvitation.findFirst({
      where: {
        boardId,
        recipientId,
        status: "PENDING",
      },
    })

    if (existingInvitation) {
      return NextResponse.json({ error: "An invitation is already pending for this user" }, { status: 400 })
    }

    // Create the invitation
    const invitation = await prisma.boardInvitation.create({
      data: {
        boardId,
        recipientId,
        senderId: user.id,
        role: role || "VIEWER",
        message,
        status: "PENDING",
      },
    })

    // Create a notification for the recipient
    await createNotification({
      userId: recipientId,
      type: "BOARD_INVITATION",
      content: `${user.name} invited you to join the board "${board.name || board.title || "Untitled Board"}"`,
      entityType: "BOARD",
      entityId: invitation.id,
    })

    // Send an email notification
    await sendBoardInvitationEmail(invitation.id)

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error("Error creating board invitation:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { boardId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const boardId = params.boardId

    // Verify the board exists and user has access
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    // Check if the user has permission to view invitations
    const userMembership = board.members[0]
    if (!userMembership || !["ADMIN", "OWNER"].includes(userMembership.role)) {
      return NextResponse.json(
        { error: "You don't have permission to view invitations for this board" },
        { status: 403 },
      )
    }

    // Get all invitations for the board
    const invitations = await prisma.boardInvitation.findMany({
      where: { boardId },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("Error fetching board invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}
