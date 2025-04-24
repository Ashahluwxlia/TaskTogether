"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { useUser } from "@/contexts/user-context"

interface AddCommentProps {
  taskId: string
  onAddComment: (content: string) => Promise<any>
  boardMembers?: Array<{ user: { name: string; email: string } }>
}

export function AddComment({ taskId, onAddComment, boardMembers = [] }: AddCommentProps) {
  const { user } = useUser()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState("")
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [open, _setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) return

    try {
      setIsSubmitting(true)
      await onAddComment(content)
      setContent("")
    } catch (error) {
      console.error("Error adding comment:", error)
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit(e)
    }

    // Handle @ mentions
    if (e.key === "@") {
      const textarea = textareaRef.current
      if (textarea) {
        const cursorPosition = textarea.selectionStart
        const textBeforeCursor = textarea.value.substring(0, cursorPosition)

        // Calculate position for mention dropdown
        const cursorCoords = getCaretCoordinates(textarea, cursorPosition)
        setMentionPosition({
          top: cursorCoords.top + 20,
          left: cursorCoords.left,
        })

        setShowMentions(true)
        setMentionFilter("")
      }
    }

    // Close mentions dropdown on escape
    if (e.key === "Escape" && showMentions) {
      setShowMentions(false)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)

    // Check for @ mentions
    const textarea = e.target
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = textarea.value.substring(0, cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const filter = mentionMatch[1].toLowerCase()
      setMentionFilter(filter)

      // Calculate position for mention dropdown
      const cursorCoords = getCaretCoordinates(textarea, cursorPosition)
      setMentionPosition({
        top: cursorCoords.top + 20,
        left: cursorCoords.left - mentionMatch[0].length * 8, // Approximate character width
      })

      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (name: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const cursorPosition = textarea.selectionStart
      const textBeforeCursor = textarea.value.substring(0, cursorPosition)
      const textAfterCursor = textarea.value.substring(cursorPosition)

      // Replace the partial @mention with the full name
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
      if (mentionMatch) {
        const newTextBeforeCursor = textBeforeCursor.substring(0, cursorPosition - mentionMatch[0].length)
        const newContent = `${newTextBeforeCursor}@${name} ${textAfterCursor}`
        setContent(newContent)

        // Set cursor position after the inserted mention
        setTimeout(() => {
          textarea.focus()
          const newPosition = newTextBeforeCursor.length + name.length + 2 // +2 for @ and space
          textarea.setSelectionRange(newPosition, newPosition)
        }, 0)
      }
    }

    setShowMentions(false)
  }

  // Helper function to get caret coordinates in a textarea
  const getCaretCoordinates = (element: HTMLTextAreaElement, _position: number) => {
    // This is a simplified version - in a real app, you'd use a library or more complex calculation
    const { offsetLeft, offsetTop } = element
    return { top: offsetTop + 20, left: offsetLeft + 10 }
  }

  const handleEmojiPickerToggle = () => {
    _setOpen((prevOpen) => !prevOpen)
  }

  // Filter board members for mentions
  const filteredMembers = boardMembers
    .filter((member) => member.user.name.toLowerCase().includes(mentionFilter.toLowerCase()))
    .slice(0, 5) // Limit to 5 suggestions

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src={user?.email ? `https://avatar.vercel.sh/${user.email}` : undefined} alt={user?.name || ""} />
        <AvatarFallback>
          {user?.name
            ? user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          placeholder="Add a comment... (Use @ to mention team members)"
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] resize-y"
        />

        {showMentions && filteredMembers.length > 0 && (
          <div
            className="absolute z-10 bg-background border rounded-md shadow-md p-1"
            style={{ top: mentionPosition.top, left: mentionPosition.left }}
            role="listbox"
          >
            {filteredMembers.map((member) => (
              <button
                key={member.user.email}
                className="px-2 py-1 hover:bg-accent rounded cursor-pointer w-full text-left"
                onClick={() => insertMention(member.user.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    insertMention(member.user.name)
                  }
                }}
                role="option"
              >
                {member.user.name}
              </button>
            ))}
          </div>
        )}

        <Button
          type="submit"
          size="sm"
          className="absolute bottom-2 right-2"
          disabled={isSubmitting || !content.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
