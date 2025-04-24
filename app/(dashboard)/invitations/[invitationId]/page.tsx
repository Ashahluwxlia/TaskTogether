import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { InvitationCard } from "@/components/invitation-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: { invitationId: string }
  searchParams: { type?: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  // Get parameters safely
  const resolvedParams = await Promise.resolve(params)
  const resolvedSearchParams = await Promise.resolve(searchParams)
  const invitationId = resolvedParams.invitationId
  const type = resolvedSearchParams.type || "board"

  let invitation
  let entityName = ""
  let senderName = ""
  let role = ""
  let message = ""
  let createdAt = new Date().toISOString()

  try {
    if (type === "board") {
      invitation = await prisma.boardInvitation.findUnique({
        where: { id: invitationId },
        include: {
          board: true,
          sender: true,
        },
      })

      if (!invitation) {
        return (
          <div className="container max-w-2xl py-10">
            <Card>
              <CardHeader>
                <CardTitle>Invitation Not Found</CardTitle>
                <CardDescription>The invitation you're looking for doesn't exist or has been removed.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }

      if (invitation.recipientId !== user.id) {
        return (
          <div className="container max-w-2xl py-10">
            <Card>
              <CardHeader>
                <CardTitle>Invalid Invitation</CardTitle>
                <CardDescription>
                  This invitation is not for you or you don't have permission to view it.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }

      if (invitation.status !== "PENDING") {
        return (
          <div className="container max-w-2xl py-10">
            <Card>
              <CardHeader>
                <CardTitle>Invitation Already Processed</CardTitle>
                <CardDescription>This invitation has already been {invitation.status.toLowerCase()}.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }

      entityName = invitation.board.title
      senderName = invitation.sender.name
      role = invitation.role
      message = invitation.message || ""
      createdAt = invitation.createdAt.toISOString()
    } else if (type === "team") {
      invitation = await prisma.teamInvitation.findUnique({
        where: { id: invitationId },
        include: {
          team: true,
          sender: true,
        },
      })

      if (!invitation) {
        return (
          <div className="container max-w-2xl py-10">
            <Card>
              <CardHeader>
                <CardTitle>Invitation Not Found</CardTitle>
                <CardDescription>The invitation you're looking for doesn't exist or has been removed.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }

      if (invitation.recipientId !== user.id) {
        return (
          <div className="container max-w-2xl py-10">
            <Card>
              <CardHeader>
                <CardTitle>Invalid Invitation</CardTitle>
                <CardDescription>
                  This invitation is not for you or you don't have permission to view it.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }

      if (invitation.status !== "PENDING") {
        return (
          <div className="container max-w-2xl py-10">
            <Card>
              <CardHeader>
                <CardTitle>Invitation Already Processed</CardTitle>
                <CardDescription>This invitation has already been {invitation.status.toLowerCase()}.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }

      entityName = invitation.team.name
      senderName = invitation.sender.name
      role = invitation.role
      message = invitation.message || ""
      createdAt = invitation.createdAt.toISOString()
    }
  } catch (error) {
    console.error("Error fetching invitation:", error)
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>There was an error processing this invitation. Please try again later.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Invitation</CardTitle>
          <CardDescription>You've been invited to join a {type}. Review the details below.</CardDescription>
        </CardHeader>
        <CardContent>
          {invitation && (
            <InvitationCard
              id={invitationId}
              type={type as "board" | "team"}
              sender={{
                id: invitation.sender?.id || "",
                name: senderName,
                image: invitation.sender?.image || null,
              }}
              entityName={entityName}
              role={role}
              message={message}
              createdAt={createdAt}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
