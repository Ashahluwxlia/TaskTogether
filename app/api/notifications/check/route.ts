import { NextResponse } from "next/server"
import { checkTasksDueSoon, checkTasksOverdue } from "@/lib/notification-service"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Running notification checks...")

    // Run the notification checks
    const dueSoonCount = await checkTasksDueSoon()
    const overdueCount = await checkTasksOverdue()

    return NextResponse.json({
      success: true,
      dueSoonCount,
      overdueCount,
      message: "Notification checks completed successfully",
    })
  } catch (error) {
    console.error("Error running notification checks:", error)
    return NextResponse.json({ error: "Failed to run notification checks" }, { status: 500 })
  }
}
