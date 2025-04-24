import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SettingsContent } from "@/components/settings-content"
import type { User } from "@/types"

// Update the User interface to include email_verified
export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Transform user to match the expected User interface
  const typedUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    email_verified: user.email_verified,
  }

  return <SettingsContent user={typedUser} />
}
