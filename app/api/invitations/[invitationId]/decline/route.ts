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
      // Handle board invitation
      const invitation = await prisma.boardInvitation.findUnique({
        where: { id: invitationId },
        include: {
          board: true,
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!invitation) {
        return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
      }

      if (invitation.recipientId !== user.id) {
        return NextResponse.json({ error: "This invitation is not for you" }, { status: 403 })
      }

      if (invitation.status !== "PENDING") {
        return NextResponse.json({ error: "This invitation has already been processed" }, { status: 400 })
      }

      // Update invitation status
      await prisma.boardInvitation.update({
        where: { id: invitationId },
        data: { status: "DECLINED" },
      })

      // Create notification for the sender
      await createNotification({
        userId: invitation.senderId,
        type: "INVITATION_DECLINED",
        content: `${user.name} declined your invitation to join the board "${invitation.board.title}"`,
        entityType: "BOARD",
        entityId: invitation.boardId,
      })

      return NextResponse.json({ message: "Invitation declined successfully" })
    } else {
      // Handle team invitation
      const invitation = await prisma.teamInvitation.findUnique({
        where: { id: invitationId },
        include: {
          team: true,
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!invitation) {
        return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
      }

      if (invitation.recipientId !== user.id) {
        return NextResponse.json({ error: "This invitation is not for you" }, { status: 403 })
      }

      if (invitation.status !== "PENDING") {
        return NextResponse.json({ error: "This invitation has already been processed" }, { status: 400 })
      }

      // Update invitation status
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: "DECLINED" },
      })

      // Create notification for the sender
      await createNotification({
        userId: invitation.senderId,
        type: "INVITATION_DECLINED",
        content: `${user.name} declined your invitation to join the team "${invitation.team.name}"`,
        entityType: "TEAM",
        entityId: invitation.teamId,
      })

      return NextResponse.json({ message: "Invitation declined successfully" })
    }
  } catch (error) {
    console.error("Error declining invitation:", error)
    return NextResponse.json({ error: "Failed to decline invitation" }, { status: 500 })
  }
}
