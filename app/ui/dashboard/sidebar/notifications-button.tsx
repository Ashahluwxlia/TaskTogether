"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: string
  content: string
  is_read: boolean
  createdAt: string
  entityType: string
  entityId: string
  invitationId?: string // Optional: Add invitationId to the Notification interface
}

export function NotificationsButton() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [invitationsCount, setInvitationsCount] = useState(0) // New state for invitations count
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/notifications?limit=10")

      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data = await response.json()
      console.log("Notifications button data:", data)
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
      setInvitationsCount(data.invitationsCount || 0) // Set invitations count
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch notifications when the component mounts
  useEffect(() => {
    fetchNotifications()

    // Set up polling for notifications - more frequent now that we don't have the scheduler
    const interval = setInterval(() => {
      fetchNotifications()
    }, 15000) // Check every 15 seconds

    return () => clearInterval(interval)
  }, [])

  // Also fetch when popover opens
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read")
      }

      setNotifications(notifications.map((notification) => ({ ...notification, is_read: true })))
      setUnreadCount(0)

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }

  // Update the handleNotificationClick function to use the correct URL format for invitations
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark this notification as read
      if (!notification.is_read) {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationIds: [notification.id] }),
        })

        setNotifications(notifications.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))

        if (unreadCount > 0) {
          setUnreadCount(unreadCount - 1)
        }
      }

      // Navigate based on notification type
      setOpen(false)

      // Special handling for invitations
      if (notification.type === "BOARD_INVITATION" || notification.type.includes("invited")) {
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
    } catch (error) {
      console.error("Error handling notification click:", error)
    }
  }

  const totalUnread = unreadCount + invitationsCount

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-zinc-400" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <p>No notifications yet</p>
            <p className="text-xs mt-1">Try creating tasks or inviting team members</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors w-full text-left ${
                    !notification.is_read ? "bg-gray-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleNotificationClick(notification)
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}>{notification.content}</p>
                    {!notification.is_read && <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
        <div className="p-2 border-t text-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setOpen(false)
              router.push("/notifications")
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
