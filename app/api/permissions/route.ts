import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ hasPermission: false }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const resourceType = searchParams.get("resourceType")
    const resourceId = searchParams.get("resourceId")
    const permission = searchParams.get("permission") || "view"

    if (!resourceType || !resourceId) {
      return NextResponse.json({ error: "Missing required parameters: resourceType, resourceId" }, { status: 400 })
    }

    let hasPermission = false

    switch (resourceType) {
      case "board":
        hasPermission = await checkBoardPermission(user.id, resourceId, permission)
        break
      case "team":
        hasPermission = await checkTeamPermission(user.id, resourceId, permission)
        break
      case "task":
        hasPermission = await checkTaskPermission(user.id, resourceId, permission)
        break
      default:
        return NextResponse.json({ error: "Invalid resourceType. Must be one of: board, team, task" }, { status: 400 })
    }

    return NextResponse.json({ hasPermission })
  } catch (error) {
    console.error("Error checking permissions:", error)
    return NextResponse.json({ error: "Failed to check permissions" }, { status: 500 })
  }
}

async function checkBoardPermission(userId: string, boardId: string, permission: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      members: {
        where: { userId },
      },
    },
  })

  if (!board) return false

  // Board creator has all permissions
  if (board.createdBy === userId) return true

  // Check board membership
  const membership = board.members[0]
  if (!membership) return false

  switch (permission) {
    case "view":
      return true // Any member can view
    case "edit":
      return ["ADMIN", "EDITOR"].includes(membership.role)
    case "admin":
      return membership.role === "ADMIN"
    default:
      return false
  }
}

async function checkTeamPermission(userId: string, teamId: string, permission: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { userId },
      },
    },
  })

  if (!team) return false

  // Team owner has all permissions
  if (team.ownerId === userId) return true

  // Check team membership
  const membership = team.members[0]
  if (!membership) return false

  switch (permission) {
    case "view":
      return true // Any member can view
    case "edit":
    case "admin":
      return membership.role === "ADMIN"
    default:
      return false
  }
}

async function checkTaskPermission(userId: string, taskId: string, permission: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      list: {
        include: {
          board: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  })

  if (!task) return false

  // Task creator or assignee has view and edit permissions
  if (task.createdBy === userId || task.assignedTo === userId) {
    // Changed from assigneeId to assignedTo
    return permission !== "admin" || task.createdBy === userId
  }

  // Check board permissions
  const board = task.list?.board
  if (!board) return false

  return checkBoardPermission(userId, board.id, permission)
}
