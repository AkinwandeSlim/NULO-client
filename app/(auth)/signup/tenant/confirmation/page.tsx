"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Home, Mail, CheckCircle, ArrowLeft, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TenantConfirmationPage() {
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    // Get email from localStorage
    if (typeof window !== 'undefined') {
      const signupEmail = localStorage.getItem('signup_email')
      if (signupEmail) {
        console.log('📧 [CONFIRMATION] Email found:', signupEmail)
        setEmail(signupEmail)
        // Keep it in localStorage for now - useful for resend
      } else {
        console.log('⚠️ [CONFIRMATION] No email in localStorage - user may have refreshed')
        // Don't redirect - let user stay on page
        // They can still use the page without email (though resend won't work)
      }
    }
  }, [])

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email not found. Please sign up again.')
      return
    }
    
    setIsResending(true)
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error
      
      toast.success('Verification email sent!')
      console.log('✅ [CONFIRMATION] Resent email to:', email)
    } catch (error: any) {
      toast.error('Failed to resend email')
      console.error('❌ [CONFIRMATION] Resend error:', error)
    } finally {
      setIsResending(false)
    }
  }

  const handleGoToSignIn = () => {
    // Clean up localStorage when user clicks to go to sign in
    if (typeof window !== 'undefined') {
      localStorage.removeItem('signup_email')
    }
    router.push('/signin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-50">
      {/* Background Elements - NuloAfrica Brand Theme */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
      </div>

      {/* Back Button */}
      <Link href="/signup/tenant" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
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
          {email ? (
            <div className="bg-slate-100 rounded-lg p-3 mt-4">
              <p className="text-lg font-semibold text-slate-900 break-all">
                {email}
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
              <User className="h-5 w-5 text-orange-600" />
              Tenant Account Created
            </CardTitle>
            <CardDescription className="text-center">
              Please check your email and click the confirmation link to activate your tenant account
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
              <p>• After verification, come back and sign in</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleGoToSignIn}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Go to Sign In
              </Button>
              
              {email && (
                <Button 
                  variant="outline" 
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  {isResending ? 'Resending...' : 'Resend Confirmation Email'}
                </Button>
              )}
            </div>

            {/* Help Link */}
            {email && (
              <div className="text-center text-sm text-slate-500">
                <p>Didn't receive the email? 
                  <button 
                    onClick={handleResendEmail}
                    className="text-orange-600 hover:text-orange-700 ml-1 underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isResending}
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
          <p>Already confirmed your email? 
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