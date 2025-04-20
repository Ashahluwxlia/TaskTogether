import { executeQuery } from "./db"
import fs from "fs"
import path from "path"

// Function to run all migrations
export async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Get all executed migrations
    const executedMigrations = await executeQuery("SELECT name FROM migrations")
    const executedMigrationNames = executedMigrations.map((m) => m.name)

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), "migrations")
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort() // Sort to ensure migrations run in order

    // Run migrations that haven't been executed yet
    for (const file of migrationFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Running migration: ${file}`)

        // Read and execute migration
        const migration = fs.readFileSync(path.join(migrationsDir, file), "utf8")
        await executeQuery(migration)

        // Record migration as executed
        await executeQuery("INSERT INTO migrations (name) VALUES ($1)", [file])

        console.log(`Migration completed: ${file}`)
      }
    }

    console.log("All migrations completed successfully")
  } catch (error) {
    console.error("Error running migrations:", error)
    throw error
  }
}

// Function to check if a specific migration has been run
export async function hasMigrationRun(migrationName: string): Promise<boolean> {
  try {
    const result = await executeQuery("SELECT 1 FROM migrations WHERE name = $1", [migrationName])
    return result.length > 0
  } catch (error) {
    console.error(`Error checking migration ${migrationName}:`, error)
    return false
  }
}
