import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const type = searchParams.get("type") || "all"

    if (!query) {
      return NextResponse.json({
        tasks: [],
        boards: [],
        labels: [],
        users: [],
        comments: [],
        attachments: [],
      })
    }

    // Create search terms for PostgreSQL text search
    const searchTerms = query.split(" ").filter(Boolean).join(" & ")

    // Results to return
    const results: {
      tasks: any[]
      boards: any[]
      labels: any[]
      users: any[]
      comments: any[]
      attachments: any[]
    } = {
      tasks: [],
      boards: [],
      labels: [],
      users: [],
      comments: [],
      attachments: [],
    }

    try {
      // Get user's accessible boards (for permission filtering)
      const accessibleBoardsQuery = `
        SELECT board_id FROM board_members WHERE user_id = $1
        UNION
        SELECT b.id FROM boards b
        JOIN team_members tm ON b.team_id = tm.team_id
        WHERE tm.user_id = $1
      `
      const accessibleBoards = await executeQuery(accessibleBoardsQuery, [user.id])
      const boardIds = accessibleBoards.map((row: any) => row.board_id || row.id)

      if (boardIds.length === 0) {
        return NextResponse.json(results)
      }

      // Only run queries for the requested type or all types
      const shouldFetchType = (t: string) => type === "all" || type === t

      // Tasks search
      if (shouldFetchType("tasks")) {
        const tasksQuery = `
          SELECT t.*, l.title as list_title, b.name as board_name, b.id as board_id,
                u.name as assignee_name, u.image as assignee_image
          FROM tasks t
          JOIN lists l ON t.list_id = l.id
          JOIN boards b ON l.board_id = b.id
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE (
            to_tsvector('english', t.title) @@ to_tsquery('english', $1) OR
            to_tsvector('english', COALESCE(t.description, '')) @@ to_tsquery('english', $1)
          )
          AND l.board_id = ANY($2)
          AND t.is_archived = false
          ORDER BY 
            ts_rank(to_tsvector('english', t.title), to_tsquery('english', $1)) DESC,
            t.updated_at DESC
          LIMIT 50
        `
        try {
          results.tasks = await executeQuery(tasksQuery, [searchTerms, boardIds])
        } catch (err) {
          console.error("Tasks search error:", err)
        }
      }

      // Boards search
      if (shouldFetchType("boards")) {
        const boardsQuery = `
          SELECT b.*, 
                (SELECT COUNT(*) FROM lists l WHERE l.board_id = b.id) as list_count,
                (SELECT COUNT(*) FROM lists l JOIN tasks t ON l.id = t.list_id WHERE l.board_id = b.id) as task_count
          FROM boards b
          WHERE (
            to_tsvector('english', b.name) @@ to_tsquery('english', $1) OR
            to_tsvector('english', COALESCE(b.description, '')) @@ to_tsquery('english', $1)
          )
          AND b.id = ANY($2)
          ORDER BY 
            ts_rank(to_tsvector('english', b.name), to_tsquery('english', $1)) DESC,
            b.updated_at DESC
          LIMIT 20
        `
        try {
          results.boards = await executeQuery(boardsQuery, [searchTerms, boardIds])
        } catch (err) {
          console.error("Boards search error:", err)
        }
      }

      // Labels search
      if (shouldFetchType("labels")) {
        const labelsQuery = `
          SELECT l.*, b.name as board_name, b.id as board_id,
                (SELECT COUNT(*) FROM task_labels tl WHERE tl.label_id = l.id) as usage_count
          FROM labels l
          JOIN boards b ON l.board_id = b.id
          WHERE to_tsvector('english', l.name) @@ to_tsquery('english', $1)
          AND l.board_id = ANY($2)
          ORDER BY 
            ts_rank(to_tsvector('english', l.name), to_tsquery('english', $1)) DESC,
            usage_count DESC
          LIMIT 20
        `
        try {
          results.labels = await executeQuery(labelsQuery, [searchTerms, boardIds])
        } catch (err) {
          console.error("Labels search error:", err)
        }
      }

      // Users search (team members and board members)
      if (shouldFetchType("users")) {
        const usersQuery = `
  SELECT DISTINCT u.id, u.name, u.email, u.image,
        (
          SELECT COUNT(DISTINCT bm.board_id) 
          FROM board_members bm 
          WHERE bm.user_id = u.id AND bm.board_id = ANY($2)
        ) as shared_boards_count,
        ts_rank(to_tsvector('english', u.name), to_tsquery('english', $1)) as name_rank
  FROM users u
  JOIN board_members bm ON u.id = bm.user_id
  WHERE (
    to_tsvector('english', u.name) @@ to_tsquery('english', $1) OR
    to_tsvector('english', u.email) @@ to_tsquery('english', $1)
  )
  AND bm.board_id = ANY($2)
  ORDER BY 
    name_rank DESC,
    shared_boards_count DESC
  LIMIT 20
`
        try {
          results.users = await executeQuery(usersQuery, [searchTerms, boardIds])
        } catch (err) {
          console.error("Users search error:", err)
        }
      }

      // Comments search
      if (shouldFetchType("comments")) {
        const commentsQuery = `
          SELECT c.*, t.title as task_title, t.id as task_id, 
                u.name as author_name, u.image as author_image,
                l.title as list_title, b.name as board_name, b.id as board_id
          FROM comments c
          JOIN tasks t ON c.task_id = t.id
          JOIN lists l ON t.list_id = l.id
          JOIN boards b ON l.board_id = b.id
          JOIN users u ON c.author_id = u.id
          WHERE to_tsvector('english', c.content) @@ to_tsquery('english', $1)
          AND l.board_id = ANY($2)
          ORDER BY 
            ts_rank(to_tsvector('english', c.content), to_tsquery('english', $1)) DESC,
            c.created_at DESC
          LIMIT 20
        `
        try {
          results.comments = await executeQuery(commentsQuery, [searchTerms, boardIds])
        } catch (err) {
          console.error("Comments search error:", err)
        }
      }

      // Attachments search
      if (shouldFetchType("attachments")) {
        const attachmentsQuery = `
          SELECT a.*, t.title as task_title, t.id as task_id,
                l.title as list_title, b.name as board_name, b.id as board_id,
                u.name as uploader_name
          FROM task_attachments a
          JOIN tasks t ON a.task_id = t.id
          JOIN lists l ON t.list_id = l.id
          JOIN boards b ON l.board_id = b.id
          JOIN users u ON a.created_by = u.id
          WHERE to_tsvector('english', a.name) @@ to_tsquery('english', $1)
          AND l.board_id = ANY($2)
          ORDER BY 
            ts_rank(to_tsvector('english', a.name), to_tsquery('english', $1)) DESC,
            a.created_at DESC
          LIMIT 20
        `
        try {
          results.attachments = await executeQuery(attachmentsQuery, [searchTerms, boardIds])
        } catch (err) {
          console.error("Attachments search error:", err)
        }
      }
    } catch (dbError) {
      console.error("Database error:", dbError)

      // Fallback search implementation when database queries fail
      try {
        // Fetch boards from the API instead of directly from the database
        const boardsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/boards`, {
          headers: {
            Cookie: request.headers.get("cookie") || "",
          },
        })

        if (boardsResponse.ok) {
          const boards = await boardsResponse.json()

          // Simple client-side search implementation
          const lowerQuery = query.toLowerCase()

          if (type === "all" || type === "boards") {
            results.boards = boards
              .filter(
                (board: any) =>
                  board.name?.toLowerCase().includes(lowerQuery) ||
                  board.description?.toLowerCase().includes(lowerQuery),
              )
              .slice(0, 20)
          }
        }
      } catch (fallbackError) {
        console.error("Fallback search error:", fallbackError)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      {
        error: "Failed to search",
        tasks: [],
        boards: [],
        labels: [],
        users: [],
        comments: [],
        attachments: [],
      },
      { status: 500 },
    )
  }
}
