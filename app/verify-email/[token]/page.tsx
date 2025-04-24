import { Suspense } from "react"
import VerifyEmailClient from "./verify-email-client"

// Use a loading component for better UX
function VerifyEmailLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
        <div className="animate-spin h-12 w-12 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we verify your email.</p>
      </div>
    </div>
  )
}

export default async function VerifyEmailPage({ params }: { params: { token: string } }) {
  // Properly handle the token parameter
  const resolvedParams = await Promise.resolve(params)
  const token = resolvedParams.token

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
        <Suspense fallback={<VerifyEmailLoading />}>
          <VerifyEmailClient token={token} />
        </Suspense>
      </div>
    </div>
  )
}
