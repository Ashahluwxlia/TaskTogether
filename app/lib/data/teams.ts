import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function getTeams() {
  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  const teams = await prisma.team.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return teams
}

export async function getTeam(teamId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Check if user is a member of the team
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    return null
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      boards: {
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  })

  return team
}
