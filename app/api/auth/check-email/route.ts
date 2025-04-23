import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await executeQuery("SELECT id FROM users WHERE email = $1", [email])

    return NextResponse.json({ exists: existingUser.length > 0 })
  } catch (error) {
    console.error("Email check error:", error)
    return NextResponse.json({ error: "Failed to check email" }, { status: 500 })
  }
}
