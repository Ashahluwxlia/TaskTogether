"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import SearchContent from "@/components/search-content"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const type = searchParams.get("type") || "all"

  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults({
          tasks: [],
          boards: [],
          labels: [],
          users: [],
          comments: [],
          attachments: [],
        })
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`)
        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setResults(data)
      } catch (err: any) {
        console.error("Search error:", err)
        setError(err.message || "An error occurred while searching. Please try again.")

        // Set empty results to prevent UI errors
        setResults({
          tasks: [],
          boards: [],
          labels: [],
          users: [],
          comments: [],
          attachments: [],
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [query, type])

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-2xl font-bold mb-6">Search Results for &quot;{query}&quot;</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Searching...</span>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {error}
          <SearchContent results={results} query={query} />
        </div>
      ) : (
        <SearchContent results={results} query={query} />
      )}
    </div>
  )
}
