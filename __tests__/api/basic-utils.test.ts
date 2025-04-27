import { describe, it, expect } from "@jest/globals"

describe("Basic Utility Functions Tests", () => {
  // Simple utility function to capitalize a string
  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  // Simple utility function to check if a number is even
  const isEven = (num: number): boolean => {
    return num % 2 === 0
  }

  // Simple utility function to sum an array of numbers
  const sum = (numbers: number[]): number => {
    return numbers.reduce((total, num) => total + num, 0)
  }

  it("should capitalize strings correctly", () => {
    expect(capitalize("hello")).toBe("Hello")
    expect(capitalize("WORLD")).toBe("World")
    expect(capitalize("javascript")).toBe("Javascript")
  })

  it("should correctly identify even numbers", () => {
    expect(isEven(2)).toBe(true)
    expect(isEven(4)).toBe(true)
    expect(isEven(100)).toBe(true)
    expect(isEven(1)).toBe(false)
    expect(isEven(3)).toBe(false)
  })

  it("should sum arrays of numbers correctly", () => {
    expect(sum([1, 2, 3])).toBe(6)
    expect(sum([5, 10, 15])).toBe(30)
    expect(sum([])).toBe(0)
  })

  it("should handle string operations correctly", () => {
    expect("hello".length).toBe(5)
    expect("hello".toUpperCase()).toBe("HELLO")
    expect("hello".charAt(0)).toBe("h")
    expect("hello world".split(" ")).toEqual(["hello", "world"])
  })

  it("should handle array operations correctly", () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBe(3)
    expect(arr.map((x) => x * 2)).toEqual([2, 4, 6])
    expect(arr.filter((x) => x > 1)).toEqual([2, 3])
    expect([...arr, 4]).toEqual([1, 2, 3, 4])
  })
})
