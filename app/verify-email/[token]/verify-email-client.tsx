"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailClient({ token }: { token: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [verificationAttempted, setVerificationAttempted] = useState(false)

  useEffect(() => {
    // Only attempt verification once
    if (verificationAttempted) return

    const verifyEmail = async () => {
      try {
        setVerificationAttempted(true)
        console.log("Verifying email with token:", token)

        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()
        console.log("Verification response:", data)

        if (response.ok && data.success) {
          // Mark this verification as completed
          localStorage.setItem(`email_verification_${token}`, "completed")
          setStatus("success")
          // Add a short delay before redirecting to ensure the success message is seen
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        } else if (data.error === "Email already verified") {
          // Handle the case where the email is already verified
          setStatus("success")
          // Show a different message for already verified emails
          setErrorMessage("Your email is already verified.")
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        } else {
          setStatus("error")
          setErrorMessage(data.error || "Failed to verify email")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setStatus("error")
        setErrorMessage("An unexpected error occurred")
      }
    }

    verifyEmail()
  }, [token, router, verificationAttempted])

  return (
    <>
      {status === "loading" && (
        <>
          <Loader2 className="h-16 w-16 text-yellow-400 animate-spin mb-4" />
          <h3 className="text-xl font-semibold mb-2">Verifying your email...</h3>
          <p className="text-gray-600 text-center">Please wait while we verify your email address.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Email Verified!</h3>
          <p className="text-gray-600 text-center mb-4">
            {errorMessage ||
              "Your email has been successfully verified. You can now access all features of TaskTogether."}
          </p>
          <p className="text-gray-600 text-center mb-4">Redirecting to dashboard...</p>
          <Button className="bg-yellow-400 hover:bg-yellow-500 text-black" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Verification Failed</h3>
          <p className="text-gray-600 text-center mb-4">
            {errorMessage || "The verification link is invalid or has expired."}
          </p>
          <Link href="/settings">
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">Go to Settings</Button>
          </Link>
        </>
      )}
    </>
  )
}
