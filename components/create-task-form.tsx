"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus, X, Trash } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { FileUpload } from "@/components/file-upload"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Board {
  id: string
  name: string
  title?: string // Some boards might use title instead of name
}

interface List {
  id: string
  title: string
}

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

interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  created_at?: string
  uploaded_by?: string
  uploader_name?: string
}

interface BoardMember {
  id: string
  user_id: string
  board_id: string
  role: string
  user: User
}

interface CreateTaskFormProps {
  user: User
  boards: Board[]
  users: User[]
  labels: Label[]
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

export function CreateTaskForm({ user, boards, users, labels: initialLabels }: CreateTaskFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedBoard, setSelectedBoard] = useState("")
  const [lists, setLists] = useState<List[]>([])
  const [selectedList, setSelectedList] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState("Medium")
  const [assignedTo, setAssignedTo] = useState("unassigned")
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [labels, setLabels] = useState<Label[]>(initialLabels)
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [isDeletingLabel, setIsDeletingLabel] = useState(false)
  const [labelToDelete, setLabelToDelete] = useState<Label | null>(null)
  const [showDeleteLabelConfirm, setShowDeleteLabelConfirm] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<User[]>([])

  // Use a dialog for attachment uploads instead of a custom overlay
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Fetch lists when board is selected
  useEffect(() => {
    if (selectedBoard) {
      const fetchLists = async () => {
        try {
          const response = await fetch(`/api/boards/${selectedBoard}/lists`)
          if (!response.ok) {
            throw new Error("Failed to fetch lists")
          }
          const data = await response.json()
          setLists(data)

          // Select the first list by default if available
          if (data.length > 0 && !selectedList) {
            setSelectedList(data[0].id)
          } else {
            setSelectedList("")
          }
        } catch (error) {
          console.error("Error fetching lists:", error)
        }
      }

      fetchLists()
    } else {
      setLists([])
      setSelectedList("")
    }
  }, [selectedBoard])

  // Fetch board members when board is selected
  useEffect(() => {
    if (selectedBoard) {
      const fetchBoardMembers = async () => {
        try {
          const response = await fetch(`/api/boards/${selectedBoard}/members`)
          if (!response.ok) {
            throw new Error("Failed to fetch board members")
          }
          const data = (await response.json()) as BoardMember[]
          setAssignableUsers(data.map((member: BoardMember) => member.user))
        } catch (error) {
          console.error("Error fetching board members:", error)
          toast({
            title: "Error",
            description: "Failed to load board members. You may only be able to assign tasks to yourself.",
            variant: "destructive",
          })
          // Fallback to just the current user
          setAssignableUsers([user])
        }
      }

      fetchBoardMembers()
    } else {
      // If no board is selected, only the current user can be assigned
      setAssignableUsers([user])
    }
  }, [selectedBoard, user])

  // Fetch labels when board is selected
  useEffect(() => {
    if (selectedBoard) {
      const fetchLabels = async () => {
        try {
          const response = await fetch(`/api/labels?boardId=${selectedBoard}`)
          if (!response.ok) {
            throw new Error("Failed to fetch labels")
          }
          const data = await response.json()
          setLabels(data)
        } catch (error) {
          console.error("Error fetching labels:", error)
          toast({
            title: "Error",
            description: "Failed to load labels. Only board-specific labels will be available.",
            variant: "destructive",
          })
          setLabels([])
        }
      }

      fetchLabels()
    } else {
      // If no board is selected, don't show any labels
      setLabels([])
    }
  }, [selectedBoard])

  const handleUploadComplete = (attachment: Attachment) => {
    setAttachments((prev) => [...prev, attachment])
    setUploadDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !selectedBoard || !selectedList) {
      return
    }

    setIsSubmitting(true)

    try {
      // Create the task with attachments included in the initial request
      const taskResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || null,
          listId: selectedList,
          dueDate: dueDate ? dueDate.toISOString() : null,
          priority,
          assignedTo: assignedTo === "unassigned" ? null : assignedTo,
          selectedLabels,
          attachments: attachments.map((att) => ({
            id: att.id,
            name: att.name,
            url: att.url,
            type: att.type,
            size: att.size,
          })),
        }),
      })

      if (!taskResponse.ok) {
        throw new Error("Failed to create task")
      }

      const task = await taskResponse.json()

      // Redirect to the task detail page
      router.push(`/tasks/${task.id}`)
      router.refresh()
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

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((current) => {
      const exists = current.includes(labelId)
      if (exists) {
        return current.filter((id) => id !== labelId)
      } else {
        return [...current, labelId]
      }
    })
  }

  const removeLabel = (labelId: string) => {
    setSelectedLabels((current) => current.filter((id) => id !== labelId))
  }

  const createNewLabel = async () => {
    if (!newLabelName.trim() || !selectedBoard) return

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
          boardId: selectedBoard,
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

  const confirmDeleteLabel = (label: Label, e: React.MouseEvent) => {
    e.stopPropagation()
    setLabelToDelete(label)
    setShowDeleteLabelConfirm(true)
  }

  const deleteLabel = async () => {
    if (!labelToDelete || !selectedBoard) return

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Task Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="board" className="block text-sm font-medium mb-1">
              Board <span className="text-red-500">*</span>
            </label>
            <Select value={selectedBoard} onValueChange={setSelectedBoard} required>
              <SelectTrigger id="board">
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.title || board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="list" className="block text-sm font-medium mb-1">
              List <span className="text-red-500">*</span>
            </label>
            <Select value={selectedList} onValueChange={setSelectedList} disabled={!selectedBoard} required>
              <SelectTrigger id="list">
                <SelectValue placeholder={selectedBoard ? "Select list" : "Select a board first"} />
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

          <div>
            <label htmlFor="priority" className="block text-sm font-medium mb-1">
              Priority
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
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
            <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
              Due Date
            </label>
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
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label htmlFor="assignee" className="block text-sm font-medium mb-1">
              Assignee
            </label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {/* Only show the current user if no board is selected */}
                {!selectedBoard && (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} (You)
                  </SelectItem>
                )}
                {/* Show board members when a board is selected */}
                {selectedBoard &&
                  assignableUsers.map((assignableUser) => (
                    <SelectItem key={assignableUser.id} value={assignableUser.id}>
                      {assignableUser.name} {assignableUser.id === user.id ? "(You)" : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="labels" className="block text-sm font-medium mb-1">
              Labels
            </label>
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
                          onSelect={() => toggleLabel(label.id)}
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
                          disabled={!newLabelName.trim() || isCreatingLabel || !selectedBoard}
                          type="button"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      {!selectedBoard && (
                        <p className="text-xs text-muted-foreground mt-1">Select a board first to create labels</p>
                      )}
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

        <div>
          <label className="block text-sm font-medium mb-1">Attachments</label>
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

            <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(true)} className="w-full">
              Add Attachment
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || !title.trim() || !selectedBoard || !selectedList}
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {/* Use Dialog component for attachment upload instead of custom overlay */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Attachment</DialogTitle>
            <DialogDescription>Add a file to your task</DialogDescription>
          </DialogHeader>
          <FileUpload
            taskId="temp" // This will be replaced with the actual task ID after creation
            onUploadComplete={handleUploadComplete}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Label Confirmation Dialog */}
      <Dialog open={showDeleteLabelConfirm} onOpenChange={setShowDeleteLabelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Label</DialogTitle>
            <DialogDescription>
              {labelToDelete && (
                <>Are you sure you want to delete the label "{labelToDelete.name}"? This action cannot be undone.</>
              )}
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
    </form>
  )
}
