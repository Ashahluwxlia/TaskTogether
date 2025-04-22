"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TaskCard } from "@/components/task-card"
import { MoreHorizontal, Plus, Trash, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { SortableContext } from "@dnd-kit/sortable"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/file-upload"

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
}

interface List {
  id: string
  title: string
  position: number
  board_id: string
  tasks: Task[]
}

interface User {
  id: string
  name: string
  email: string
  image: string | null
}

interface BoardLabel {
  id: string
  name: string
  color: string
}

// Add this interface for board members
interface BoardMember {
  id: string
  user_id: string
  board_id: string
  role: string
  user: User
}

// Add this for label colors
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

interface ListColumnProps {
  list: List
  boardId: string
  onListsChange: (lists: List[]) => void
  onAddTask: (listId: string) => void
  onOpenTaskDetail: (task: Task) => void
  onListDeleted?: () => void
}

export function ListColumn({
  list,
  boardId,
  onListsChange,
  onAddTask,
  onOpenTaskDetail,
  onListDeleted,
}: ListColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newTitle, setNewTitle] = useState(list.title)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [assignee, setAssignee] = useState("unassigned")
  const [boardMembers, setBoardMembers] = useState<User[]>([])
  const [labels, setLabels] = useState<BoardLabel[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Add new state variables for enhanced label functionality
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [isDeletingLabel, setIsDeletingLabel] = useState(false)
  const [labelToDelete, setLabelToDelete] = useState<BoardLabel | null>(null)
  const [showDeleteLabelConfirm, setShowDeleteLabelConfirm] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<User[]>([])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: {
      type: "list",
      list,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Focus the input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleUpdateTitle = async () => {
    if (!newTitle.trim() || newTitle === list.title || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      })

      if (!response.ok) {
        throw new Error("Failed to update list title")
      }

      const updatedList = await response.json()

      // Create a new list with the updated title
      const listWithUpdatedTitle = {
        ...list,
        title: updatedList.title || newTitle,
      }

      // Call onListsChange with a new array where this list is updated
      onListsChange([listWithUpdatedTitle])

      setIsEditing(false)

      toast({
        title: "List updated",
        description: "The list title has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating list title:", error)
      toast({
        title: "Error updating list title",
        description: "There was an error updating the list title. Please try again.",
        variant: "destructive",
      })
      setNewTitle(list.title) // Reset to original title
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteList = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to delete list: ${errorData.error || response.statusText}`)
      }

      // Call onListsChange with an empty array to signal this list should be removed
      // The parent component should handle filtering out this list
      onListsChange([])

      toast({
        title: "List deleted",
        description: "The list has been deleted successfully.",
      })

      // Close the dialog
      setIsDeleteDialogOpen(false)

      // Call the onListDeleted callback if provided
      if (onListDeleted) {
        onListDeleted()
      }
    } catch (error) {
      console.error("Error deleting list:", error)
      toast({
        title: "Error deleting list",
        description: "There was an error deleting the list. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickAddTask = async () => {
    if (!newTaskTitle.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTaskTitle,
          listId: list.id,
          priority: "Medium", // Default priority
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create task")
      }

      const newTask = await response.json()

      // Create a new list with the new task added
      const updatedList = {
        ...list,
        tasks: [...list.tasks, newTask],
      }

      // Call onListsChange with the updated list
      onListsChange([updatedList])

      setNewTaskTitle("")
      setIsAddingTask(false)

      toast({
        title: "Task created",
        description: `Task "${newTaskTitle}" has been created successfully.`,
      })
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error creating task",
        description: "There was an error creating the task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a new function to handle task movement between lists
  // Add this after the handleQuickAddTask function

  const handleTaskMoved = async (
    taskId: string,
    sourceListId: string,
    destinationListId: string,
    newPosition: number,
  ) => {
    try {
      console.log(
        `Moving task ${taskId} from list ${sourceListId} to list ${destinationListId} at position ${newPosition}`,
      )

      // First update the task's list_id and position
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          list_id: destinationListId,
          position: newPosition,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error moving task:", errorData)
        throw new Error("Failed to update task position")
      }

      // Get the updated task
      const updatedTask = await response.json()
      console.log("Task moved successfully:", updatedTask)

      // Notify parent component about the change
      onListsChange([
        {
          ...list,
          tasks:
            list.id === destinationListId
              ? [...list.tasks, updatedTask].map((t, i) => ({ ...t, position: i }))
              : list.tasks.filter((t) => t.id !== taskId).map((t, i) => ({ ...t, position: i })),
        },
      ])

      toast({
        title: "Task moved",
        description: "Task position has been updated successfully.",
      })

      return true
    } catch (error) {
      console.error("Error moving task:", error)
      toast({
        title: "Error moving task",
        description: "There was an error updating the task position. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const openTaskDialog = async () => {
    // Fetch board members and labels before opening dialog
    try {
      const [membersResponse, labelsResponse] = await Promise.all([
        fetch(`/api/boards/${boardId}/members`),
        fetch(`/api/labels?boardId=${boardId}`),
      ])

      if (membersResponse.ok) {
        const members = await membersResponse.json()
        setBoardMembers(members)
      }

      if (labelsResponse.ok) {
        const labelData = await labelsResponse.json()
        setLabels(labelData)
      }

      // Reset form fields
      setTaskTitle("")
      setTaskDescription("")
      setPriority("Medium")
      setDueDate(undefined)
      setAssignee("unassigned")
      setSelectedLabels([])
      setAttachments([])

      // Open dialog
      setIsTaskDialogOpen(true)
    } catch (error) {
      console.error("Error fetching data for task dialog:", error)
      toast({
        title: "Error",
        description: "Failed to load task creation form. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskTitle.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Create the task
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription || null,
          listId: list.id,
          dueDate: dueDate ? dueDate.toISOString() : null,
          priority: priority,
          assignedTo: assignee === "unassigned" ? null : assignee,
          selectedLabels: selectedLabels,
          attachments: attachments.map((att) => ({
            id: att.id,
            name: att.name,
            url: att.url,
            type: att.type,
            size: att.size,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create task")
      }

      const task = await response.json()

      // Create a new list with the new task added
      const updatedList = {
        ...list,
        tasks: [...list.tasks, task],
      }

      // Call onListsChange with the updated list
      onListsChange([updatedList])

      setIsTaskDialogOpen(false)

      // Clear the form fields
      setTaskTitle("")
      setTaskDescription("")
      setPriority("Medium")
      setDueDate(undefined)
      setAssignee("unassigned")
      setSelectedLabels([])
      setAttachments([])

      toast({
        title: "Task created",
        description: `Task "${taskTitle}" has been created successfully.`,
      })
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error creating task",
        description: "There was an error creating the task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTaskCompletionToggle = async (taskId: string, completed: boolean) => {
    // Update the task in the local state optimistically
    const updatedList = {
      ...list,
      tasks: list.tasks.map((task) => (task.id === taskId ? { ...task, completed } : task)),
    }

    // Call onListsChange with the updated list
    onListsChange([updatedList])
  }

  // Fetch board members when dialog opens
  useEffect(() => {
    if (isTaskDialogOpen) {
      const fetchBoardMembers = async () => {
        try {
          const response = await fetch(`/api/boards/${boardId}/members`)
          if (!response.ok) {
            console.warn("Failed to fetch board members:", response.status)
            setBoardMembers([])
            setAssignableUsers([])
            return
          }
          const data = await response.json()
          setBoardMembers(data)
          setAssignableUsers(data.map((member: BoardMember) => member.user))
        } catch (error) {
          console.error("Error fetching board members:", error)
          setBoardMembers([])
          setAssignableUsers([])
        }
      }

      const fetchLabels = async () => {
        try {
          const response = await fetch(`/api/labels?boardId=${boardId}`)
          if (!response.ok) {
            console.warn("Failed to fetch labels:", response.status)
            setLabels([])
            return
          }
          const data = await response.json()
          setLabels(data)
        } catch (error) {
          console.error("Error fetching labels:", error)
          setLabels([])
        }
      }

      fetchBoardMembers()
      fetchLabels()
    }
  }, [isTaskDialogOpen, boardId])

  const toggleLabel = (label: BoardLabel) => {
    setSelectedLabels((current) => {
      const exists = current.includes(label.id)
      if (exists) {
        return current.filter((id) => id !== label.id)
      } else {
        return [...current, label.id]
      }
    })
  }

  const removeLabel = (labelId: string) => {
    setSelectedLabels((current) => current.filter((id) => id !== labelId))
  }

  const createNewLabel = async () => {
    if (!newLabelName.trim() || !boardId) return

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
          boardId: boardId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create label")
      }

      const newLabel = await response.json()

      // Add the new label to the labels list
      setLabels((current) => [...current, newLabel])

      // Also select the newly created label
      setSelectedLabels((current) => [...current, newLabel.id])

      // Clear the input
      setNewLabelName("")

      toast({
        title: "Label created",
        description: `Label "${newLabel.name}" has been created successfully.`,
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

  const confirmDeleteLabel = (label: BoardLabel, e: React.MouseEvent) => {
    e.stopPropagation()
    setLabelToDelete(label)
    setShowDeleteLabelConfirm(true)
  }

  const deleteLabel = async () => {
    if (!labelToDelete || !boardId) return

    setIsDeletingLabel(true)
    try {
      const response = await fetch(`/api/labels/${labelToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete label")
      }

      // Remove the label from the labels list
      setLabels((current) => current.filter((l) => l.id !== labelToDelete.id))

      // Also remove from selected labels if present
      setSelectedLabels((current) => current.filter((id) => id !== labelToDelete.id))

      toast({
        title: "Label deleted",
        description: `Label "${labelToDelete.name}" has been deleted successfully.`,
      })

      setShowDeleteLabelConfirm(false)
      setLabelToDelete(null)
    } catch (error) {
      console.error("Error deleting label:", error)
      toast({
        title: "Error",
        description: "Failed to delete label. It may be in use by existing tasks.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingLabel(false)
    }
  }

  const handleUploadComplete = (attachment: any) => {
    setAttachments([...attachments, attachment])
    setShowUploadDialog(false)
  }

  console.log(`ListColumn - listId: ${list.id}, title: ${list.title}, tasks:`, list.tasks)

  return (
    <div ref={setNodeRef} style={style} className="w-72 shrink-0 flex flex-col bg-white rounded-lg shadow-sm border">
      {/* Header with title and controls */}
      <div className="p-2 border-b flex items-center justify-between">
        {/* Title area - only draggable when not editing */}
        <div className="flex-1">
          {isEditing ? (
            <div className="w-full" onClick={(e) => e.stopPropagation()}>
              <Input
                ref={inputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={() => {
                  if (newTitle.trim() && newTitle !== list.title) {
                    handleUpdateTitle()
                  } else {
                    setNewTitle(list.title)
                    setIsEditing(false)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateTitle()
                  } else if (e.key === "Escape") {
                    setNewTitle(list.title)
                    setIsEditing(false)
                  }
                }}
                className="h-7 text-sm font-medium"
              />
            </div>
          ) : (
            <div className="flex items-center cursor-grab" {...attributes} {...listeners}>
              <h3 className="text-sm font-medium px-2 py-1 flex-1">
                {list.title} ({list.tasks.length})
              </h3>
            </div>
          )}
        </div>

        {/* Controls that should NOT trigger drag */}
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              setIsDeleteDialogOpen(true)
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>

          {/* Dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  openTaskDialog()
                }}
              >
                Add card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext items={list.tasks.map((task) => task.id)} key={list.id}>
          {list.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              listId={list.id}
              onClick={() => onOpenTaskDetail(task)}
              onCompletionToggle={handleTaskCompletionToggle}
            />
          ))}
        </SortableContext>
      </div>

      <div className="p-2 border-t" onClick={(e) => e.stopPropagation()}>
        {isAddingTask ? (
          <div className="space-y-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              className="text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleQuickAddTask()
                } else if (e.key === "Escape") {
                  setNewTaskTitle("")
                  setIsAddingTask(false)
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleQuickAddTask}
                disabled={!newTaskTitle.trim() || isSubmitting}
                className="h-7 text-xs bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                {isSubmitting ? "Adding..." : "Add card"}
              </Button>
              <Button
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setNewTaskTitle("")
                  setIsAddingTask(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground text-sm h-7"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add a card
          </Button>
        )}
      </div>

      {/* Comprehensive Task Creation Dialog - Made wider */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[650px] w-full" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Create a new task</DialogTitle>
            <DialogDescription>Add a new task to your board</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title" className="text-sm font-medium">
                  Task Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="task-title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-priority" className="text-sm font-medium">
                    Priority
                  </Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="task-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-due-date" className="text-sm font-medium">
                    Due Date
                  </Label>
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
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-assignee" className="text-sm font-medium">
                    Assignee
                  </Label>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger id="task-assignee">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {assignableUsers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labels" className="text-sm font-medium">
                    Labels
                  </Label>
                  <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={labelsOpen}
                        className="w-full justify-between"
                      >
                        {selectedLabels.length > 0 ? `${selectedLabels.length} selected` : "Select labels"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search labels..." />
                        <CommandList>
                          <CommandEmpty>
                            <div className="py-3 px-4 text-center text-sm">No labels found.</div>
                          </CommandEmpty>
                          <CommandGroup>
                            {labels.map((label) => (
                              <CommandItem
                                key={label.id}
                                onSelect={() => toggleLabel(label)}
                                className="flex items-center gap-2 cursor-pointer justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }}></div>
                                  <span>{label.name}</span>
                                </div>
                                <div className="flex items-center">
                                  {selectedLabels.includes(label.id) && <span className="text-primary mr-2">✓</span>}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 ml-2"
                                    onClick={(e) => confirmDeleteLabel(label, e)}
                                  >
                                    <Trash className="h-3 w-3 text-red-500" />
                                    <span className="sr-only">Delete label</span>
                                  </Button>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>

                          <Separator className="my-1" />

                          <div className="p-2">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Create new label..."
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={createNewLabel}
                                disabled={!newLabelName.trim() || isCreatingLabel || !boardId}
                                type="button"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {selectedLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedLabels.map((labelId) => {
                        const label = labels.find((l) => l.id === labelId)
                        if (!label) return null
                        return (
                          <Badge
                            key={label.id}
                            style={{ backgroundColor: label.color, color: "#fff" }}
                            className="flex items-center gap-1 px-2 py-1"
                          >
                            {label.name}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeLabel(label.id)} />
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Attachments</Label>
                <div className="space-y-3">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="bg-gray-100 p-2 rounded">
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{attachment.name}</div>
                        <div className="text-xs text-gray-500">{attachment.size} bytes • Uploaded by you</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAttachments(attachments.filter((_, i) => i !== index))
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={() => setShowUploadDialog(true)} className="w-full">
                    Add Attachment
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTaskDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                disabled={isSubmitting || !taskTitle.trim()}
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete List Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          onClick={(e) => e.stopPropagation()}
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the list "{list.title}"? This action cannot be undone and all tasks in
              this list will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteList} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Label Confirmation Dialog */}
      {showDeleteLabelConfirm && labelToDelete && (
        <Dialog
          open={showDeleteLabelConfirm}
          onOpenChange={(open) => {
            setShowDeleteLabelConfirm(open)
            if (!open) setLabelToDelete(null)
          }}
        >
          <DialogContent className="z-[100]">
            <DialogHeader>
              <DialogTitle>Delete Label</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the label "{labelToDelete.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteLabelConfirm(false)
                  setLabelToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={deleteLabel} disabled={isDeletingLabel}>
                {isDeletingLabel ? "Deleting..." : "Delete Label"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Attachment Dialog */}
      {showUploadDialog && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="z-[100]">
            <DialogHeader>
              <DialogTitle>Upload Attachment</DialogTitle>
              <DialogDescription>Add a file to your task</DialogDescription>
            </DialogHeader>
            <FileUpload
              taskId="temp" // This will be replaced with the actual task ID after creation
              onUploadComplete={handleUploadComplete}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
