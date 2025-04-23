import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")
    const limit = searchParams.get("limit") || "10"

    let query = `
      SELECT te.*, t.title as task_title
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      WHERE te.user_id = $1
    `
    const params = [user.id]

    if (taskId) {
      query += " AND te.task_id = $2"
      params.push(taskId)
    }

    query += " ORDER BY te.start_time DESC LIMIT $" + (params.length + 1)
    params.push(Number(limit))

    const timeEntries = await executeQuery(query, params)

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error("Error fetching time entries:", error)
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId, startTime, endTime, duration, description } = await request.json()

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

    // Create time entry
    const result = await executeQuery(
      `INSERT INTO time_entries (task_id, user_id, start_time, end_time, duration, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [taskId, user.id, startTime, endTime, duration, description],
    )

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating time entry:", error)
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 })
  }
}
