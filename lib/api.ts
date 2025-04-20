import { ApiError, handleApiResponse } from "@/lib/error-handling"
import type { ApiResponse } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || ""

/**
 * Generic function for making API requests
 */
export async function apiRequest<T, R = T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<R>> {
  try {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    return await handleApiResponse<ApiResponse<R>>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message }
    }

    console.error(`API request error (${endpoint}):`, error)
    return { error: "An unexpected error occurred" }
  }
}

/**
 * GET request helper
 */
export async function get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "GET", ...options })
}

/**
 * POST request helper
 */
export async function post<T, D = any>(endpoint: string, data: D, options?: RequestInit): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * PUT request helper
 */
export async function put<T, D = any>(endpoint: string, data: D, options?: RequestInit): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * PATCH request helper
 */
export async function patch<T, D = any>(endpoint: string, data: D, options?: RequestInit): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * DELETE request helper
 */
export async function del<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "DELETE", ...options })
}

/**
 * Upload helper for file uploads
 */
export async function upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: formData,
    headers: {
      // Don't set Content-Type for FormData, browser will set it with boundary
      ...options?.headers,
    },
    ...options,
  })
}
