"use client"

import { useEffect, useState } from "react"
import { InvitationCard } from "@/components/invitation-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

interface BoardInvitation {
  id: string
  boardId: string
  recipientId: string
  senderId: string
  role: string
  status: string
  message: string | null
  createdAt: string
  board: {
    id: string
    title: string
    background: string
  }
  sender: {
    id: string
    name: string
    image: string | null
  }
}

interface TeamInvitation {
  id: string
  teamId: string
  recipientId: string
  senderId: string
  role: string
  status: string
  message: string | null
  createdAt: string
  team: {
    id: string
    name: string
  }
  sender: {
    id: string
    name: string
    image: string | null
  }
}

export function InvitationsList() {
  const [boardInvitations, setBoardInvitations] = useState<BoardInvitation[]>([])
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/notifications?includeInvitations=true")
        const data = await response.json()

        if (response.ok) {
          setBoardInvitations(data.boardInvitations || [])
          setTeamInvitations(data.teamInvitations || [])
        }
      } catch (error) {
        console.error("Error fetching invitations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitations()
  }, [])

  const handleAccept = () => {
    router.refresh()
  }

  const handleDecline = () => {
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (boardInvitations.length === 0 && teamInvitations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No pending invitations</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 p-2">
      {boardInvitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          id={invitation.id}
          type="board"
          sender={{
            id: invitation.sender.id,
            name: invitation.sender.name,
            image: invitation.sender.image,
          }}
          entityName={invitation.board.title}
          role={invitation.role}
          message={invitation.message}
          createdAt={invitation.createdAt}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ))}

      {teamInvitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          id={invitation.id}
          type="team"
          sender={{
            id: invitation.sender.id,
            name: invitation.sender.name,
            image: invitation.sender.image,
          }}
          entityName={invitation.team.name}
          role={invitation.role}
          message={invitation.message}
          createdAt={invitation.createdAt}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ))}
    </div>
  )
}
