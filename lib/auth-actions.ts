"use client"

import { useRouter } from "next/navigation"

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export async function loginUser(credentials: LoginCredentials) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Login failed")
    }

    return data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export async function registerUser(credentials: RegisterCredentials) {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Registration failed")
    }

    return data
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

export async function logoutUser() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || "Logout failed")
    }

    return true
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}

export async function getCurrentUser() {
  try {
    const response = await fetch("/api/auth/me")

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export function useAuth() {
  const router = useRouter()

  const login = async (credentials: LoginCredentials) => {
    const result = await loginUser(credentials)
    router.push("/dashboard")
    return result
  }

  const register = async (credentials: RegisterCredentials) => {
    const result = await registerUser(credentials)
    router.push("/dashboard")
    return result
  }

  const logout = async () => {
    await logoutUser()
    router.push("/")
  }

  return {
    login,
    register,
    logout,
    getCurrentUser,
  }
}
