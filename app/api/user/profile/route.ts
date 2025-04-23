import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Only update the name in this endpoint
    // Image updates are handled by the dedicated profile-photo endpoint
    const { name } = data

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Update user in database - ensure we don't modify theme or language
    const result = await executeQuery(
      "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, image, theme, language",
      [name, user.id],
    )

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    // Don't modify the image URL in this endpoint
    return NextResponse.json({
      success: true,
      user: result[0],
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
