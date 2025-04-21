"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export function useAuthorization(
  resourceType: "board" | "team" | "task",
  resourceId: string,
  requiredPermission: "view" | "edit" | "admin" = "view",
) {
  const { user } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkPermission() {
      if (!user) {
        setIsAuthorized(false)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/permissions?resourceType=${resourceType}&resourceId=${resourceId}&permission=${requiredPermission}`,
        )

        if (!response.ok) {
          throw new Error("Failed to check permissions")
        }

        const { hasPermission } = await response.json()
        setIsAuthorized(hasPermission)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [user, resourceType, resourceId, requiredPermission])

  return { isAuthorized, isLoading, error }
}
