"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  getDay,
  isToday,
} from "date-fns"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Locale } from "date-fns"

export type CalendarProps = {
  className?: string
  selected?: Date | Date[]
  onSelect?: ((date: Date) => void) | React.Dispatch<React.SetStateAction<Date | undefined>>
  disabled?: (date: Date) => boolean
  month?: Date
  onMonthChange?: (date: Date) => void
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  mode?: "single" | "multiple" | "range" // Added mode prop
  initialFocus?: boolean // Added initialFocus prop
  fromDate?: Date
  toDate?: Date
  defaultMonth?: Date
  numberOfMonths?: number
  fixedWeeks?: boolean
  ISOWeek?: boolean
  showOutsideDays?: boolean
  locale?: Locale
  classNames?: Record<string, string>
}

function Calendar({
  className,
  selected,
  onSelect,
  disabled,
  month: externalMonth,
  onMonthChange,
  weekStartsOn = 0,
  mode = "single", // Default to single mode
  initialFocus = false,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Use controlled or uncontrolled month state
  const [month, setMonth] = useState(() => {
    if (externalMonth) return externalMonth
    if (selected && !Array.isArray(selected)) return selected
    return new Date()
  })

  // Update internal state when external month changes
  useEffect(() => {
    if (externalMonth) {
      setMonth(externalMonth)
    }
  }, [externalMonth])

  // Handle month navigation
  const handlePreviousMonth = () => {
    const newMonth = subMonths(month, 1)
    setMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = addMonths(month, 1)
    setMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  // Handle date selection based on mode
  const handleDateSelect = (date: Date) => {
    if (disabled?.(date)) return

    if (mode === "single") {
      // In single mode, just pass the date directly to onSelect
      // This works with both our custom handler and React's setState
      onSelect?.(date)
    } else if (mode === "multiple" || mode === "range") {
      // For multiple and range modes, we need to handle the selection differently
      // But since these aren't used in the current application, we'll just pass the date
      onSelect?.(date)
    }
  }

  // Check if a date is selected
  const isDateSelected = (date: Date) => {
    if (!selected) return false

    if (Array.isArray(selected)) {
      return selected.some((selectedDate) => selectedDate.toDateString() === date.toDateString())
    }

    return date.toDateString() === selected.toDateString()
  }

  // Generate calendar days
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Calculate days needed to fill the grid
  const startDay = getDay(monthStart)
  const daysToAdd = (7 - ((daysInMonth.length + startDay) % 7)) % 7

  // Create array of all days to display
  const calendarDays = React.useMemo(() => {
    // Get days from previous month to fill the first row
    const prevMonthDays = Array.from({ length: startDay }).map((_, i) => {
      const date = new Date(monthStart)
      date.setDate(date.getDate() - (startDay - i))
      return date
    })

    // Get days from next month to fill the last row
    const nextMonthDays = Array.from({ length: daysToAdd }).map((_, i) => {
      const date = new Date(monthEnd)
      date.setDate(date.getDate() + i + 1)
      return date
    })

    return [...prevMonthDays, ...daysInMonth, ...nextMonthDays]
  }, [monthStart, monthEnd, daysInMonth, startDay, daysToAdd])

  // Get weekday names
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  // Reorder weekdays based on weekStartsOn
  const orderedWeekdays = [...weekdays.slice(weekStartsOn), ...weekdays.slice(0, weekStartsOn)]

  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">{format(month, "MMMM yyyy")}</div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePreviousMonth}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </button>
          <button
            onClick={handleNextMonth}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            )}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </button>
        </div>
      </div>

      {/* Weekday headers - adjusted to match date alignment */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {orderedWeekdays.map((day) => (
          <div key={day} className="text-sm text-muted-foreground flex items-center justify-center h-9 w-9 mx-auto">
            {day.charAt(0)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => {
          const isCurrentMonth = isSameMonth(date, month)
          const isSelected = isDateSelected(date)
          const isDisabled = disabled?.(date) || false
          const isToday_ = isToday(date)

          return (
            <button
              key={i}
              onClick={() => handleDateSelect(date)}
              disabled={isDisabled}
              tabIndex={initialFocus && i === 0 ? 0 : -1}
              className={cn(
                "h-9 w-9 p-0 font-normal text-center text-sm rounded-md mx-auto",
                isCurrentMonth ? "text-foreground" : "text-muted-foreground opacity-50",
                isSelected && "bg-primary text-primary-foreground",
                isToday_ && !isSelected && "border border-primary",
                !isSelected && !isDisabled && "hover:bg-accent hover:text-accent-foreground",
                isDisabled && "opacity-50 cursor-not-allowed",
                !showOutsideDays && !isCurrentMonth && "invisible pointer-events-none",
              )}
            >
              {format(date, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
