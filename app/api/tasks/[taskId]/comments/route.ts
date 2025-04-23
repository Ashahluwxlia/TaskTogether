import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import type { BoardRole } from "@/lib/permissions"
import { executeQuery } from "@/lib/db"
import { getUserNotificationPreferences } from "@/lib/user-preferences"

export async function GET(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await params before destructuring
    const { taskId } = await params // Await params.taskId

    // Verify user has access to this task
    const hasAccess = await executeQuery(
      `SELECT 1 FROM board_members bm
      JOIN boards b ON bm.board_id = b.id
      JOIN lists l ON b.id = l.board_id
      JOIN tasks t ON l.id = t.list_id
      WHERE bm.user_id = $1 AND t.id = $2`,
      [user.id, taskId],
    )

    if (hasAccess.length === 0) {
      return NextResponse.json({ error: "You do not have access to this task" }, { status: 403 })
    }

    // Get all comments for this task
    const comments = await executeQuery(
      `SELECT c.*, u.name as author_name, u.image as author_image
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.task_id = $1
      ORDER BY c.created_at DESC`,
      [taskId],
    )

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching task comments:", error)
    return NextResponse.json({ error: "Failed to fetch task comments" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await params before destructuring
    const { taskId } = await params
    const { content } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    // Get the task to check access and for notifications
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        list: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const boardId = task.list.board.id

    // Check if the user has access to the board
    const userMembership = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: boardId,
          userId: user.id,
        },
      },
    })

    if (!userMembership) {
      return NextResponse.json({ error: "You don't have access to this task" }, { status: 403 })
    }

    // Check if the user has sufficient permissions to comment
    // Users with OWNER, ADMIN, EDITOR, or MEMBER roles can comment
    // Users with VIEWER role cannot comment
    const role = userMembership.role as BoardRole
    if (role !== "OWNER" && role !== "ADMIN" && role !== "EDITOR" && role !== "MEMBER") {
      return NextResponse.json({ error: "You don't have permission to comment" }, { status: 403 })
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Extract mentions from the comment (e.g., @username)
    const mentionRegex = /@(\w+)/g
    const mentions = content.match(mentionRegex) || []

    // Get all board members to check mentions
    const boardMembers = await prisma.boardMember.findMany({
      where: {
        boardId: boardId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create notifications for mentioned users and task assignee
    for (const boardMember of boardMembers) {
      // Skip the comment author
      if (boardMember.userId === user.id) continue

      // Check if the user was mentioned
      const wasMentioned = mentions.some((mention: string) => {
        const username = mention.substring(1).toLowerCase()
        return boardMember.user.name.toLowerCase().includes(username)
      })

      // Get user preferences
      const userPreferences = await getUserNotificationPreferences(boardMember.userId)

      // Create notification if mentioned and user wants mention notifications
      if (wasMentioned && userPreferences.mentions) {
        await prisma.notification.create({
          data: {
            userId: boardMember.userId,
            type: "MENTION",
            content: `${user.name} mentioned you in a comment on task "${task.title}"`,
            entityType: "TASK",
            entityId: taskId,
          },
        })
      }
      // Create notification if this user is the task assignee and wants task comment notifications
      else if (task.assignedTo && boardMember.userId === task.assignedTo && userPreferences.taskComments) {
        await prisma.notification.create({
          data: {
            userId: boardMember.userId,
            type: "COMMENT",
            content: `${user.name} commented on your task "${task.title}"`,
            entityType: "TASK",
            entityId: taskId,
          },
        })
      }
    }

    // Record this activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: "COMMENTED",
        entityType: "TASK",
        entityId: taskId,
        boardId: boardId,
        details: {
          taskTitle: task.title,
          boardName: task.list.board.title,
        },
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error creating task comment:", error)
    return NextResponse.json({ error: "Failed to create task comment" }, { status: 500 })
  }
}
