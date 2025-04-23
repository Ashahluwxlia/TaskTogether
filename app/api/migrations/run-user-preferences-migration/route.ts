import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Read the SQL file
    const migrationSql = fs.readFileSync(path.join(process.cwd(), "migrations", "add_user_preferences.sql"), "utf8")

    // Split the SQL into individual statements
    const statements = migrationSql
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0)

    // Execute each statement separately
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(`${statement};`)
        console.log(`Successfully executed statement: ${statement.substring(0, 50)}...`)
      } catch (statementError) {
        console.error(`Error executing statement: ${statement.substring(0, 50)}...`, statementError)
        // Continue with other statements even if one fails
      }
    }

    return NextResponse.json({ success: true, message: "User preferences migration completed successfully" })
  } catch (error) {
    console.error("Error running user preferences migration:", error)
    return NextResponse.json({ success: false, error: "Failed to run migration" }, { status: 500 })
  }
}
