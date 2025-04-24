import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ProfileContent } from "@/components/profile-content"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  console.log("User data in profile page:", user) // Log the user data to verify image field

  return <ProfileContent user={user as any} />
}
