import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TeamMembersSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
