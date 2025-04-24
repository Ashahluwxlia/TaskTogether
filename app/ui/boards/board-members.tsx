"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { MoreHorizontal, UserMinus, UserCog } from "lucide-react"
import { InviteMemberDialog } from "./invite-member-dialog"
import { useBoardMembers } from "@/hooks/use-board-members"
import { useUser } from "@/contexts/user-context"

interface BoardMembersProps {
  boardId: string
}

export function BoardMembers({ boardId }: BoardMembersProps) {
  const { members, isLoading, error, inviteMember, updateMemberRole, removeMember } = useBoardMembers(boardId)
  const { user } = useUser()
  const [confirmingRemoval, setConfirmingRemoval] = useState<string | null>(null)

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading members...</div>
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>
  }

  const isAdmin = members.some(
    (member) => member.user.id === user?.id && (member.role === "ADMIN" || member.role === "OWNER"),
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-yellow-400 hover:bg-yellow-500 text-black"
      case "ADMIN":
        return "bg-blue-500 hover:bg-blue-600"
      case "EDITOR":
        return "bg-green-500 hover:bg-green-600"
      case "COMMENTER":
        return "bg-purple-500 hover:bg-purple-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Owner"
      case "ADMIN":
        return "Admin"
      case "EDITOR":
        return "Editor"
      case "COMMENTER":
        return "Commenter"
      default:
        return "Viewer"
    }
  }

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await updateMemberRole(memberId, role)
      toast({
        title: "Success",
        description: "Member role updated",
      })
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error updating role:", error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId)
      setConfirmingRemoval(null)
      toast({
        title: "Success",
        description: "Member removed from board",
      })
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error removing member:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Board Members ({members.length})</h3>
        {isAdmin && <InviteMemberDialog boardId={boardId} onInvite={inviteMember} />}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${member.user.email}`} alt={member.user.name} />
                <AvatarFallback>
                  {member.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{member.user.name}</p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getRoleBadgeColor(member.role)}>{getRoleLabel(member.role)}</Badge>

              {isAdmin && member.user.id !== user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center w-full">
                          <UserCog className="mr-2 h-4 w-4" />
                          <span>Change role</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => handleRoleChange(member.id, "ADMIN")}>
                            Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleRoleChange(member.id, "EDITOR")}>
                            Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleRoleChange(member.id, "COMMENTER")}>
                            Commenter
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleRoleChange(member.id, "VIEWER")}>
                            Viewer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onSelect={() => setConfirmingRemoval(member.id)}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      <span>Remove member</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {confirmingRemoval === member.id && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-background p-6 rounded-lg max-w-md w-full">
                    <h3 className="text-lg font-medium mb-2">Remove member</h3>
                    <p className="mb-4">Are you sure you want to remove {member.user.name} from this board?</p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setConfirmingRemoval(null)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={() => handleRemoveMember(member.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
