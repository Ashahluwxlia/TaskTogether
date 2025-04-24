"use server"

import { revalidatePath } from "next/cache"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function updateUserSettings(formData: FormData) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    const name = formData.get("name") as string

    // Check if the columns exist before updating them
    const columnsResult = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('email_notifications', 'theme', 'language')
    `)

    const columns = columnsResult.map((col: any) => col.column_name)

    // Only include columns that exist
    let query = "UPDATE users SET name = $1"
    const params = [name]

    let paramIndex = 2

    if (columns.includes("email_notifications")) {
      const emailNotifications = formData.get("emailNotifications") === "true"
      query += `, email_notifications = $${paramIndex}`
      // Convert boolean to string 'TRUE'/'FALSE' for PostgreSQL
      params.push(emailNotifications ? "TRUE" : "FALSE")
      paramIndex++
    }

    if (columns.includes("theme")) {
      // Set a default theme value if not provided
      const theme = (formData.get("theme") as string) || "light"
      query += `, theme = $${paramIndex}`
      params.push(theme)
      paramIndex++
    }

    if (columns.includes("language")) {
      // Set a default language value if not provided
      const language = (formData.get("language") as string) || "en"
      query += `, language = $${paramIndex}`
      params.push(language)
      paramIndex++
    }

    query += ` WHERE id = $${paramIndex}`
    params.push(user.id)

    // Update user profile with only existing columns
    await executeQuery(query, params)

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating settings:", error)
    return { error: "Failed to update settings" }
  }
}
