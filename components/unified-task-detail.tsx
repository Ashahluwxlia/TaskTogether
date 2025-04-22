"use client"

import { DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  File,
  MoreHorizontal,
  Paperclip,
  Send,
  Tag,
  User,
  CalendarIcon,
  X,
  Trash,
  Plus,
} from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/hooks/use-toast"

interface UserType {
  id: string
  name: string
  email: string
  image: string | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  author_name: string
  author_image: string | null
}

interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  created_at: string
  uploaded_by: string
  uploader_name: string
}

interface Label {
  id: string
  name: string
  color: string
}

interface List {
  id: string
  title: string
}

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  priority: string | null
  list_id: string
  list_title: string
  board_id: string
  board_title: string
  assigned_to: string | null
  assignee_name: string | null
  assignee_image: string | null
  comments: Comment[]
  attachments: Attachment[]
  labels: Label[]
  creatorId?: string
  position: number
  completed?: boolean
  completed_at?: string | null
  _isDeleted?: boolean // Add this line to fix the TypeScript error
}

// Add onTaskUpdate to the props interface
interface UnifiedTaskDetailProps {
  user: UserType
  task: Task
  boardMembers: UserType[]
  lists?: List[]
  labels?: Label[]
  currentUser?: UserType
  onClose?: () => void
  isDialog?: boolean
  onTaskUpdate?: (task: Task) => void
}

// Add the LABEL_COLORS constant from create-task-form.tsx
// Add this after the interface declarations and before the UnifiedTaskDetail function
const LABEL_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
]

// Update the function parameters to include onTaskUpdate
export function UnifiedTaskDetail({
  user,
  task,
  boardMembers,
  lists = [],
  labels = [],
  onClose,
  isDialog = false,
  onTaskUpdate,
}: UnifiedTaskDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments || [])
  const [priority, setPriority] = useState(task.priority || "none")
  const [dueDate, setDueDate] = useState<Date | undefined>(task.due_date ? new Date(task.due_date) : undefined)
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || "")
  const [selectedList, setSelectedList] = useState(task.list_id)
  const [showLabelsDialog, setShowLabelsDialog] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<Label[]>(() => {
    // Ensure task.labels is always an array
    return Array.isArray(task.labels) ? task.labels : []
  })
  const [newLabelName, setNewLabelName] = useState("")
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [assigneeName, setAssigneeName] = useState(task.assignee_name || "Unassigned")
  const [assigneeImage, setAssigneeImage] = useState(task.assignee_image || null)
  const [availableLabels, setAvailableLabels] = useState<Label[]>(labels)
  const [isCompleted, setIsCompleted] = useState(task.completed || false)

  // Fetch the latest task data when the component mounts
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        const response = await fetch(`/api/tasks/${task.id}`)
        if (response.ok) {
          const taskData = await response.json()

          // Update local state with the latest data
          setTitle(taskData.title)
          setDescription(taskData.description || "")
          setPriority(taskData.priority || "none")
          setDueDate(taskData.due_date ? new Date(taskData.due_date) : undefined)
          setAssignedTo(taskData.assigned_to || "")
          setAssigneeName(taskData.assignee_name || "Unassigned")
          setAssigneeImage(taskData.assignee_image || null)
          setSelectedList(taskData.list_id)
          setSelectedLabels(Array.isArray(taskData.labels) ? taskData.labels : [])

          // Fetch attachments if they don't exist on the task data
          if (!taskData.attachments) {
            const attachmentsResponse = await fetch(`/api/tasks/${task.id}/attachments`)
            if (attachmentsResponse.ok) {
              const attachmentsData = await attachmentsResponse.json()
              setAttachments(attachmentsData || [])
            } else {
              setAttachments([])
            }
          } else {
            setAttachments(taskData.attachments || [])
          }

          setIsCompleted(taskData.completed || false)
        }
      } catch (error) {
        console.error("Error fetching task data:", error)
      }
    }

    fetchTaskData()
  }, [task.id])

  const handleSaveChanges = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || null,
          due_date: dueDate ? dueDate.toISOString() : null,
          priority: priority === "none" ? null : priority,
          assigned_to: assignedTo === "unassigned" || assignedTo === "" ? null : assignedTo,
          list_id: selectedList,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to update task: ${errorData.error || response.statusText}`)
      }

      const updatedTask = await response.json()

      // Update local state
      setIsEditing(false)

      // Update assignee name and image based on the selected user
      if (assignedTo === "unassigned") {
        setAssigneeName("Unassigned")
        setAssigneeImage(null)
      } else {
        const selectedMember = boardMembers.find((member) => member.id === assignedTo)
        if (selectedMember) {
          setAssigneeName(selectedMember.name)
          setAssigneeImage(selectedMember.image)
        }
      }

      // Call onTaskUpdate with the updated task
      if (onTaskUpdate) {
        onTaskUpdate({
          ...task,
          title,
          description: description || null,
          due_date: dueDate ? dueDate.toISOString() : null,
          priority: priority === "none" ? null : priority,
          assigned_to: assignedTo === "unassigned" ? null : assignedTo,
          assignee_name: assignedTo === "unassigned" ? null : assigneeName,
          assignee_image: assignedTo === "unassigned" ? null : assigneeImage,
          list_id: selectedList,
          position: task.position,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comment.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task.id,
          content: comment,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add comment")
      }

      // Get the newly created comment from the response
      const newComment = await response.json()

      // Add the new comment to the local state
      const updatedTask = {
        ...task,
        comments: [newComment, ...(task.comments || [])],
      }

      // Update the task in the parent component if the callback exists
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask)
      }

      setComment("")
      router.refresh()
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update the handleDeleteTask function to properly update the parent component's state
  // Find the existing handleDeleteTask function and replace it with this implementation:

  const handleDeleteTask = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete task")
      }

      // Close the dialog if it's open
      if (onClose) {
        onClose()
      }

      // Call onTaskUpdate with null to signal that the task was deleted
      if (onTaskUpdate) {
        // Pass a special signal to indicate deletion
        onTaskUpdate({
          ...task,
          _isDeleted: true,
        })
      } else {
        router.push("/tasks")
      }

      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error deleting task",
        description: "There was an error deleting the task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleAssignUser = async (userId: string) => {
    try {
      setIsSubmitting(true)

      // Find the user's name and image before making the API call
      let newAssigneeName = "Unassigned"
      let newAssigneeImage = null

      if (userId !== "unassigned") {
        const selectedMember = boardMembers.find((member) => member.id === userId)
        if (selectedMember) {
          newAssigneeName = selectedMember.name
          newAssigneeImage = selectedMember.image
        }
      }

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigned_to: userId === "unassigned" ? null : userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(`Failed to assign user: ${errorData.error || response.statusText}`)
      }

      // Update local state immediately
      setAssignedTo(userId)
      setAssigneeName(newAssigneeName)
      setAssigneeImage(newAssigneeImage)

      // Call onTaskUpdate with the updated task
      if (onTaskUpdate) {
        onTaskUpdate({
          ...task,
          assigned_to: userId === "unassigned" ? null : userId,
          assignee_name: userId === "unassigned" ? null : newAssigneeName,
          assignee_image: userId === "unassigned" ? null : newAssigneeImage,
          position: task.position,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error assigning user:", error)
      toast({
        title: "Error",
        description: "Failed to assign user. You may not have permission to edit this task.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetPriority = async (newPriority: string) => {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priority: newPriority === "none" ? null : newPriority,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(`Failed to set priority: ${errorData.error || response.statusText}`)
      }

      // Update local state immediately
      setPriority(newPriority)

      // Call onTaskUpdate with the updated task
      if (onTaskUpdate) {
        onTaskUpdate({
          ...task,
          priority: newPriority === "none" ? null : newPriority,
          position: task.position,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error setting priority:", error)
      toast({
        title: "Error",
        description: "Failed to set priority. You may not have permission to edit this task.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetDueDate = async (date: Date | undefined) => {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          due_date: date ? date.toISOString() : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(`Failed to set due date: ${errorData.error || response.statusText}`)
      }

      // Update local state immediately
      setDueDate(date)

      // Call onTaskUpdate with the updated task
      if (onTaskUpdate) {
        onTaskUpdate({
          ...task,
          due_date: date ? date.toISOString() : null,
          position: task.position,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error setting due date:", error)
      toast({
        title: "Error",
        description: "Failed to set due date. You may not have permission to edit this task.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadComplete = (attachment: Attachment) => {
    setAttachments([attachment, ...attachments])
    setShowUploadDialog(false)
    router.refresh()
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete attachment")
      }

      setAttachments(attachments.filter((a) => a.id !== attachmentId))
      router.refresh()
    } catch (error) {
      console.error("Error deleting attachment:", error)
    }
  }

  const handleMoveList = async (listId: string) => {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          list_id: listId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to move task")
      }

      // Update local state immediately
      setSelectedList(listId)

      // Call onTaskUpdate with the updated task
      if (onTaskUpdate) {
        onTaskUpdate({
          ...task,
          list_id: listId,
          position: task.position,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error moving task:", error)
      toast({
        title: "Error",
        description: "Failed to move task. You may not have permission to edit this task.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update the toggleLabel function to properly update the task in the parent component
  const toggleLabel = async (label: Label) => {
    if (!label || !label.id) return

    const isSelected = selectedLabels.some((l) => l.id === label.id)

    try {
      setIsSubmitting(true)

      if (isSelected) {
        // Remove label
        const response = await fetch(`/api/tasks/${task.id}/labels/${label.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Failed to remove label: ${errorData.error || response.statusText}`)
        }

        // Update local state immediately
        setSelectedLabels((prevLabels) => prevLabels.filter((l) => l.id !== label.id))
      } else {
        // Add label - Fix the payload format to use labelIds array instead of single labelId
        const response = await fetch(`/api/tasks/${task.id}/labels`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            labelIds: [label.id],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Failed to add label: ${errorData.error || response.statusText}`)
        }

        // Update local state immediately
        setSelectedLabels((prevLabels) => [...prevLabels, label])
      }

      // Call onTaskUpdate with the updated task
      if (onTaskUpdate) {
        const updatedLabels = isSelected ? selectedLabels.filter((l) => l.id !== label.id) : [...selectedLabels, label]

        onTaskUpdate({
          ...task,
          labels: updatedLabels,
          position: task.position,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating labels:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update labels",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
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

  // Fetch labels directly from the API to ensure we have the latest data
  const fetchTaskLabels = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/labels`)
      if (response.ok) {
        const data = await response.json()
        setSelectedLabels(data)
      }
    } catch (error) {
      console.error("Error fetching task labels:", error)
    }
  }

  const handleCompletionToggle = async () => {
    try {
      setIsSubmitting(true)

      const newCompletionStatus = !isCompleted

      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: newCompletionStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task completion status")
      }

      // Update local state
      setIsCompleted(newCompletionStatus)

      // Call onTaskUpdate with the updated task if it exists
      if (onTaskUpdate) {
        onTaskUpdate({
          ...task,
          completed: newCompletionStatus,
          completed_at: newCompletionStatus ? new Date().toISOString() : null,
        })
      }

      toast({
        title: newCompletionStatus ? "Task marked as complete" : "Task marked as incomplete",
        description: `"${task.title}" has been ${newCompletionStatus ? "marked" : "unmarked"} as complete.`,
      })

      router.refresh()
    } catch (error) {
      console.error("Error toggling task completion:", error)
      toast({
        title: "Error",
        description: "Failed to update task completion status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fix the createNewLabel function to prevent duplicate labels
  const createNewLabel = async () => {
    if (!newLabelName.trim() || !task.board_id) return

    setIsCreatingLabel(true)
    try {
      // Pick a random color from the predefined colors
      const color = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]

      const response = await fetch("/api/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color,
          boardId: task.board_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create label")
      }

      const newLabel = await response.json()

      // Add the new label to the available labels list
      setAvailableLabels((current) => [...current, newLabel])

      // Clear the input
      setNewLabelName("")

      // Now add the label to the task in a separate step
      // This prevents the duplicate label issue by not manually adding to selectedLabels
      await fetch(`/api/tasks/${task.id}/labels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          labelIds: [newLabel.id],
        }),
      })

      // After API call completes, update the selected labels from the server
      const labelsResponse = await fetch(`/api/tasks/${task.id}/labels`)
      if (labelsResponse.ok) {
        const updatedLabels = await labelsResponse.json()
        setSelectedLabels(updatedLabels)

        // Update the task in the parent component if the callback exists
        if (onTaskUpdate) {
          onTaskUpdate({
            ...task,
            labels: updatedLabels,
          })
        }
      }

      toast({
        title: "Label created",
        description: `Label "${newLabel.name}" has been created and added to the task.`,
      })
    } catch (error) {
      console.error("Error creating label:", error)
      toast({
        title: "Error",
        description: "Failed to create label. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingLabel(false)
    }
  }

  const content = (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        {isDialog ? (
          <Button variant="ghost" className="mb-4" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        ) : (
          <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xl font-bold" />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[100px]"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="priority" className="text-sm font-medium">
                      Priority
                    </label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="dueDate" className="text-sm font-medium">
                      Due date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date: Date | undefined) => handleSetDueDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label htmlFor="assignee" className="text-sm font-medium">
                      Assignee
                    </label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger id="assignee">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {boardMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="list" className="text-sm font-medium">
                      List
                    </label>
                    <Select value={selectedList} onValueChange={setSelectedList}>
                      <SelectTrigger id="list">
                        <SelectValue placeholder="Select list" />
                      </SelectTrigger>
                      <SelectContent>
                        {lists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  >
                    Save changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTitle(task.title)
                      setDescription(task.description || "")
                      setIsEditing(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleCompletionToggle()}
                      className="h-5 w-5 data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className={`text-2xl font-bold ${isCompleted ? "line-through text-gray-500" : ""}`}>
                      {task.title}
                    </h1>
                    {isCompleted && (
                      <div className="text-sm text-gray-500 mt-1">
                        Completed {task.completed_at ? new Date(task.completed_at).toLocaleString() : "recently"}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>Edit task</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCompletionToggle}>
                        {isCompleted ? "Mark as incomplete" : "Mark as complete"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => setShowDeleteDialog(true)}>
                        Delete task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-gray-500 text-sm">
                  <Link href={`/boards/${task.board_id}`} className="hover:underline">
                    {task.board_title}
                  </Link>
                  {" • "}
                  <span>{task.list_title}</span>
                </div>

                {task.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-gray-400 italic">No description provided</p>
                )}
              </div>
            )}
          </div>

          <div className="border-t p-6 grid md:grid-cols-3 gap-6">
            <div className="space-y-6 md:col-span-2">
              <div>
                <h2 className="text-lg font-semibold mb-4">Comments</h2>

                <div className="space-y-4">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author_image || undefined} alt={comment.author_name} />
                          <AvatarFallback className="bg-gray-300">{comment.author_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <span className="font-medium">{comment.author_name}</span>
                              <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                            </div>
                            <p className="mt-1 text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No comments yet</p>
                  )}

                  <form onSubmit={handleSubmitComment} className="flex gap-3 mt-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || undefined} alt={user.name} />
                      <AvatarFallback className="bg-gray-300">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex">
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Comment, or type / for comment"
                        className="flex-1 rounded-r-none"
                      />
                      <Button
                        type="submit"
                        disabled={!comment.trim() || isSubmitting}
                        className="rounded-l-none bg-yellow-400 hover:bg-yellow-500 text-black"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Attachments</h2>
                  <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)}>
                    <Paperclip className="mr-2 h-4 w-4" />
                    Add attachment
                  </Button>
                </div>

                <div className="space-y-3">
                  {attachments && attachments.length > 0 ? (
                    attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="bg-gray-100 p-2 rounded">
                          <File className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{attachment.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(attachment.size)} • Uploaded by {attachment.uploader_name}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                Download
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No attachments</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Assignee</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      {assigneeName || "Unassigned"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleAssignUser("unassigned")}>
                      <span className="text-gray-500">Unassigned</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {boardMembers.map((member) => (
                      <DropdownMenuItem key={member.id} onClick={() => handleAssignUser(member.id)}>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={member.image || undefined} alt={member.name} />
                            <AvatarFallback className="bg-gray-300 text-xs">{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {member.name}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Due date</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date: Date | undefined) => handleSetDueDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Badge className={`mr-2 ${getPriorityColor(priority)}`}>{priority || "None"}</Badge>
                      Priority
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSetPriority("none")}>
                      <Badge className="mr-2 bg-gray-100 text-gray-800">None</Badge>
                      None
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetPriority("Low")}>
                      <Badge className="mr-2 bg-green-100 text-green-800">Low</Badge>
                      Low
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetPriority("Medium")}>
                      <Badge className="mr-2 bg-orange-100 text-orange-800">Medium</Badge>
                      Medium
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetPriority("High")}>
                      <Badge className="mr-2 bg-red-100 text-red-800">High</Badge>
                      High
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Labels</h3>
                <div className="space-y-2">
                  {selectedLabels && selectedLabels.length > 0 ? (
                    selectedLabels.map((label) => (
                      <div
                        key={label.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-md"
                        style={{ backgroundColor: `${label.color}20` }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }}></div>
                          <span>{label.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleLabel(label)}>
                          <span className="sr-only">Remove</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-2">No labels</p>
                  )}

                  <Button variant="outline" className="w-full" onClick={() => setShowLabelsDialog(true)}>
                    <Tag className="mr-2 h-4 w-4" />
                    {selectedLabels && selectedLabels.length > 0 ? "Edit labels" : "Add label"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload attachment</DialogTitle>
            <DialogDescription>
              Add files to this task. Supported formats: documents, images, and other files.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FileUpload taskId={task.id} onUploadComplete={handleUploadComplete} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLabelsDialog} onOpenChange={setShowLabelsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Labels</DialogTitle>
            <DialogDescription>Select labels to apply to this task</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              {availableLabels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 flex-1" onClick={() => toggleLabel(label)}>
                    <input
                      type="checkbox"
                      checked={selectedLabels.some((l) => l.id === label.id)}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }}></div>
                    <span>{label.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Implement delete label functionality here
                      if (confirm(`Are you sure you want to delete the label "${label.name}"?`)) {
                        fetch(`/api/labels/${label.id}`, {
                          method: "DELETE",
                        })
                          .then((response) => {
                            if (response.ok) {
                              // Remove from selected labels
                              setSelectedLabels((prev) => prev.filter((l) => l.id !== label.id))
                              // Remove from available labels
                              const updatedLabels = availableLabels.filter((l) => l.id !== label.id)
                              setAvailableLabels(updatedLabels)
                              toast({
                                title: "Label deleted",
                                description: `Label "${label.name}" has been deleted successfully.`,
                              })
                            } else {
                              throw new Error("Failed to delete label")
                            }
                          })
                          .catch((error) => {
                            console.error("Error deleting label:", error)
                            toast({
                              title: "Error",
                              description: "Failed to delete label. It may be in use by other tasks.",
                              variant: "destructive",
                            })
                          })
                      }
                    }}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                    <span className="sr-only">Delete label</span>
                  </Button>
                </div>
              ))}

              {availableLabels.length === 0 && (
                <p className="text-gray-500 text-center py-4">No labels available for this board</p>
              )}
            </div>

            {/* Add the new label creation UI */}
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Create New Label</h3>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter label name"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={createNewLabel}
                  disabled={!newLabelName.trim() || isCreatingLabel || !task.board_id}
                  type="button"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabelsDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  // If this is being used as a dialog, return just the content
  // Otherwise wrap it in a div for the page view
  return content
}
