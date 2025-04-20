/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
  }
}

/**
 * Helper function to handle API responses
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage: string

    try {
      const errorData = await response.json()
      errorMessage = errorData.error || response.statusText
    } catch (e) {
      errorMessage = response.statusText
    }

    throw new ApiError(errorMessage, response.status)
  }

  return (await response.json()) as T
}

/**
 * Helper function to wrap async functions and provide consistent error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  fallback?: T,
  errorHandler?: (error: any) => void,
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    if (errorHandler) {
      errorHandler(error)
    } else {
      console.error("An error occurred:", error)
    }
    return fallback
  }
}

/**
 * Helper function to validate required fields
 */
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      return `The ${field} field is required`
    }
  }
  return null
}

/**
 * Format and log API errors consistently
 */
export function logApiError(endpoint: string, error: any, context?: any): void {
  console.error(`API Error (${endpoint}):`, {
    message: error.message || "Unknown error",
    status: error.statusCode || "Unknown status",
    context: context || {},
  })
}
