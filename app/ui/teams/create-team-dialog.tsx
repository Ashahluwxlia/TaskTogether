"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { PlusCircle, X, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CreateTeamDialogProps {
  onCreateTeam: (name: string, description?: string, members?: Array<{ email: string; role: string }>) => Promise<any>
}

export function CreateTeamDialog({ onCreateTeam }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [memberEmail, setMemberEmail] = useState("")
  const [members, setMembers] = useState<Array<{ email: string; role: string }>>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onCreateTeam(name, description, members)

      toast({
        title: "Success",
        description: "Team created successfully",
      })

      // Reset form and close dialog
      setName("")
      setDescription("")
      setMembers([])
      setOpen(false)
    } catch (error) {
      console.error("Error creating team:", error)
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const addMember = () => {
    if (!memberEmail) return

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(memberEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    // Check if member already added
    if (members.some((m) => m.email === memberEmail)) {
      toast({
        title: "Member already added",
        description: "This email is already in the invitation list",
        variant: "destructive",
      })
      return
    }

    setMembers([...members, { email: memberEmail, role: "MEMBER" }])
    setMemberEmail("")
  }

  const removeMember = (email: string) => {
    setMembers(members.filter((m) => m.email !== email))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new team</DialogTitle>
            <DialogDescription>Create a team to collaborate with others on boards and tasks.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team name</Label>
              <Input
                id="name"
                placeholder="Engineering Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="A brief description of your team..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-2 mt-2">
              <Label>Invite members (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={addMember} className="shrink-0">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {members.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm text-muted-foreground mb-2 block">Members to invite:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {members.map((member) => (
                      <Badge key={member.email} variant="secondary" className="flex items-center gap-1">
                        {member.email}
                        <button
                          type="button"
                          onClick={() => removeMember(member.email)}
                          className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
