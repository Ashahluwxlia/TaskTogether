"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { EmptyState } from "@/app/ui/empty-state"
import { formatDistanceToNow } from "date-fns"
import { PlusCircle, ClipboardList, ArrowLeft } from "lucide-react"
import { CreateBoardModal } from "./create-board-modal"

interface TeamBoardsProps {
  teamId: string
}

interface Board {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  creatorId: string
  teamId: string
  creator: {
    id: string
    name: string
  }
  lists: {
    id: string
    _count: {
      tasks: number
    }
  }[]
}

export function TeamBoards({ teamId }: TeamBoardsProps) {
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    async function fetchBoards() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/teams/${teamId}/boards`)

        if (!response.ok) {
          throw new Error("Failed to fetch team boards")
        }

        const data = await response.json()
        setBoards(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load team boards",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (teamId) {
      fetchBoards()
    }
  }, [teamId])

  const handleCreateBoard = () => {
    setIsCreateModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Team Boards</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={() => router.refresh()} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTotalTasks = (board: Board) => {
    return board.lists.reduce((acc, list) => acc + list._count.tasks, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Team Boards ({boards.length})</h3>
          <p className="text-sm text-muted-foreground">Collaborative workspaces for your team</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/teams")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
          <Button onClick={handleCreateBoard} className="bg-yellow-400 hover:bg-yellow-500 text-black">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Board
          </Button>
        </div>
      </div>

      {boards.length === 0 ? (
        <EmptyState
          title="No boards yet"
          description="Create your first board for this team to start collaborating."
          icon={<ClipboardList className="h-12 w-12 text-gray-400" />}
          action={{
            label: "Create Board",
            onClick: handleCreateBoard,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link href={`/boards/${board.id}`} key={board.id}>
              <Card className="h-full transition-all hover:shadow-md cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{board.name}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {board.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>
                      {getTotalTasks(board)} {getTotalTasks(board) === 1 ? "task" : "tasks"}
                    </span>
                    <span>Updated {formatDistanceToNow(new Date(board.updatedAt))} ago</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateBoardModal teamId={teamId} isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}
