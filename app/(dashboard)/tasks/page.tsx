import { redirect } from "next/navigation"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { TasksContent } from "@/components/tasks-content"

// Define a local Task interface that matches exactly what TasksContent expects
interface User {
  id: string
  name: string
  email: string
  image: string | null
}

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: string // Required, not optional
  priority: string | null
  position: number
  list_id: string
  list_title: string
  board_title: string
  assignee_name: string | null
  assignee_image: string | null
  comments: any[] // Required, not optional
  attachments: any[] // Required, not optional
  labels: any[] // Required, not optional
}

export default async function TasksPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's tasks
  const tasksData = await executeQuery(
    `SELECT t.*, l.title as list_title, b.title as board_title, u.name as assignee_name, u.image as assignee_image
    FROM tasks t
    JOIN lists l ON t.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    JOIN board_members bm ON b.id = bm.board_id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE bm.user_id = $1
    ORDER BY t.due_date ASC NULLS LAST`,
    [user.id],
  )

  // Transform the tasks data to match the expected Task interface
  const tasks: Task[] = tasksData.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    due_date: task.due_date,
    status: task.status || "TODO", // Provide a default value to ensure it's never undefined
    priority: task.priority,
    position: task.position || 0,
    list_id: task.list_id,
    list_title: task.list_title,
    board_title: task.board_title,
    assignee_name: task.assignee_name,
    assignee_image: task.assignee_image,
    // Add empty arrays for the required properties
    comments: [],
    attachments: [],
    labels: [],
  }))

  // Transform the user data to match the expected User interface
  const typedUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  }

  return (
    <>
      <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      </div>
      <TasksContent user={typedUser} tasks={tasks} />
    </>
  )
}
