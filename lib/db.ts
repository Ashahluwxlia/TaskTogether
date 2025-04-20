import { neon, neonConfig } from "@neondatabase/serverless"
import { Pool } from "pg"

// Configure neon to use WebSockets in development
if (process.env.NODE_ENV !== "production") {
  neonConfig.webSocketConstructor = require("ws")
}

// Create a connection pool for server-side operations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Use neon() for serverless functions
const sql = neon(process.env.DATABASE_URL || "")

export async function executeQuery(query: string, params: any[] = []) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await client.query(query, params)
    await client.query("COMMIT")
    return result.rows
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Database query error:", error)
    throw error
  } finally {
    client.release()
  }
}

export { pool, sql }
