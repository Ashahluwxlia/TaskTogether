"use client"

import { useState, useEffect, useCallback } from "react"

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export function useComments(taskId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    if (!taskId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/tasks/${taskId}/comments`)

      if (!response.ok) {
        throw new Error("Failed to fetch comments")
      }

      const data = await response.json()
      setComments(data)
    } catch (err) {
      console.error("Error fetching comments:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch comments")
    } finally {
      setIsLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const addComment = useCallback(
    async (content: string) => {
      if (!taskId || !content.trim()) {
        throw new Error("Task ID and comment content are required")
      }

      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId,
            content,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to add comment")
        }

        const newComment = await response.json()

        // Update the local state with the new comment
        setComments((prevComments) => [newComment, ...prevComments])

        return newComment
      } catch (err) {
        console.error("Error adding comment:", err)
        setError(err instanceof Error ? err.message : "Failed to add comment")
        throw err
      }
    },
    [taskId],
  )

  return { comments, isLoading, error, addComment, refreshComments: fetchComments }
}
