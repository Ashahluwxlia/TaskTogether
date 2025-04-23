import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET() {
  try {
    const testDir = path.join(process.cwd(), "attachments")

    // Try to create a test directory
    try {
      await fs.mkdir(testDir, { recursive: true })
      console.log("Test directory created or already exists:", testDir)
    } catch (err) {
      console.error("Error creating test directory:", err)
      return NextResponse.json({ error: "Failed to create test directory", details: err }, { status: 500 })
    }

    // Try to write a test file
    const testFile = path.join(testDir, "test-file.txt")
    try {
      await fs.writeFile(testFile, "This is a test file to verify file system access.")
      console.log("Test file written successfully:", testFile)
    } catch (err) {
      console.error("Error writing test file:", err)
      return NextResponse.json({ error: "Failed to write test file", details: err }, { status: 500 })
    }

    // Try to read the test file
    try {
      const content = await fs.readFile(testFile, "utf8")
      console.log("Test file read successfully:", content)
    } catch (err) {
      console.error("Error reading test file:", err)
      return NextResponse.json({ error: "Failed to read test file", details: err }, { status: 500 })
    }

    // List the contents of the attachments directory
    try {
      const files = await fs.readdir(testDir, { withFileTypes: true })
      const fileList = files.map((file) => ({
        name: file.name,
        isDirectory: file.isDirectory(),
      }))
      console.log("Directory contents:", fileList)

      return NextResponse.json({
        success: true,
        message: "File system access verified",
        testDir,
        testFile,
        directoryContents: fileList,
      })
    } catch (err) {
      console.error("Error listing directory:", err)
      return NextResponse.json({ error: "Failed to list directory", details: err }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error in test-fs route:", error)
    return NextResponse.json({ error: "Failed to test file system", details: error }, { status: 500 })
  }
}
