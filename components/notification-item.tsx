"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Bell, MessageSquare, Users, UserPlus, Calendar, Tag, Trash2, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface NotificationItemProps {
  id: string
  type: string
  content: string
  createdAt: string
  isRead: boolean
  actor_name?: string
  actor_image?: string
  task_id?: string
  invitationId?: string
  entityType?: string
  entityId?: string
  onDelete?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  onClick?: () => void
}

export function NotificationItem({
  id,
  type,
  content,
  createdAt,
  isRead,
  actor_name,
  actor_image,
  task_id,
  invitationId,
  entityType,
  entityId,
  onDelete,
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (isDeleting || !onDelete) return

    try {
      setIsDeleting(true)
      await onDelete(id)
    } catch (error) {
      console.error("Error deleting notification:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getNotificationIcon = () => {
    switch (type?.toLowerCase()) {
      case "message":
      case "comment":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "team":
      case "team_invitation":
        return <Users className="h-5 w-5 text-green-500" />
      case "mention":
        return <Tag className="h-5 w-5 text-purple-500" />
      case "due_date":
      case "reminder":
        return <Calendar className="h-5 w-5 text-orange-500" />
      case "invitation":
      case "board_invitation":
        return <UserPlus className="h-5 w-5 text-indigo-500" />
      case "alert":
      case "warning":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    // Mark as read if needed
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(id)
    }

    // Handle navigation based on notification type
    if (type === "BOARD_INVITATION" || type === "TEAM_INVITATION" || type.includes("invited")) {
      router.push(`/invitations/${invitationId || entityId}`)
      return
    }

    switch (entityType) {
      case "TASK":
        router.push(`/tasks/${entityId}`)
        break
      case "BOARD":
        router.push(`/boards/${entityId}`)
        break
      case "TEAM":
        router.push(`/teams/${entityId}`)
        break
      case "COMMENT":
        router.push(`/tasks?comment=${entityId}`)
        break
      default:
      // Do nothing or navigate to notifications
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 border rounded-lg transition-colors",
        isRead ? "bg-white" : "bg-yellow-50 border-yellow-200",
        "cursor-pointer hover:bg-gray-50",
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0">
        {actor_image ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={actor_image || "/placeholder.svg"} alt={actor_name || "User"} />
            <AvatarFallback>{actor_name ? actor_name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            {getNotificationIcon()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !isRead && "font-medium")}>{content}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>

      {!isRead && <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-gray-500 hover:text-red-500"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete notification</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete notification</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
