import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { createNotification } from "@/lib/notifications"

export async function POST(req: NextRequest, { params }: { params: { invitationId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invitationId = params.invitationId
    const { type } = await req.json()

    if (!["board", "team"].includes(type)) {
      return NextResponse.json({ error: "Invalid invitation type" }, { status: 400 })
    }

    if (type === "board") {
      const invitation = await prisma.boardInvitation.findUnique({
        where: { id: invitationId },
        include: {
          board: true,
          sender: true,
        },
      })

      if (!invitation) {
        return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
      }

      if (invitation.recipientId !== user.id) {
        return NextResponse.json({ error: "This invitation is not for you" }, { status: 403 })
      }

      if (invitation.status !== "PENDING") {
        return NextResponse.json(
          { error: `Invitation has already been ${invitation.status.toLowerCase()}` },
          { status: 400 },
        )
      }

      // Check if the user is already a member of the board
      const existingMember = await prisma.boardMember.findFirst({
        where: {
          boardId: invitation.boardId,
          userId: user.id,
        },
      })

      if (!existingMember) {
        // Add the user as a board member
        await prisma.boardMember.create({
          data: {
            boardId: invitation.boardId,
            userId: user.id,
            role: invitation.role,
          },
        })
      }

      // Update the invitation status
      await prisma.boardInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      })

      // Create a notification for the sender
      await createNotification({
        userId: invitation.senderId,
        type: "INVITATION_ACCEPTED",
        content: `${user.name} accepted your invitation to join the board "${invitation.board.name || invitation.board.title || "Untitled Board"}"`,
        entityType: "BOARD",
        entityId: invitation.boardId,
      })

      // Return success response with board details
      return NextResponse.json({
        message: "Board invitation accepted successfully",
        boardId: invitation.boardId,
        boardName: invitation.board.name || invitation.board.title || "Untitled Board",
        role: invitation.role,
      })
    } else if (type === "team") {
      const invitation = await prisma.teamInvitation.findUnique({
        where: { id: invitationId },
        include: {
          team: true,
          sender: true,
        },
      })

      if (!invitation) {
        return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
      }

      if (invitation.recipientId !== user.id) {
        return NextResponse.json({ error: "This invitation is not for you" }, { status: 403 })
      }

      if (invitation.status !== "PENDING") {
        return NextResponse.json(
          { error: `Invitation has already been ${invitation.status.toLowerCase()}` },
          { status: 400 },
        )
      }

      // Check if the user is already a member of the team
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: invitation.teamId,
          userId: user.id,
        },
      })

      if (!existingMember) {
        // Add the user as a team member
        await prisma.teamMember.create({
          data: {
            teamId: invitation.teamId,
            userId: user.id,
            role: invitation.role,
          },
        })
      }

      // Update the invitation status
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      })

      // Create a notification for the sender
      await createNotification({
        userId: invitation.senderId,
        type: "INVITATION_ACCEPTED",
        content: `${user.name} accepted your invitation to join the team "${invitation.team.name}"`,
        entityType: "TEAM",
        entityId: invitation.teamId,
      })

      return NextResponse.json({
        message: "Invitation accepted successfully",
        teamId: invitation.teamId,
      })
    }

    return NextResponse.json({ error: "Invalid invitation type" }, { status: 400 })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}
