import { NextResponse } from "next/server"
import { getCurrentUser, createVerificationToken } from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/notification-service"

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the email is already verified
    const isVerified = user.email_verified === true

    if (isVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
    }

    // Create a new verification token
    const verificationToken = await createVerificationToken(user.id)

    // Send the verification email
    await sendVerificationEmail(user.id, verificationToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Failed to resend verification email" }, { status: 500 })
  }
}
