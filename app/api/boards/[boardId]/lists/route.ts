import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { boardId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await the params object
    const { boardId } = await params

    // Check if user has access to this board
    const boardAccess = await executeQuery("SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      user.id,
    ])

    if (boardAccess.length === 0) {
      return NextResponse.json({ error: "You do not have access to this board" }, { status: 403 })
    }

    // Get all lists for this board with ordered tasks
    const lists = await executeQuery(
      `SELECT l.* 
       FROM lists l 
       WHERE l.board_id = $1 
       ORDER BY l.position ASC`,
      [boardId],
    )

    // For each list, get its tasks ordered by position
    for (let i = 0; i < lists.length; i++) {
      const tasks = await executeQuery(
        `SELECT t.*, u.name as assignee_name, u.image as assignee_image,
         (SELECT json_agg(json_build_object('id', lb.id, 'name', lb.name, 'color', lb.color))
          FROM task_labels tl
          JOIN labels lb ON tl.label_id = lb.id
          WHERE tl.task_id = t.id) as labels
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.list_id = $1
         ORDER BY t.position ASC`,
        [lists[i].id],
      )

      // Ensure labels is always an array
      tasks.forEach((task) => {
        if (!task.labels) {
          task.labels = []
        }
      })

      lists[i].tasks = tasks
    }

    return NextResponse.json(lists)
  } catch (error) {
    console.error("Error fetching lists:", error)
    return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { boardId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Properly await the params object
    const { boardId } = await params
    const { title } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Check if user has access to this board
    const boardAccess = await executeQuery("SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      user.id,
    ])

    if (boardAccess.length === 0) {
      return NextResponse.json({ error: "You do not have access to this board" }, { status: 403 })
    }

    // Get the highest position
    const positionResult = await executeQuery(
      "SELECT COALESCE(MAX(position), 0) as max_position FROM lists WHERE board_id = $1",
      [boardId],
    )
    const position = positionResult[0].max_position + 1

    // Create the list
    const newList = await executeQuery(
      "INSERT INTO lists (title, board_id, position) VALUES ($1, $2, $3) RETURNING *",
      [title, boardId, position],
    )

    return NextResponse.json(newList[0])
  } catch (error) {
    console.error("Error creating list:", error)
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 })
  }
}
