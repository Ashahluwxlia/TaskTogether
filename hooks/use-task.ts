"use client"

import { useState, useEffect, useCallback } from "react"
import type { Task } from "@/types"
import { get, put } from "@/lib/api"

export function useTask(taskId: string) {
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = useCallback(async () => {
    if (!taskId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await get<Task>(`/api/tasks/${taskId}`)

      if (response.error) {
        setError(response.error)
        setTask(null)
      } else if (response.data) {
        setTask(response.data)
      }
    } catch (err) {
      setError("Failed to fetch task")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [taskId])

  const updateTask = async (updates: Partial<Task>) => {
    if (!taskId) return false

    try {
      const response = await put<Task, Partial<Task>>(`/api/tasks/${taskId}`, updates)

      if (response.error) {
        setError(response.error)
        return false
      } else if (response.data) {
        // Immediately update the local state with the new data
        setTask((prevTask) => {
          if (prevTask) {
            return { ...prevTask, ...response.data }
          }
          return response.data || null
        })
        return true
      }
      return false
    } catch (err) {
      setError("Failed to update task")
      console.error(err)
      return false
    }
  }

  useEffect(() => {
    if (taskId) {
      fetchTask()
    }
  }, [taskId, fetchTask])

  return {
    task,
    isLoading,
    error,
    refreshTask: fetchTask,
    updateTask,
  }
}
