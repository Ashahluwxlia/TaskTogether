"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { Bell, CheckCircle, MessageSquare, Users, ClipboardList } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"

export function NotificationList() {
  const { notifications, totalCount, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications()
  const router = useRouter()

  // Add this after the useNotifications hook call
  console.log("Notifications data:", { notifications, totalCount, unreadCount, isLoading })

  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const handleToggleUnread = () => {
    setShowUnreadOnly(!showUnreadOnly)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead([notificationId])
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MENTION":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "COMMENT":
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case "BOARD_INVITATION":
      case "TEAM_INVITATION":
        return <Users className="h-5 w-5 text-purple-500" />
      case "TASK_ASSIGNED":
      case "TASK_UPDATED":
        return <ClipboardList className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Handle notification click with direct navigation
  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead([notification.id])
    }

    // Special handling for invitations
    if (
      notification.type === "BOARD_INVITATION" ||
      notification.type === "TEAM_INVITATION" ||
      notification.content.includes("invited")
    ) {
      // Use the correct format for invitation URLs - just use the invitationId without the type parameter
      const invitationId = notification.invitationId || notification.entityId
      router.push(`/invitations/${invitationId}`)
      return
    }

    switch (notification.entityType) {
      case "TASK":
        router.push(`/tasks/${notification.entityId}`)
        break
      case "BOARD":
        router.push(`/boards/${notification.entityId}`)
        break
      case "TEAM":
        router.push(`/teams/${notification.entityId}`)
        break
      case "COMMENT":
        router.push(`/tasks?comment=${notification.entityId}`)
        break
      default:
        router.push("/notifications")
    }
  }

  if (isLoading || !notifications) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Notifications</h2>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 border rounded-md">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const displayedNotifications = showUnreadOnly ? notifications.filter((n) => !n.isRead) : notifications

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Notifications {unreadCount > 0 && <span className="text-sm">({unreadCount} unread)</span>}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleToggleUnread}>
            {showUnreadOnly ? "Show All" : "Show Unread"}
          </Button>
          <Button onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            Mark All as Read
          </Button>
        </div>
      </div>

      {displayedNotifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <p className="mt-2 text-muted-foreground">
            {showUnreadOnly ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex gap-3 p-3 border rounded-md ${
                !notification.isRead ? "bg-accent/20 border-accent" : ""
              } cursor-pointer hover:bg-gray-50`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="mt-1">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1">
                <p className="text-sm">{notification.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notification.isRead && <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-gray-500 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation() // Prevent triggering the parent onClick
                  // Add delete functionality here if needed
                }}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="sr-only">Mark as read</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {totalCount > notifications.length && (
        <div className="text-center">
          <Button variant="link">Load More</Button>
        </div>
      )}
    </div>
  )
}
