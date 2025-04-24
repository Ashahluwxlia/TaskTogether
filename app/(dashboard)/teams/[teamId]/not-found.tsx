import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TeamNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Team Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The team you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/teams">View All Teams</Link>
        </Button>
      </div>
    </div>
  )
}
