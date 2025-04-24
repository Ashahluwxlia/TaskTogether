import { redirect } from "next/navigation"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { TeamsContent } from "@/components/teams-content"

interface User {
  id: string
  name: string
  email: string
  image: string | null
}

interface TeamMember {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

interface Team {
  id: string
  name: string
  description: string | null
  owner_id: string
  role: string
  member_count: number
  members: TeamMember[]
}

export default async function TeamsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's teams
  const teamsData = await executeQuery(
    `SELECT t.*, tm.role,
     (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
    FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = $1
    ORDER BY t.name ASC`,
    [user.id],
  )

  // Transform the teams data to match the expected Team interface
  const teams: Team[] = teamsData.map((team) => ({
    id: team.id,
    name: team.name,
    description: team.description,
    owner_id: team.owner_id,
    role: team.role,
    member_count: team.member_count,
    members: [], // This will be populated later if needed
  }))

  // Transform the user data to match the expected User interface
  const typedUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  }

  return (
    <>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Teams</h1>
      </div>
      <TeamsContent user={typedUser} teams={teams} />
    </>
  )
}
