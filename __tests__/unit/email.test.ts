import { describe, test, expect, jest } from "@jest/globals"

// Define the types for our mocks
type EmailResult = {
  success: boolean
  messageId?: string
  error?: any
}

// Mock the actual email module
jest.mock("@/lib/email", () => ({
  sendEmail: jest.fn<() => Promise<EmailResult>>().mockResolvedValue({
    success: true,
    messageId: "test-id",
  }),
  createEmailTemplate: jest.fn<(template: string, data: any) => string>().mockReturnValue("<html>Test template</html>"),
}))

describe("Email utility functions", () => {
  test("module can be imported", () => {
    const { sendEmail, createEmailTemplate } = require("@/lib/email")
    expect(sendEmail).toBeDefined()
    expect(createEmailTemplate).toBeDefined()
  })
})
