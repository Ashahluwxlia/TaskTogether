"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Pencil,
  PlusCircle,
  Shield,
  Trash2,
  Users,
} from "lucide-react"
import { TeamMembers } from "@/app/ui/teams/team-members"
import { TeamBoards } from "@/app/ui/teams/team-boards"
import { EditTeamModal } from "@/app/ui/teams/edit-team-modal"
import { DeleteTeamModal } from "@/app/ui/teams/delete-team-modal"
import { AddMemberModal } from "@/app/ui/teams/add-member-modal" // Import AddMemberModal
import { TeamChat } from "@/components/team-chat"

interface Team {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  updated_at: string
  members: {
    id: string
    name: string
    email: string
    image: string | null
    role: string
    user_id?: string
  }[]
  boards: {
    id: string
    name: string
    created_at: string
  }[]
}

interface TeamDetailContentProps {
  teamId: string
}

export function TeamDetailContent({ teamId }: TeamDetailContentProps) {
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [addMemberOpen, setAddMemberOpen] = useState(false) // Add state for AddMemberModal
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}`)

        if (!response.ok) {
          if (response.status === 404) {
            router.push("/teams")
            return
          }
          throw new Error("Failed to fetch team")
        }

        const data = await response.json()
        console.log("Team data:", data) // Log the team data to see its structure
        setTeam(data)
      } catch (error) {
        console.error("Error fetching team:", error)
        toast({
          title: "Error",
          description: "Failed to load team details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [teamId, router, toast])

  const handleTeamUpdated = (updatedTeam: Partial<Team>) => {
    if (team) {
      setTeam({ ...team, ...updatedTeam })
    }
  }

  const handleTeamDeleted = () => {
    router.push("/teams")
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <p>Team not found or you don&apos;t have access.</p>
        <Button onClick={() => router.push("/teams")} className="mt-4">
          Back to Teams
        </Button>
      </div>
    )
  }

  const memberCount = team.members?.length || 0
  const boardCount = team.boards?.length || 0
  const adminCount = team.members?.filter((member) => member.role === "ADMIN" || member.role === "OWNER").length || 0

  // Function to determine if a member is the owner
  const isOwner = (member: any) => {
    // Try different possible properties that might contain the user ID
    const memberId = member.user_id || member.id
    return team.owner_id === memberId
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{team.name}</h2>
          {team.description && <p className="text-muted-foreground">{team.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/teams")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => setAddMemberOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            Add Member
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="boards">Boards</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Members Card */}
            <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setActiveTab("members")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memberCount}</div>
                <p className="text-xs text-muted-foreground">{adminCount} administrators</p>
              </CardContent>
            </Card>

            {/* Boards Card */}
            <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setActiveTab("boards")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Boards</CardTitle>
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{boardCount}</div>
                <p className="text-xs text-muted-foreground">Collaborative workspaces</p>
              </CardContent>
            </Card>

            {/* Activity Card */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
                <CheckSquare className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">Last updated recently</p>
                <div className="mt-2">
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">75% activity level</p>
                </div>
              </CardContent>
            </Card>

            {/* Access Control Card */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Access Control</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminCount}</div>
                <p className="text-xs text-muted-foreground">Team administrators</p>
              </CardContent>
            </Card>

            {/* Team Chat Card */}
            <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setActiveTab("chat")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Chat</CardTitle>
                <MessageSquare className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">Communicate with your team</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Team Members Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>People with access to this team</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("members")}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.members?.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {member.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {isOwner(member) ? "Owner" : member.role}
                      </div>
                    </div>
                  ))}
                  {team.members?.length > 3 && (
                    <Button variant="ghost" className="w-full text-xs" onClick={() => setActiveTab("members")}>
                      View all {team.members.length} members
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Boards Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Boards</CardTitle>
                    <CardDescription>Collaborative workspaces for your team</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("boards")}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.boards?.slice(0, 3).map((board) => (
                    <div
                      key={board.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={() => router.push(`/boards/${board.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{board.name || "Untitled Board"}</p>
                      </div>
                    </div>
                  ))}
                  {team.boards?.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">No boards created yet</p>
                      <Button
                        className="bg-yellow-400 hover:bg-yellow-500 text-black"
                        onClick={() => setActiveTab("boards")}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Board
                      </Button>
                    </div>
                  )}
                  {team.boards?.length > 3 && (
                    <Button variant="ghost" className="w-full text-xs" onClick={() => setActiveTab("boards")}>
                      View all {team.boards.length} boards
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <TeamMembers teamId={teamId} />
        </TabsContent>

        <TabsContent value="boards" className="space-y-4">
          <TeamBoards teamId={teamId} />
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <TeamChat teamId={teamId} />
        </TabsContent>
      </Tabs>

      {isEditModalOpen && (
        <EditTeamModal
          team={team}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onTeamUpdated={handleTeamUpdated}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteTeamModal
          teamId={teamId}
          teamName={team.name}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onTeamDeleted={handleTeamDeleted}
        />
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        teamId={teamId}
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onMemberAdded={() => router.refresh()}
      />
    </div>
  )
}
