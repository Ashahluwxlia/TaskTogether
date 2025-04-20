import { NextResponse } from "next/server"

export type ServerErrorType = "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "BAD_REQUEST" | "SERVER_ERROR"

interface ErrorResponseOptions {
  status?: number
  detail?: string
  code?: string
}

/**
 * Creates a standardized error response for API routes
 */
export function errorResponse(message: string, type: ServerErrorType, options?: ErrorResponseOptions) {
  const statusCodes: Record<ServerErrorType, number> = {
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    BAD_REQUEST: 400,
    SERVER_ERROR: 500,
  }

  const status = options?.status || statusCodes[type]

  return NextResponse.json(
    {
      error: message,
      detail: options?.detail,
      code: options?.code || type,
    },
    { status },
  )
}

/**
 * Helper for creating common error responses
 */
export const errors = {
  notFound: (resource: string) => errorResponse(`${resource} not found`, "NOT_FOUND"),

  unauthorized: (message = "Unauthorized") => errorResponse(message, "UNAUTHORIZED"),

  forbidden: (message = "Forbidden") => errorResponse(message, "FORBIDDEN"),

  badRequest: (message: string, detail?: string) => errorResponse(message, "BAD_REQUEST", { detail }),

  serverError: (message = "Internal server error", detail?: string) =>
    errorResponse(message, "SERVER_ERROR", { detail }),
}

/**
 * Async function wrapper that handles common errors in API routes
 */
export async function safeApiHandler<T>(
  handler: () => Promise<T>,
  errorHandler?: (error: any) => NextResponse,
): Promise<T | NextResponse> {
  try {
    return await handler()
  } catch (error: any) {
    console.error("API Handler Error:", error)

    if (errorHandler) {
      return errorHandler(error)
    }

    // Handle common errors
    if (error.message.includes("not found")) {
      return errors.notFound("Resource")
    }

    if (error.message.includes("unauthorized") || error.message.includes("Unauthorized")) {
      return errors.unauthorized()
    }

    if (error.message.includes("forbidden") || error.message.includes("Forbidden")) {
      return errors.forbidden()
    }

    // Default server error
    return errors.serverError(
      "An unexpected error occurred",
      process.env.NODE_ENV === "development" ? error.message : undefined,
    )
  }
}
