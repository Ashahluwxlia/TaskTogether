import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// Schema for updating a member's role
const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
})

export async function PUT(req: NextRequest, { params }: { params: { teamId: string; userId: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { teamId, userId } = resolvedParams

    // Prevent users from changing their own role
    if (currentUser.id === userId) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 403 })
    }

    // Check if current user is the owner or admin of the team
    const currentUserMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: currentUser.id,
        },
      },
    })

    if (!currentUserMembership || (currentUserMembership.role !== "OWNER" && currentUserMembership.role !== "ADMIN")) {
      return NextResponse.json({ error: "You don't have permission to update team members" }, { status: 403 })
    }

    // Check if the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if the target user is a member of the team
    const targetMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    })

    if (!targetMembership) {
      return NextResponse.json({ error: "User is not a member of this team" }, { status: 404 })
    }

    // Prevent non-owners from modifying owner or admin roles
    if (
      currentUserMembership.role !== "OWNER" &&
      (targetMembership.role === "OWNER" || targetMembership.role === "ADMIN")
    ) {
      return NextResponse.json({ error: "Only owners can modify the role of owners or admins" }, { status: 403 })
    }

    // Prevent members from changing any roles
    if (currentUserMembership.role !== "OWNER" && currentUserMembership.role !== "ADMIN") {
      return NextResponse.json({ error: "Only owners and admins can change member roles" }, { status: 403 })
    }

    // Prevent owners from changing their own role
    if (currentUser.id === userId && targetMembership.role === "OWNER") {
      return NextResponse.json({ error: "Owners cannot change their own role" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = updateMemberSchema.parse(body)

    // Update the member's role
    const updatedMembership = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: {
        role: validatedData.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedMembership)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }

    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { teamId: string; userId: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { teamId, userId } = resolvedParams

    // Allow users to remove themselves from a team
    const isSelfRemoval = currentUser.id === userId

    let currentUserMembership

    if (!isSelfRemoval) {
      // Check if current user is the owner or admin of the team
      currentUserMembership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: currentUser.id,
          },
        },
      })

      if (
        !currentUserMembership ||
        (currentUserMembership.role !== "OWNER" && currentUserMembership.role !== "ADMIN")
      ) {
        return NextResponse.json({ error: "You don't have permission to remove team members" }, { status: 403 })
      }
    }

    // Check if the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if the target user is a member of the team
    const targetMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    })

    if (!targetMembership) {
      return NextResponse.json({ error: "User is not a member of this team" }, { status: 404 })
    }

    // Prevent non-owners from removing owners or admins
    if (
      !isSelfRemoval &&
      currentUserMembership && // Added null check
      currentUserMembership.role === "ADMIN" &&
      (targetMembership.role === "OWNER" || targetMembership.role === "ADMIN")
    ) {
      return NextResponse.json({ error: "Admins cannot remove owners or other admins" }, { status: 403 })
    }

    // Prevent removing the owner
    if (targetMembership.role === "OWNER" && !isSelfRemoval) {
      return NextResponse.json({ error: "The team owner cannot be removed" }, { status: 403 })
    }

    // Remove the member from the team
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        action: "DELETED", // Changed from "LEFT" to a valid enum value
        entityType: "TEAM",
        entityId: teamId,
        userId,
        boardId: "system", // Special case for team member removal
        details: {
          teamName: team.name,
          removedBy: isSelfRemoval ? null : currentUser.id,
          removedByName: isSelfRemoval ? null : currentUser.name,
        },
      },
    })

    return NextResponse.json({ message: "Team member removed successfully" })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
  }
}
