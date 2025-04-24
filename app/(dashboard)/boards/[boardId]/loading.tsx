import { Skeleton } from "@/components/ui/skeleton"

export default function BoardLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="min-w-[300px] space-y-3 p-3 border rounded-md">
            <Skeleton className="h-6 w-32" />

            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="p-3 border rounded-md space-y-2">
                <Skeleton className="h-5 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}

            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
