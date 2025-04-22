import type { User } from "@/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

// Define a local Task interface that's specific to this component
interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: string
  list_title: string
  board_title: string
  assignee_name: string | null
  assignee_image: string | null
  // These properties are used in the detail view but not in the list view
  comments?: any[]
  attachments?: any[]
  labels?: any[]
}

interface TasksContentProps {
  user: User
  tasks: Task[]
}

export function TasksContent({ user, tasks }: TasksContentProps) {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <Button asChild>
          <Link href="/tasks/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Task
          </Link>
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have any tasks yet.</p>
          <Button asChild className="mt-4">
            <Link href="/tasks/new">Create your first task</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-foreground font-medium">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                  )}
                </div>
                {task.assignee_name && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                      {task.assignee_image ? (
                        <img
                          src={task.assignee_image || "/placeholder.svg"}
                          alt={task.assignee_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground">
                          {task.assignee_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-muted rounded">{task.board_title}</span>
                <span className="text-xs px-2 py-1 bg-muted rounded">{task.list_title}</span>
                {task.due_date && (
                  <span className="text-xs px-2 py-1 bg-muted rounded">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    task.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
