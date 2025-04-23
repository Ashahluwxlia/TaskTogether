import { type NextRequest, NextResponse } from "next/server"
import { verifyEmail, isTokenAlreadyUsed } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    console.log("Verifying email with token:", token)

    if (!token) {
      console.log("Token missing in request")
      return NextResponse.json({ success: false, error: "Verification token is required" }, { status: 400 })
    }

    // Check if token was already used for verification
    const alreadyVerified = await isTokenAlreadyUsed(token)
    if (alreadyVerified) {
      console.log("Email already verified with this token")
      return NextResponse.json({ success: false, error: "Email already verified" }, { status: 200 })
    }

    // Verify the token
    const success = await verifyEmail(token)
    console.log("Verification result:", success)

    if (!success) {
      console.log("Token verification failed")
      return NextResponse.json({ success: false, error: "Invalid or expired verification token" }, { status: 400 })
    }

    console.log("Email verification successful")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ success: false, error: "Failed to verify email" }, { status: 500 })
  }
}
