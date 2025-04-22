"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { BoardsList } from "@/components/boards-list"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Clock,
  Star,
  StarOff,
  CalendarIcon,
  LayoutDashboard,
  AlertCircle,
  ChevronRight,
  CheckSquare,
  AlertTriangle,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  image: string | null
}

interface Board {
  id: string
  title: string
  is_starred: boolean
  member_count: number
  team_name?: string | null
  name?: string | null
}

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  board_title: string
  list_title: string
  assignee_name: string | null
  assignee_image: string | null
  completed_at?: string | null
}

interface CompletionStats {
  completedToday: number
  completedThisWeek: number
  totalTasks: number
  recentlyCompleted: Task[]
}

interface TasksByDueDate {
  today: Task[]
  tomorrow: Task[]
  thisWeek: Task[]
  thisMonth: Task[] // New category
  later: Task[]
  noDueDate: Task[] // New category
  overdue: Task[]
}

interface DashboardContentProps {
  user: User
  boards: Board[]
  tasksByDueDate: TasksByDueDate
  completionStats: CompletionStats
}

export function DashboardContent({ user, boards, tasksByDueDate, completionStats }: DashboardContentProps) {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [localBoards, setLocalBoards] = useState<Board[]>(boards)

  // Updated function to get board display name - no longer includes team name in parentheses
  const getBoardDisplayName = (board: Board) => {
    // Just return the board name without the team name in parentheses
    return board.name || "Untitled"
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const navigateToBoard = (boardId: string) => {
    router.push(`/boards/${boardId}`)
  }

  const navigateToTask = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }

  const navigateToBoards = () => {
    setActiveTab("boards")
  }

  const handleToggleStar = async (e: React.MouseEvent, board: Board) => {
    e.stopPropagation() // Prevent board click event

    try {
      const newStarredState = !board.is_starred

      // Optimistically update UI
      setLocalBoards(localBoards.map((b) => (b.id === board.id ? { ...b, is_starred: newStarredState } : b)))

      const response = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_starred: newStarredState,
        }),
      })

      if (!response.ok) {
        // Revert on failure
        setLocalBoards(localBoards.map((b) => (b.id === board.id ? { ...b, is_starred: board.is_starred } : b)))
        throw new Error("Failed to update starred status")
      }

      toast({
        title: newStarredState ? "Board starred" : "Board unstarred",
        description: `${board.title} has been ${newStarredState ? "added to" : "removed from"} your starred boards.`,
      })

      router.refresh()
    } catch (error) {
      console.error("Error toggling star:", error)
      toast({
        title: "Error",
        description: "Failed to update starred status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReopenTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: false }),
      })

      if (!response.ok) {
        throw new Error("Failed to reopen task")
      }

      toast({
        title: "Task reopened",
        description: "The task has been marked as incomplete.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error reopening task:", error)
      toast({
        title: "Error",
        description: "Failed to reopen task. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Link href="/tasks/new">
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">New Task</Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="boards">Boards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Completed Tasks Card */}
            <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => navigateToBoards()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionStats.completedToday}</div>
                <p className="text-xs text-muted-foreground">{completionStats.completedThisWeek} this week</p>
                <div className="mt-2">
                  <Progress
                    value={(completionStats.completedThisWeek / Math.max(completionStats.totalTasks, 1)) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((completionStats.completedThisWeek / Math.max(completionStats.totalTasks, 1)) * 100)}%
                    completion rate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Total Boards Card */}
            <Card className="cursor-pointer transition-all hover:shadow-md" onClick={navigateToBoards}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Boards</CardTitle>
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{localBoards.length}</div>
                <p className="text-xs text-muted-foreground">
                  {localBoards.filter((board) => board.is_starred).length} starred
                </p>
              </CardContent>
            </Card>

            {/* Tasks Due Today Card */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasksByDueDate.today.length}</div>
                <p className="text-xs text-muted-foreground">{tasksByDueDate.tomorrow.length} due tomorrow</p>
                {tasksByDueDate.today.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {tasksByDueDate.today.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className="text-sm truncate cursor-pointer hover:text-blue-600"
                        onClick={() => navigateToTask(task.id)}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasksByDueDate.today.length > 2 && (
                      <Link href="/tasks" className="text-sm text-foreground hover:text-foreground view-all-link">
                        View all {tasksByDueDate.today.length} tasks
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overdue Tasks Card */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasksByDueDate.overdue.length}</div>
                <p className="text-xs text-muted-foreground">Tasks past their due date</p>
                {tasksByDueDate.overdue.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {tasksByDueDate.overdue.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className="text-sm truncate cursor-pointer hover:text-blue-600"
                        onClick={() => navigateToTask(task.id)}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasksByDueDate.overdue.length > 2 && (
                      <Link
                        href="/tasks?filter=overdue"
                        className="text-sm text-foreground hover:text-foreground view-all-link"
                      >
                        View all {tasksByDueDate.overdue.length} tasks
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Due Tomorrow Card */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Tomorrow</CardTitle>
                <CalendarIcon className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasksByDueDate.tomorrow.length}</div>
                <p className="text-xs text-muted-foreground">Tasks due tomorrow</p>
                {tasksByDueDate.tomorrow.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {tasksByDueDate.tomorrow.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className="text-sm truncate cursor-pointer hover:text-blue-600"
                        onClick={() => navigateToTask(task.id)}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasksByDueDate.tomorrow.length > 2 && (
                      <Link
                        href="/tasks?filter=tomorrow"
                        className="text-sm text-foreground hover:text-foreground view-all-link"
                      >
                        View all {tasksByDueDate.tomorrow.length} tasks
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* This Week Card */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <CalendarIcon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasksByDueDate.thisWeek.length}</div>
                <p className="text-xs text-muted-foreground">Due in the next 7 days</p>
                {tasksByDueDate.thisWeek.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {tasksByDueDate.thisWeek.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className="text-sm truncate cursor-pointer hover:text-blue-600"
                        onClick={() => navigateToTask(task.id)}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasksByDueDate.thisWeek.length > 2 && (
                      <Link
                        href="/tasks?filter=week"
                        className="text-sm text-foreground hover:text-foreground view-all-link"
                      >
                        View all {tasksByDueDate.thisWeek.length} tasks
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* This Month Card */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <CalendarIcon className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasksByDueDate.thisMonth.length}</div>
                <p className="text-xs text-muted-foreground">Due later this month</p>
                {tasksByDueDate.thisMonth.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {tasksByDueDate.thisMonth.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className="text-sm truncate cursor-pointer hover:text-blue-600"
                        onClick={() => navigateToTask(task.id)}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasksByDueDate.thisMonth.length > 2 && (
                      <Link
                        href="/tasks?filter=month"
                        className="text-sm text-foreground hover:text-foreground view-all-link"
                      >
                        View all {tasksByDueDate.thisMonth.length} tasks
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* No Due Date Card */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">No Due Date</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasksByDueDate.noDueDate.length}</div>
                <p className="text-xs text-muted-foreground">Tasks without deadline</p>
                {tasksByDueDate.noDueDate.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {tasksByDueDate.noDueDate.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className="text-sm truncate cursor-pointer hover:text-blue-600"
                        onClick={() => navigateToTask(task.id)}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasksByDueDate.noDueDate.length > 2 && (
                      <Link
                        href="/tasks?filter=nodate"
                        className="text-sm text-foreground hover:text-foreground view-all-link"
                      >
                        View all {tasksByDueDate.noDueDate.length} tasks
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Recent Boards Card */}
            <Card className="col-span-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Boards</CardTitle>
                  <CardDescription>Your recently accessed boards</CardDescription>
                </div>
                {localBoards.length > 0 && (
                  <Link
                    href="/boards"
                    className="text-sm text-foreground hover:text-foreground view-all-link flex items-center"
                  >
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {localBoards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground mb-4">You don't have any boards yet</p>
                    <Link href="/boards/new">
                      <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">Create your first board</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {localBoards.slice(0, 5).map((board) => (
                      <div
                        key={board.id}
                        className="flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={() => navigateToBoard(board.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{getBoardDisplayName(board)}</div>
                          <Badge variant="outline">{board.member_count} members</Badge>
                          {board.team_name && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {board.team_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => handleToggleStar(e, board)}
                            aria-label={board.is_starred ? "Unstar board" : "Star board"}
                          >
                            {board.is_starred ? (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Tasks Card */}
            <Card className="col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>Tasks due soon</CardDescription>
                </div>
                {(tasksByDueDate.today.length > 0 ||
                  tasksByDueDate.tomorrow.length > 0 ||
                  tasksByDueDate.thisWeek.length > 0) && (
                  <Link
                    href="/tasks"
                    className="text-sm text-foreground hover:text-foreground view-all-link flex items-center"
                  >
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {tasksByDueDate.today.length === 0 &&
                tasksByDueDate.tomorrow.length === 0 &&
                tasksByDueDate.thisWeek.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground mb-4">No upcoming tasks</p>
                    <Link href="/tasks/new">
                      <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">Create a task</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...tasksByDueDate.today, ...tasksByDueDate.tomorrow, ...tasksByDueDate.thisWeek]
                      .slice(0, 5)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
                          onClick={() => navigateToTask(task.id)}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="font-medium">{task.title}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{task.board_title}</span>
                              <span>•</span>
                              <span>{task.list_title}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.assignee_name && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assignee_image || undefined} />
                                <AvatarFallback>{task.assignee_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            <Badge variant="outline">{formatDate(task.due_date)}</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recently Completed Tasks */}
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recently Completed</CardTitle>
                  <CardDescription>Tasks you've finished recently</CardDescription>
                </div>
                <Link
                  href="/tasks?filter=completed"
                  className="text-sm text-foreground hover:text-foreground view-all-link flex items-center"
                >
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </CardHeader>
              <CardContent>
                {completionStats.recentlyCompleted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground mb-4">You haven't completed any tasks yet</p>
                    <Link href="/tasks/new">
                      <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">Create a task</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {completionStats.recentlyCompleted.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium line-through text-gray-500">{task.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Completed {task.completed_at ? new Date(task.completed_at).toLocaleString() : "recently"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleReopenTask(task.id)}
                          >
                            Reopen
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => navigateToTask(task.id)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>View and manage your tasks by date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border mx-auto" />
                </div>
                <div className="md:w-1/2">
                  <h3 className="font-medium mb-2">
                    Tasks for {date?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </h3>
                  <div className="space-y-2">
                    {date
                      ? Object.values(tasksByDueDate)
                          .flat()
                          .filter((task) => {
                            if (!task.due_date) return false
                            const taskDate = new Date(task.due_date)
                            return (
                              taskDate.getDate() === date.getDate() &&
                              taskDate.getMonth() === date.getMonth() &&
                              taskDate.getFullYear() === date.getFullYear()
                            )
                          })
                          .map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
                              onClick={() => navigateToTask(task.id)}
                            >
                              <div className="font-medium">{task.title}</div>
                              <div className="text-sm text-muted-foreground">{task.board_title}</div>
                            </div>
                          ))
                      : null}
                    {date &&
                      Object.values(tasksByDueDate)
                        .flat()
                        .filter((task) => {
                          if (!task.due_date) return false
                          const taskDate = new Date(task.due_date)
                          return (
                            taskDate.getDate() === date.getDate() &&
                            taskDate.getMonth() === date.getMonth() &&
                            taskDate.getFullYear() === date.getFullYear()
                          )
                        }).length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">No tasks scheduled for this day</div>
                      )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boards" className="space-y-4">
          <BoardsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
