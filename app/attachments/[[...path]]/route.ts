import { type NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Extract the path from the URL instead of using params
    const url = new URL(request.url)
    const pathname = url.pathname

    // Remove the '/attachments/' prefix to get the actual file path
    const prefixToRemove = "/attachments/"
    let filePath = ""

    if (pathname.startsWith(prefixToRemove)) {
      filePath = pathname.slice(prefixToRemove.length)
    }

    console.log("Requested file path:", filePath)

    // Construct the full path to the file
    const fullPath = path.join(process.cwd(), "attachments", filePath)
    console.log("Full file path:", fullPath)

    // Check if the file exists
    try {
      await fs.access(fullPath)
      console.log("File exists")
    } catch (error) {
      console.error("File not found:", fullPath)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read the file
    const file = await fs.readFile(fullPath)
    console.log("File read successfully, size:", file.length)

    // Determine the content type based on file extension
    const ext = path.extname(fullPath).toLowerCase()
    let contentType = "application/octet-stream" // Default content type

    // Map common extensions to content types
    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".txt": "text/plain",
    }

    if (ext in contentTypeMap) {
      contentType = contentTypeMap[ext]
    }

    console.log("Content type:", contentType)

    // Return the file with the appropriate content type
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(fullPath)}"`,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
