import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { sendTeamInvitationEmail } from "@/lib/notification-service"
import { createNotification } from "@/lib/notifications"
import { getUserNotificationPreferences } from "@/lib/user-preferences"

export async function POST(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.teamId
    const { recipientId, role, message } = await req.json()

    // Verify the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if the user has permission to invite members
    const userMembership = team.members[0]
    if (!userMembership || !["ADMIN", "OWNER"].includes(userMembership.role)) {
      return NextResponse.json({ error: "You don't have permission to invite members to this team" }, { status: 403 })
    }

    // Check if the recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    })

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Check if the recipient is already a member of the team
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: recipientId,
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: "User is already a member of this team" }, { status: 400 })
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        recipientId,
        status: "PENDING",
      },
    })

    if (existingInvitation) {
      return NextResponse.json({ error: "An invitation is already pending for this user" }, { status: 400 })
    }

    // Create the invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        recipientId,
        senderId: user.id,
        role: role || "MEMBER",
        message,
        status: "PENDING",
      },
    })

    // Check user preferences for team invitations
    const recipientPreferences = await getUserNotificationPreferences(recipientId)

    // Create a notification for the recipient if they have team invitations enabled
    if (recipientPreferences.teamInvitations) {
      await createNotification({
        userId: recipientId,
        type: "TEAM_INVITATION",
        content: `${user.name} invited you to join the team "${team.name}"`,
        entityType: "TEAM",
        entityId: invitation.id,
      })
    }

    // Send an email notification if email notifications are enabled
    if (recipientPreferences.emailNotifications) {
      await sendTeamInvitationEmail(invitation.id)
    }

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error("Error creating team invitation:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.teamId

    // Verify the team exists and user has access
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if the user has permission to view invitations
    const userMembership = team.members[0]
    if (!userMembership || !["ADMIN", "OWNER"].includes(userMembership.role)) {
      return NextResponse.json(
        { error: "You don't have permission to view invitations for this team" },
        { status: 403 },
      )
    }

    // Get all invitations for the team
    const invitations = await prisma.teamInvitation.findMany({
      where: { teamId },
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
    console.error("Error fetching team invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}
