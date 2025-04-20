import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 0) milliseconds = 0

  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const displayHours = hours
  const displayMinutes = minutes % 60
  const displaySeconds = seconds % 60

  if (hours > 0) {
    return `${displayHours}h ${displayMinutes}m ${displaySeconds}s`
  } else if (minutes > 0) {
    return `${displayMinutes}m ${displaySeconds}s`
  } else {
    return `${displaySeconds}s`
  }
}
