"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { SimplePhotoUpload } from "./simple-photo-upload"

interface User {
  id: string
  name: string
  email: string
  image: string | null
  _timestamp?: number // Optional timestamp for forcing re-renders
}

interface ProfileContentProps {
  user: User
}

export function ProfileContent({ user }: ProfileContentProps) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userImage, setUserImage] = useState<string | null>(user.image)
  const [componentKey, setComponentKey] = useState(Date.now()) // Force re-render key

  // Update state when user prop changes
  useEffect(() => {
    console.log("User in ProfileContent updated:", user)
    setName(user.name)
    setUserImage(user.image)
    // Force re-render when user changes
    setComponentKey(Date.now())
  }, [user, user._timestamp])

  const handlePhotoSuccess = (imageUrl: string) => {
    console.log("Photo upload success, new URL:", imageUrl)
    setUserImage(imageUrl)
    setSuccess("Profile photo uploaded successfully")

    // Use router.refresh() instead of window.location.reload()
    // This will refresh the server components without a full page reload
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update profile")
      }

      setSuccess("Profile updated successfully")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 p-6" key={componentKey}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Profile photo</h2>
              <SimplePhotoUpload userName={user.name} currentImageUrl={userImage} onSuccess={handlePhotoSuccess} />
            </div>

            <Separator />

            <div className="pt-2">
              <h2 className="text-lg font-semibold mb-4">Contact</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full name<span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Type your name here"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </label>
                  <div className="text-gray-700">{user.email}</div>
                  <p className="text-xs text-muted-foreground">
                    Your email address is used for login and cannot be changed.
                  </p>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                    {isLoading ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
