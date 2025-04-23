import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { hashPassword, createToken, setAuthCookie, createVerificationToken } from "@/lib/auth"
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/notification-service"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Check if user already exists
    const existingUser = await executeQuery("SELECT id FROM users WHERE email = $1", [email])

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate UUID for the new user
    const userId = uuidv4()

    // Current timestamp for created_at and updated_at
    const now = new Date()

    // Create user with explicit UUID and timestamps
    // Note: email_verified is NULL initially, not false
    const result = await executeQuery(
      `INSERT INTO users 
       (id, name, email, password, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [userId, name, email, hashedPassword, now, now],
    )

    // Create token and set cookie
    const token = await createToken(userId)
    await setAuthCookie(token)

    // Create verification token and send verification email
    const verificationToken = await createVerificationToken(userId)

    // Send verification email (don't await to avoid blocking the response)
    sendVerificationEmail(userId, verificationToken).catch((error) => {
      console.error("Error sending verification email:", error)
    })

    // Send welcome email (don't await to avoid blocking the response)
    sendWelcomeEmail(userId).catch((error) => {
      console.error("Error sending welcome email:", error)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}
