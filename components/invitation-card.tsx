"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface InvitationCardProps {
  id: string
  type: "board" | "team"
  sender: {
    id: string
    name: string
    image?: string | null
  }
  entityName: string
  role: string
  message?: string | null
  createdAt: string
  onAccept?: () => void
  onDecline?: () => void
}

export function InvitationCard({
  id,
  type,
  sender,
  entityName,
  role,
  message,
  createdAt,
  onAccept,
  onDecline,
}: InvitationCardProps) {
  const [isLoading, setIsLoading] = useState<"accept" | "decline" | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleAccept = async () => {
    try {
      setIsLoading("accept")
      const response = await fetch(`/api/invitations/${id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation")
      }

      toast({
        title: "Invitation accepted",
        description: `You have joined the ${type} "${entityName}"`,
        variant: "default",
      })

      if (onAccept) {
        onAccept()
      }

      // Redirect to the board or team
      if (type === "board" && data.boardId) {
        router.push(`/boards/${data.boardId}`)
      } else if (type === "team" && data.teamId) {
        router.push(`/dashboard/teams/${data.teamId}`)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Error accepting invitation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invitation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleDecline = async () => {
    try {
      setIsLoading("decline")
      const response = await fetch(`/api/invitations/${id}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to decline invitation")
      }

      toast({
        title: "Invitation declined",
        description: `You have declined the invitation to join the ${type} "${entityName}"`,
        variant: "default",
      })

      if (onDecline) {
        onDecline()
      }

      router.refresh()
    } catch (error) {
      console.error("Error declining invitation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to decline invitation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  // Format the date
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={sender.image || ""} alt={sender.name} />
              <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{entityName}</CardTitle>
              <CardDescription className="text-sm">
                Invited by {sender.name} on {formattedDate}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Role:</span>
            <Badge variant="secondary" className="capitalize">
              {role.toLowerCase()}
            </Badge>
          </div>
          {message && (
            <div className="mt-2">
              <p className="text-sm font-medium">Message:</p>
              <p className="text-sm mt-1 text-muted-foreground">{message}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={handleDecline} disabled={isLoading !== null}>
          {isLoading === "decline" ? "Declining..." : "Decline"}
        </Button>
        <Button size="sm" onClick={handleAccept} disabled={isLoading !== null}>
          {isLoading === "accept" ? "Accepting..." : "Accept"}
        </Button>
      </CardFooter>
    </Card>
  )
}
