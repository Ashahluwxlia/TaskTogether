"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  boardId: string
  createdAt: string
  details: any
  user: {
    id: string
    name: string
    email: string
  }
}

interface ActivityLogProps {
  boardId?: string
  teamId?: string
  limit?: number
}

export function ActivityLog({ boardId, teamId, limit = 10 }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivities() {
      try {
        setIsLoading(true)

        let url = "/api/activities?"

        if (boardId) {
          url += `boardId=${boardId}&`
        }

        if (teamId) {
          url += `teamId=${teamId}&`
        }

        url += `limit=${limit}`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch activities")
        }

        const data = await response.json()
        setActivities(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [boardId, teamId, limit])

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading activity...</div>
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>
  }

  if (activities.length === 0) {
    return <div className="text-sm text-muted-foreground">No recent activity</div>
  }

  const getActivityDescription = (activity: Activity) => {
    const { action, entityType, details } = activity

    switch (`${action}_${entityType}`) {
      case "CREATED_BOARD":
        return `created board "${details.boardName}"`
      case "UPDATED_BOARD":
        return `updated board "${details.boardName}"`
      case "DELETED_BOARD":
        return `deleted board "${details.boardName}"`
      case "CREATED_TASK":
        return `created task "${details.taskTitle}"`
      case "UPDATED_TASK":
        return `updated task "${details.taskTitle}"`
      case "DELETED_TASK":
        return `deleted task "${details.taskTitle}"`
      case "MOVED_TASK":
        return `moved task "${details.taskTitle}" to ${details.listName}`
      case "COMMENTED_TASK":
        return `commented on task "${details.taskTitle}"`
      case "CREATED_TEAM":
        return `created team "${details.teamName}"`
      case "UPDATED_TEAM":
        return `updated team "${details.teamName}"`
      case "DELETED_TEAM":
        return `deleted team "${details.teamName}"`
      case "JOINED_TEAM":
        return `joined team "${details.teamName}"`
      case "LEFT_TEAM":
        return `left team "${details.teamName}"`
      case "JOINED_BOARD":
        return `joined board "${details.boardName}"`
      case "LEFT_BOARD":
        return `left board "${details.boardName}"`
      default:
        return `performed action ${action} on ${entityType.toLowerCase()}`
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Recent Activity</h3>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://avatar.vercel.sh/${activity.user.email}`} alt={activity.user.name} />
              <AvatarFallback>
                {activity.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm">
                <span className="font-medium">{activity.user.name}</span> {getActivityDescription(activity)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
