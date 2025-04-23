import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserNotificationPreferences, updateUserNotificationPreferences } from "@/lib/user-preferences"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const preferences = await getUserNotificationPreferences(user.id)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    return NextResponse.json({ error: "Failed to fetch user preferences" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate preferences
    const preferences = {
      emailNotifications: Boolean(body.emailNotifications),
      taskAssigned: Boolean(body.taskAssigned),
      taskDueSoon: Boolean(body.taskDueSoon),
      taskComments: Boolean(body.taskComments),
      mentions: Boolean(body.mentions),
      teamInvitations: Boolean(body.teamInvitations),
      boardShared: Boolean(body.boardShared),
    }

    const updatedPreferences = await updateUserNotificationPreferences(preferences)

    if (!updatedPreferences) {
      return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 })
    }

    return NextResponse.json({ success: true, preferences: updatedPreferences })
  } catch (error) {
    console.error("Error saving user preferences:", error)
    return NextResponse.json({ error: "Failed to save user preferences" }, { status: 500 })
  }
}
