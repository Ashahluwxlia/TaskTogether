import { redirect } from "next/navigation"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { StarredBoardsList } from "@/components/starred-boards-list"

export default async function StarredPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's starred boards
  const starredBoards = await executeQuery(
    `SELECT b.*, bm.role, bm.is_starred
    FROM boards b
    JOIN board_members bm ON b.id = bm.board_id
    WHERE bm.user_id = $1 AND bm.is_starred = true
    ORDER BY b.updated_at DESC`,
    [user.id],
  )

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Starred Boards</h1>

      <StarredBoardsList boards={starredBoards} />
    </div>
  )
}
