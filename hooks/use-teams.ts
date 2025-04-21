"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface Team {
  id: string
  name: string
  description?: string | null
  createdAt: Date
  ownerId: string
  members: TeamMember[]
  owner: {
    id: string
    name: string
    email: string
  }
}

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

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchTeams() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/teams")

        if (!response.ok) {
          throw new Error("Failed to fetch teams")
        }

        const data = await response.json()
        setTeams(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load teams",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeams()
  }, [])

  const createTeam = async (name: string, description?: string, members?: Array<{ email: string; role: string }>) => {
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, members }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to create team")
      }

      const newTeam = await response.json()
      setTeams([newTeam, ...teams])

      // Refresh the page data to ensure we have the latest data
      router.refresh()

      toast({
        title: "Success",
        description: `Team "${name}" created successfully`,
      })

      return newTeam
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create team",
        variant: "destructive",
      })
      throw err
    }
  }

  return {
    teams,
    isLoading,
    error,
    createTeam,
  }
}
