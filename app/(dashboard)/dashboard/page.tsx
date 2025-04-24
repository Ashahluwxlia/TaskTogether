import { redirect } from "next/navigation"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Fixed query to include b.updated_at in both SELECT statements and ORDER BY b.updated_at
  const boards = await executeQuery(
    `SELECT b.id, b.name, b.title, b.updated_at, bm.role, bm.is_starred,
      (SELECT COUNT(DISTINCT m.user_id) FROM board_members m WHERE m.board_id = b.id) as member_count,
      t.name as team_name
     FROM boards b
     LEFT JOIN board_members bm ON b.id = bm.board_id AND bm.user_id = $1
     LEFT JOIN teams t ON b.team_id = t.id
     WHERE bm.user_id = $1
    
     UNION
    
     SELECT b.id, b.name, b.title, b.updated_at, tm.role as role, false as is_starred,
      (SELECT COUNT(DISTINCT m.user_id) FROM board_members m WHERE m.board_id = b.id) as member_count,
      t.name as team_name
     FROM boards b
     JOIN teams t ON b.team_id = t.id
     JOIN team_members tm ON t.id = tm.team_id
     LEFT JOIN board_members bm ON b.id = bm.board_id AND bm.user_id = $1
     WHERE tm.user_id = $1 AND bm.user_id IS NULL
    
     ORDER BY updated_at DESC`,
    [user.id],
  )

  // Get user's tasks - now filtering out completed tasks for upcoming sections
  const tasks = await executeQuery(
    `SELECT t.*, l.title as list_title, b.name as board_title, u.name as assignee_name, u.image as assignee_image
   FROM tasks t
   JOIN lists l ON t.list_id = l.id
   JOIN boards b ON l.board_id = b.id
   LEFT JOIN board_members bm ON b.id = bm.board_id AND bm.user_id = $1
   LEFT JOIN teams tm ON b.team_id = tm.id
   LEFT JOIN team_members tmm ON tm.id = tmm.team_id AND tmm.user_id = $1
   LEFT JOIN users u ON t.assigned_to = u.id
   WHERE (bm.user_id = $1 OR tmm.user_id = $1) AND (t.completed = false OR t.completed IS NULL)
   ORDER BY t.due_date ASC NULLS LAST`,
    [user.id],
  )

  // Get completion statistics
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  const startOfWeek = new Date(todayDate)
  startOfWeek.setDate(todayDate.getDate() - todayDate.getDay()) // Start of current week (Sunday)

  const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1) // Start of current month

  // Get completed tasks - updated to include team boards
  const completedTasks = await executeQuery(
    `SELECT t.*, l.title as list_title, b.name as board_title, u.name as assignee_name, u.image as assignee_image
   FROM tasks t
   JOIN lists l ON t.list_id = l.id
   JOIN boards b ON l.board_id = b.id
   LEFT JOIN board_members bm ON b.id = bm.board_id AND bm.user_id = $1
   LEFT JOIN teams tm ON b.team_id = tm.id
   LEFT JOIN team_members tmm ON tm.id = tmm.team_id AND tmm.user_id = $1
   LEFT JOIN users u ON t.assigned_to = u.id
   WHERE (bm.user_id = $1 OR tmm.user_id = $1) AND t.completed = true
   ORDER BY t.completed_at DESC`,
    [user.id],
  )

  // Calculate completion statistics
  const completedToday = completedTasks.filter((task) => {
    if (!task.completed_at) return false
    const completedDate = new Date(task.completed_at)
    return completedDate >= todayDate
  }).length

  const completedThisWeek = completedTasks.filter((task) => {
    if (!task.completed_at) return false
    const completedDate = new Date(task.completed_at)
    return completedDate >= startOfWeek
  }).length

  const recentlyCompleted = completedTasks.slice(0, 5) // Get 5 most recently completed tasks

  const completionStats = {
    completedToday,
    completedThisWeek,
    totalTasks: tasks.length + completedTasks.length, // Total includes both completed and incomplete
    recentlyCompleted,
  }

  // Group tasks by due date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const tasksByDueDate = {
    today: tasks.filter((task) => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime()
    }),
    tomorrow: tasks.filter((task) => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === tomorrow.getTime()
    }),
    thisWeek: tasks.filter((task) => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() > tomorrow.getTime() && dueDate.getTime() <= nextWeek.getTime()
    }),
    thisMonth: tasks.filter((task) => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() > nextWeek.getTime() && dueDate.getTime() <= endOfMonth.getTime()
    }),
    later: tasks.filter((task) => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() > endOfMonth.getTime()
    }),
    noDueDate: tasks.filter((task) => !task.due_date),
    overdue: tasks.filter((task) => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() < today.getTime()
    }),
  }

  return (
    <DashboardContent user={user} boards={boards} tasksByDueDate={tasksByDueDate} completionStats={completionStats} />
  )
}
