import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvitationCard } from "@/components/invitation-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function InvitationsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  // Get board invitations
  const boardInvitations = await prisma.boardInvitation.findMany({
    where: {
      recipientId: user.id,
      status: "PENDING",
    },
    include: {
      board: true,
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Get team invitations
  const teamInvitations = await prisma.teamInvitation.findMany({
    where: {
      recipientId: user.id,
      status: "PENDING",
    },
    include: {
      team: true,
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const hasInvitations = boardInvitations.length > 0 || teamInvitations.length > 0

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Invitations</h1>

      {!hasInvitations ? (
        <Card>
          <CardHeader>
            <CardTitle>No Invitations</CardTitle>
            <CardDescription>You don't have any pending invitations at the moment.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({boardInvitations.length + teamInvitations.length})</TabsTrigger>
            <TabsTrigger value="boards">Boards ({boardInvitations.length})</TabsTrigger>
            <TabsTrigger value="teams">Teams ({teamInvitations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
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
                createdAt={invitation.createdAt.toISOString()}
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
                createdAt={invitation.createdAt.toISOString()}
              />
            ))}
          </TabsContent>

          <TabsContent value="boards" className="space-y-4">
            {boardInvitations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No board invitations</p>
                </CardContent>
              </Card>
            ) : (
              boardInvitations.map((invitation) => (
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
                  createdAt={invitation.createdAt.toISOString()}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            {teamInvitations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No team invitations</p>
                </CardContent>
              </Card>
            ) : (
              teamInvitations.map((invitation) => (
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
                  createdAt={invitation.createdAt.toISOString()}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
