import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function getTeamBoards(teamId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return []
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
    return []
  }

  const boards = await prisma.board.findMany({
    where: {
      teamId,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      lists: {
        select: {
          id: true,
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return boards
}

export async function getBoardMembers(boardId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  // Check if the board exists and if the user has access to it
  const board = await prisma.board.findUnique({
    where: { id: boardId },
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
    },
  })

  if (!board) {
    return []
  }

  // Check if the user has access to the board
  const isCreator = board.members.some((member) => member.userId === user.id && member.role === "OWNER")
  const isMember = board.members.some((member) => member.userId === user.id)

  if (!isCreator && !isMember) {
    return []
  }

  return board.members
}
