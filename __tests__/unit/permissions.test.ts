import { isTeamMember, hasBoardAccess } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// Mock the prisma client
jest.mock("@/lib/prisma", () => ({
  prisma: {
    team: {
      findUnique: jest.fn(),
    },
    teamMember: {
      findUnique: jest.fn(),
    },
    board: {
      findUnique: jest.fn(),
    },
    boardMember: {
      findUnique: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock the getCurrentUser function
jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}))

describe("Permission utility functions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("isTeamMember", () => {
    test("should return false if user is not authenticated", async () => {
      // Mock getCurrentUser to return null
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const result = await isTeamMember("team-1")

      expect(result).toBe(false)
    })

    test("should return true if user is the team owner", async () => {
      // Mock getCurrentUser to return a user
      ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-1" })

      // Mock prisma.team.findUnique to return a team
      prisma.team.findUnique = jest.fn().mockResolvedValue({ id: "team-1", ownerId: "user-1" })

      const result = await isTeamMember("team-1")

      expect(result).toBe(true)
      expect(prisma.team.findUnique).toHaveBeenCalledWith({
        where: {
          id: "team-1",
          ownerId: "user-1",
        },
      })
    })

    test("should return true if user is a team member", async () => {
      // Mock getCurrentUser to return a user
      ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-1" })

      // Mock prisma.team.findUnique to return null (not the owner)
      prisma.team.findUnique = jest.fn().mockResolvedValue(null)

      // Mock prisma.teamMember.findUnique to return a membership
      prisma.teamMember.findUnique = jest.fn().mockResolvedValue({
        teamId: "team-1",
        userId: "user-1",
        role: "MEMBER",
      })

      const result = await isTeamMember("team-1")

      expect(result).toBe(true)
      expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: {
          teamId_userId: {
            teamId: "team-1",
            userId: "user-1",
          },
        },
      })
    })

    test("should return false if user is not a team member", async () => {
      // Mock getCurrentUser to return a user
      ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-1" })

      // Mock prisma.team.findUnique to return null (not the owner)
      prisma.team.findUnique = jest.fn().mockResolvedValue(null)

      // Mock prisma.teamMember.findUnique to return null (not a member)
      prisma.teamMember.findUnique = jest.fn().mockResolvedValue(null)

      const result = await isTeamMember("team-1")

      expect(result).toBe(false)
    })
  })

  describe("hasBoardAccess", () => {
    test("should return true if user is the board creator", async () => {
      // Mock getCurrentUser to return a user
      ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-1" })

      // Mock prisma.board.findUnique to return a board
      prisma.board.findUnique = jest.fn().mockResolvedValue({
        id: "board-1",
        createdBy: "user-1",
        members: [],
      })

      const result = await hasBoardAccess("board-1")

      expect(result).toBe(true)
    })

    test("should return true if user is a board member", async () => {
      // Mock getCurrentUser to return a user
      ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-1" })

      // Mock prisma.board.findUnique to return a board
      prisma.board.findUnique = jest.fn().mockResolvedValue({
        id: "board-1",
        createdBy: "user-2",
        members: [{ userId: "user-1", role: "VIEWER" }],
      })

      const result = await hasBoardAccess("board-1")

      expect(result).toBe(true)
    })

    test("should check team membership if board belongs to a team", async () => {
      // Mock getCurrentUser to return a user
      ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-1" })

      // Mock prisma.board.findUnique to return a board with a team
      prisma.board.findUnique = jest.fn().mockResolvedValue({
        id: "board-1",
        createdBy: "user-2",
        teamId: "team-1",
        members: [],
      })

      // Mock prisma.teamMember.findUnique to return a membership
      prisma.teamMember.findUnique = jest.fn().mockResolvedValue({
        teamId: "team-1",
        userId: "user-1",
        role: "MEMBER",
      })

      const result = await hasBoardAccess("board-1")

      expect(result).toBe(true)
      expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: {
          teamId_userId: {
            teamId: "team-1",
            userId: "user-1",
          },
        },
      })
    })
  })
})
