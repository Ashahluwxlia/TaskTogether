import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Soft delete all notifications for the user by setting isDeleted to true
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isDeleted: false, // Only update non-deleted notifications
      },
      data: {
        isDeleted: true,
      },
    })

    return NextResponse.json({ success: true, message: "All notifications deleted successfully" })
  } catch (error) {
    console.error("Error deleting all notifications:", error)
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 })
  }
}
