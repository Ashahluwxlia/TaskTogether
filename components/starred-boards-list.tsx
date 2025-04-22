"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface Board {
  id: string
  title: string
  description: string | null
  is_starred: boolean
  member_count?: number
  name?: string
}

interface StarredBoardsListProps {
  boards: Board[]
}

export function StarredBoardsList({ boards: initialBoards }: StarredBoardsListProps) {
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>(initialBoards)

  const handleToggleStar = async (e: React.MouseEvent, board: Board) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      // Optimistically update UI
      setBoards(boards.filter((b) => b.id !== board.id))

      const response = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_starred: false,
        }),
      })

      if (!response.ok) {
        // Revert on failure
        setBoards([...boards])
        throw new Error("Failed to update starred status")
      }

      toast({
        title: "Board unstarred",
        description: `${board.title} has been removed from your starred boards.`,
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

  const navigateToBoard = (boardId: string) => {
    router.push(`/boards/${boardId}`)
  }

  if (boards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">You don't have any starred boards yet.</p>
        <Link href="/boards">
          <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">Browse boards</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {boards.map((board) => (
        <Card
          key={board.id}
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigateToBoard(board.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium truncate">{board.title || board.name || "Untitled Board"}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => handleToggleStar(e, board)}
                aria-label="Unstar board"
              >
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </Button>
            </div>
            {board.description && <p className="text-sm text-muted-foreground mb-2">{board.description}</p>}
            {board.member_count !== undefined && (
              <Badge variant="outline" className="mt-2">
                {board.member_count} members
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
