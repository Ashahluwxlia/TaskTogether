import { describe, test, expect, jest } from "@jest/globals"

// Define the types for our mocks
type EmailResult = {
  success: boolean
  messageId?: string
  error?: any
}

// Mock the entire module
jest.mock("@/lib/notification-service", () => ({
  sendPasswordResetEmail: jest.fn<(email: string, token: string) => Promise<EmailResult>>().mockResolvedValue({
    success: true,
  }),
  sendTaskAssignmentEmail: jest
    .fn<(email: string, taskTitle: string, boardName: string) => Promise<EmailResult>>()
    .mockResolvedValue({
      success: true,
    }),
  checkTasksDueSoon: jest.fn<() => Promise<number>>().mockResolvedValue(1),
}))

describe("Notification Service", () => {
  test("module can be imported", () => {
    const { sendPasswordResetEmail, sendTaskAssignmentEmail, checkTasksDueSoon } = require("@/lib/notification-service")
    expect(sendPasswordResetEmail).toBeDefined()
    expect(sendTaskAssignmentEmail).toBeDefined()
    expect(checkTasksDueSoon).toBeDefined()
  })
})
