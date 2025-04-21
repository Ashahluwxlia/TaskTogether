"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

interface BoardMember {
  id: string
  role: string
  userId: string
  boardId: string
  user: {
    id: string
    name: string
    email: string
  }
}

export function useBoardMembers(boardId: string) {
  const [members, setMembers] = useState<BoardMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembers() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/boards/${boardId}/members`)

        if (!response.ok) {
          throw new Error("Failed to fetch board members")
        }

        const data = await response.json()
        setMembers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load board members",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (boardId) {
      fetchMembers()
    }
  }, [boardId])

  const inviteMember = async (email: string, role: string, message?: string) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role, message }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to invite member")
      }

      const newMember = await response.json()
      setMembers([...members, newMember])

      return newMember
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to invite member",
        variant: "destructive",
      })
      throw err
    }
  }

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update member role")
      }

      const updatedMember = await response.json()
      setMembers(members.map((member) => (member.id === memberId ? updatedMember : member)))

      return updatedMember
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update member role",
        variant: "destructive",
      })
      throw err
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to remove member")
      }

      setMembers(members.filter((member) => member.id !== memberId))

      return true
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove member",
        variant: "destructive",
      })
      throw err
    }
  }

  return {
    members,
    isLoading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
  }
}
