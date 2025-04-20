import type { NextRequest } from "next/server"
import { createHash, randomBytes } from "crypto"

// Generate a CSRF token
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex")
}

// Verify a CSRF token
export function verifyCsrfToken(request: NextRequest, token: string): boolean {
  const csrfCookie = request.cookies.get("csrf_token")?.value
  return csrfCookie === token
}

// Hash a password
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex")
  return `${hash}:${salt}`
}

// Verify a password
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [hash, salt] = hashedPassword.split(":")
  const calculatedHash = createHash("sha256")
    .update(password + salt)
    .digest("hex")
  return hash === calculatedHash
}

// Generate a session token
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex")
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
}
