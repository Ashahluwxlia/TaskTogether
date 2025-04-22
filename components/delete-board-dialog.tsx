"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

interface DeleteBoardDialogProps {
  boardId: string
  boardName: string
  trigger?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onDelete?: () => void // Make sure onDelete is defined and optional
}

export function DeleteBoardDialog({
  boardId,
  boardName,
  trigger,
  isOpen,
  onOpenChange,
  onDelete,
}: DeleteBoardDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Use either the controlled state from props or the internal state
  const open = isOpen !== undefined ? isOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete board")
      }

      toast({
        title: "Board deleted",
        description: `Board "${boardName}" has been deleted successfully.`,
      })

      setOpen(false)

      // Redirect to the boards page
      router.push("/boards")
      onDelete && onDelete()
    } catch (error) {
      console.error("Error deleting board:", error)
      toast({
        title: "Error deleting board",
        description: error instanceof Error ? error.message : "Failed to delete board. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // If we're using the component with a trigger, render it with the trigger
  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Board</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the board "{boardName}"? This action cannot be undone and all lists,
              tasks, and comments will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Board"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Otherwise, just render the dialog content (for controlled usage)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Board</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the board "{boardName}"? This action cannot be undone and all lists, tasks,
            and comments will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
