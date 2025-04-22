"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  image: string | null
}

interface Label {
  id: string
  name: string
  color: string
}

interface BoardMember {
  id: string
  user_id: string
  board_id: string
  role: string
  user: User
}

interface AddTaskInListProps {
  listId: string
  boardId: string
  onClose: () => void
  onTaskAdded: () => void
}

// Predefined colors for new labels
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

export function AddTaskInList({ listId, boardId, onClose, onTaskAdded }: AddTaskInListProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [assignedTo, setAssignedTo] = useState("unassigned")
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [labels, setLabels] = useState<Label[]>([])
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [isDeletingLabel, setIsDeletingLabel] = useState(false)
  const [labelToDelete, setLabelToDelete] = useState<Label | null>(null)
  const [showDeleteLabelConfirm, setShowDeleteLabelConfirm] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const user = await response.json()
          setCurrentUser(user)
        }
      } catch (error) {
        console.error("Error fetching current user:", error)
      }
    }

    fetchCurrentUser()
  }, [])

  // Fetch board members for assignee dropdown
  useEffect(() => {
    if (boardId) {
      const fetchBoardMembers = async () => {
        try {
          const response = await fetch(`/api/boards/${boardId}/members`)
          if (!response.ok) {
            throw new Error("Failed to fetch board members")
          }
          const data = await response.json()
          setAssignableUsers(data.map((member: BoardMember) => member.user))
        } catch (error) {
          console.error("Error fetching board members:", error)
          if (currentUser) {
            setAssignableUsers([currentUser])
          }
        }
      }

      fetchBoardMembers()
    }
  }, [boardId, currentUser])

  // Fetch labels for the board
  useEffect(() => {
    if (boardId) {
      const fetchLabels = async () => {
        try {
          const response = await fetch(`/api/labels?boardId=${boardId}`)
          if (!response.ok) {
            throw new Error("Failed to fetch labels")
          }
          const data = await response.json()
          setLabels(data)
        } catch (error) {
          console.error("Error fetching labels:", error)
          setLabels([])
        }
      }

      fetchLabels()
    }
  }, [boardId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Create the task
      const taskResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || null,
          listId,
          boardId,
          priority: priority === "none" ? null : priority,
          assignedTo: assignedTo === "unassigned" ? null : assignedTo,
          selectedLabels: selectedLabels.map((label) => label.id),
        }),
      })

      if (!taskResponse.ok) {
        throw new Error("Failed to create task")
      }

      // Notify parent component that task was added
      onTaskAdded()
      onClose()

      // Refresh the page to show the new task
      router.refresh()
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleLabel = (label: Label) => {
    setSelectedLabels((current) => {
      const exists = current.some((l) => l.id === label.id)
      if (exists) {
        return current.filter((l) => l.id !== label.id)
      } else {
        return [...current, label]
      }
    })
  }

  const removeLabel = (labelId: string) => {
    setSelectedLabels((current) => current.filter((label) => label.id !== labelId))
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
          boardId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create label")
      }

      const newLabel = await response.json()

      // Add the new label to the labels list
      setLabels((current) => [...current, newLabel])

      // Also select the newly created label
      setSelectedLabels((current) => [...current, newLabel])

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

  const confirmDeleteLabel = (label: Label, e: React.MouseEvent) => {
    e.stopPropagation()
    setLabelToDelete(label)
    setShowDeleteLabelConfirm(true)
  }

  const deleteLabel = async () => {
    if (!labelToDelete) return

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
      setSelectedLabels((current) => current.filter((l) => l.id !== labelToDelete.id))

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

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            className="w-full"
            required
          />
        </div>

        <div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            className="min-h-[80px] w-full"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assignee</label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {assignableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} {currentUser && user.id === currentUser.id ? "(You)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Labels</label>
            <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={labelsOpen} className="w-full justify-between">
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
                            {selectedLabels.some((l) => l.id === label.id) && (
                              <span className="text-primary mr-2">✓</span>
                            )}
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

                    <div className="p-2 border-t">
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
                          disabled={!newLabelName.trim() || isCreatingLabel}
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
                {selectedLabels.map((label) => (
                  <Badge
                    key={label.id}
                    style={{ backgroundColor: label.color, color: "#fff" }}
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {label.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeLabel(label.id)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>

      {showDeleteLabelConfirm && labelToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete Label</h2>
            <p className="mb-4">
              Are you sure you want to delete the label "{labelToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
