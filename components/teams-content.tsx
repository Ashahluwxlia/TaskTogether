"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Users } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

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

interface TeamsContentProps {
  user: User
  teams: Team[]
}

export function TeamsContent({ user, teams }: TeamsContentProps) {
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamDescription, setNewTeamDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create team")
      }

      const team = await response.json()

      toast({
        title: "Team created",
        description: `${team.name} has been created successfully.`,
      })

      setNewTeamName("")
      setNewTeamDescription("")
      setIsCreateDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-yellow-400 hover:bg-yellow-500 text-black">
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No teams yet</h2>
          <p className="text-gray-500 mb-4">Create your first team to start collaborating with others.</p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-yellow-400 hover:bg-yellow-500 text-black">
            Create Team
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {team.member_count} {team.member_count === 1 ? "member" : "members"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{team.description || "No description provided"}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 5).map((member) => (
                      <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={member.user.image || undefined} alt={member.user.name} />
                        <AvatarFallback>
                          {member.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {team.member_count > 5 && (
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarFallback>+{team.member_count - 5}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="Enter team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter team description"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
              disabled={isSubmitting || !newTeamName.trim()}
              onClick={handleCreateTeam}
            >
              {isSubmitting ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
