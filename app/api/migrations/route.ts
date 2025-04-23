import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    // Only allow admin users to run migrations
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const migrationsDir = path.join(process.cwd(), "migrations")
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort()

    const results = []

    // Create migrations table if it doesn't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // Get already applied migrations
    const appliedMigrations = await executeQuery("SELECT name FROM migrations")
    const appliedMigrationNames = appliedMigrations.map((m: any) => m.name)

    // Apply each migration that hasn't been applied yet
    for (const file of migrationFiles) {
      if (appliedMigrationNames.includes(file)) {
        results.push({ file, status: "already applied" })
        continue
      }

      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, "utf8")

      try {
        // Execute the migration
        await executeQuery(sql)

        // Record the migration
        await executeQuery("INSERT INTO migrations (name) VALUES ($1)", [file])

        results.push({ file, status: "applied" })
      } catch (error) {
        console.error(`Error applying migration ${file}:`, error)
        results.push({ file, status: "error", error: (error as Error).message })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error running migrations:", error)
    return NextResponse.json({ error: "Failed to run migrations" }, { status: 500 })
  }
}
