"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Star, StarOff, RefreshCw, User, Users, FolderOpen } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Member {
  id: string
  name: string
  image: string | null
}

interface Board {
  id: string
  name: string
  description: string | null
  member_count: number
  is_starred: boolean
  role: string
  created_by: string
  team_id: string | null
  team_name: string | null
  members: Member[]
}

export function BoardsList() {
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setCurrentUserId(userData.id)
        }
      } catch (error) {
        console.error("Error fetching current user:", error)
      }
    }

    fetchCurrentUser()
  }, [])

  // Update useEffect to depend on refreshKey and currentUserId
  useEffect(() => {
    if (currentUserId) {
      fetchBoards()
    }
  }, [refreshKey, currentUserId])

  // Add a manual refresh function
  const refreshBoards = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const fetchBoards = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/boards", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch boards")
      }

      const data = await response.json()
      setBoards(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load boards",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newBoardTitle,
          description: newBoardDescription || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create board")
      }

      const newBoard = await response.json()
      setBoards([...boards, newBoard])

      setNewBoardTitle("")
      setNewBoardDescription("")
      setIsDialogOpen(false)
      toast({
        title: "Board created",
        description: "Your new board has been created successfully.",
      })

      // Navigate to the board page
      router.push(`/boards/${newBoard.id}`)
    } catch (error) {
      console.error("Error creating board:", error)
      toast({
        title: "Error",
        description: "Failed to create board. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBoardClick = (boardId: string) => {
    router.push(`/boards/${boardId}`)
  }

  const handleToggleStar = async (e: React.MouseEvent, board: Board) => {
    e.stopPropagation() // Prevent board click event

    try {
      const newStarredState = !board.is_starred

      // Optimistically update UI
      setBoards(
        boards.map((b) =>
          b.id === board.id
            ? {
                ...b,
                is_starred: newStarredState,
              }
            : b,
        ),
      )

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
        setBoards(boards.map((b) => (b.id === board.id ? { ...b, is_starred: board.is_starred } : b)))
        throw new Error("Failed to update starred status")
      }

      toast({
        title: newStarredState ? "Board starred" : "Board unstarred",
        description: `${board.name} has been ${newStarredState ? "added to" : "removed from"} your starred boards.`,
      })

      // Refresh the boards to ensure we have the latest data
      fetchBoards()
    } catch (error) {
      console.error("Error toggling star:", error)
      toast({
        title: "Error",
        description: "Failed to update starred status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter boards into categories
  const myBoards = boards.filter((board) => board.created_by === currentUserId && !board.team_id)
  const sharedWithMe = boards.filter((board) => board.created_by !== currentUserId && !board.team_id)
  const teamBoards = boards.filter((board) => board.team_id !== null)

  // Group team boards by team
  const teamBoardsGrouped = teamBoards.reduce(
    (acc, board) => {
      const teamId = board.team_id as string
      const teamName = board.team_name || "Unknown Team"

      if (!acc[teamId]) {
        acc[teamId] = {
          teamId,
          teamName,
          boards: [],
        }
      }

      acc[teamId].boards.push(board)
      return acc
    },
    {} as Record<string, { teamId: string; teamName: string; boards: Board[] }>,
  )

  // Convert to array for rendering
  const teamBoardsArray = Object.values(teamBoardsGrouped)

  // Render board card
  const renderBoardCard = (board: Board) => (
    <div
      key={board.id}
      className="bg-card rounded-lg border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow text-left relative"
      onClick={() => handleBoardClick(board.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleBoardClick(board.id)
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open ${board.name} board`}
    >
      <div className="p-4 pb-2">
        <h3 className="font-medium truncate">{board.name}</h3>
        <p className="text-xs text-muted-foreground">
          {board.member_count} member{board.member_count !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="p-4 pt-2">
        <div className="flex -space-x-2">
          {board.members?.slice(0, 3).map((member, i) => (
            <Avatar key={i} className="border-2 border-background h-8 w-8">
              <AvatarImage src={member.image || undefined} alt={member.name} />
              <AvatarFallback className="bg-muted text-xs">{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}

          {board.member_count > 3 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
              +{board.member_count - 3}
            </div>
          )}
        </div>
      </div>

      {/* Star/Unstar button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0"
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
  )

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Boards</CardTitle>
          <CardDescription>Manage your project boards</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={refreshBoards} title="Refresh boards">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new board</DialogTitle>
                <DialogDescription>
                  Create a new board to organize your tasks and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    placeholder="Enter board title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Enter board description"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBoard}
                  disabled={!newBoardTitle.trim() || isSubmitting}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  {isSubmitting ? "Creating..." : "Create board"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No boards yet. Create your first one!</div>
        ) : (
          <Tabs defaultValue="my-boards" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="my-boards" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>My Boards</span>
                {myBoards.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{myBoards.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span>Shared With Me</span>
                {sharedWithMe.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{sharedWithMe.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Team Boards</span>
                {teamBoards.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{teamBoards.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-boards">
              {myBoards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">You haven't created any boards yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myBoards.map(renderBoardCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared">
              {sharedWithMe.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No boards have been shared with you.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedWithMe.map(renderBoardCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="team">
              {teamBoardsArray.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">You don't have access to any team boards.</div>
              ) : (
                <div className="space-y-8">
                  {teamBoardsArray.map((team) => (
                    <div key={team.teamId} className="space-y-4">
                      <h3 className="text-lg font-medium">{team.teamName}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {team.boards.map(renderBoardCard)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
