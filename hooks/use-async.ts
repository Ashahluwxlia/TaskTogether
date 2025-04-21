"use client"

import { useState, useCallback, useEffect } from "react"

interface UseAsyncOptions<T> {
  defaultValue?: T
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseAsyncResult<T> {
  data: T | undefined
  error: Error | null
  loading: boolean
  execute: (...args: any[]) => Promise<T | undefined>
  reset: () => void
}

/**
 * Custom hook for handling async operations with loading and error states
 */
export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions<T> = {},
): UseAsyncResult<T> {
  const { defaultValue, immediate = false, onSuccess, onError } = options

  const [data, setData] = useState<T | undefined>(defaultValue)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState<boolean>(immediate)

  // Function to execute the async operation
  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      try {
        setLoading(true)
        setError(null)

        const result = await asyncFunction(...args)
        setData(result)

        if (onSuccess) {
          onSuccess(result)
        }

        return result
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e))
        setError(error)

        if (onError) {
          onError(error)
        }

        return undefined
      } finally {
        setLoading(false)
      }
    },
    [asyncFunction, onSuccess, onError],
  )

  // Reset function
  const reset = useCallback(() => {
    setData(defaultValue)
    setError(null)
    setLoading(false)
  }, [defaultValue])

  // Execute immediately if specified
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { data, error, loading, execute, reset }
}
