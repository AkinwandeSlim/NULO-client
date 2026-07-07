"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Mail, ArrowLeft, Loader2, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import apiClient from "@/lib/api/client"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [storedEmail, setStoredEmail] = useState<string>("")
  const [resendSuccess, setResendSuccess] = useState(false)
  const [isLinkExpired, setIsLinkExpired] = useState(false)

  // Check for expired link in URL params
  const searchParams = useSearchParams()
  useEffect(() => {
    // Check for expired link error in URL
    const error = searchParams?.get('error')
    const errorDescription = searchParams?.get('error_description')

    if (error === 'LINK_EXPIRED' || (errorDescription && errorDescription.toLowerCase().includes('expired'))) {
      setIsLinkExpired(true)
    }

    // Get stored email for resend
    const stored = localStorage.getItem('verification_email')
    if (stored) {
      setStoredEmail(stored)
    }
  }, [searchParams])

  // Redirect if already verified
  useEffect(() => {
    if (user?.email_verified) {
      // ✅ FIXED: Route based on user_type instead of hardcoding to tenant
      if (user.user_type === 'admin') {
        router.push('/admin')
      } else if (user.user_type === 'landlord') {
        router.push('/landlord/overview')
      } else {
        router.push('/tenant')
      }
    }
  }, [user, router])

  // Derive role-aware features
  const roleFeatures = user?.user_type === 'landlord'
    ? ["Access your landlord dashboard", "List and manage your properties", "Review tenant viewing requests"]
    : ["Access your tenant dashboard", "Browse available properties", "Apply for rental properties"]

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendVerification = async () => {
    setIsResending(true)
    setCountdown(60) // 60 second cooldown

    try {
      // BUG-001: Actually call the resend endpoint
      const response = await apiClient.post('/api/v1/auth/resend-verification', {
        email: storedEmail,
      })

      if (response.data?.success) {
        toast.success('Verification email resent! Please check your inbox.')
        setResendSuccess(true)
      } else {
        toast.error(response.data?.message || 'Failed to resend verification email.')
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to resend verification email.'
      toast.error(errorMsg)
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
      </div>

      {/* Back Button */}
      <Link 
        href="/signin" 
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-white/50 backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back to Sign In</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Email Card */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-lg rounded-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-slate-600">
              We've sent a verification email to your inbox
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              {isLinkExpired ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800">
                      Verification Link Expired
                    </p>
                  </div>
                  <p className="text-sm text-amber-700">
                    Verification links expire after 1 hour. No worries — just request a fresh one below and click it promptly.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Important:</strong> Please check your email and click the verification link to activate your account.
                  </p>
                </div>
              )}
              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    A new verification email has been sent. Please check your inbox (and spam folder).
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-slate-600">
                  After verification, you'll be able to:
                </p>
                <div className="space-y-2 text-left">
                  {roleFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resend Email Button */}
            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={isResending || countdown > 0}
                variant="outline"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-500">
                  Didn't receive the email? Check your spam folder.
                </p>
              </div>
            </div>

            {/* Sign Out Option */}
            <div className="pt-4 border-t border-slate-200">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-3">
                  Want to use a different email?
                </p>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-800"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-8 text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Trusted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
