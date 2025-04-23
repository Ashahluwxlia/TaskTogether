import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// Schema for board creation
const createBoardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(100),
  description: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.teamId
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Board name is required" }, { status: 400 })
    }

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 })
    }

    // Create the board
    const board = await prisma.board.create({
      data: {
        name,
        description,
        teamId,
        createdBy: user.id,
      },
    })

    // Add the creator as a board member with OWNER role
    await prisma.boardMember.create({
      data: {
        boardId: board.id,
        userId: user.id,
        role: "OWNER",
      },
    })

    // Get all team members
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        userId: {
          not: user.id, // Exclude the creator who was already added
        },
      },
      select: {
        userId: true,
        role: true,
      },
    })

    // Add all team members to the board with appropriate roles
    if (teamMembers.length > 0) {
      const boardMembersData = teamMembers.map((member) => ({
        boardId: board.id,
        userId: member.userId,
        // Map team roles to board roles (you can adjust this mapping as needed)
        role: member.role === "OWNER" ? "ADMIN" : member.role === "ADMIN" ? "EDITOR" : "VIEWER",
      }))

      await prisma.boardMember.createMany({
        data: boardMembersData,
      })
    }

    // Create default lists for the board
    const defaultLists = ["To Do", "In Progress", "Done"]
    for (let i = 0; i < defaultLists.length; i++) {
      await prisma.list.create({
        data: {
          boardId: board.id,
          title: defaultLists[i],
          position: i,
        },
      })
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error("Error creating board:", error)
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: { params: { teamId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Access teamId from context.params instead of destructuring
    const resolvedParamsGet = await Promise.resolve(context.params)
    const teamId = resolvedParamsGet.teamId

    // Check if the team exists and if the user is a member
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "You're not a member of this team" }, { status: 403 })
    }

    // Get all boards for the team
    const boards = await prisma.board.findMany({
      where: { teamId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        lists: {
          select: {
            id: true,
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        },
        members: {
          where: {
            userId: user.id,
          },
          select: {
            role: true,
            isStarred: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Format the response to include role and isStarred
    const formattedBoards = boards.map((board) => {
      const memberInfo = board.members[0]
      return {
        ...board,
        role: memberInfo?.role || membership.role === "ADMIN" ? "ADMIN" : "VIEWER",
        is_starred: memberInfo?.isStarred || false,
      }
    })

    return NextResponse.json(formattedBoards)
  } catch (error) {
    console.error("Error fetching team boards:", error)
    return NextResponse.json({ error: "Failed to fetch team boards" }, { status: 500 })
  }
}
