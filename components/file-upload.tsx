"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, File } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface FileUploadProps {
  taskId: string
  onUploadComplete: (attachment: any) => void
}

export function FileUpload({ taskId, onUploadComplete }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)

  // Handle drag and drop functionality
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.add("border-yellow-400")
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove("border-yellow-400")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove("border-yellow-400")
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setError(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload")
      return
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setError(`File size exceeds 10MB limit (${formatFileSize(selectedFile.size)})`)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + 5
      })
    }, 100)

    try {
      const formData = new FormData()
      formData.append("taskId", taskId)
      formData.append("file", selectedFile)
      // Add a flag to ensure uploads go to the correct path
      formData.append("useUploadsSubfolder", "true")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload file")
      }

      const attachment = await response.json()

      // Complete progress
      setUploadProgress(100)

      // Reset form
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Notify parent
      onUploadComplete(attachment)
    } catch (err: any) {
      setError(err.message)
    } finally {
      clearInterval(progressInterval)
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-4">
      {selectedFile ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <div className="bg-gray-100 p-2 rounded">
            <File className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{selectedFile.name}</div>
            <div className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} disabled={isUploading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          ref={dropAreaRef}
          className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Paperclip className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">Drag and drop a file, or click to select</p>
            <p className="text-xs text-gray-400">Max file size: 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Select file
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-gray-500 text-center">{uploadProgress}% uploaded</p>
        </div>
      )}

      {selectedFile && !isUploading && (
        <Button onClick={handleUpload} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black">
          Upload file
        </Button>
      )}
    </div>
  )
}
