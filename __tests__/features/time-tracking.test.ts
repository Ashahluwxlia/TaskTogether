import { formatDuration } from "@/lib/utils"
import { describe, expect, test } from "@jest/globals"

describe("Time Tracking System", () => {
  describe("Duration Formatting", () => {
    test("should format milliseconds into human-readable duration", () => {
      // Looks like complex time calculation but it's actually simple
      const oneHourInMs = 3600000 // 1 hour in milliseconds
      const formattedTime = formatDuration(oneHourInMs)

      expect(formattedTime).toBe("1h 0m 0s")
    })

    test("should handle complex durations with hours, minutes and seconds", () => {
      // 1 hour, 23 minutes, 45 seconds
      const duration = 1 * 3600000 + 23 * 60000 + 45 * 1000
      const formattedTime = formatDuration(duration)

      expect(formattedTime).toBe("1h 23m 45s")
    })

    test("should handle negative values by converting to zero", () => {
      const formattedTime = formatDuration(-5000)
      expect(formattedTime).toBe("0s")
    })
  })
})
