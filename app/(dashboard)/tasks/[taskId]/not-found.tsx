import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TaskNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Task Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The task you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tasks">View All Tasks</Link>
        </Button>
      </div>
    </div>
  )
}
