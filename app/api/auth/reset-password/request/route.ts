import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/notification-service"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const users = await executeQuery("SELECT id FROM users WHERE email = $1", [email])

    if (users.length === 0) {
      // Don't reveal that the user doesn't exist for security reasons
      return NextResponse.json({ success: true })
    }

    const userId = users[0].id

    // Generate a reset token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

    // Store the token in the database
    await executeQuery(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3",
      [userId, token, expiresAt],
    )

    // Send password reset email
    await sendPasswordResetEmail(email, token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json({ error: "Failed to process password reset request" }, { status: 500 })
  }
}
