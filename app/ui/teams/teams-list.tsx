import { getTeams } from "@/app/lib/data/teams"
import { TeamCard } from "./team-card"
import { EmptyState } from "@/app/ui/empty-state"
import { UsersRound } from "lucide-react"

interface Team {
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

interface TeamsListProps {
  teams?: Team[]
}

export async function TeamsList({ teams }: TeamsListProps) {
  const teamsData = teams || await getTeams()

  if (teamsData.length === 0) {
    return (
      <EmptyState
        title="No teams yet"
        description="Create your first team to start collaborating with others."
        icon={<UsersRound className="h-12 w-12 text-gray-400" />}
        action={{
          label: "Create Team",
          href: "#create-team-modal",
        }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teamsData.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  )
}
