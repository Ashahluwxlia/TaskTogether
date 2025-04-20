import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"
import { randomUUID } from "crypto" // Using Node.js built-in instead of nanoid
import { executeQuery } from "./db"
import bcrypt from "bcryptjs" // This is already in your package.json

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const revalidate = 0

// Secret key for JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Compare a password with a hash
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create a JWT token
export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(randomUUID()) // Using Node.js built-in instead of nanoid
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

// Set the auth cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set({
    name: "auth-token",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax", // Add sameSite for better security
  })
}

// Get the current user from the auth token
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    const userId = verified.payload.userId as string

    // THIS IS THE KEY CHANGE: Include the image field in the query
    const users = await executeQuery("SELECT id, name, email, image, email_verified FROM users WHERE id = $1", [userId])

    if (users.length === 0) {
      return null
    }

    return users[0]
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

// Logout - clear the auth cookie
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set({
    name: "auth-token",
    value: "",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  })
}

/**
 * Creates a verification token for a user
 * @param userId The ID of the user
 * @returns The verification token
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

  await executeQuery(
    `INSERT INTO email_verification_tokens (user_id, token, expires_at) 
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt],
  )

  return token
}

/**
 * Verifies a user's email using a verification token
 * @param token The verification token
 * @returns Whether the verification was successful
 */
export async function verifyEmail(token: string): Promise<boolean> {
  try {
    console.log("Verifying email token in auth lib:", token)

    // Find the token and check if it's valid
    const tokens = await executeQuery(
      `SELECT user_id FROM email_verification_tokens 
       WHERE token = $1 AND expires_at > NOW()`,
      [token],
    )

    console.log("Token query result:", tokens)

    if (tokens.length === 0) {
      console.log("No valid token found or token expired")
      return false
    }

    const userId = tokens[0].user_id
    console.log("Found valid token for user:", userId)

    // Update the user's verification status with current timestamp
    await executeQuery(`UPDATE users SET email_verified = NOW() WHERE id = $1`, [userId])
    console.log("Updated user email_verified status")

    // Delete the token after use
    await executeQuery(`DELETE FROM email_verification_tokens WHERE token = $1`, [token])
    console.log("Deleted used token")

    return true
  } catch (error) {
    console.error("Email verification error:", error)
    return false
  }
}

/**
 * Checks if a user's email is verified
 * @param userId The ID of the user
 * @returns Whether the user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const users = await executeQuery(`SELECT email_verified FROM users WHERE id = $1`, [userId])

    if (users.length === 0) {
      return false
    }

    return users[0].email_verified !== null
  } catch (error) {
    console.error("Email verification check error:", error)
    return false
  }
}

// Add a function to check if a token has already been used

/**
 * Checks if a verification token has already been used
 * @param token The verification token
 * @returns Whether the token has already been used
 */
export async function isTokenAlreadyUsed(token: string): Promise<boolean> {
  try {
    // First check if the token exists in the database
    const tokens = await executeQuery(
      `SELECT user_id FROM email_verification_tokens 
       WHERE token = $1`,
      [token],
    )

    // If token doesn't exist, it might have been used already
    if (tokens.length === 0) {
      // Check if there's a record of this token being used
      // We can do this by checking if the user associated with this token has a verified email
      // This is a simplified approach - in a real system you might want to keep a record of used tokens

      // For now, we'll return true to indicate it might have been used
      return true
    }

    return false
  } catch (error) {
    console.error("Token check error:", error)
    return false
  }
}
