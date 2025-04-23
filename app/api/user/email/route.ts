import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    // Check if email is already in use
    const existingUser = await executeQuery("SELECT id FROM users WHERE email = $1 AND id != $2", [email, user.id])

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
    }

    // In a real app, you would send a confirmation email
    // For this example, we'll update directly
    await executeQuery("UPDATE users SET email = $1 WHERE id = $2", [email, user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating email:", error)
    return NextResponse.json({ error: "Failed to update email" }, { status: 500 })
  }
}
