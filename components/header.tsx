"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Mail, CalendarIcon, Trash, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsButton } from "@/app/ui/dashboard/sidebar/notifications-button"
import { toast } from "@/components/ui/use-toast"
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
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/file-upload"

// Add this import at the top
import { useTheme } from "next-themes"

interface User {
  id: string
  name: string
  email: string
  image: string | null
}

interface Board {
  id: string
  name: string
  title?: string // Some boards might use title instead of name
}

interface List {
  id: string
  title: string
}

interface LabelType {
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
  created_at: string
  uploaded_by: string
  uploader_name: string
  task_id?: string
  task_title?: string
}

interface BoardMember {
  id: string
  user_id: string
  board_id: string
  role: string
  user: User
}

interface HeaderProps {
  initialUser?: User
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

export function Header({ initialUser }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user] = useState<User | undefined>(initialUser)
  const [searchQuery, setSearchQuery] = useState("")
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isMailDialogOpen, setIsMailDialogOpen] = useState(false)
  const [mailSubject, setMailSubject] = useState("")
  const [mailMessage, setMailMessage] = useState("")
  const [mailTo, setMailTo] = useState("")

  // Task creation state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoard, setSelectedBoard] = useState("")
  const [lists, setLists] = useState<List[]>([])
  const [selectedList, setSelectedList] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [assignedTo, setAssignedTo] = useState("unassigned")
  const [boardMembers, setBoardMembers] = useState<User[]>([])
  const [labels, setLabels] = useState<LabelType[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [isDeletingLabel, setIsDeletingLabel] = useState(false)
  const [labelToDelete, setLabelToDelete] = useState<LabelType | null>(null)
  const [showDeleteLabelConfirm, setShowDeleteLabelConfirm] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<User[]>([])

  // Add this code to the Header component to ensure proper theme application
  // Inside the Header component, add this line near the top
  const { theme } = useTheme()

  // Get page title based on pathname
  const getPageTitle = () => {
    if (pathname?.includes("/tasks")) return "My Tasks"
    if (pathname?.includes("/teams")) return "Teams"
    if (pathname?.includes("/boards")) return "Boards"
    if (pathname?.includes("/starred")) return "Starred"
    if (pathname?.includes("/notifications")) return "Notifications"
    if (pathname?.includes("/profile")) return "Profile"
    if (pathname?.includes("/settings")) return "Settings"
    return "Dashboard"
  }

  // Fetch boards when dialog opens
  useEffect(() => {
    if (isTaskDialogOpen) {
      fetchBoards()
    }
  }, [isTaskDialogOpen])

  // Fetch lists when board is selected
  useEffect(() => {
    if (selectedBoard) {
      fetchLists()
      fetchBoardMembers()
      fetchLabels()
    } else {
      setLists([])
      setSelectedList("")
      setBoardMembers([])
      setLabels([])
    }
  }, [selectedBoard])

  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/boards")
      if (!response.ok) {
        throw new Error("Failed to fetch boards")
      }
      const data = await response.json()
      setBoards(data)

      // Select the first board by default if available
      if (data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching boards:", error)
      toast({
        title: "Error",
        description: "Failed to fetch boards. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchLists = async () => {
    try {
      const response = await fetch(`/api/boards/${selectedBoard}/lists`)
      if (!response.ok) {
        console.warn("Failed to fetch lists:", response.status)
        setLists([])
        return
      }
      const data = await response.json()
      setLists(data)

      // Select the first list by default if available
      if (data.length > 0) {
        setSelectedList(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching lists:", error)
      setLists([])
    }
  }

  const fetchBoardMembers = async () => {
    try {
      const response = await fetch(`/api/boards/${selectedBoard}/members`)
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
      // Fallback to just the current user if there's an error
      if (user) {
        setAssignableUsers([user])
      }
    }
  }

  const fetchLabels = async () => {
    try {
      const response = await fetch(`/api/labels?boardId=${selectedBoard}`)
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

  const resetTaskForm = () => {
    setTaskTitle("")
    setTaskDescription("")
    setSelectedBoard("")
    setSelectedList("")
    setPriority("Medium")
    setDueDate(undefined)
    setAssignedTo("unassigned")
    setSelectedLabels([])
    setAttachments([])
    setNewLabelName("")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskTitle.trim() || !selectedBoard || !selectedList) {
      toast({
        title: "Error",
        description: "Task title, board, and list are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create the task with attachments included
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription || null,
          listId: selectedList,
          dueDate: dueDate ? dueDate.toISOString() : null,
          priority: priority,
          assignedTo: assignedTo === "unassigned" ? null : assignedTo,
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

      toast({
        title: "Success",
        description: "Task created successfully",
      })

      setIsTaskDialogOpen(false)
      resetTaskForm()
      router.push(`/tasks/${task.id}`)
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

  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault()

    if (!mailTo.trim() || !mailSubject.trim()) {
      toast({
        title: "Error",
        description: "Email recipient and subject are required",
        variant: "destructive",
      })
      return
    }

    // This is a mock function since we don't have actual email functionality
    toast({
      title: "Email Sent",
      description: `Your message has been sent to ${mailTo}`,
    })

    setIsMailDialogOpen(false)
    setMailTo("")
    setMailSubject("")
    setMailMessage("")
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const handleUploadComplete = (attachment: Attachment) => {
    setAttachments([...attachments, attachment])
    setShowUploadDialog(false)
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

  const confirmDeleteLabel = (label: LabelType, e: React.MouseEvent) => {
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

  // Then update the header className to include theme-specific styling
  return (
    <header className="header flex h-16 items-center px-4 border-b sticky top-0 z-10">
      <div className="flex items-center w-full max-w-screen-2xl mx-auto">
        {/* Logo and name removed */}

        <div className="flex items-center w-full">
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="w-full bg-background border-border pl-8 focus-visible:ring-yellow-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
                <Plus className="h-4 w-4 mr-2" />
                New task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-background text-foreground">
              <DialogHeader>
                <DialogTitle>Create a new task</DialogTitle>
                <DialogDescription>Add a new task to your workspace</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-foreground">
                      Task Title <span className="text-red-500 dark:text-red-400">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter task title"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Enter task description"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="board" className="text-sm font-medium">
                        Board <span className="text-red-500">*</span>
                      </Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="list" className="text-sm font-medium">
                        List <span className="text-red-500">*</span>
                      </Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium">
                        Priority
                      </Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className="text-sm font-medium">
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
                      <Label htmlFor="assignee" className="text-sm font-medium">
                        Assignee
                      </Label>
                      <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger id="assignee">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {/* Only show the current user if no board is selected */}
                          {!selectedBoard && user && (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} (You)
                            </SelectItem>
                          )}
                          {/* Show board members when a board is selected */}
                          {selectedBoard &&
                            assignableUsers.map((assignableUser) => (
                              <SelectItem key={assignableUser.id} value={assignableUser.id}>
                                {assignableUser.name} {assignableUser.id === user?.id ? "(You)" : ""}
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
                                    onSelect={() => toggleLabel(label.id)}
                                    className="flex items-center gap-2 cursor-pointer justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: label.color }}
                                      ></div>
                                      <span>{label.name}</span>
                                    </div>
                                    <div className="flex items-center">
                                      {selectedLabels.includes(label.id) && (
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
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Select a board first to create labels
                                  </p>
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
                                style={{
                                  backgroundColor: label.color,
                                  color: "#fff",
                                  borderColor: "transparent",
                                }}
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
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                          <div className="bg-muted p-2 rounded">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{attachment.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {attachment.size} bytes • Uploaded by you
                            </div>
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

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUploadDialog(true)}
                        className="w-full"
                      >
                        Add Attachment
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsTaskDialogOpen(false)
                      resetTaskForm()
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    disabled={isSubmitting || !taskTitle.trim() || !selectedBoard || !selectedList}
                  >
                    {isSubmitting ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <ThemeToggle />

          <Dialog open={isMailDialogOpen} onOpenChange={setIsMailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground">
                <Mail className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Message</DialogTitle>
                <DialogDescription>Send a message to team members</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendMail}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="to">To</Label>
                    <Input
                      id="to"
                      placeholder="recipient@example.com"
                      value={mailTo}
                      onChange={(e) => setMailTo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Message subject"
                      value={mailSubject}
                      onChange={(e) => setMailSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here"
                      value={mailMessage}
                      onChange={(e) => setMailMessage(e.target.value)}
                      rows={5}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsMailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black">
                    Send Message
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <NotificationsButton />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-yellow-300 text-black">{user?.name?.charAt(0) || "T"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background text-foreground" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Upload Attachment Dialog */}
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

      {/* Delete Label Confirmation Dialog */}
      <Dialog
        open={showDeleteLabelConfirm}
        onOpenChange={(open) => {
          setShowDeleteLabelConfirm(open)
          if (!open) setLabelToDelete(null)
        }}
      >
        <DialogContent className="z-[100] bg-background text-foreground">
          <DialogHeader>
            <DialogTitle>Delete Label</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the label "{labelToDelete?.name}"? This action cannot be undone.
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
    </header>
  )
}
