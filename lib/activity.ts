import { prisma } from "@/lib/prisma"

type ActivityAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "MOVED"
  | "COMMENTED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "JOINED"
  | "LEFT"
  | "INVITED"
  | "REMOVED"
  | "UPDATED_ROLE"

type EntityType =
  | "BOARD"
  | "TASK"
  | "LIST"
  | "COMMENT"
  | "TEAM"
  | "BOARD_MEMBER"
  | "TEAM_MEMBER"
  | "LABEL"
  | "ATTACHMENT"

interface ActivityParams {
  userId: string
  action: ActivityAction
  entityType: EntityType
  entityId: string
  boardId?: string
  teamId?: string
  details?: Record<string, any>
}

export async function trackActivity({
  userId,
  action,
  entityType,
  entityId,
  boardId,
  teamId,
  details = {},
}: ActivityParams) {
  try {
    await prisma.activity.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        boardId,
        teamId,
        details,
      },
    })

    return true
  } catch (error) {
    console.error("Error tracking activity:", error)
    return false
  }
}
