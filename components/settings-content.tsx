"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Check, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { updateUserSettings } from "@/app/actions/settings"
import { deleteAccount } from "@/app/actions/delete-account"
import { toast } from "@/hooks/use-toast"
import { ChangePasswordForm } from "@/components/change-password-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SettingsContentProps {
  user: User
}

export function SettingsContent({ user }: SettingsContentProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  // User settings
  const [name, setName] = useState(user.name || "")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [taskAssigned, setTaskAssigned] = useState(true)
  const [taskDueSoon, setTaskDueSoon] = useState(true)
  const [taskComments, setTaskComments] = useState(true)
  const [mentions, setMentions] = useState(true)
  const [teamInvitations, setTeamInvitations] = useState(true)
  const [boardShared, setBoardShared] = useState(true)

  // Fetch user preferences on load
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch("/api/user/preferences")
        if (response.ok) {
          const data = await response.json()
          if (data.preferences) {
            setEmailNotifications(data.preferences.emailNotifications ?? true)
            setTaskAssigned(data.preferences.taskAssigned ?? true)
            setTaskDueSoon(data.preferences.taskDueSoon ?? true)
            setTaskComments(data.preferences.taskComments ?? true)
            setMentions(data.preferences.mentions ?? true)
            setTeamInvitations(data.preferences.teamInvitations ?? true)
            setBoardShared(data.preferences.boardShared ?? true)
          }
        }
      } catch (err) {
        console.error("Failed to fetch preferences:", err)
      } finally {
        setIsLoadingPreferences(false)
      }
    }

    fetchPreferences()
  }, [])

  const handleSaveSettings = async () => {
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("emailNotifications", emailNotifications.toString())

      const result = await updateUserSettings(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Settings saved successfully")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailNotifications,
          taskAssigned,
          taskDueSoon,
          taskComments,
          mentions,
          teamInvitations,
          boardShared,
        }),
      })

      if (response.ok) {
        toast({
          title: "Preferences saved",
          description: "Your notification preferences have been updated.",
        })
      } else {
        const data = await response.json()
        setError(data.error || "Failed to save preferences")
      }
    } catch (err: any) {
      setError(err.message || "Failed to save preferences")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== "delete my account") {
      toast({
        title: "Confirmation failed",
        description: "Please type 'delete my account' to confirm deletion",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteAccount(user.id)

      if (result.success) {
        toast({
          title: "Account deleted",
          description: "Your account has been successfully deleted",
        })
        // Redirect to home page after successful deletion
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Your email address is used for login and cannot be changed.
                </p>
              </div>
            </CardContent>

            <div className="space-y-6 px-8">
              <div>
                <h3 className="text-lg font-medium">Email Verification</h3>
                <p className="text-sm text-muted-foreground">Verify your email address to access all features</p>
              </div>
              <div className="flex items-center gap-4">
                {user.email_verified ? (
                  <>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Email Verified</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span>Email Not Verified</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/auth/resend-verification", {
                            method: "POST",
                          })

                          if (response.ok) {
                            toast({
                              title: "Verification email sent",
                              description: "Please check your inbox for the verification link",
                            })
                          } else {
                            const data = await response.json()
                            toast({
                              title: "Error",
                              description: data.error || "Failed to send verification email",
                              variant: "destructive",
                            })
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "An unexpected error occurred",
                            variant: "destructive",
                          })
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Resend Verification Email
                    </Button>
                  </>
                )}
              </div>
            </div>

            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. This action cannot be undone.
              </p>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Account
                    </DialogTitle>
                    <DialogDescription>
                      This action is permanent and cannot be undone. All your data will be permanently removed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You will lose all your data, including teams, boards, tasks, and comments.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-delete">
                        Type <span className="font-semibold">delete my account</span> to confirm
                      </Label>
                      <Input
                        id="confirm-delete"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="delete my account"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || confirmText !== "delete my account"}
                    >
                      {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Change your password.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Task assignments</h3>
                  <p className="text-sm text-muted-foreground">Get notified when you are assigned to a task</p>
                </div>
                <Switch checked={taskAssigned} onCheckedChange={setTaskAssigned} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Due date reminders</h3>
                  <p className="text-sm text-muted-foreground">Get notified when a task is due soon</p>
                </div>
                <Switch checked={taskDueSoon} onCheckedChange={setTaskDueSoon} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Comments</h3>
                  <p className="text-sm text-muted-foreground">Get notified when someone comments on your tasks</p>
                </div>
                <Switch checked={taskComments} onCheckedChange={setTaskComments} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Mentions</h3>
                  <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
                </div>
                <Switch checked={mentions} onCheckedChange={setMentions} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Team invitations</h3>
                  <p className="text-sm text-muted-foreground">Get notified when you're invited to join a team</p>
                </div>
                <Switch checked={teamInvitations} onCheckedChange={setTeamInvitations} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Board sharing</h3>
                  <p className="text-sm text-muted-foreground">Get notified when a board is shared with you</p>
                </div>
                <Switch checked={boardShared} onCheckedChange={setBoardShared} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePreferences} disabled={isLoading || isLoadingPreferences}>
                {isLoading ? "Saving..." : "Save preferences"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
