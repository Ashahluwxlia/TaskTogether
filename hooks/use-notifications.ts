"use client"

import { useState, useEffect, useCallback } from "react"

interface Notification {
  id: string
  type: string
  content: string
  read: boolean
  isRead?: boolean
  createdAt: string
  entityType: string
  entityId: string
  actor_name?: string
  actor_image?: string
  task_id?: string
  invitationId?: string
}

interface NotificationsResponse {
  notifications: Notification[]
  totalCount: number
  unreadCount: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async (unreadOnly = false, offset = 0, limit = 20) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/notifications?unreadOnly=${unreadOnly}&offset=${offset}&limit=${limit}`)

      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data: NotificationsResponse = await response.json()
      console.log("API response:", data) // Debug log

      // Transform the data if needed
      const transformedNotifications = data.notifications.map((notification) => ({
        ...notification,
        // Ensure createdAt is properly formatted
        createdAt: notification.createdAt || new Date().toISOString(),
        // Ensure isRead is available (for backward compatibility)
        isRead: notification.read,
      }))

      // If offset is 0, replace notifications, otherwise append
      if (offset === 0) {
        setNotifications(transformedNotifications)
      } else {
        setNotifications((prev) => [...prev, ...transformedNotifications])
      }

      setTotalCount(data.totalCount)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setNotifications([])
      setTotalCount(0)
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read")
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notificationIds.includes(notification.id) ? { ...notification, read: true, isRead: true } : notification,
        ),
      )

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      throw error
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read")
      }

      // Update local state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  }, [])

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(`/api/notifications/${notificationId}/delete`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete notification")
        }

        // Update local state
        setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))

        // Update counts
        setTotalCount((prev) => Math.max(0, prev - 1))

        // If the notification was unread, update unread count
        const deletedNotification = notifications.find((n) => n.id === notificationId)
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } catch (error) {
        console.error("Error deleting notification:", error)
        throw error
      }
    },
    [notifications],
  )

  const deleteAllNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/delete-all", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete all notifications")
      }

      // Update local state
      setNotifications([])
      setTotalCount(0)
      setUnreadCount(0)
    } catch (error) {
      console.error("Error deleting all notifications:", error)
      throw error
    }
  }, [])

  return {
    notifications,
    totalCount,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
  }
}
