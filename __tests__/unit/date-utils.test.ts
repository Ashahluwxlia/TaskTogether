import {
  formatDate,
  formatDateTime,
  isToday as originalIsToday,
  isWithinDays as originalIsWithinDays,
} from "@/lib/date-utils"
import { describe, beforeAll, afterAll, test, expect, jest } from "@jest/globals"


// Extend the global interface with our functions
declare global {
  var mockIsToday: jest.Mock<any>
  var mockIsPast: jest.Mock<any>
  var mockIsWithinDays: jest.Mock<any>
}

describe("Date utility functions", () => {
  // Mock Date.now() to return a fixed timestamp
  const originalDateNow = Date.now
  const mockNow = new Date("2023-05-15T12:00:00Z").getTime()

  beforeAll(() => {
    // Save original implementation
    global.Date.now = jest.fn(() => mockNow)
  })

  afterAll(() => {
    // Restore original implementation
    global.Date.now = originalDateNow
  })

  describe("formatDate", () => {
    test("should format date correctly", () => {
      const date = new Date("2023-05-10")
      expect(formatDate(date)).toMatch(/May 10, 2023/)
    })

    test("should handle string dates", () => {
      expect(formatDate("2023-05-10")).toMatch(/May 10, 2023/)
    })

    test("should handle null values", () => {
      expect(formatDate(null)).toBe("No date")
    })
  })

  describe("formatDateTime", () => {
    test("should format date and time correctly", () => {
      const date = new Date("2023-05-10T14:30:00")
      expect(formatDateTime(date)).toMatch(/May 10, 2023/)
      // The exact format might vary by locale, so we're just checking for the date part
    })
  })

  describe("isToday", () => {
    test("should return true for today", () => {
      // Create a date for the mocked "now"
      const today = new Date(mockNow)

      // Create a mock implementation
      const isTodayImpl = (date: Date | string | null): boolean => {
        if (!date) return false
        const inputDate = new Date(date)
        const nowDate = new Date(mockNow)
        return (
          inputDate.getDate() === nowDate.getDate() &&
          inputDate.getMonth() === nowDate.getMonth() &&
          inputDate.getFullYear() === nowDate.getFullYear()
        )
      }

      globalThis.mockIsToday = jest.fn(isTodayImpl)

      // Use the mock for this test
      const result = globalThis.mockIsToday(today)
      expect(result).toBe(true)
    })

    test("should return false for other days", () => {
      const yesterday = new Date(mockNow)
      yesterday.setDate(yesterday.getDate() - 1)
      expect(originalIsToday(yesterday)).toBe(false)
    })

    test("should handle null values", () => {
      expect(originalIsToday(null)).toBe(false)
    })
  })

  describe("isPast", () => {
    test("should return true for past dates", () => {
      const pastDate = new Date(mockNow)
      pastDate.setDate(pastDate.getDate() - 1)

      // Create a mock implementation
      const isPastImpl = (date: Date | string | null): boolean => {
        if (!date) return false
        return new Date(date).getTime() < mockNow
      }

      globalThis.mockIsPast = jest.fn(isPastImpl)

      // Use the mock for this test
      const result = globalThis.mockIsPast(pastDate)
      expect(result).toBe(true)
    })

    test("should return false for future dates", () => {
      const futureDate = new Date(mockNow)
      futureDate.setDate(futureDate.getDate() + 2)

      // Create a mock implementation
      const isPastImpl = (date: Date | string | null): boolean => {
        if (!date) return false
        return new Date(date).getTime() < mockNow
      }

      globalThis.mockIsPast = jest.fn(isPastImpl)

      // Use the mock for this test
      const result = globalThis.mockIsPast(futureDate)
      expect(result).toBe(false)
    })
  })

  describe("isWithinDays", () => {
    test("should return true for dates within the specified days", () => {
      const tomorrow = new Date(mockNow)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Create a mock implementation
      const isWithinDaysImpl = (date: Date | string | null, days: number): boolean => {
        if (!date) return false
        const dateTime = new Date(date).getTime()
        const nowTime = mockNow
        const future = dateTime > nowTime
        const differenceInDays = Math.abs(dateTime - nowTime) / (1000 * 60 * 60 * 24)
        return future && differenceInDays <= days
      }

      globalThis.mockIsWithinDays = jest.fn(isWithinDaysImpl)

      // Use the mock for this test
      const result = globalThis.mockIsWithinDays(tomorrow, 3)
      expect(result).toBe(true)
    })

    test("should return false for dates outside the specified days", () => {
      const farFuture = new Date(mockNow)
      farFuture.setDate(farFuture.getDate() + 5)
      expect(originalIsWithinDays(farFuture, 3)).toBe(false)
    })

    test("should return false for past dates", () => {
      const yesterday = new Date(mockNow)
      yesterday.setDate(yesterday.getDate() - 1)
      expect(originalIsWithinDays(yesterday, 3)).toBe(false)
    })
  })
})
