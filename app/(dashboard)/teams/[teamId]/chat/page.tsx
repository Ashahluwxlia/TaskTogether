import { notFound } from "next/navigation"
import { TeamChat } from "@/components/team-chat"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

interface TeamChatPageProps {
  params: {
    teamId: string
  }
}

export default async function TeamChatPage({ params }: TeamChatPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    return notFound()
  }

  // Check if user is a member of the team
  const isMember = await executeQuery("SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1", [
    params.teamId,
    user.id,
  ])

  if (isMember.length === 0) {
    return notFound()
  }

  // Get team details
  const teams = await executeQuery("SELECT * FROM teams WHERE id = $1", [params.teamId])

  if (teams.length === 0) {
    return notFound()
  }

  const team = teams[0]

  // Get initial messages
  const initialMessages = await executeQuery(
    `SELECT m.*, u.name as sender_name, u.image as sender_image
     FROM team_chat_messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.team_id = $1
     AND m.is_deleted = false
     ORDER BY m.created_at DESC
     LIMIT 50`,
    [params.teamId],
  )

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">{team.name} - Team Chat</h1>
      <TeamChat teamId={params.teamId} initialMessages={initialMessages.reverse()} />
    </div>
  )
}
