import { Suspense } from "react"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { TeamDetailContent } from "@/components/team-detail-content"

interface TeamPageProps {
  params: {
    teamId: string
  }
}

export async function generateMetadata(props: TeamPageProps): Promise<Metadata> {
  // Use props.params instead of destructuring to avoid the Next.js warning
  const resolvedParams = await Promise.resolve(props.params)
  const teamId = resolvedParams.teamId
  const teams = await executeQuery("SELECT name, description FROM teams WHERE id = $1", [teamId])
  const team = teams[0]

  if (!team) {
    return {
      title: "Team Not Found - Organizo",
    }
  }

  return {
    title: `${team.name} - Teams - Organizo`,
    description: team.description || `Collaborate with your team on Organizo`,
  }
}

export default async function TeamPage(props: TeamPageProps) {
  // Use props.params instead of destructuring to avoid the Next.js warning
  const resolvedParams2 = await Promise.resolve(props.params)
  const teamId = resolvedParams2.teamId

  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is a member of this team
  const membership = await executeQuery("SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2", [
    teamId,
    user.id,
  ])

  if (membership.length === 0) {
    redirect("/teams")
  }

  // Get team details
  const teams = await executeQuery("SELECT * FROM teams WHERE id = $1", [teamId])

  if (teams.length === 0) {
    // Team doesn't exist
    redirect("/teams")
  }

  return (
    <Suspense fallback={<div className="p-8">Loading team details...</div>}>
      <TeamDetailContent teamId={teamId} />
    </Suspense>
  )
}
