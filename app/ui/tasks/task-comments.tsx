"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { Send } from "lucide-react"
import { useComments } from "@/hooks/use-comments"
import { useUser } from "@/contexts/user-context"

interface TaskCommentsProps {
  taskId: string
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { comments, isLoading, error, addComment } = useComments(taskId)
  const { user } = useUser()
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) return

    try {
      setIsSubmitting(true)
      const addedComment = await addComment(newComment)
      setNewComment("")

      // No need to refresh the page or fetch comments again
      // The useComments hook should handle updating the local state
    } catch (error) {
      console.error("Error adding comment:", error)
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading comments...</div>
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>
  }

  // Function to highlight mentions in comment content
  const highlightMentions = (content: string) => {
    // Escape HTML to prevent XSS
    const escapedContent = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")

    // Then highlight mentions
    return escapedContent.replace(/@(\w+)/g, '<span class="text-blue-500 font-medium">@$1</span>')
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Comments ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Add a comment... (Use @ to mention team members)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px]"
        />
        <Button type="submit" size="icon" disabled={isSubmitting || !newComment.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${comment.user.email}`} alt={comment.user.name} />
                <AvatarFallback>
                  {comment.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{comment.user.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div
                  className="text-sm mt-1"
                  dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
