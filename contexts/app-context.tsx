"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types"

interface AppContextType {
  appName: string
  appInitials: string
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  // Add other app-wide settings here
}

const AppContext = createContext<AppContextType>({
  appName: "TaskTogether",
  appInitials: "TT",
  user: null,
  isLoading: true,
  setUser: (user: User | null) => {},
  logout: async () => {},
  refreshUser: async () => {},
})

export const useAppContext = () => useContext(AppContext)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [appState] = useState({
    appName: "TaskTogether",
    appInitials: "TT",
  })

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.data)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AppContext.Provider
      value={{
        ...appState,
        user,
        isLoading,
        setUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
