import { redirect } from "next/navigation"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { BoardView } from "@/components/board-view"

export default async function BoardPage({
  params,
}: {
  params: { boardId: string }
}) {
  const user = await getCurrentUser()

  console.log("BoardPage - params:", params)
  console.log("BoardPage - user:", user)

  if (!user) {
    redirect("/login")
  }

  let boardId: string
  try {
    // Await the params object before accessing boardId
    boardId = String((await Promise.resolve(params)).boardId)
  } catch (error) {
    console.error("Error getting boardId from params:", error)
    return redirect("/dashboard")
  }

  try {
    // First verify that the boardId is valid
    if (!boardId || typeof boardId !== "string") {
      console.error("Invalid boardId:", boardId)
      return redirect("/dashboard")
    }

    // Check if user has access to this board
    const boardAccess = await executeQuery(
      `SELECT b.*, bm.role, bm.is_starred
      FROM boards b
      JOIN board_members bm ON b.id = bm.board_id
      WHERE b.id = $1 AND bm.user_id = $2`,
      [boardId, user.id],
    )

    console.log("Board access query result:", boardAccess)
    console.log("Board ID:", boardId)
    console.log("User ID:", user.id)

    // Check if the user is a member of the board directly in the database
    const boardMemberCheck = await executeQuery("SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2", [
      boardId,
      user.id,
    ])
    console.log("Board member check:", boardMemberCheck)

    if (!boardAccess || boardAccess.length === 0) {
      console.log("BoardPage - User does not have access to this board. Redirecting to /dashboard")
      console.log("User does not have access to this board")
      return redirect("/dashboard")
    }

    const board = boardAccess[0]

    // Get lists
    const lists = await executeQuery("SELECT * FROM lists WHERE board_id = $1 ORDER BY position ASC", [boardId])

    // Get tasks for each list
    for (const list of lists) {
      const tasks = await executeQuery(
        `SELECT t.*, u.name as assignee_name, u.image as assignee_image,
         (SELECT COALESCE(json_agg(l.*), '[]'::json)
          FROM labels l
          JOIN task_labels tl ON l.id = tl.label_id
          WHERE tl.task_id = t.id) as labels
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.list_id = $1
        ORDER BY t.position::integer ASC`,
        [list.id],
      )

      list.tasks = tasks
    }

    // Get members
    const members = await executeQuery(
      `SELECT u.id, u.name, u.email, u.image, bm.role
       FROM users u
       JOIN board_members bm ON u.id = bm.user_id
       WHERE bm.board_id = $1`,
      [boardId],
    )

    // Get labels
    const labels = await executeQuery("SELECT * FROM labels WHERE board_id = $1", [boardId])

    // Make sure we have all required properties for the board
    const boardWithDetails = {
      id: board.id,
      title: board.title || board.name || "", // Prioritize title over name
      description: board.description || null,
      is_starred: board.is_starred || false,
      role: board.role || "VIEWER",
      lists: lists as any,
      members: members as any,
      labels: labels as any,
      background_color: board.background_color || null,
    }

    return <BoardView user={user as any} board={boardWithDetails} />
  } catch (error) {
    console.error("Error loading board:", error)
    redirect("/dashboard")
  }
}
