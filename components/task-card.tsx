"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, GripVertical } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  priority: string | null
  list_id: string
  position: number
  assigned_to: string | null
  assignee_name: string | null
  assignee_image: string | null
  labels: { id: string; name: string; color: string }[] | null
  completed?: boolean
  completed_at?: string | null
  _isDeleted?: boolean // Add this property
}

interface TaskCardProps {
  task: Task
  listId: string
  onClick?: () => void
  onCompletionToggle?: (taskId: string, completed: boolean) => void
}

export function TaskCard({ task, listId, onClick, onCompletionToggle }: TaskCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Ensure labels is always an array
  const safeLabels = Array.isArray(task.labels) ? task.labels : []

  const handleCompletionToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening task detail
    e.preventDefault() // Prevent drag start

    if (!onCompletionToggle) return

    try {
      // Call the parent handler to update the UI optimistically
      onCompletionToggle(task.id, !task.completed)

      // Update the task completion status in the database
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !task.completed }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task completion status")
      }

      toast({
        title: task.completed ? "Task marked as incomplete" : "Task marked as complete",
        description: `"${task.title}" has been ${task.completed ? "unmarked" : "marked"} as complete.`,
      })
    } catch (error) {
      console.error("Error toggling task completion:", error)
      // Revert the optimistic update
      onCompletionToggle(task.id, !!task.completed)

      toast({
        title: "Error",
        description: "Failed to update task completion status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
      listId,
    },
  })

  // Update the style object to make the card more visible during dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 100 : "auto",
    boxShadow: isDragging ? "0 5px 10px rgba(0, 0, 0, 0.15)" : "none",
  }

  // Handle click to open task detail
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick()
    }
  }

  console.log(
    `TaskCard - taskId: ${task.id}, title: ${task.title}, position: ${task.position}, completed: ${task.completed}`,
  )

  // Update the Card component to apply the style properly
  return (
    <Card
      key={task.id}
      ref={setNodeRef}
      style={style}
      className={`cursor-grab hover:shadow-md transition-shadow ${task.completed ? "bg-gray-50 opacity-75" : ""}`}
    >
      <CardContent className="p-3 space-y-1">
        <div className="flex items-start gap-2">
          {/* Checkbox for completion toggle - not draggable */}
          <div className="mt-0.5 flex-shrink-0" onClick={handleCompletionToggle}>
            <Checkbox
              checked={task.completed}
              className="data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
            />
          </div>

          {/* Title area - clickable but not draggable */}
          <div className="flex-1" onClick={handleClick}>
            <h3
              className={`font-medium truncate text-foreground ${task.completed ? "line-through text-gray-500" : ""}`}
            >
              {task.title}
            </h3>
          </div>

          {/* Drag handle */}
          <div className="cursor-grab" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Display labels if they exist */}
        {safeLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 my-1 ml-6">
            {safeLabels.map((label) => (
              <div key={label.id} className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between ml-6">
          <div className="flex items-center gap-1">
            {task.due_date && (
              <Badge variant="outline" className="text-[10px] px-1 py-0.5">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {formatDate(task.due_date)}
              </Badge>
            )}
            {task.priority && (
              <Badge variant="outline" className={`text-[10px] px-1 py-0.5 ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </Badge>
            )}
          </div>
          {task.assignee_name && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee_image || undefined} alt={task.assignee_name} />
              <AvatarFallback className="bg-gray-300 text-xs">{task.assignee_name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
