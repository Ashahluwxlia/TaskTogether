import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    // Check if token exists and is not expired
    const tokens = await executeQuery(
      "SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()",
      [token],
    )

    if (tokens.length === 0) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    const userId = tokens[0].user_id

    // Hash the new password
    const hashedPassword = await hashPassword(password)

    // Update the user's password
    await executeQuery("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId])

    // Delete the used token
    await executeQuery("DELETE FROM password_reset_tokens WHERE token = $1", [token])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password reset confirmation error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
