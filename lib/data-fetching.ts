import { prisma } from "@/lib/prisma"
import { withErrorHandling } from "@/lib/error-handling"
import type { Board, Task, Team, User } from "@/types"
import { getCurrentUser } from "@/lib/auth-utils"

// Get a board with all related data
export async function getBoard(boardId: string, userId: string): Promise<Board | null> {
  // Debug the database schema for tasks
  try {
    console.log("Checking task schema...")
    const taskSchema = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'tasks'
  `
    console.log("Task schema:", taskSchema)
  } catch (error) {
    console.error("Error checking schema:", error)
  }
  const result = await withErrorHandling(async () => {
    // First check if user is a direct board member
    const boardMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    })

    // If not a direct board member, check if user is a member of the team that owns the board
    let isTeamMember = false
    let teamRole = null

    if (!boardMember) {
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { teamId: true },
      })

      if (board?.teamId) {
        const teamMembership = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: board.teamId,
              userId,
            },
          },
        })

        if (teamMembership) {
          isTeamMember = true
          teamRole = teamMembership.role
        }
      }

      // If not a direct board member and not a team member, return null
      if (!isTeamMember) {
        return null
      }
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!board) {
      return null
    }

    const lists = await prisma.list.findMany({
      where: { boardId: board.id },
      orderBy: { position: "asc" },
      include: {
        tasks: {
          orderBy: { position: "asc" },
          include: {
            assignee: true,
            labels: {
              include: {
                label: true,
              },
            },
            comments: {
              include: {
                author: true,
              },
            },
            attachments: true,
          },
        },
      },
    })

    const labels = await prisma.label.findMany({
      where: { boardId: board.id },
    })

    // Format the data to match the expected structure
    const boardData: Board = {
      id: board.id,
      title: board.title,
      description: board.description,
      is_starred: boardMember?.isStarred || false,
      role: boardMember?.role || teamRole || "VIEWER", // Use team role if no direct board role
      member_count: board.members.length,
      creatorId: board.creator?.id || userId, // Add creatorId with fallback
      lists: lists.map((list) => ({
        id: list.id,
        title: list.title,
        position: Number(list.position),
        board_id: list.boardId,
        tasks: list.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          due_date: task.dueDate ? task.dueDate.toISOString() : null,
          status: "ACTIVE", // Default status
          priority: task.priority,
          position: Number(task.position),
          list_id: task.listId,
          list_title: list.title, // Add list_title
          board_id: boardId, // Add board_id
          board_title: board.title, // Add board_title
          assigned_to: task.assignedTo,
          assignee_name: task.assignee?.name || null,
          assignee_image: task.assignee?.image || null,
          creatorId: board.creator?.id || userId, // Add creatorId with fallback
          completed: task.completed || false,
          completed_at: task.completedAt ? task.completedAt.toISOString() : null,
          comments: task.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            created_at: comment.createdAt.toISOString(),
            author_id: comment.authorId,
            author_name: comment.author.name,
            author_image: comment.author.image,
          })),
          attachments: task.attachments.map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            url: attachment.url,
            type: attachment.type || "", // Ensure non-null value
            size: attachment.size || 0, // Ensure non-null value
            created_at: attachment.createdAt.toISOString(),
            uploaded_by: attachment.createdBy,
            uploader_name: "Uploader", // This would need to be fetched separately
          })),
          labels: task.labels.map((tl) => tl.label),
        })),
      })),
      members: board.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
      })),
      labels: labels,
    }

    return boardData
  })

  return result || null
}

// Get a task with all related data
export async function getTask(taskId: string, userId: string): Promise<Task | null> {
  const result = await withErrorHandling(async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        list: {
          include: {
            board: {
              include: {
                creator: true,
                members: {
                  where: {
                    userId,
                  },
                },
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: true,
          },
        },
        attachments: true,
        labels: {
          include: {
            label: true,
          },
        },
      },
    })

    if (!task || task.list.board.members.length === 0) {
      return null
    }

    // Format the data to match the expected structure
    const taskData: Task = {
      id: task.id,
      title: task.title,
      description: task.description,
      due_date: task.dueDate ? task.dueDate.toISOString() : null,
      status: "ACTIVE", // Default status
      priority: task.priority,
      position: task.position,
      list_id: task.listId,
      list_title: task.list.title, // Add list_title
      board_id: task.list.boardId, // Add board_id
      board_title: task.list.board.name, // Add board_title
      assigned_to: task.assignedTo,
      assignee_name: task.assignee?.name || null,
      assignee_image: task.assignee?.image || null,
      creatorId: task.list.board.creator?.id || userId, // Add creatorId with fallback
      completed: task.completed || false,
      completed_at: task.completedAt ? task.completedAt.toISOString() : null,
      comments: task.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.createdAt.toISOString(),
        author_id: comment.authorId,
        author_name: comment.author.name,
        author_image: comment.author.image,
      })),
      attachments: task.attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        type: attachment.type || "", // Ensure non-null value
        size: attachment.size || 0, // Ensure non-null value
        created_at: attachment.createdAt.toISOString(),
        uploaded_by: attachment.createdBy,
        uploader_name: "Uploader", // This would need to be fetched separately
      })),
      labels: task.labels.map((tl) => tl.label),
    }

    return taskData
  })

  return result || null
}

// Get a team with all related data
export async function getTeam(teamId: string, userId: string): Promise<Team | null> {
  const result = await withErrorHandling(async () => {
    // Check if user has access to this team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    })

    if (!teamMember) {
      return null
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        boards: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    if (!team) {
      return null
    }

    const teamData: Team = {
      id: team.id,
      name: team.name,
      description: team.description,
      owner_id: team.ownerId,
      member_count: team._count.members,
      members: team.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
      })),
      boards: team.boards.map((board) => ({
        id: board.id,
        title: board.title,
        description: board.description,
      })),
    }

    return teamData
  })

  return result || null
}

// Get current user data - proper implementation using auth
export async function getCurrentUserData(): Promise<User | null> {
  // Use the authentication mechanism to get the current user
  const authUser = await getCurrentUser()

  if (!authUser) {
    return null
  }

  // Get additional user data if needed
  const result = await withErrorHandling(async () => {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        // Add any other fields you need
      },
    })

    if (!user) {
      return null
    }

    const userData: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      // Remove email_verified as it's no longer in the User interface
    }

    return userData
  })

  return result || null
}
