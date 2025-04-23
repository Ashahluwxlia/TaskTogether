import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// Define allowed file types
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("PROFILE PHOTO UPLOAD ENDPOINT CALLED")
  try {
    // Get the current user
    const user = await getCurrentUser()
    if (!user) {
      console.error("User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("User authenticated:", user.id)

    // Process the form data
    const formData = await request.formData()
    console.log("Form data received, keys:", Array.from(formData.keys()))

    // Get the file from the form data
    const file = formData.get("photo") as File
    if (!file) {
      console.error("No file found in form data")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      console.error("Invalid file type:", file.type)
      return NextResponse.json({ error: "Invalid file type. Only jpg, png, and gif are allowed." }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size)
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    console.log("File received:", file.name, file.type, file.size)

    // Create directory path for profile photos
    const timestamp = Date.now()
    const userId = user.id
    const uniqueId = uuidv4()
    const fileExt = path.extname(file.name)
    const dirPath = path.join(process.cwd(), "attachments", "users", userId, "profile_photos")

    // Create the directory if it doesn't exist
    console.log("Creating directories if needed")
    try {
      await fs.mkdir(dirPath, { recursive: true })
      console.log("Directories created or verified")
    } catch (error) {
      console.error("Error creating directories:", error)
      return NextResponse.json({ error: "Failed to create upload directory" }, { status: 500 })
    }

    // Create a unique filename
    const filename = `profile-${timestamp}-${uniqueId}${fileExt}`
    const filePath = path.join(dirPath, filename)
    console.log("File will be saved as:", filePath)

    // Convert the file to a buffer
    console.log("Writing file to disk")
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write the file to disk
    try {
      await fs.writeFile(filePath, buffer)
      console.log("File written successfully")
    } catch (error) {
      console.error("Error writing file:", error)
      return NextResponse.json({ error: "Failed to save file" }, { status: 500 })
    }

    // Create the URL path for the file
    const imageUrl = `/attachments/users/${userId}/profile_photos/${filename}`
    console.log("Image URL:", imageUrl)

    // Update the user's profile image in the database
    console.log("Updating user profile in database")
    try {
      const result = await executeQuery("UPDATE users SET image = $1 WHERE id = $2 RETURNING id, name, email, image", [
        imageUrl,
        userId,
      ])

      if (!result || result.length === 0) {
        console.error("Database update failed: No rows returned")
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
      }

      console.log("Database updated successfully")

      // Return the image URL with a timestamp to prevent caching
      return NextResponse.json({
        success: true,
        imageUrl,
        timestamp,
        user: result[0],
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to update profile in database" }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Failed to upload profile photo" }, { status: 500 })
  }
}
