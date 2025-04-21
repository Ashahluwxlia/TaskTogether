"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

interface TeamMember {
  id: string
  role: string
  userId: string
  teamId: string
  user: {
    id: string
    name: string
    email: string
  }
}

export function useTeamMembers(teamId: string) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembers() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/teams/${teamId}/members`)

        if (!response.ok) {
          throw new Error("Failed to fetch team members")
        }

        const data = await response.json()
        setMembers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load team members",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (teamId) {
      fetchMembers()
    }
  }, [teamId])

  const inviteMember = async (email: string, role: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
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

  const updateMemberRole = async (userId: string, role: string) => {
    try {
      // Validate role is either ADMIN or MEMBER
      if (role !== "ADMIN" && role !== "MEMBER") {
        throw new Error("Invalid role. Role must be either ADMIN or MEMBER")
      }

      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
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
      setMembers(members.map((member) => (member.user.id === userId ? updatedMember : member)))

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

  const removeMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to remove member")
      }

      setMembers(members.filter((member) => member.user.id !== userId))

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
