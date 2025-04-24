import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import { redirect } from "next/navigation"
import { CreateTaskForm } from "@/components/create-task-form"

export default async function NewTaskPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch all boards the user has access to
  const boards = await executeQuery(
    `SELECT b.id, b.title, b.name
     FROM boards b
     JOIN board_members bm ON b.id = bm.board_id
     WHERE bm.user_id = $1
     ORDER BY b.title ASC`,
    [user.id],
  )
  

  // Fetch all users for assignment
  const users = await executeQuery(
    `SELECT id, name, email, image 
     FROM users 
     ORDER BY name ASC`,
  )

  // Fetch all labels
  const labels = await executeQuery(
    `SELECT id, name, color 
     FROM labels 
     ORDER BY name ASC`,
  )

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Task</h1>
        <CreateTaskForm user={user} boards={boards} users={users} labels={labels} />
      </div>
    </div>
  )
}
