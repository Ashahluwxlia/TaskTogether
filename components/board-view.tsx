"use client"

import type React from "react"

import { useState, useEffect, useId } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { ListColumn } from "@/components/list-column"
import { TaskCard } from "@/components/task-card"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { UnifiedTaskDetail } from "@/components/unified-task-detail"
import { BoardHeader } from "@/app/ui/boards/board-header"

interface User {
  id: string
  name: string
  email: string
  image: string | null
  role?: string
}

interface TaskLabel {
  id: string
  name: string
  color: string
}

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
  labels: TaskLabel[] | null
  // Additional properties required by TaskDetail
  list_title?: string
  board_id?: string
  board_title?: string
  comments?: any[]
  attachments?: any[]
  _isDeleted?: boolean
}

interface List {
  id: string
  title: string
  position: number
  board_id: string
  tasks: Task[]
}

interface Board {
  id: string
  title: string
  description: string | null
  is_starred: boolean
  role: string
  lists: List[]
  members: User[]
  labels: TaskLabel[]
  background_color?: string | null
}

interface BoardViewProps {
  user: User
  board: Board
}

export function BoardView({ user: userProp, board }: BoardViewProps) {
  const router = useRouter()
  // Create a stable ID for DndContext
  const dndDescribedById = useId()
  const [backgroundColor, setBackgroundColor] = useState<string>(board.background_color || "#ffffff")

  // Sort tasks by position when initializing lists
  const sortedLists = board.lists.map((list) => ({
    ...list,
    tasks: [...list.tasks].sort((a, b) => Number(a.position) - Number(b.position)),
  }))

  const [lists, setLists] = useState<List[]>(sortedLists)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeListId, setActiveListId] = useState<string | null>(null) // Track the list ID of the active task
  const [newListTitle, setNewListTitle] = useState("")
  const [addingList, setAddingList] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false)
  const [newTaskListId, setNewTaskListId] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("Medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined)
  const [newTaskAssignee, setNewTaskAssignee] = useState("unassigned")
  const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false)

  // Apply background color to the body
  useEffect(() => {
    if (backgroundColor) {
      // Store the original background color as a data attribute
      document.body.setAttribute("data-board-background", "true")
      document.body.style.setProperty("--board-background-color", backgroundColor)

      // Apply to both document.body and the main container
      document.body.style.backgroundColor = backgroundColor

      // Find the main container element and apply the background color
      const mainContainer = document.querySelector(".flex-1.flex.flex-col.h-full")
      if (mainContainer) {
        ;(mainContainer as HTMLElement).style.backgroundColor = backgroundColor
      }
    }

    return () => {
      document.body.removeAttribute("data-board-background")
      document.body.style.removeProperty("--board-background-color")
      document.body.style.backgroundColor = ""
      const mainContainer = document.querySelector(".flex-1.flex.flex-col.h-full")
      if (mainContainer) {
        ;(mainContainer as HTMLElement).style.backgroundColor = ""
      }
    }
  }, [backgroundColor])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    // Initial fetch
    refreshBoardData()

    // Set up an interval to refresh data
    const intervalId = setInterval(refreshBoardData, 30000) // Refresh every 30 seconds

    return () => clearInterval(intervalId)
  }, [board.id])

  const refreshBoardData = async () => {
    try {
      const response = await fetch(`/api/boards/${board.id}`)
      if (response.ok) {
        const boardData = await response.json()
        // Sort tasks by position before setting state
        const sortedLists = boardData.lists.map((list: List) => ({
          ...list,
          tasks: [...list.tasks].sort((a, b) => Number(a.position) - Number(b.position)),
        }))
        // Only update state if lists have actually changed
        setLists((prevLists) => {
          const prevJson = JSON.stringify(prevLists)
          const newJson = JSON.stringify(sortedLists)
          if (prevJson !== newJson) {
            return sortedLists || []
          }
          return prevLists
        })

        // Update background color if it changed
        if (boardData.background_color !== backgroundColor) {
          setBackgroundColor(boardData.background_color || "#ffffff")
        }

        return true
      }
      return false
    } catch (error) {
      console.error("Error refreshing board data:", error)
      return false
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // If dragging a task
    if (active.data.current?.type === "task") {
      setActiveTask(active.data.current.task)
      setActiveListId(active.data.current.listId) // Store the list ID
    }
  }

  const findListById = (listId: string) => {
    return lists.find((list) => list.id === listId)
  }

  const findTaskById = (taskId: string) => {
    for (const list of lists) {
      const task = list.tasks.find((task) => task.id === taskId)
      if (task) return { task, listId: list.id }
    }
    return null
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id
    const overId = over.id

    // If task is not being dragged over anything, return
    if (!activeId || !overId) return

    // If task is being dragged over itself, return
    if (activeId === overId) return

    // Handle task over list
    if (active.data.current?.type === "task" && over.data.current?.type === "list") {
      const activeListId = active.data.current.listId
      const overListId = over.id as string // Use the list ID directly from over.id

      // If task is already in this list, return
      if (activeListId === overListId) return

      // Find the task in the source list
      const taskInfo = findTaskById(activeId as string)
      if (!taskInfo) return

      // Move the task to the destination list
      setLists((prevLists) => {
        return prevLists.map((list) => {
          // Remove from source list
          if (list.id === activeListId) {
            return {
              ...list,
              tasks: list.tasks.filter((task) => task.id !== activeId),
            }
          }

          // Add to destination list
          if (list.id === overListId) {
            const updatedTask = {
              ...taskInfo.task,
              list_id: overListId,
              position: list.tasks.length, // Add to the end of the list
            }

            return {
              ...list,
              tasks: [...list.tasks, updatedTask].map((task, index) => ({
                ...task,
                position: index,
              })),
            }
          }

          return list
        })
      })
    }

    // Handle task over task (in a different list)
    if (active.data.current?.type === "task" && over.data.current?.type === "task") {
      const activeListId = active.data.current.listId
      const overListId = over.data.current.listId

      // If in the same list, we'll handle this in dragEnd
      if (activeListId === overListId) return

      // Find the task in the source list
      const taskInfo = findTaskById(activeId as string)
      if (!taskInfo) return

      // Find the over task's position
      const overTaskInfo = findTaskById(overId as string)
      if (!overTaskInfo) return

      // Move the task to the destination list at the correct position
      setLists((prevLists) => {
        return prevLists.map((list) => {
          // Remove from source list
          if (list.id === activeListId) {
            return {
              ...list,
              tasks: list.tasks.filter((task) => task.id !== activeId),
            }
          }

          // Add to destination list at the correct position
          if (list.id === overListId) {
            const updatedTask = {
              ...taskInfo.task,
              list_id: overListId,
            }

            const overTaskIndex = list.tasks.findIndex((task) => task.id === overId)
            if (overTaskIndex === -1) return list

            const newTasks = [...list.tasks]
            newTasks.splice(overTaskIndex, 0, updatedTask)

            // Update positions
            return {
              ...list,
              tasks: newTasks.map((task, index) => ({
                ...task,
                position: index,
              })),
            }
          }

          return list
        })
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    // Reset active states
    setActiveId(null)
    setActiveTask(null)
    setActiveListId(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    // If nothing is being dragged over anything, return
    if (!activeId || !overId) return

    // If list is being dragged
    if (active.data.current?.type === "list" && over.data.current?.type === "list") {
      // If list is not being dragged to a new position, return
      if (activeId === overId) return

      // Find the indices of the active and over lists
      const activeIndex = lists.findIndex((list) => list.id === activeId)
      const overIndex = lists.findIndex((list) => list.id === overId)

      // If either list is not found, return
      if (activeIndex === -1 || overIndex === -1) return

      // Reorder the lists
      const newLists = arrayMove(lists, activeIndex, overIndex)

      // Update UI immediately
      setLists(newLists)

      // Update the positions in the database
      try {
        setIsSubmitting(true)

        // Update each list's position
        const updatePromises = newLists.map((list, index) =>
          fetch(`/api/lists/${list.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ position: index }),
          }),
        )

        await Promise.all(updatePromises)

        // Refresh board data after update to ensure consistency
        await refreshBoardData()
      } catch (error) {
        console.error("Error updating list positions:", error)
        toast({
          title: "Error updating list positions",
          description: "There was an error updating list positions. Refreshing data...",
          variant: "destructive",
        })
        // Force refresh on error to ensure UI is consistent with backend
        await refreshBoardData()
      } finally {
        setIsSubmitting(false)
      }
    }

    // If task is being dragged within the same list
    if (active.data.current?.type === "task" && over.data.current?.type === "task") {
      const activeListId = active.data.current.listId
      const overListId = over.data.current.listId

      // If task is being dragged within the same list
      if (activeListId === overListId) {
        // Existing same-list logic remains unchanged
        try {
          setIsSubmitting(true)

          // Find the list
          const listIndex = lists.findIndex((list) => list.id === activeListId)
          if (listIndex === -1) return

          // Get the tasks
          const tasks = [...lists[listIndex].tasks]

          // Find the indices of the active and over tasks
          const activeIndex = tasks.findIndex((task) => task.id === activeId)
          const overIndex = tasks.findIndex((task) => task.id === overId)

          // If either task is not found, return
          if (activeIndex === -1 || overIndex === -1) return

          // Reorder the tasks
          const newTasks = arrayMove(tasks, activeIndex, overIndex)

          // Update positions for all tasks in the list
          const updatedTasks = newTasks.map((task, index) => ({
            ...task,
            position: index,
          }))

          // Update the UI immediately
          const newLists = [...lists]
          newLists[listIndex] = {
            ...newLists[listIndex],
            tasks: updatedTasks,
          }
          setLists(newLists)

          // Update all tasks in the list with their new positions
          const updatePromises = updatedTasks.map((task, idx) =>
            fetch(`/api/tasks/${task.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                position: idx,
                list_id: activeListId,
              }),
            }),
          )

          await Promise.all(updatePromises)
        } catch (error) {
          console.error("Error updating task positions:", error)
          toast({
            title: "Error updating task positions",
            description: "There was an error updating task positions. Refreshing data...",
            variant: "destructive",
          })
          // Force refresh on error to ensure UI is consistent with backend
          await refreshBoardData()
        } finally {
          setIsSubmitting(false)
        }
      } else {
        // If task is being dragged to a different list
        try {
          setIsSubmitting(true)

          // Find the task
          const taskInfo = findTaskById(activeId as string)
          if (!taskInfo) return

          // Get the source and destination lists
          const sourceList = findListById(activeListId)
          const destList = findListById(overListId)
          if (!sourceList || !destList) return

          // Find the over task's position
          const overTaskIndex = destList.tasks.findIndex((task) => task.id === overId)
          if (overTaskIndex === -1) return

          // Create updated task lists for both source and destination
          const updatedSourceTasks = sourceList.tasks
            .filter((task) => task.id !== activeId)
            .map((task, index) => ({ ...task, position: index }))

          // Create a copy of the destination tasks
          const updatedDestTasks = [...destList.tasks]

          // Insert the moved task at the correct position
          const movedTask = {
            ...taskInfo.task,
            list_id: overListId,
          }

          // Insert at the correct position
          updatedDestTasks.splice(overTaskIndex, 0, movedTask)

          // Update positions for all tasks in the destination list
          const finalDestTasks = updatedDestTasks.map((task, index) => ({
            ...task,
            position: index,
          }))

          // Update UI immediately
          setLists((prevLists) => {
            return prevLists.map((list) => {
              if (list.id === activeListId) {
                return {
                  ...list,
                  tasks: updatedSourceTasks,
                }
              }
              if (list.id === overListId) {
                return {
                  ...list,
                  tasks: finalDestTasks,
                }
              }
              return list
            })
          })

          // First update the moved task's list_id and position
          console.log(
            `Moving task ${activeId} from list ${activeListId} to list ${overListId} at position ${overTaskIndex}`,
          )

          const moveResponse = await fetch(`/api/tasks/${activeId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              list_id: overListId,
              position: Number(overTaskIndex),
            }),
          })

          if (!moveResponse.ok) {
            const errorData = await moveResponse.json()
            console.error("Error response from server:", errorData)
            throw new Error(`Failed to update task position: ${errorData.error || "Unknown error"}`)
          }

          const updatedTask = await moveResponse.json()
          console.log("Task updated successfully:", updatedTask)

          // Then update all tasks in the source list with their new positions
          const sourceUpdatePromises = updatedSourceTasks.map((task) =>
            fetch(`/api/tasks/${task.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ position: Number(task.position) }), // Ensure position is a number
            }),
          )

          // And update all tasks in the destination list with their new positions
          const destUpdatePromises = finalDestTasks
            .filter((task) => task.id !== activeId) // Skip the task we just updated
            .map((task) =>
              fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  position: Number(task.position), // Ensure position is a number
                }),
              }),
            )

          // Wait for all updates to complete
          await Promise.all([...sourceUpdatePromises, ...destUpdatePromises])

          // Verify the task was moved correctly
          const verifyResponse = await fetch(`/api/tasks/${activeId}`)
          if (verifyResponse.ok) {
            const verifiedTask = await verifyResponse.json()
            console.log(`Verification - Task ${activeId} is now in list: ${verifiedTask.list_id}`)
          }

          toast({
            title: "Task moved",
            description: "Task has been moved to a new list successfully.",
          })
        } catch (error) {
          console.error("Error updating task list:", error)
          toast({
            title: "Error moving task",
            description: "There was an error moving the task. Refreshing data...",
            variant: "destructive",
          })
          // Force refresh on error to ensure UI is consistent with backend
          await refreshBoardData()
        } finally {
          setIsSubmitting(false)
        }
      }
    }

    // If task is being dragged to a list
    if (active.data.current?.type === "task" && over.data.current?.type === "list") {
      const activeListId = active.data.current.listId
      const overListId = over.id as string

      if (activeListId === overListId) return

      try {
        setIsSubmitting(true)

        const taskInfo = findTaskById(activeId as string)
        if (!taskInfo) return

        const sourceList = findListById(activeListId)
        const destList = findListById(overListId)
        if (!sourceList || !destList) return

        const newPosition = destList.tasks.length

        // Create updated task lists for both source and destination
        const updatedSourceTasks = sourceList.tasks
          .filter((task) => task.id !== activeId)
          .map((task, index) => ({ ...task, position: index }))

        // Create the moved task with updated list_id and position
        const movedTask = {
          ...taskInfo.task,
          list_id: overListId,
          position: newPosition,
        }

        // Create the updated destination tasks list
        const updatedDestTasks = [...destList.tasks, movedTask].map((task, index) => ({
          ...task,
          position: index,
        }))

        // Update UI immediately
        setLists((prevLists) => {
          return prevLists.map((list) => {
            if (list.id === activeListId) {
              return {
                ...list,
                tasks: updatedSourceTasks,
              }
            }
            if (list.id === overListId) {
              return {
                ...list,
                tasks: updatedDestTasks,
              }
            }
            return list
          })
        })

        // First update the moved task's list_id and position
        console.log(
          `Moving task ${activeId} from list ${activeListId} to list ${overListId} at position ${newPosition}`,
        )

        const moveResponse = await fetch(`/api/tasks/${activeId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            list_id: overListId,
            position: Number(newPosition),
          }),
        })

        if (!moveResponse.ok) {
          const errorData = await moveResponse.json()
          console.error("Error response from server:", errorData)
          throw new Error(`Failed to update task position: ${errorData.error || "Unknown error"}`)
        }

        const updatedTask = await moveResponse.json()
        console.log("Task updated successfully:", updatedTask)

        // Then update all tasks in the source list with their new positions
        const sourceUpdatePromises = updatedSourceTasks.map((task) =>
          fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ position: Number(task.position) }), // Ensure position is a number
          }),
        )

        // And update all tasks in the destination list with their new positions
        const destUpdatePromises = updatedDestTasks
          .filter((task) => task.id !== activeId) // Skip the task we just updated
          .map((task) =>
            fetch(`/api/tasks/${task.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                position: Number(task.position), // Ensure position is a number
              }),
            }),
          )

        // Wait for all updates to complete
        await Promise.all([...sourceUpdatePromises, ...destUpdatePromises])

        // Verify the task was moved correctly
        const verifyResponse = await fetch(`/api/tasks/${activeId}`)
        if (verifyResponse.ok) {
          const verifiedTask = await verifyResponse.json()
          console.log(`Verification - Task ${activeId} is now in list: ${verifiedTask.list_id}`)
        }

        toast({
          title: "Task moved",
          description: "Task has been moved to a new list successfully.",
        })
      } catch (error) {
        console.error("Error updating task list:", error)
        toast({
          title: "Error moving task",
          description: "There was an error moving the task. Refreshing data...",
          variant: "destructive",
        })
        // Force refresh on error to ensure UI is consistent with backend
        await refreshBoardData()
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleListDeleted = () => {
    // Refresh the board data
    router.refresh()
  }

  const handleAddList = async () => {
    if (!newListTitle.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newListTitle,
          boardId: board.id,
          position: lists.length,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create list")
      }

      const newList = await response.json()
      console.log("Created new list:", newList)

      // Add the new list with an empty tasks array
      setLists([...lists, { ...newList, tasks: [] }])
      setNewListTitle("")
      setAddingList(false)

      toast({
        title: "List created",
        description: `List "${newListTitle}" has been created successfully.`,
      })
    } catch (error) {
      console.error("Error creating list:", error)
      toast({
        title: "Error creating list",
        description: "There was an error creating the list. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStar = async () => {
    try {
      await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_starred: !board.is_starred }),
      })

      router.refresh()
    } catch (error) {
      console.error("Failed to update board", error)
    }
  }

  const handleDeleteBoard = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete board")
      }

      toast({
        title: "Board deleted",
        description: "The board has been deleted successfully.",
      })

      // Redirect to boards page after successful deletion
      router.push("/dashboard/boards")
    } catch (error) {
      console.error("Error deleting board:", error)
      toast({
        title: "Error deleting board",
        description:
          error instanceof Error ? error.message : "There was an error deleting the board. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsDeleteBoardDialogOpen(false)
    }
  }

  const handleAddTask = (listId: string) => {
    setNewTaskListId(listId)
    setNewTaskTitle("")
    setNewTaskDescription("")
    setNewTaskPriority("Medium")
    setNewTaskDueDate(undefined)
    setNewTaskAssignee("unassigned")
    setIsAddTaskDialogOpen(true)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTaskTitle.trim() || !newTaskListId) {
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
          title: newTaskTitle,
          description: newTaskDescription || null,
          listId: newTaskListId,
          dueDate: newTaskDueDate ? newTaskDueDate.toISOString() : null,
          priority: newTaskPriority,
          assignedTo: newTaskAssignee === "unassigned" ? null : newTaskAssignee,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create task")
      }

      const task = await response.json()

      // Update the UI
      setLists((prevLists) =>
        prevLists.map((list) => {
          if (list.id === newTaskListId) {
            return {
              ...list,
              tasks: [...list.tasks, task],
            }
          }
          return list
        }),
      )

      setIsAddTaskDialogOpen(false)
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

  // In the handleOpenTaskDetail function, modify it to fetch comments:
  const handleOpenTaskDetail = async (task: Task) => {
    // Find the list title for this task
    const list = lists.find((list) => list.id === task.list_id)

    try {
      // Fetch comments for this task
      const commentsResponse = await fetch(`/api/tasks/${task.id}/comments`)
      let comments = []

      if (commentsResponse.ok) {
        comments = await commentsResponse.json()
      }

      // Fetch attachments for this task
      const attachmentsResponse = await fetch(`/api/tasks/${task.id}/attachments`)
      let attachments = []

      if (attachmentsResponse.ok) {
        attachments = await attachmentsResponse.json()
      }

      // Ensure task.labels is always an array before passing to TaskDetail
      const safeLabels = Array.isArray(task.labels) ? task.labels : []

      // Prepare the task with all required properties for TaskDetail
      const taskWithDetails = {
        ...task,
        list_title: list?.title || "",
        board_id: board.id,
        board_title: board.title,
        comments: comments, // Add the fetched comments
        attachments: attachments, // Add the fetched attachments
        labels: safeLabels,
      }

      setSelectedTask(taskWithDetails)
      setIsTaskDialogOpen(true)
    } catch (error) {
      console.error("Error fetching task details:", error)

      // If there's an error, still open the dialog but with empty comments and attachments
      const taskWithDetails = {
        ...task,
        list_title: list?.title || "",
        board_id: board.id,
        board_title: board.title,
        comments: [],
        attachments: [],
        labels: Array.isArray(task.labels) ? task.labels : [],
      }

      setSelectedTask(taskWithDetails)
      setIsTaskDialogOpen(true)
    }
  }

  // New function to handle task updates from the task detail dialog
  const handleTaskUpdate = (updatedTask: Task) => {
    // Check if this is a deletion signal
    if (updatedTask._isDeleted) {
      // Remove the task from all lists
      setLists((prevLists) => {
        return prevLists.map((list) => ({
          ...list,
          tasks: list.tasks.filter((task) => task.id !== updatedTask.id),
        }))
      })

      // Close the task dialog if it's open
      if (isTaskDialogOpen) {
        setIsTaskDialogOpen(false)
      }

      return
    }

    // Update the task in the lists state
    setLists((prevLists) => {
      // Create a new array to hold the updated lists
      const newLists = prevLists.map((list) => {
        // If this is the list that contains the updated task
        if (list.id === updatedTask.list_id) {
          // Check if the task already exists in this list
          const taskExists = list.tasks.some((task) => task.id === updatedTask.id)

          if (taskExists) {
            // Update the existing task
            return {
              ...list,
              tasks: list.tasks.map((task) => (task.id === updatedTask.id ? { ...updatedTask } : task)),
            }
          } else {
            // Add the task to this list (it was moved here)
            return {
              ...list,
              tasks: [...list.tasks, updatedTask],
            }
          }
        }
        // If the task was moved from this list to another list
        else if (list.tasks.some((task) => task.id === updatedTask.id)) {
          return {
            ...list,
            tasks: list.tasks.filter((task) => task.id !== updatedTask.id),
          }
        }
        return list
      })

      return newLists
    })

    // If the task detail dialog is open, update the selected task
    if (isTaskDialogOpen && selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <BoardHeader
            board={{
              id: board.id,
              title: board.title,
              description: board.description,
              teamId: null,
              isStarred: board.is_starred,
              backgroundColor: backgroundColor,
            }}
            onUpdateBoard={async (data) => {
              try {
                // Apply background color immediately before API call
                if (data.backgroundColor) {
                  setBackgroundColor(data.backgroundColor)

                  // Apply to both document.body and the main container
                  document.body.style.backgroundColor = data.backgroundColor
                  const mainContainer = document.querySelector(".flex-1.flex.flex-col.h-full")
                  if (mainContainer) {
                    ;(mainContainer as HTMLElement).style.backgroundColor = data.backgroundColor
                  }
                }

                const response = await fetch(`/api/boards/${board.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    background_color: data.backgroundColor,
                  }),
                })

                if (!response.ok) {
                  const errorData = await response.json()
                  console.error("Error response from server:", errorData)
                  throw new Error("Failed to update board")
                }

                // Update local state
                if (data.title) board.title = data.title
                if (data.description !== undefined) board.description = data.description

                toast({
                  title: "Board updated",
                  description: "Board has been updated successfully.",
                })

                // Force a refresh to update the board name in all places
                router.refresh()
              } catch (error) {
                console.error("Error updating board:", error)
                toast({
                  title: "Error updating board",
                  description: "There was an error updating the board. Please try again.",
                  variant: "destructive",
                })
              }
            }}
            onToggleStar={handleToggleStar}
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          id={dndDescribedById}
        >
          <div className="flex gap-4 h-full">
            <SortableContext items={lists.map((list) => list.id)}>
              {lists.map((list) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  boardId={board.id}
                  onListsChange={(updatedList) => {
                    if (updatedList.length === 0) {
                      // This is a delete operation
                      setLists(lists.filter((l) => l.id !== list.id))
                    } else {
                      // This is an update operation
                      setLists(lists.map((l) => (l.id === updatedList[0].id ? updatedList[0] : l)))
                    }
                  }}
                  onAddTask={handleAddTask}
                  onOpenTaskDetail={handleOpenTaskDetail}
                  onListDeleted={handleListDeleted}
                />
              ))}
            </SortableContext>

            {addingList ? (
              <div className="w-72 shrink-0 bg-white rounded-lg shadow-sm border p-2">
                <Input
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Enter list title..."
                  className="mb-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddList()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddList}
                    disabled={!newListTitle.trim() || isSubmitting}
                    className="h-7 text-xs bg-yellow-400 hover:bg-yellow-500 text-black"
                  >
                    {isSubmitting ? "Adding..." : "Add list"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setNewListTitle("")
                      setAddingList(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setAddingList(true)}
                className="h-12 w-72 justify-start bg-white/80 hover:bg-white text-gray-500 border border-dashed"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add another list
              </Button>
            )}
          </div>

          <DragOverlay>
            {activeId && activeTask && activeListId && (
              <div className="opacity-100 transform scale-105 shadow-xl rounded-lg">
                <TaskCard task={activeTask} listId={activeListId} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Task Details</DialogTitle>
          {selectedTask && (
            <UnifiedTaskDetail
              user={userProp}
              task={{
                ...selectedTask,
                list_title: lists.find((list) => list.id === selectedTask.list_id)?.title || "",
                board_id: board.id,
                board_title: board.title,
                comments: selectedTask.comments || [],
                attachments: selectedTask.attachments || [],
                labels: selectedTask.labels || [],
              }}
              boardMembers={board.members}
              lists={lists}
              labels={board.labels}
              onClose={() => setIsTaskDialogOpen(false)}
              isDialog={true}
              onTaskUpdate={handleTaskUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new task</DialogTitle>
            <DialogDescription>Add a new task to your board</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-task-title">Title</Label>
                <Input
                  id="new-task-title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-task-description">Description</Label>
                <Textarea
                  id="new-task-description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-task-priority">Priority</Label>
                  <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                    <SelectTrigger id="new-task-priority">
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
                  <Label htmlFor="new-task-due-date">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newTaskDueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTaskDueDate ? format(newTaskDueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={newTaskDueDate} onSelect={setNewTaskDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                disabled={isSubmitting || !newTaskTitle.trim()}
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Board Confirmation Dialog */}
      <Dialog open={isDeleteBoardDialogOpen} onOpenChange={setIsDeleteBoardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Board</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this board? This action cannot be undone and all lists, tasks, and
              comments will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteBoardDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBoard} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete Board"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
