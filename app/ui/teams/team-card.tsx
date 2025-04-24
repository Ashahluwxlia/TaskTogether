"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { UsersRound } from "lucide-react"

interface TeamCardProps {
  team: {
    id: string
    name: string
    description?: string | null
    createdAt: Date
    members: {
      id: string
      role: string
      user: {
        id: string
        name: string
        email: string
      }
    }[]
    owner: {
      id: string
      name: string
      email: string
    }
  }
}

export function TeamCard({ team }: TeamCardProps) {
  const memberCount = team.members.length

  return (
    <Link href={`/dashboard/teams/${team.id}`} className="block h-full">
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{team.name}</CardTitle>
            <Badge variant="outline" className="ml-2">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">{team.description || "No description provided"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <UsersRound className="mr-1 h-4 w-4" />
            <span>Created {formatDistanceToNow(new Date(team.createdAt))} ago</span>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex -space-x-2">
            {team.members.slice(0, 5).map((member) => (
              <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                <AvatarFallback>
                  {member.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            ))}
            {memberCount > 5 && (
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarFallback>+{memberCount - 5}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
