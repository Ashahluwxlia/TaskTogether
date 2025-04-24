"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ChevronLeft, Edit, Users, Star, StarOff, Settings, Palette } from "lucide-react"
import { InviteMemberDialog } from "./invite-member-dialog"
import { useBoardMembers } from "@/hooks/use-board-members"
import { useRouter } from "next/navigation"
import { DeleteBoardDialog } from "@/components/delete-board-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface BoardHeaderProps {
  board: {
    id: string
    title: string
    description: string | null
    teamId: string | null
    team?: {
      id: string
      name: string
    } | null
    isStarred?: boolean
    backgroundColor?: string
  }
  onUpdateBoard: (data: { title?: string; description?: string; backgroundColor?: string }) => Promise<void>
  onToggleStar?: () => Promise<void>
}

// Predefined color options
const colorOptions = [
  { name: "Default", value: "#ffffff" },
  { name: "Blue", value: "#e3f2fd" },
  { name: "Green", value: "#e8f5e9" },
  { name: "Purple", value: "#f3e5f5" },
  { name: "Pink", value: "#fce4ec" },
  { name: "Yellow", value: "#fffde7" },
  { name: "Orange", value: "#fff3e0" },
  { name: "Red", value: "#ffebee" },
  { name: "Teal", value: "#e0f2f1" },
  { name: "Indigo", value: "#e8eaf6" },
]

export function BoardHeader({ board, onUpdateBoard, onToggleStar }: BoardHeaderProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(board.title)
  const [description, setDescription] = useState(board.description || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStarred, setIsStarred] = useState(board.isStarred)
  const [backgroundColor, setBackgroundColor] = useState(board.backgroundColor || "#ffffff")
  const { inviteMember } = useBoardMembers(board.id)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Apply background color to the board
  useEffect(() => {
    document.body.style.backgroundColor = backgroundColor
    return () => {
      document.body.style.backgroundColor = ""
    }
  }, [backgroundColor])

  // Update local state when board props change
  useEffect(() => {
    setTitle(board.title)
    setDescription(board.description || "")
    setIsStarred(board.isStarred)
    setBackgroundColor(board.backgroundColor || "#ffffff")
  }, [board])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Board name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onUpdateBoard({
        title: title.trim(),
        description: description.trim() || undefined,
        backgroundColor: backgroundColor,
      })

      setIsEditing(false)
      toast({
        title: "Success",
        description: "Board updated successfully",
      })

      // Force a refresh to update the board name in all places
      router.refresh()
    } catch (error) {
      console.error("Error updating board:", error)
      toast({
        title: "Error",
        description: "Failed to update board",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStar = async () => {
    try {
      // Optimistically update UI
      setIsStarred(!isStarred)

      // Call the parent's onToggleStar if provided
      if (onToggleStar) {
        await onToggleStar()
        return // Let the parent handle the API call and toast
      }

      // Otherwise, handle it here
      const response = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_starred: !isStarred,
        }),
      })

      if (!response.ok) {
        // Revert on failure
        setIsStarred(isStarred)
        throw new Error("Failed to update starred status")
      }

      toast({
        title: isStarred ? "Board unstarred" : "Board starred",
        description: `${board.title} has been ${isStarred ? "removed from" : "added to"} your starred boards.`,
      })

      router.refresh()
    } catch (error) {
      console.error("Error toggling star:", error)
      toast({
        title: "Error",
        description: "Failed to update starred status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleChangeBackgroundColor = async (color: string) => {
    try {
      // Optimistically update UI immediately
      setBackgroundColor(color)

      // Apply the color change to the document body and main container immediately
      document.body.style.backgroundColor = color
      const mainContainer = document.querySelector(".flex-1.flex.flex-col.h-full")
      if (mainContainer) {
        ;(mainContainer as HTMLElement).style.backgroundColor = color
      }

      // Call the API to update the background color
      await onUpdateBoard({
        backgroundColor: color,
      })

      toast({
        title: "Background updated",
        description: "Board background color has been updated successfully.",
      })

      // No need to call router.refresh() as we've already updated the UI
    } catch (error) {
      console.error("Error changing background color:", error)
      toast({
        title: "Error",
        description: "Failed to update background color. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsColorPickerOpen(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/boards">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>

        {/* Add a separate link to the team page if the board belongs to a team */}
        {board.team && (
          <Button variant="ghost" size="sm" asChild className="flex items-center gap-1">
            <Link href={`/teams/${board.team.id}`}>
              <Users className="h-4 w-4 mr-1" />
              Back to {board.team.name}
            </Link>
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Board name"
            className="text-xl font-bold h-auto py-2"
            autoFocus
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{board.title}</h1>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleToggleStar}>
              {isStarred ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Board settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault()
                      setIsColorPickerOpen(true)
                    }}
                  >
                    <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                      <PopoverTrigger asChild>
                        <div className="flex items-center w-full">
                          <Palette className="mr-2 h-4 w-4" />
                          <span>Change background</span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-64 p-3"
                        onInteractOutside={(e) => {
                          // Prevent closing when interacting with the content
                          e.preventDefault()
                        }}
                      >
                        <div className="space-y-2">
                          <h4 className="font-medium">Background Color</h4>
                          <div className="grid grid-cols-5 gap-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                className={`h-8 w-8 rounded-md border ${
                                  backgroundColor === color.value ? "ring-2 ring-primary" : ""
                                }`}
                                style={{ backgroundColor: color.value }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleChangeBackgroundColor(color.value)
                                }}
                                title={color.name}
                                aria-label={`Set background to ${color.name}`}
                              />
                            ))}
                          </div>
                          <div className="mt-3">
                            <label htmlFor="custom-color" className="text-sm font-medium">
                              Custom color
                            </label>
                            <div className="flex mt-1 gap-2">
                              <input
                                type="color"
                                id="custom-color"
                                value={backgroundColor}
                                onChange={(e) => handleChangeBackgroundColor(e.target.value)}
                                className="h-8 w-8 cursor-pointer"
                              />
                              <Input
                                value={backgroundColor}
                                onChange={(e) => handleChangeBackgroundColor(e.target.value)}
                                className="h-8 flex-1"
                                placeholder="#RRGGBB"
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DeleteBoardDialog
                    boardId={board.id}
                    boardName={board.title}
                    trigger={
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer"
                        onSelect={(e) => e.preventDefault()}
                      >
                        Delete board
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
              <InviteMemberDialog boardId={board.id} onInvite={inviteMember} />
            </div>
          </div>
          {board.description && <p className="text-muted-foreground mt-1">{board.description}</p>}
        </div>
      )}
    </div>
  )
}
