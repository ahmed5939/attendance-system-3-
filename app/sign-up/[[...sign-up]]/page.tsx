"use client"

import { useState } from "react"
import { SignUp } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [whitelistInfo, setWhitelistInfo] = useState<any>(null)
  const [error, setError] = useState("")

  const checkWhitelist = async () => {
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    setIsChecking(true)
    setError("")

    try {
      const response = await fetch("/api/auth/check-whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setWhitelistInfo(data)
      } else {
        setError(data.error || "Failed to check whitelist")
      }
    } catch (error) {
      setError("Failed to check whitelist. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }

  if (whitelistInfo) {
  return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome, {whitelistInfo.name}!</CardTitle>
            <CardDescription>
              You're signing up as a {whitelistInfo.role.toLowerCase()}
              {whitelistInfo.department && ` in the ${whitelistInfo.department} department`}
            </CardDescription>
          </CardHeader>
          <CardContent>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none",
          },
        }}
              afterSignUpUrl="/dashboard"
              redirectUrl="/dashboard"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Attendance System</CardTitle>
          <CardDescription>
            Enter your email to check if you're authorized to create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your school email"
              onKeyPress={(e) => e.key === 'Enter' && checkWhitelist()}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={checkWhitelist} 
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? "Checking..." : "Check Authorization"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>Only authorized users can create accounts.</p>
            <p>Contact your administrator if you need access.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 