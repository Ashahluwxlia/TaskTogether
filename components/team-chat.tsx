"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/app/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Send, Trash2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, format } from "date-fns"

interface TeamChatMessage {
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

interface TeamChatProps {
  teamId: string
  initialMessages?: TeamChatMessage[]
}

export function TeamChat({ teamId, initialMessages = [] }: TeamChatProps) {
  const [messages, setMessages] = useState<TeamChatMessage[]>(initialMessages || [])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [page, setPage] = useState(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const { toast } = useToast()

  // Fetch messages only when explicitly called
  const fetchMessages = useCallback(
    async (pageNum = 1, replace = true) => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/teams/${teamId}/chat?page=${pageNum}&limit=20`)

        if (!response.ok) {
          throw new Error("Failed to fetch messages")
        }

        const data = await response.json()

        if (replace) {
          setMessages(data.messages)
        } else {
          setMessages((prev) => [...data.messages, ...prev])
        }

        setHasMoreMessages(data.hasMore)
        setPage(pageNum)
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load messages"
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [teamId, toast],
  )

  // Initial load - only once
  useEffect(() => {
    // Only fetch if no initial messages were provided
    if (!initialMessages || initialMessages.length === 0) {
      fetchMessages(1, true)
    }
    // Empty dependency array means this runs once on mount
  }, []) // Intentionally not including fetchMessages to prevent re-fetching

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isScrolledUp) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isScrolledUp])

  // Handle scroll to detect when user scrolls up
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setIsScrolledUp(!isAtBottom)

      // Load more messages when scrolled to top
      if (scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
        handleLoadMore()
      }
    }
  }

  // Handle loading more messages
  const handleLoadMore = async () => {
    if (isLoadingMore) return

    setIsLoadingMore(true)
    try {
      // Save current scroll position
      const scrollContainer = messagesContainerRef.current
      const scrollPosition = scrollContainer?.scrollHeight || 0

      // Load more messages
      const success = await fetchMessages(page + 1, false)

      // Restore scroll position if messages were loaded
      if (success && scrollContainer) {
        setTimeout(() => {
          const newScrollHeight = scrollContainer.scrollHeight
          scrollContainer.scrollTop = newScrollHeight - scrollPosition
        }, 100)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const newMessageData = await response.json()
      setMessages((prev) => [...prev, newMessageData])
      setNewMessage("")
      setIsScrolledUp(false) // Scroll to bottom after sending
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle deleting a message
  const handleDeleteMessage = async (messageId: string) => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete message"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
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

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Manual refresh button handler
  const handleManualRefresh = () => {
    fetchMessages(1, true)
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-220px)]">
      <CardHeader className="px-4 py-3 border-b flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">Team Chat</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleManualRefresh} disabled={isLoading} title="Refresh messages">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>

      {/* Messages container */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef} onScroll={handleScroll}>
        {/* Load more button */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more messages"
              )}
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">Start the conversation with your team!</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          // Group consecutive messages from the same sender
          const isFirstInGroup = index === 0 || messages[index - 1].sender_id !== message.sender_id
          const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender_id !== message.sender_id

          return (
            <div key={message.id} className={cn("flex items-start gap-3", !isFirstInGroup && "pl-12 mt-1")}>
              {isFirstInGroup && (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={message.sender_image || undefined} alt={message.sender_name} />
                  <AvatarFallback>{getInitials(message.sender_name)}</AvatarFallback>
                </Avatar>
              )}

              <div className={cn("flex-1", !isFirstInGroup && "mt-0.5")}>
                {isFirstInGroup && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{message.sender_name}</span>
                    <span className="text-xs text-muted-foreground">{formatMessageTime(message.created_at)}</span>
                  </div>
                )}

                <div className="group relative">
                  {message.is_deleted ? (
                    <p className="italic text-muted-foreground">This message has been deleted</p>
                  ) : (
                    <div className="bg-muted p-3 rounded-md whitespace-pre-wrap break-words">{message.content}</div>
                  )}

                  {!message.is_deleted && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteMessage(message.id)}
                      title="Delete message"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message input */}
      <CardFooter className="p-4 border-t mt-auto">
        <form onSubmit={handleSendMessage} className="w-full">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
            <Button type="submit" disabled={!newMessage.trim() || isSubmitting} className="self-end">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for a new line</p>
        </form>
      </CardFooter>
    </Card>
  )
}
