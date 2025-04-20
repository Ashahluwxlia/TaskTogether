"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/me")

      if (!response.ok) {
        if (response.status !== 401) {
          // Only show error for non-auth related issues
          toast({
            title: "Error",
            description: "Failed to fetch user data",
            variant: "destructive",
          })
        }
        setUser(null)
        return
      }

      const userData = await response.json()
      setUser(userData)
    } catch (_error) {
      console.error("Error refreshing user:", _error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Login failed")
      }

      await refreshUser()
      router.push("/dashboard")
      toast({
        title: "Success",
        description: "You have been logged in successfully",
      })
    } catch (_error) {
      console.error("Login error:", _error)
      toast({
        title: "Login failed",
        description: _error instanceof Error ? _error.message : "Invalid credentials",
        variant: "destructive",
      })
      throw _error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Registration failed")
      }

      await refreshUser()
      router.push("/dashboard")
      toast({
        title: "Success",
        description: "Your account has been created successfully",
      })
    } catch (_error) {
      console.error("Registration error:", _error)
      toast({
        title: "Registration failed",
        description: _error instanceof Error ? _error.message : "Could not create account",
        variant: "destructive",
      })
      throw _error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Logout failed")
      }

      setUser(null)
      router.push("/")
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      })
    } catch (_error) {
      console.error("Logout error:", _error)
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
