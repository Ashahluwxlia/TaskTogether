import { cn, formatDuration } from "@/lib/utils"
import { describe, expect, test } from "@jest/globals"

describe("cn function", () => {
  test("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2")
    expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2")
    expect(cn("class1", undefined, null, "class2")).toBe("class1 class2")
  })
})

describe("formatDuration function", () => {
  test("should format milliseconds to human-readable duration", () => {
    // Test hours, minutes, seconds
    expect(formatDuration(3661000)).toBe("1h 1m 1s")

    // Test minutes and seconds only
    expect(formatDuration(61000)).toBe("1m 1s")

    // Test seconds only
    expect(formatDuration(5000)).toBe("5s")

    // Test zero
    expect(formatDuration(0)).toBe("0s")

    // Test negative value (should be treated as 0)
    expect(formatDuration(-1000)).toBe("0s")
  })
})
