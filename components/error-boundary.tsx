"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground">An error occurred while trying to display this content.</p>
        {process.env.NODE_ENV === "development" && (
          <div className="my-4 rounded-md bg-red-50 p-4 text-left">
            <p className="text-sm font-medium text-red-800">Error details:</p>
            <pre className="mt-2 max-h-96 overflow-auto text-xs text-red-800">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </div>
        )}
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
