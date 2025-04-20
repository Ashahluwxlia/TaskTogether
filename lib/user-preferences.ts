import { prisma } from "./prisma"
import { getCurrentUser } from "./auth"

export interface NotificationPreferences {
  taskAssigned: boolean
  taskDueSoon: boolean
  taskComments: boolean
  mentions: boolean
  teamInvitations: boolean
  boardShared: boolean
  emailNotifications: boolean
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  taskAssigned: true,
  taskDueSoon: true,
  taskComments: true,
  mentions: true,
  teamInvitations: true,
  boardShared: true,
  emailNotifications: true,
}

export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    console.log(`Getting notification preferences for user ${userId}`)

    // Try to get user preferences from database
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    console.log(`User preferences from DB:`, userPreferences)

    // If user has preferences, return them
    if (userPreferences && userPreferences.preferences) {
      const preferences = userPreferences.preferences as any

      // Make sure all expected properties exist, using defaults for any missing ones
      return {
        taskAssigned: preferences.taskAssigned ?? DEFAULT_NOTIFICATION_PREFERENCES.taskAssigned,
        taskDueSoon: preferences.taskDueSoon ?? DEFAULT_NOTIFICATION_PREFERENCES.taskDueSoon,
        taskComments: preferences.taskComments ?? DEFAULT_NOTIFICATION_PREFERENCES.taskComments,
        mentions: preferences.mentions ?? DEFAULT_NOTIFICATION_PREFERENCES.mentions,
        teamInvitations: preferences.teamInvitations ?? DEFAULT_NOTIFICATION_PREFERENCES.teamInvitations,
        boardShared: preferences.boardShared ?? DEFAULT_NOTIFICATION_PREFERENCES.boardShared,
        emailNotifications: preferences.emailNotifications ?? DEFAULT_NOTIFICATION_PREFERENCES.emailNotifications,
      }
    }

    // If user doesn't have preferences yet, create default ones using upsert to avoid race conditions
    console.log(`Creating default preferences for user ${userId}`)
    await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        preferences: DEFAULT_NOTIFICATION_PREFERENCES as any,
      },
      create: {
        userId,
        preferences: DEFAULT_NOTIFICATION_PREFERENCES as any,
      },
    })

    return DEFAULT_NOTIFICATION_PREFERENCES
  } catch (error) {
    console.error("Error getting user notification preferences:", error)
    return DEFAULT_NOTIFICATION_PREFERENCES
  }
}

export async function updateUserNotificationPreferences(
  preferences: Partial<NotificationPreferences>,
): Promise<NotificationPreferences | null> {
  const user = await getCurrentUser()

  if (!user) return null

  try {
    // Get current preferences
    const currentPreferences = await getUserNotificationPreferences(user.id)

    // Merge current preferences with new ones
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
    }

    // Update in database
    const result = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        preferences: updatedPreferences as any, // Cast to any to satisfy Prisma's JSON type
      },
      create: {
        userId: user.id,
        preferences: updatedPreferences as any, // Cast to any to satisfy Prisma's JSON type
      },
    })

    return updatedPreferences
  } catch (error) {
    console.error("Error updating user notification preferences:", error)
    return null
  }
}

interface UserPreferences {
  theme: string
  language: string
  emailNotifications: boolean
  defaultView: string
}

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "light",
  language: "en",
  emailNotifications: true,
  defaultView: "board",
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const user = await getCurrentUser()

  if (!user) return DEFAULT_USER_PREFERENCES

  try {
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    })

    if (!userSettings) {
      return DEFAULT_USER_PREFERENCES
    }

    return {
      theme: userSettings.theme,
      language: userSettings.language,
      emailNotifications: userSettings.emailNotifications,
      defaultView: userSettings.defaultBoardView,
    }
  } catch (error) {
    console.error("Error getting user preferences:", error)
    return DEFAULT_USER_PREFERENCES
  }
}

export async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
  const user = await getCurrentUser()

  if (!user) return null

  try {
    const userSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        ...(preferences.theme && { theme: preferences.theme }),
        ...(preferences.language && { language: preferences.language }),
        ...(preferences.emailNotifications !== undefined && {
          emailNotifications: preferences.emailNotifications,
        }),
        ...(preferences.defaultView && { defaultBoardView: preferences.defaultView }),
      },
      create: {
        userId: user.id,
        theme: preferences.theme || DEFAULT_USER_PREFERENCES.theme,
        language: preferences.language || DEFAULT_USER_PREFERENCES.language,
        emailNotifications:
          preferences.emailNotifications !== undefined
            ? preferences.emailNotifications
            : DEFAULT_USER_PREFERENCES.emailNotifications,
        defaultBoardView: preferences.defaultView || DEFAULT_USER_PREFERENCES.defaultView,
      },
    })

    return {
      theme: userSettings.theme,
      language: userSettings.language,
      emailNotifications: userSettings.emailNotifications,
      defaultView: userSettings.defaultBoardView,
    }
  } catch (error) {
    console.error("Error updating user preferences:", error)
    return null
  }
}
