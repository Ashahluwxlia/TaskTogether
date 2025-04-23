import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const boardId = url.searchParams.get("boardId")
    const teamId = url.searchParams.get("teamId")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10)
    const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10)

    // Build the query
    const query: any = {}

    if (boardId) {
      query.boardId = boardId
    }

    if (teamId) {
      // For team activities, we need to check if the user is a member of the team
      const teamMembership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: user.id,
          },
        },
      })

      if (!teamMembership) {
        return NextResponse.json({ error: "You don't have access to this team" }, { status: 403 })
      }

      // Get activities for the team
      query.OR = [{ entityType: "TEAM", entityId: teamId }, { boardId: { in: await getTeamBoardIds(teamId) } }]
    }

    // If no specific board or team is requested, get activities for all boards and teams the user has access to
    if (!boardId && !teamId) {
      const userTeams = await prisma.teamMember.findMany({
        where: { userId: user.id },
        select: { teamId: true },
      })

      const userBoards = await prisma.boardMember.findMany({
        where: { userId: user.id },
        select: { boardId: true },
      })

      query.OR = [
        { userId: user.id },
        { boardId: { in: userBoards.map((b) => b.boardId) } },
        { entityType: "TEAM", entityId: { in: userTeams.map((t) => t.teamId) } },
      ]
    }

    // Get activities
    const activities = await prisma.activity.findMany({
      where: query,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    })

    // Manually fetch user data for each activity
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        if (activity.userId) {
          const userData = await prisma.user.findUnique({
            where: { id: activity.userId },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
          return {
            ...activity,
            user: userData,
          }
        }
        return activity
      }),
    )

    return NextResponse.json(activitiesWithUsers)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

// Helper function to get all board IDs for a team
async function getTeamBoardIds(teamId: string): Promise<string[]> {
  const boards = await prisma.board.findMany({
    where: { teamId },
    select: { id: true },
  })

  return boards.map((board) => board.id)
}
