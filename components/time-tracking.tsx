"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/utils"
import { Play, Pause, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TimeEntry {
  id: string
  task_id: string
  task_title: string
  start_time: string
  end_time: string | null
  duration: number | null
  description: string | null
}

interface TimeTrackingProps {
  taskId: string
  _userId: string
}

export function TimeTracking(props: TimeTrackingProps) {
  const { taskId, _userId } = props
  const router = useRouter()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTimeEntries()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (activeEntry) {
      const startTime = new Date(activeEntry.start_time).getTime()

      interval = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTime) / 1000) * 1000 // Convert to milliseconds
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeEntry])

  const fetchTimeEntries = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/time-entries")

      if (!response.ok) {
        throw new Error("Failed to fetch time entries")
      }

      const data = await response.json()

      // Find active entry (no end time)
      const active = data.find((entry: TimeEntry) => !entry.end_time)

      setTimeEntries(data)
      setActiveEntry(active || null)

      if (active) {
        const startTime = new Date(active.start_time).getTime()
        const now = Date.now()
        setElapsedTime(now - startTime)
      }
    } catch (error) {
      console.error("Error fetching time entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const startTimer = async (taskId: string, taskTitle: string) => {
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          startTime: new Date().toISOString(),
          description: `Working on ${taskTitle}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start timer")
      }

      const newEntry = await response.json()
      setActiveEntry(newEntry)
      setElapsedTime(0)

      fetchTimeEntries()
    } catch (error) {
      console.error("Error starting timer:", error)
    }
  }

  const stopTimer = async () => {
    if (!activeEntry) return

    try {
      const endTime = new Date().toISOString()
      const duration = elapsedTime

      const response = await fetch(`/api/time-entries/${activeEntry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          end_time: endTime,
          duration,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to stop timer")
      }

      setActiveEntry(null)
      fetchTimeEntries()
    } catch (error) {
      console.error("Error stopping timer:", error)
    }
  }

  const deleteTimeEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete time entry")
      }

      fetchTimeEntries()
    } catch (error) {
      console.error("Error deleting time entry:", error)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My tracking</h2>

      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading time entries...</div>
        ) : timeEntries.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No time entries yet</div>
        ) : (
          <div className="divide-y">
            {activeEntry && (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-yellow-500"></div>
                  <span>{activeEntry.task_title || "Untitled task"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{formatDuration(elapsedTime)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-yellow-100"
                    onClick={stopTimer}
                  >
                    <span className="sr-only">Pause timer</span>
                    <Pause className="h-4 w-4 text-yellow-700" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/tasks/${activeEntry.task_id}`)}>
                        View task
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteTimeEntry(activeEntry.id)} className="text-red-600">
                        Delete entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {timeEntries
              .filter((entry) => entry.end_time) // Only show completed entries
              .slice(0, 4) // Limit to 4 entries
              .map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <span>{entry.task_title || "Untitled task"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{formatDuration(entry.duration || 0)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startTimer(entry.task_id, entry.task_title)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/tasks/${entry.task_id}`)}>
                          View task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteTimeEntry(entry.id)} className="text-red-600">
                          Delete entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
