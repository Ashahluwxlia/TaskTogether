import { prisma } from "./prisma"
import { getCurrentUser } from "./auth"

// Role types
export type TeamRole = "OWNER" | "ADMIN" | "MEMBER"
export type BoardRole = "OWNER" | "ADMIN" | "EDITOR" | "MEMBER" | "VIEWER"

// Check if user is a member of a team
export async function isTeamMember(teamId: string, userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser()

  if (!user) return false

  // First check if user is the owner
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
      ownerId: user.id,
    },
  })

  if (team) return true

  // Then check if user is a member
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: user.id,
      },
    },
  })

  return !!membership
}

// Check if user is a team admin
export async function isTeamAdmin(teamId: string, userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser()

  if (!user) return false

  // First check if user is the owner (owners have admin privileges)
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
      ownerId: user.id,
    },
  })

  if (team) return true

  // Then check if user is an admin member
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: user.id,
      },
    },
  })

  return membership?.role === "ADMIN"
}

// Check if user is the team owner
export async function isTeamOwner(teamId: string, userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser()

  if (!user) return false

  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
      ownerId: user.id,
    },
  })

  return !!team
}

// Check if user has access to a board
export async function hasBoardAccess(boardId: string, userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser()

  if (!user) return false

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
    return false
  }

  // Check if the user has direct access to the board
  const isCreator = board.createdBy === user.id
  const isMember = board.members.some((member) => member.userId === user.id)

  if (isCreator || isMember) {
    return true
  }

  // If the board belongs to a team, check if the user is a team member
  if (board.teamId) {
    const teamMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: board.teamId,
          userId: user.id,
        },
      },
    })

    if (teamMembership) {
      return true
    }
  }

  return false
}

// Check if user can edit a board
export async function canEditBoard(boardId: string, userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser()

  if (!user) return false

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      members: {
        where: {
          userId: user.id,
        },
      },
    },
  })

  if (!board) return false

  // User is the creator of the board
  if (board.createdBy === user.id) return true

  // User has OWNER, ADMIN or EDITOR role on the board
  const membership = board.members[0]
  if (membership && (membership.role === "OWNER" || membership.role === "ADMIN" || membership.role === "EDITOR")) {
    return true
  }

  // If the board belongs to a team, check team permissions
  if (board.teamId) {
    const isAdmin = await isTeamAdmin(board.teamId, user.id)
    if (isAdmin) return true
  }

  return false
}

// Check if user can manage a task
export async function canManageTask(taskId: string, userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser()

  if (!user) return false

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      list: {
        include: {
          board: {
            include: {
              members: {
                where: {
                  userId: user.id,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!task) return false

  // User is the creator of the task
  if (task.createdBy === user.id) return true

  // User is assigned to the task
  if (task.assignedTo === user.id) return true

  // Check board permissions
  const board = task.list?.board
  if (board) {
    return canEditBoard(board.id, user.id)
  }

  return false
}

// Add a new function to check if a user can assign tasks to another user

/**
 * Check if a user can assign tasks to another user in a specific board
 */
export async function canAssignTaskInBoard(boardId: string, assignerId: string, assigneeId: string) {
  // Self-assignment is always allowed
  if (assignerId === assigneeId) return true

  // Check if both users are members of the board
  const assignerMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId: assignerId,
      },
    },
  })

  if (!assignerMember) return false

  // Check if the assignee is a member of the board
  const assigneeMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId: assigneeId,
      },
    },
  })

  if (!assigneeMember) return false

  // Check if the assigner has the right role to assign tasks
  // OWNER, ADMIN, and EDITOR can assign tasks
  const canAssign = ["OWNER", "ADMIN", "EDITOR"].includes(assignerMember.role)

  return canAssign
}
