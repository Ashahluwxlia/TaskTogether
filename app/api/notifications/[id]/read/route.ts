import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationId = params.id

    // Verify user owns this notification
    const notification = await executeQuery("SELECT * FROM notifications WHERE id = $1 AND user_id = $2", [
      notificationId,
      user.id,
    ])

    if (notification.length === 0) {
      return NextResponse.json({ error: "Notification not found or you do not have access" }, { status: 404 })
    }

    // Mark as read
    await executeQuery("UPDATE notifications SET is_read = true WHERE id = $1", [notificationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}
