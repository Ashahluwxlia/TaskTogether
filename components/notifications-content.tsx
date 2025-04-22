"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, Trash } from "lucide-react"
import { NotificationItem } from "@/components/notification-item"
import { useNotifications } from "@/hooks/use-notifications"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import type { User, Notification } from "@/types"

interface NotificationsContentProps {
  user: User
  notifications?: Notification[]
}

export function NotificationsContent({ user }: NotificationsContentProps) {
  const {
    notifications,
    totalCount,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
  } = useNotifications()

  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingRead(true)
      await markAllAsRead()
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
    } finally {
      setIsMarkingRead(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      setIsDeletingAll(true)
      await deleteAllNotifications()
      setShowDeleteDialog(false)
      toast({
        title: "Success",
        description: "All notifications deleted",
      })
    } catch (error) {
      console.error("Error deleting all notifications:", error)
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAll(false)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id)
      toast({
        title: "Success",
        description: "Notification deleted",
      })
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.task_id) {
      return `/tasks/${notification.task_id}`
    }
    return "#"
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark this notification as read
      if (!notification.isRead) {
        await markAsRead([notification.id])
      }
      // Navigate based on notification type (matching bell dropdown logic)
      if (notification.type === "BOARD_INVITATION" || (notification.type && notification.type.includes("invited"))) {
        const invitationId = notification.invitationId || notification.entityId
        window.location.href = `/invitations/${invitationId}`
        return
      }
      switch (notification.entityType) {
        case "TASK":
          window.location.href = `/tasks/${notification.entityId}`
          break
        case "BOARD":
          window.location.href = `/boards/${notification.entityId}`
          break
        case "TEAM":
          window.location.href = `/teams/${notification.entityId}`
          break
        case "COMMENT":
          window.location.href = `/tasks?comment=${notification.entityId}`
          break
        default:
          window.location.href = "/notifications"
      }
    } catch (error) {
      console.error("Error handling notification click:", error)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingRead}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Trash className="h-4 w-4" />
                  Delete all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All notifications will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    disabled={isDeletingAll}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeletingAll ? "Deleting..." : "Delete all"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-muted-foreground">You don't have any notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="block cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <NotificationItem
                id={notification.id}
                type={notification.type}
                content={notification.content}
                createdAt={notification.createdAt}
                isRead={notification.isRead || false}
                actor_name={notification.actor_name}
                actor_image={notification.actor_image}
                task_id={notification.task_id}
                invitationId={notification.invitationId}
                entityType={notification.entityType}
                entityId={notification.entityId}
                onDelete={handleDeleteNotification}
              />
            </div>
          ))}
        </div>
      )}

      {totalCount > notifications.length && !isLoading && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => fetchNotifications(false, notifications.length)} className="mx-auto">
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
