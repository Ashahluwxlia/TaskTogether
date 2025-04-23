import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// Add a cache to track the last check time
const lastCheckTimeCache = new Map<string, number>()
const CHECK_INTERVAL = 60 * 1000 // Only check once per minute per user

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if we should run the notification check
    const now = Date.now()
    const lastCheckTime = lastCheckTimeCache.get(user.id) || 0
    const shouldRunCheck = now - lastCheckTime > CHECK_INTERVAL

    // Call the notification check endpoint if needed
    if (shouldRunCheck) {
      console.log("Triggering notification check via notifications/check endpoint...")
      try {
        // Determine the base URL (works in both development and production)
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
        const host = req.headers.get("host") || "localhost:3000"
        const baseUrl = `${protocol}://${host}`

        // Call the new check endpoint
        await fetch(`${baseUrl}/api/notifications/check`, {
          method: "GET",
          headers: {
            Cookie: req.headers.get("cookie") || "",
          },
        })

        // Update the last check time
        lastCheckTimeCache.set(user.id, now)
        console.log("Notification check completed")
      } catch (error) {
        console.error("Error calling notification check endpoint:", error)
        // Continue even if the notification check fails
      }
    } else {
      console.log(
        `Skipping notification check for user ${user.id} - last check was ${Math.round((now - lastCheckTime) / 1000)}s ago`,
      )
    }

    // Get query parameters
    const url = new URL(req.url)
    const unreadOnly = url.searchParams.get("unreadOnly") === "true"
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10)
    const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10)
    const includeInvitations = url.searchParams.get("includeInvitations") !== "false" // Default to true

    console.log("Fetching notifications with params:", {
      unreadOnly,
      limit,
      offset,
      userId: user.id,
      includeInvitations,
    })

    // Get notifications for the user
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
        ...(unreadOnly ? { read: false } : {}),
      },
      select: {
        id: true,
        type: true,
        content: true,
        read: true,
        createdAt: true,
        entityType: true,
        entityId: true,
        invitationId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    })

    console.log(`Found ${notifications.length} notifications`)

    // Get total count for pagination
    const totalCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isDeleted: false, // Only count non-deleted notifications
        ...(unreadOnly ? { read: false } : {}),
      },
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
        isDeleted: false, // Only count non-deleted notifications
      },
    })

    // Get pending invitations if requested
    let boardInvitations: {
      id: string
      boardId: string
      recipientId: string
      senderId: string
      role: string
      status: string
      message: string | null
      createdAt: Date
      board: {
        id: string
        title: string
        background: string | null
      }
      sender: {
        id: string
        name: string
        image: string | null
      }
    }[] = []

    let teamInvitations: {
      id: string
      teamId: string
      recipientId: string
      senderId: string
      role: string
      status: string
      message: string | null
      createdAt: Date
      team: {
        id: string
        name: string
      }
      sender: {
        id: string
        name: string
        image: string | null
      }
    }[] = []

    if (includeInvitations) {
      // Get board invitations
      boardInvitations = await prisma.boardInvitation.findMany({
        where: {
          recipientId: user.id,
          status: "PENDING",
        },
        include: {
          board: {
            select: {
              id: true,
              title: true,
              background: true,
            },
          },
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      // Get team invitations
      teamInvitations = await prisma.teamInvitation.findMany({
        where: {
          recipientId: user.id,
          status: "PENDING",
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      console.log(`Found ${boardInvitations.length} board invitations and ${teamInvitations.length} team invitations`)
    }

    console.log("Notification counts:", { totalCount, unreadCount })

    return NextResponse.json({
      notifications,
      totalCount,
      unreadCount: unreadOnly ? totalCount : unreadCount,
      boardInvitations: includeInvitations ? boardInvitations : [],
      teamInvitations: includeInvitations ? teamInvitations : [],
      invitationsCount: boardInvitations.length + teamInvitations.length,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Mark all notifications as read
    if (body.markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
          isDeleted: false, // Only update non-deleted notifications
        },
        data: {
          read: true,
        },
      })

      return NextResponse.json({ message: "All notifications marked as read" })
    }

    // Mark specific notifications as read
    if (body.notificationIds && Array.isArray(body.notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: {
            in: body.notificationIds,
          },
          userId: user.id,
          isDeleted: false, // Only update non-deleted notifications
        },
        data: {
          read: true,
        },
      })

      return NextResponse.json({ message: "Notifications marked as read" })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
