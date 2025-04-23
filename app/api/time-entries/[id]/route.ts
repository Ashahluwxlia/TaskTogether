import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const timeEntryId = params.id
    const updates = await request.json()

    // Verify user owns this time entry
    const timeEntry = await executeQuery("SELECT * FROM time_entries WHERE id = $1 AND user_id = $2", [
      timeEntryId,
      user.id,
    ])

    if (timeEntry.length === 0) {
      return NextResponse.json({ error: "Time entry not found or you do not have access" }, { status: 404 })
    }

    // Build update query dynamically
    const allowedFields = ["end_time", "duration", "description"]
    const setStatements = []
    const queryParams = []

    let paramIndex = 1

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setStatements.push(`${key} = $${paramIndex}`)
        queryParams.push(value)
        paramIndex++
      }
    }

    if (setStatements.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Add time entry ID as the last parameter
    queryParams.push(timeEntryId)

    const query = `
      UPDATE time_entries
      SET ${setStatements.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await executeQuery(query, queryParams)

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating time entry:", error)
    return NextResponse.json({ error: "Failed to update time entry" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const timeEntryId = params.id

    // Verify user owns this time entry
    const timeEntry = await executeQuery("SELECT * FROM time_entries WHERE id = $1 AND user_id = $2", [
      timeEntryId,
      user.id,
    ])

    if (timeEntry.length === 0) {
      return NextResponse.json({ error: "Time entry not found or you do not have access" }, { status: 404 })
    }

    // Delete time entry
    await executeQuery("DELETE FROM time_entries WHERE id = $1", [timeEntryId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting time entry:", error)
    return NextResponse.json({ error: "Failed to delete time entry" }, { status: 500 })
  }
}
