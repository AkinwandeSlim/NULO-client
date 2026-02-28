"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Home, Mail, CheckCircle, ArrowLeft, Building, RefreshCw, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/utils/supabase/client"

const RESEND_COOLDOWN_SECONDS = 60

export default function LandlordConfirmationPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const supabase = createClient()

  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resendCount, setResendCount] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // ─── Redirect if already verified ───────────────────────────────────────────
  useEffect(() => {
    if (!loading && user) {
      if (user.user_type === 'landlord' && user.email_verified) {
        if (user.onboarding_completed) {
          router.push('/landlord/overview')
        } else if (user.onboarding_step && user.onboarding_step >= 1) {
          router.push(`/onboarding/landlord/step-${user.onboarding_step}`)
        } else {
          router.push('/onboarding/landlord/step-1')
        }
      } else if (user.user_type === 'landlord' && !user.email_verified) {
        toast.info('Please check your email for the confirmation link')
      }
    }
  }, [user, loading, router])

  // ─── Grab email from Supabase session ───────────────────────────────────────
  useEffect(() => {
    const getEmail = async () => {
      // Try session first, fall back to localStorage (same pattern as tenant page)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      } else if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('signup_email')
        if (stored) setUserEmail(stored)
      }
    }
    getEmail()
  }, [])

  // ─── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // ─── Resend via Supabase ─────────────────────────────────────────────────────
  const handleResendEmail = useCallback(async () => {
    if (cooldown > 0 || isResending) return

    if (resendCount >= 3) {
      toast.error('Too many resend attempts', {
        description: 'Please check your spam folder or contact support.',
      })
      return
    }

    setIsResending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || userEmail

      if (!email) {
        toast.error('Could not find your email address', {
          description: 'Please go back and sign up again.',
        })
        return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?user_type=landlord`,
        },
      })

      if (error) {
        if (error.message.toLowerCase().includes('rate')) {
          toast.error('Please wait before requesting another email', {
            description: 'Check your inbox — the previous email may still arrive.',
          })
          setCooldown(RESEND_COOLDOWN_SECONDS)
        } else {
          toast.error('Failed to resend email', { description: error.message })
        }
        return
      }

      setResendCount(prev => prev + 1)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      toast.success('Confirmation email resent!', {
        description: `Check your inbox at ${email}. Also check your spam folder.`,
        duration: 6000,
      })
    } catch (err: any) {
      toast.error('Something went wrong', {
        description: 'Please try again or contact support.',
      })
    } finally {
      setIsResending(false)
    }
  }, [cooldown, isResending, resendCount, supabase, userEmail])

  const handleGoToSignIn = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('signup_email')
    }
    router.push('/signin')
  }

  const resendLabel = isResending
    ? 'Sending...'
    : cooldown > 0
    ? `Resend in ${cooldown}s`
    : resendCount > 0
    ? 'Resend Again'
    : 'Resend Confirmation Email'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-50">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce"
          style={{ animationDelay: '2s', animationDuration: '4s' }} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: '1s', animationDuration: '3s' }} />
      </div>

      {/* Back Button */}
      <Link
        href="/signup/landlord"
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back to Signup</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Check Your Email</h1>
          <p className="text-slate-600">We've sent a confirmation link to:</p>

          {/* Email Display */}
          {userEmail ? (
            <div className="bg-slate-100 rounded-lg p-3 mt-4">
              <p className="text-lg font-semibold text-slate-900 break-all">
                {userEmail}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-amber-800">
                Your email address (check your inbox)
              </p>
            </div>
          )}
        </div>

        <Card className="shadow-lg border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
              <Building className="h-5 w-5 text-orange-600" />
              Landlord Account Created
            </CardTitle>
            <CardDescription className="text-center">
              Please check your email and click the confirmation link to activate your landlord account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success Message */}
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Account created successfully!</p>
                <p className="text-green-700">Check your inbox for the confirmation email</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3 text-sm text-slate-600">
              <p>• Check your spam folder if you don't see the email</p>
              <p>• The confirmation link expires in 24 hours</p>
              <p>• Click the link in the email to verify your account</p>
              <p>• After verification, you'll be guided through onboarding</p>
            </div>

            {/* Resend attempts warning */}
            {resendCount >= 2 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  Email not arriving? Check your <strong>spam/junk folder</strong>.
                  If still missing, contact{' '}
                  <a href="mailto:support@nuloafrica.com" className="underline font-medium">
                    support
                  </a>.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleGoToSignIn}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Go to Sign In
              </Button>

              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={isResending || cooldown > 0 || resendCount >= 3}
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-60"
              >
                {isResending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : cooldown > 0 ? (
                  <Clock className="h-4 w-4 mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {resendLabel}
              </Button>

              {/* Cooldown progress bar */}
              {cooldown > 0 && (
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all duration-1000"
                    style={{
                      width: `${((RESEND_COOLDOWN_SECONDS - cooldown) / RESEND_COOLDOWN_SECONDS) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Help Link */}
            {userEmail && (
              <div className="text-center text-sm text-slate-500">
                <p>
                  Didn't receive the email?{' '}
                  <button
                    onClick={handleResendEmail}
                    className="text-orange-600 hover:text-orange-700 ml-1 underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isResending || cooldown > 0 || resendCount >= 3}
                  >
                    Resend it
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Already confirmed your email?{' '}
            <button
              onClick={handleGoToSignIn}
              className="text-orange-600 hover:text-orange-700 ml-1 font-medium"
            >
              Sign in here
            </button>
          </p>
          <p className="mt-2">
            <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
              <Home className="inline h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}