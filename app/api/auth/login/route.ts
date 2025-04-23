import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { comparePasswords, createToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Find user
    const users = await executeQuery("SELECT id, password FROM users WHERE email = $1", [email])

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 })
    }

    const user = users[0]

    // Verify password
    const passwordMatch = await comparePasswords(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 })
    }

    // Create token
    const token = await createToken(user.id)

    // Create a new response
    const response = NextResponse.json({ success: true })

    // Set the cookie directly on the response
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 })
  }
}
