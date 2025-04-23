import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser, comparePasswords, hashPassword } from "@/lib/auth"

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    // Get the user's current password hash from the database
    const users = await executeQuery("SELECT password FROM users WHERE id = $1", [user.id])

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const storedPasswordHash = users[0].password

    // Verify the current password
    const isPasswordValid = await comparePasswords(currentPassword, storedPasswordHash)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update the password in the database
    await executeQuery("UPDATE users SET password = $1 WHERE id = $2", [newPasswordHash, user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
