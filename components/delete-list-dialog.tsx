"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Trash } from "lucide-react"

interface DeleteListDialogProps {
  listId: string
  listTitle: string
  onDelete: () => void
}

export function DeleteListDialog({ listId, listTitle, onDelete }: DeleteListDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete list")
      }

      toast({
        title: "List deleted",
        description: `"${listTitle}" has been deleted successfully.`,
      })

      setOpen(false)
      onDelete()
    } catch (error) {
      console.error("Error deleting list:", error)
      toast({
        title: "Error",
        description: "Failed to delete list. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full flex items-center justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
      >
        <Trash className="h-4 w-4 mr-2" />
        Delete list
      </Button>

      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          // Prevent event propagation when opening/closing the dialog
          setOpen(newOpen)
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="sm:max-w-[425px]"
        >
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the list "{listTitle}"? This action cannot be undone and all tasks in this
              list will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
