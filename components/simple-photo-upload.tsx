"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SimplePhotoUploadProps {
  userName: string
  currentImageUrl: string | null
  onSuccess?: (imageUrl: string) => void
}

export function SimplePhotoUpload({ userName, currentImageUrl, onSuccess }: SimplePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageKey, setImageKey] = useState(Date.now())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview URL when currentImageUrl changes
  useEffect(() => {
    console.log("Current image URL in SimplePhotoUpload:", currentImageUrl)
    if (currentImageUrl) {
      // Add a small random query parameter to prevent browser caching
      // but not a timestamp that changes every render
      if (!currentImageUrl.includes("?")) {
        setPreviewUrl(`${currentImageUrl}?v=${Math.random().toString(36).substring(2, 8)}`)
      } else {
        setPreviewUrl(currentImageUrl)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [currentImageUrl])

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("File selected:", file.name, file.type, file.size)

    // Create a preview immediately for better UX
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload the file
    await uploadFile(file)

    // Clean up object URL
    URL.revokeObjectURL(objectUrl)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append("photo", file)

      const response = await fetch("/api/profile-photo", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      if (data.imageUrl) {
        // Add a small random query parameter to prevent browser caching
        const imageUrlWithParam = `${data.imageUrl}?v=${Math.random().toString(36).substring(2, 8)}`
        setPreviewUrl(imageUrlWithParam)
        setImageKey(Date.now())

        if (onSuccess) {
          onSuccess(data.imageUrl)
        }
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload profile photo")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24 border">
            {previewUrl ? (
              <AvatarImage
                key={imageKey}
                src={previewUrl || "/placeholder.svg"}
                alt={userName}
                className="object-cover"
                onError={(e) => {
                  console.error("Failed to load image:", previewUrl)
                  // Try without query parameters if loading fails
                  if (previewUrl && previewUrl.includes("?")) {
                    const baseUrl = previewUrl.split("?")[0]
                    e.currentTarget.src = baseUrl
                  } else {
                    e.currentTarget.style.display = "none"
                  }
                }}
              />
            ) : null}
            <AvatarFallback className="text-2xl bg-gray-100">{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div>
          <Button variant="outline" className="relative" onClick={handleFileSelect} disabled={isUploading}>
            <Upload className="h-4 w-4 mr-2" />
            Upload photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: jpg, gif or png.
            <br />
            Max file size: 10MB.
          </p>
        </div>
      </div>
    </div>
  )
}
