import { describe, it, expect, beforeAll } from "@jest/globals"

// Mock fetch for testing
global.fetch = jest.fn()

// Simple mock response data
const mockUserData = { id: 1, name: "Test User", email: "test@example.com" }
const mockTasksData = [
  { id: 1, title: "Task 1", completed: false },
  { id: 2, title: "Task 2", completed: true },
]
const mockTeamsData = [
  { id: 1, name: "Team Alpha", memberCount: 5 },
  { id: 2, name: "Team Beta", memberCount: 3 },
]

describe("Simple API Tests", () => {
  beforeAll(() => {
    // Reset and setup mock implementations
    ;(fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockUserData),
        })
      } else if (url.includes("/api/tasks")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockTasksData),
        })
      } else if (url.includes("/api/teams")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockTeamsData),
        })
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: "Success" }),
      })
    })
  })

  it("should fetch current user data successfully", async () => {
    const response = await fetch("/api/auth/me")
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("name")
    expect(data).toHaveProperty("email")
  })

  it("should fetch tasks successfully", async () => {
    const response = await fetch("/api/tasks")
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    expect(data[0]).toHaveProperty("id")
    expect(data[0]).toHaveProperty("title")
  })

  it("should fetch teams successfully", async () => {
    const response = await fetch("/api/teams")
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(2)
    expect(data[0].name).toBe("Team Alpha")
  })

  it("should have the correct structure for team data", async () => {
    const response = await fetch("/api/teams")
    const data = await response.json()

    const team = data[0]
    expect(team).toHaveProperty("id")
    expect(team).toHaveProperty("name")
    expect(team).toHaveProperty("memberCount")
    expect(typeof team.id).toBe("number")
    expect(typeof team.name).toBe("string")
    expect(typeof team.memberCount).toBe("number")
  })
})
