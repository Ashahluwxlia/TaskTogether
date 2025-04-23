import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import { prisma } from "@/lib/prisma"
import { sendTeamInvitationEmail } from "@/lib/notification-service"

// GET /api/teams - List teams for the current user
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = user.id

    // Get teams the user is a member of
    const teams = await executeQuery(
      `
      SELECT t.* 
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY t.name ASC
    `,
      [userId],
    )

    // Get teams the user owns
    const ownedTeams = await executeQuery(
      `
      SELECT * 
      FROM teams 
      WHERE owner_id = $1
      ORDER BY name ASC
    `,
      [userId],
    )

    // Combine and deduplicate
    const allTeams = [...teams, ...ownedTeams.filter((ot) => !teams.some((t) => t.id === ot.id))]

    return NextResponse.json(allTeams)
  } catch (error) {
    console.error("[TEAMS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// POST /api/teams - Create a new team
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, description, members } = await req.json()

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    // Create the team using Prisma
    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        ownerId: user.id, // Set the creator as the owner
        createdBy: user.id,
      },
    })

    // Add the creator as a team member with ADMIN role
    // Note: The owner is automatically an admin but we still add them as a member for consistency
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: "ADMIN", // Owner gets ADMIN role
      },
    })

    // If members are provided, send invitations to them
    if (members && Array.isArray(members) && members.length > 0) {
      for (const member of members) {
        const { email, role = "MEMBER" } = member

        // Find user by email
        const invitedUser = await prisma.user.findUnique({
          where: { email },
        })

        if (invitedUser) {
          // Create team invitation
          const invitation = await prisma.teamInvitation.create({
            data: {
              teamId: team.id,
              recipientId: invitedUser.id,
              senderId: user.id,
              role: role,
              status: "PENDING",
              message: `${user.name} has invited you to join the team "${name}"`,
            },
          })

          // Create a notification for the recipient
          await prisma.notification.create({
            data: {
              userId: invitedUser.id,
              type: "TEAM_INVITATION",
              content: `${user.name} invited you to join the team "${name}"`,
              entityType: "TEAM",
              entityId: team.id,
              invitationId: invitation.id,
            },
          })

          // Send email notification
          try {
            await sendTeamInvitationEmail(invitation.id)
          } catch (error) {
            console.error("Failed to send invitation email:", error)
          }
        }
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "TEAM",
        entityId: team.id,
        teamId: team.id,
        details: { teamName: name },
      },
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error("[TEAMS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
