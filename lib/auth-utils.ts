import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { withErrorHandling } from "@/lib/error-handling"
import { jwtVerify } from "jose"

// Secret key for JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

// Get the current authenticated user
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    // Verify the JWT token
    const verified = await jwtVerify(token, JWT_SECRET)
    const userId = verified.payload.userId as string

    if (!userId) {
      return null
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
      },
    })

    return user
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

// Protect a route by requiring authentication
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

// Check if a user has access to a board
export async function checkBoardAccess(userId: string, boardId: string) {
  return await withErrorHandling(async () => {
    const boardMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    })

    return !!boardMember
  }, false)
}

// Check if a user has access to a team
export async function checkTeamAccess(userId: string, teamId: string) {
  return await withErrorHandling(async () => {
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    })

    return !!teamMember
  }, false)
}
