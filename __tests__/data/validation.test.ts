import { createBoardSchema, createTaskSchema, loginSchema } from "@/lib/validation"

describe("Data Validation", () => {
  describe("Board Validation", () => {
    test("should validate a valid board object", () => {

      const validBoard = {
        title: "Project Alpha",
        description: "A new project for Q2",
      }

      const result = createBoardSchema.safeParse(validBoard)
      expect(result.success).toBe(true)
    })
  })

  describe("Task Validation", () => {
    test("should validate a complex task object with all fields", () => {
      const validTask = {
        title: "Implement API",
        description: "Create REST endpoints for user management",
        listId: "list-123",
        dueDate: "2023-12-31",
        assignedTo: "user-456",
        position: 1,
      }

      const result = createTaskSchema.safeParse(validTask)
      expect(result.success).toBe(true)
    })
  })

  describe("User Authentication Validation", () => {
    test("should validate login credentials", () => {
      const validCredentials = {
        email: "user@example.com",
        password: "securepassword123",
      }

      const result = loginSchema.safeParse(validCredentials)
      expect(result.success).toBe(true)
    })
  })
})
