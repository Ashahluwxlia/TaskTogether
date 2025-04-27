import { generateCsrfToken, hashPassword, verifyPassword, generateSessionToken, sanitizeInput } from "@/lib/security"

describe("Security utility functions", () => {
  describe("generateCsrfToken", () => {
    test("should generate a token of correct length", () => {
      const token = generateCsrfToken()
      expect(token).toHaveLength(64) // 32 bytes in hex = 64 characters
    })

    test("should generate different tokens on each call", () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe("hashPassword and verifyPassword", () => {
    test("should hash password and verify it correctly", () => {
      const password = "securePassword123!"
      const hashedPassword = hashPassword(password)

      // Hash should be in format hash:salt
      expect(hashedPassword).toContain(":")

      // Verification should work with correct password
      expect(verifyPassword(password, hashedPassword)).toBe(true)

      // Verification should fail with incorrect password
      expect(verifyPassword("wrongPassword", hashedPassword)).toBe(false)
    })
  })

  describe("generateSessionToken", () => {
    test("should generate a token of correct length", () => {
      const token = generateSessionToken()
      expect(token).toHaveLength(64) // 32 bytes in hex = 64 characters
    })
  })

  describe("sanitizeInput", () => {
    test("should sanitize HTML special characters", () => {
      const input = '<script>alert("XSS")</script>'
      const sanitized = sanitizeInput(input)
      expect(sanitized).toBe("&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;")
    })

    test("should handle normal text correctly", () => {
      const input = "Normal text without special characters"
      const sanitized = sanitizeInput(input)
      expect(sanitized).toBe(input)
    })
  })
})
