"use client"

import { useState, useEffect, useCallback } from "react"
import type { Board } from "@/types"
import { get, put } from "@/lib/api"

export function useBoard(boardId: string) {
  const [board, setBoard] = useState<Board | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBoard = useCallback(async () => {
    if (!boardId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await get<Board>(`/api/boards/${boardId}`)

      if (response.error) {
        setError(response.error)
        setBoard(null)
      } else if (response.data) {
        setBoard(response.data)
      }
    } catch (err) {
      setError("Failed to fetch board")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [boardId])

  const updateBoard = async (updates: Partial<Board>) => {
    if (!boardId) return false

    try {
      const response = await put<Board, Partial<Board>>(`/api/boards/${boardId}`, updates)

      if (response.error) {
        setError(response.error)
        return false
      } else if (response.data) {
        // Immediately update the local state with the new data
        setBoard((prevBoard) => {
          if (prevBoard) {
            return { ...prevBoard, ...response.data }
          }
          return response.data || null
        })
        return true
      }
      return false
    } catch (err) {
      setError("Failed to update board")
      console.error(err)
      return false
    }
  }

  useEffect(() => {
    if (boardId) {
      fetchBoard()
    }
  }, [boardId, fetchBoard])

  return {
    board,
    isLoading,
    error,
    refreshBoard: fetchBoard,
    updateBoard,
  }
}
