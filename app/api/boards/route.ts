import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

// Update the GET function to use the direct relationship between boards and teams
// Replace the existing GET function with this updated version:

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all boards the user has access to
    const boards = await executeQuery(
      `SELECT b.*, bm.role, bm.is_starred,
        (SELECT COUNT(DISTINCT m.user_id) FROM board_members m WHERE m.board_id = b.id) as member_count,
        (SELECT t.name FROM teams t WHERE t.id = b.team_id) as team_name
       FROM boards b
       LEFT JOIN board_members bm ON b.id = bm.board_id AND bm.user_id = $1
       WHERE bm.user_id = $1
       
       UNION
       
       SELECT b.*, tm.role as role, false as is_starred,
        (SELECT COUNT(DISTINCT m.user_id) FROM board_members m WHERE m.board_id = b.id) as member_count,
        (SELECT t.name FROM teams t WHERE t.id = b.team_id) as team_name
       FROM boards b
       JOIN teams t ON b.team_id = t.id
       JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN board_members bm ON b.id = bm.board_id AND bm.user_id = $1
       WHERE tm.user_id = $1 AND bm.user_id IS NULL
       
       ORDER BY updated_at DESC`,
      [user.id],
    )

    // For each board, get the first few members to display avatars
    for (const board of boards) {
      const members = await executeQuery(
        `SELECT u.id, u.name, u.image
         FROM board_members bm
         JOIN users u ON bm.user_id = u.id
         WHERE bm.board_id = $1
         LIMIT 5`,
        [board.id],
      )
      board.members = members
    }

    return NextResponse.json(boards)
  } catch (error) {
    console.error("Error fetching boards:", error)
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, teamId } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const boardId = uuidv4()

    // Create the board
    const [board] = await executeQuery(
      `INSERT INTO boards (id, name, created_by) 
     VALUES ($1, $2, $3) 
     RETURNING id, name, created_at`,
      [boardId, title, user.id],
    )

    // Add the creator as a board member with admin role
    await executeQuery(
      `INSERT INTO board_members (board_id, user_id, role, is_starred) 
     VALUES ($1, $2, 'ADMIN', false)`,
      [boardId, user.id],
    )

    // If teamId is provided, associate the board with the team
    if (teamId) {
      await executeQuery(
        `INSERT INTO team_boards (team_id, board_id) 
       VALUES ($1, $2)`,
        [teamId, boardId],
      )
    }

    // Create default lists for the board
    const defaultLists = ["To Do", "In Progress", "Done"]
    for (const listTitle of defaultLists) {
      await executeQuery(
        `INSERT INTO lists (board_id, title, position) 
       VALUES ($1, $2, $3)`,
        [boardId, listTitle, defaultLists.indexOf(listTitle)],
      )
    }

    // Log activity
    await executeQuery(
      `INSERT INTO activities (user_id, entity_type, entity_id, action, created_at, board_id)
     VALUES ($1, 'BOARD', $2, 'CREATED', NOW(), $3)`,
      [user.id, boardId, boardId],
    )

    return NextResponse.json(board)
  } catch (error) {
    console.error("Error creating board:", error)
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 })
  }
}
