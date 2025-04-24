import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { BoardsList } from "@/components/boards-list"

export default async function BoardsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-6">
      <BoardsList />
    </div>
  )
}
