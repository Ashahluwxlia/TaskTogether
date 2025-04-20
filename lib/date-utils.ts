// Format a date to a readable string
export function formatDate(date: Date | string | null): string {
  if (!date) return "No date"

  const dateObj = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj)
}

// Format a date to include time
export function formatDateTime(date: Date | string | null): string {
  if (!date) return "No date"

  const dateObj = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(dateObj)
}

// Get relative time (e.g., "2 hours ago")
export function getRelativeTime(date: Date | string | null): string {
  if (!date) return "No date"

  const dateObj = typeof date === "string" ? new Date(date) : date

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, "second")
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, "minute")
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, "hour")
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, "day")
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, "month")
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return rtf.format(-diffInYears, "year")
}

// Check if a date is today
export function isToday(date: Date | string | null): boolean {
  if (!date) return false

  const dateObj = typeof date === "string" ? new Date(date) : date
  const today = new Date()

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}

// Check if a date is in the past
export function isPast(date: Date | string | null): boolean {
  if (!date) return false

  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()

  return dateObj < now
}

// Check if a date is within the next n days
export function isWithinDays(date: Date | string | null, days: number): boolean {
  if (!date) return false

  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const futureDate = new Date(now)
  futureDate.setDate(now.getDate() + days)

  return dateObj >= now && dateObj <= futureDate
}
