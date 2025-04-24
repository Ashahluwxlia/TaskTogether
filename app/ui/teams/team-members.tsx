"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Shield, ShieldAlert, ShieldCheck, UserMinus, UserPlus } from "lucide-react"
import { AddMemberDialog } from "./add-member-dialog"

interface TeamMember {
  id: string
  role: string
  displayRole?: string
  user_id: string
  name?: string
  email?: string
  image?: string
  user?: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface TeamMembersProps {
  teamId: string
}

export function TeamMembers({ teamId }: TeamMembersProps) {
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const [membersResponse, userResponse, teamResponse] = await Promise.all([
          fetch(`/api/teams/${teamId}/members`),
          fetch("/api/auth/me"),
          fetch(`/api/teams/${teamId}`),
        ])

        if (!membersResponse.ok) {
          throw new Error("Failed to fetch team members")
        }

        if (!userResponse.ok) {
          throw new Error("Failed to fetch current user")
        }

        if (!teamResponse.ok) {
          throw new Error("Failed to fetch team details")
        }

        const membersData = await membersResponse.json()
        const userData = await userResponse.json()
        const teamData = await teamResponse.json()

        // Normalize member data structure and mark the owner
        const normalizedMembers = membersData.map((member: any) => {
          // Handle both flattened and nested user data structures
          const memberData = {
            ...member,
            user: {
              id: member.user_id || (member.user && member.user.id),
              name: member.name || (member.user && member.user.name) || "Unknown",
              email: member.email || (member.user && member.user.email) || "",
              image: member.image || (member.user && member.user.image),
            },
          }

          // If this member is the team owner, override their role display
          if (memberData.user.id === teamData.owner_id) {
            memberData.displayRole = "OWNER"
          } else {
            memberData.displayRole = member.role
          }

          return memberData
        })

        setMembers(normalizedMembers)
        setCurrentUserId(userData.id)
        setUserRole(userData.role)
      } catch (error: any) {
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [teamId])

  const refreshMembers = async () => {
    setIsLoading(true)
    try {
      const [membersResponse, teamResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}/members`),
        fetch(`/api/teams/${teamId}`),
      ])

      if (!membersResponse.ok) {
        throw new Error("Failed to fetch team members")
      }

      if (!teamResponse.ok) {
        throw new Error("Failed to fetch team details")
      }

      const membersData = await membersResponse.json()
      const teamData = await teamResponse.json()

      // Normalize member data structure and mark the owner
      const normalizedMembers = membersData.map((member: any) => {
        // Handle both flattened and nested user data structures
        const memberData = {
          ...member,
          user: {
            id: member.user_id || (member.user && member.user.id),
            name: member.name || (member.user && member.user.name) || "Unknown",
            email: member.email || (member.user && member.user.email) || "",
            image: member.image || (member.user && member.user.image),
          },
        }

        // If this member is the team owner, override their role display
        if (memberData.user.id === teamData.owner_id) {
          memberData.displayRole = "OWNER"
        } else {
          memberData.displayRole = member.role
        }

        return memberData
      })

      setMembers(normalizedMembers)
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeRole = async () => {
    if (!selectedMember || !newRole) return

    setIsSubmitting(true)

    try {
      const userId = selectedMember.user?.id || selectedMember.user_id

      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update member role")
      }

      const updatedMember = await response.json()

      setMembers(members.map((member) => (member.id === updatedMember.id ? updatedMember : member)))

      toast({
        title: "Role updated",
        description: `${selectedMember.user?.name || "Member"}'s role has been updated to ${newRole}.`,
      })

      setChangeRoleDialogOpen(false)
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

  const handleRemoveMember = async () => {
    if (!selectedMember) return

    setIsSubmitting(true)

    try {
      const userId = selectedMember.user?.id || selectedMember.user_id

      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to remove member")
      }

      setMembers(members.filter((member) => member.id !== selectedMember.id))

      toast({
        title: "Member removed",
        description: `${selectedMember.user?.name || "Member"} has been removed from the team.`,
      })

      setRemoveDialogOpen(false)
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

  const getRoleIcon = (role: string, displayRole?: string) => {
    const roleToUse = displayRole || role
    switch (roleToUse) {
      case "OWNER":
        return <ShieldCheck className="h-4 w-4 text-yellow-500" />
      case "ADMIN":
        return <ShieldAlert className="h-4 w-4 text-blue-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleName = (role: string, displayRole?: string) => {
    const roleToUse = displayRole || role
    switch (roleToUse) {
      case "OWNER":
        return "Owner"
      case "ADMIN":
        return "Admin"
      case "MEMBER":
        return "Member"
      default:
        return roleToUse
    }
  }

  const getUserInitials = (member: TeamMember) => {
    const name = member.user?.name || member.name || ""
    if (!name) return "?"

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Members</h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded mt-2"></div>
                </div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={refreshMembers} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Team Members ({members.length})</h3>
          <p className="text-sm text-muted-foreground">Manage team members and their roles</p>
        </div>
        {userRole === "admin" && (
          <Button className="bg-yellow-400 hover:bg-yellow-500 text-black" onClick={() => {}}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Members</CardTitle>
          <CardDescription>People with access to this team</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getUserInitials(member)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.user?.name || member.name || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground">{member.user?.email || member.email || ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs bg-accent/50 px-2 py-1 rounded">
                    {getRoleIcon(member.role, member.displayRole)}
                    <span>{getRoleName(member.role, member.displayRole)}</span>
                  </div>

                  {/* Don't show dropdown for current user or for owner if current user is not owner */}
                  {(member.user?.id || member.user_id) !== currentUserId &&
                    !(
                      member.role === "OWNER" &&
                      !members.some((m) => (m.user?.id || m.user_id) === currentUserId && m.role === "OWNER")
                    ) &&
                    members.some(
                      (m) => (m.user?.id || m.user_id) === currentUserId && (m.role === "OWNER" || m.role === "ADMIN"),
                    ) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member)
                              setNewRole(member.role)
                              setChangeRoleDialogOpen(true)
                            }}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member)
                              setRemoveDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedMember?.user?.name || selectedMember?.name || "this member"}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {/* Don't allow changing to OWNER */}
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {newRole === "ADMIN" && "Can manage team settings and members"}
              {newRole === "MEMBER" && "Can create and edit boards and tasks"}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setChangeRoleDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
              onClick={handleChangeRole}
              disabled={isSubmitting || newRole === selectedMember?.role}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.user?.name || selectedMember?.name || "this member"} from
              this team?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleRemoveMember} disabled={isSubmitting}>
              {isSubmitting ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {userRole === "admin" && <AddMemberDialog teamId={teamId} onMemberAdded={refreshMembers} />}
    </div>
  )
}
