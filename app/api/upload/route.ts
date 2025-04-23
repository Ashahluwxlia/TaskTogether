import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import fs from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const taskId = formData.get("taskId") as string
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    // If taskId is "temp", we're just uploading a file during task creation
    // We'll associate it with the task later
    if (taskId !== "temp") {
      // Verify user has access to this task
      const hasAccess = await executeQuery(
        `SELECT 1 FROM board_members bm
         JOIN boards b ON bm.board_id = b.id
         JOIN lists l ON b.id = l.board_id
         JOIN tasks t ON l.id = t.list_id
         WHERE bm.user_id = $1 AND t.id = $2`,
        [user.id, taskId],
      )

      if (hasAccess.length === 0) {
        return NextResponse.json({ error: "You do not have access to this task" }, { status: 403 })
      }
    }

    // Define the upload directory structure
    // Root/attachments/users/{userId}/uploads/
    const userDir = path.join(process.cwd(), "attachments", "users", user.id)
    const uploadDir = path.join(userDir, "uploads")

    // Create the directory if it doesn't exist
    try {
      // First ensure the user directory exists
      await fs.mkdir(userDir, { recursive: true })
      // Then ensure the uploads subdirectory exists
      await fs.mkdir(uploadDir, { recursive: true })
    } catch (mkdirError) {
      console.error("Error creating directory:", mkdirError)
      return NextResponse.json({ error: "Failed to create upload directory" }, { status: 500 })
    }

    // Generate a unique filename with timestamp to avoid collisions
    const timestamp = Date.now()
    const originalName = file.name
    const fileExtension = originalName.split(".").pop() || ""
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\s+/g, "_")
    const filename = `${timestamp}-${sanitizedName}`
    const filepath = path.join(uploadDir, filename)

    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Write the file to disk
    try {
      await fs.writeFile(filepath, buffer)
    } catch (writeFileError) {
      console.error("Error writing file:", writeFileError)
      return NextResponse.json({ error: "Failed to write file to disk" }, { status: 500 })
    }

    // Create a public URL for the file
    // This path will be used to access the file from the frontend
    const fileUrl = `/attachments/users/${user.id}/uploads/${filename}`

    // If taskId is not "temp", create attachment record in database
    let attachmentRecord = null
    if (taskId !== "temp") {
      const result = await executeQuery(
        `INSERT INTO task_attachments (task_id, created_by, name, url, type, size)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [taskId, user.id, originalName, fileUrl, file.type, file.size],
      )
      attachmentRecord = result[0]
    } else {
      // For temporary uploads during task creation, just return the file info
      attachmentRecord = {
        id: `temp-${timestamp}`,
        name: originalName,
        url: fileUrl,
        type: file.type,
        size: file.size,
        created_at: new Date().toISOString(),
        created_by: user.id,
        uploader_name: user.name,
      }
    }

    return NextResponse.json({
      ...attachmentRecord,
      uploader_name: user.name,
    })
  } catch (error) {
    console.error("Error uploading attachment:", error)
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 })
  }
}
