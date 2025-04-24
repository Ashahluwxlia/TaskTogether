import { redirect } from "next/navigation"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { NotificationsContent } from "@/components/notifications-content"
import type { User, Notification } from "@/types"

export default async function NotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's notifications (updated query to not rely on actor_id)
  const notifications = await executeQuery(
    `SELECT n.id, n.type, n.content, n.read as is_read, n.created_at, 
           n.entity_type, n.entity_id, n.user_id,
           t.title as task_title, t.id as task_id
    FROM notifications n
    LEFT JOIN tasks t ON n.entity_id = t.id AND n.entity_type = 'TASK'
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT 20`,
    [user.id],
  )

  // Transform the raw database results to match the Notification interface
  const typedNotifications: Notification[] = notifications.map((notification: any) => ({
    id: notification.id,
    type: notification.type || "",
    content: notification.content,
    isRead: notification.is_read,
    read: notification.is_read,
    createdAt: notification.created_at,
    userId: notification.user_id,
    // Use empty strings instead of null for required string fields
    actor_name: "", // Use empty string instead of null
    actor_image: "", // Use empty string instead of null
    task_title: notification.task_title || "",
    task_id: notification.task_id || "",
  }))

  // Ensure user object matches the User interface
  const typedUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  }

  return <NotificationsContent user={typedUser} notifications={typedNotifications} />
}
