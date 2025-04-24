import { ResetPasswordClient } from "./reset-password-client"

// This is a server component that unwraps the params
export default async function ResetPasswordPage({ params }: { params: { token: string } }) {
  // Await the params to properly handle them in Next.js 15.2.4
  const resolvedParams = await params
  return <ResetPasswordClient token={resolvedParams.token} />
}
