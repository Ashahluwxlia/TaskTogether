"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteTeamModalProps {
  teamId: string
  teamName: string
  isOpen: boolean
  onClose: () => void
  onTeamDeleted: () => void
}

export function DeleteTeamModal({ teamId, teamName, isOpen, onClose, onTeamDeleted }: DeleteTeamModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      })

      // Always try to parse the response as JSON
      let data
      try {
        data = await response.json()
      } catch (e) {
        // If it's not JSON, create a default error object
        data = { error: "An unexpected error occurred" }
      }

      if (!response.ok) {
        // Extract error message from the response
        const errorMessage = data?.message || data?.error || "Failed to delete team"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Team deleted",
        description: "The team has been successfully deleted.",
      })

      onTeamDeleted()
      onClose()
    } catch (error: any) {
      console.error("Error deleting team:", error)
      const errorMessage = error.message || "An unexpected error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the team &quot;{teamName}&quot; and all associated data. This action cannot be
            undone.
          </AlertDialogDescription>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md" role="alert">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Team"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
