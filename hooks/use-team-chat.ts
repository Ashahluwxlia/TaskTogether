"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, format } from "date-fns"

// Debounce function to limit API calls
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export interface TeamChatMessage {
  id: string
  content: string
  team_id: string
  sender_id: string
  sender_name: string
  sender_image?: string | null
  created_at: string
  updated_at: string
  is_deleted: boolean
}

interface UseTeamChatProps {
  teamId: string
  initialMessages?: TeamChatMessage[]
}

export function useTeamChat({ teamId, initialMessages = [] }: UseTeamChatProps) {
  const [messages, setMessages] = useState<TeamChatMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const { toast } = useToast()

  // Fetch messages with debouncing to prevent excessive API calls
  const fetchMessagesRaw = async (pageNum = 1, replace = true) => {
    try {
      setError(null)
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response = await fetch(`/api/teams/${teamId}/chat?page=${pageNum}&limit=20`)

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const data = await response.json()

      // Update messages state
      if (replace) {
        setMessages(data.messages)
      } else {
        setMessages((prev) => [...data.messages, ...prev])
      }

      // Update pagination state
      setHasMoreMessages(data.hasMore)
      setPage(pageNum)

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load messages"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const fetchMessages = useCallback(debounce(fetchMessagesRaw, 300), [teamId, toast])

  // Add a refresh function to explicitly reload messages:
  const refreshMessages = useCallback(async () => {
    return await fetchMessagesRaw(1, true)
  }, [fetchMessagesRaw])

  // Load initial messages
  useEffect(() => {
    // Only fetch if initialMessages is truly empty (not just a new reference)
    if (!initialMessages || initialMessages.length === 0) {
      fetchMessages(1)
    } else {
      setIsLoading(false)
      setMessages(initialMessages)
    }
    // Note: removed the interval that was causing excessive API calls
  }, [fetchMessages, initialMessages && initialMessages.length])

  // Send a new message
  const sendMessage = async (content: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const newMessage = await response.json()
      setMessages((prev) => [...prev, newMessage])
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      return false
    }
  }

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/chat/${messageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete message")
      }

      // Update the message in the state to mark it as deleted
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_deleted: true, content: "This message has been deleted" } : msg,
        ),
      )

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete message"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      return false
    }
  }

  // Load more messages
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return false
    return await fetchMessages(page + 1, false)
  }

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return format(date, "h:mm a")
    }

    return formatDistanceToNow(date, { addSuffix: true })
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
    formatMessageTime,
    refreshMessages, // Add this new function
  }
}
