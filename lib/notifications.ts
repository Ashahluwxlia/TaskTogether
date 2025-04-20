import { prisma } from "./prisma"
import { getCurrentUser } from "./auth"
import { getUserNotificationPreferences } from "./user-preferences"

type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_COMMENTED"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "BOARD_SHARED"
  | "TEAM_INVITATION"
  | "MENTION"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  content: string
  message?: string
  link?: string
  taskId?: string
  boardId?: string
  teamId?: string
  commentId?: string
  entityType?: string
  entityId?: string
}

export async function createNotification({
  userId,
  type,
  content,
  entityType = "TASK",
  entityId,
}: {
  userId: string
  type: string
  content: string
  entityType?: string
  entityId?: string
}) {
  try {
    console.log(`Creating notification for user ${userId} of type ${type}`)

    // Check user preferences before creating notification
    const preferences = await getUserNotificationPreferences(userId)
    console.log(`User ${userId} notification preferences:`, preferences)

    // Skip notification based on user preferences
    if (
      (type === "TASK_ASSIGNED" && !preferences.taskAssigned) ||
      (type === "TASK_DUE_SOON" && !preferences.taskDueSoon) ||
      (type === "TASK_OVERDUE" && !preferences.taskDueSoon) ||
      (type === "TASK_COMMENTED" && !preferences.taskComments)
    ) {
      console.log(`Skipping notification of type ${type} due to user preferences`)
      return null
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        content,
        entityType,
        entityId,
        read: false,
      },
    })

    console.log(`Created notification:`, notification)
    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser()

  if (!user) return null

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification || notification.userId !== user.id) {
      return null
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    return updatedNotification
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return null
  }
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser()

  if (!user) return false

  try {
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: { read: true },
    })

    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return false
  }
}

export async function getUnreadNotificationsCount() {
  const user = await getCurrentUser()

  if (!user) return 0

  try {
    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    })

    return count
  } catch (error) {
    console.error("Error getting unread notifications count:", error)
    return 0
  }
}
