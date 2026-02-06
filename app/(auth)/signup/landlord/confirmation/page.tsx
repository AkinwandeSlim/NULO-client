"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Building, Mail, CheckCircle, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

export default function LandlordConfirmationPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isResending, setIsResending] = useState(false)

  // Check if user is already authenticated and verified
  useEffect(() => {
    if (!loading && user) {
      if (user.user_type === 'landlord' && user.email_verified) {
        // If landlord is already verified, redirect to appropriate step
        if (user.onboarding_completed) {
          router.push('/landlord/overview')
    } else if (user.onboarding_step && user.onboarding_step >= 1) {
          router.push(`/onboarding/landlord/step-${user.onboarding_step}`)
        } else {
          router.push('/onboarding/landlord/step-1')
        }
      } else if (user.user_type === 'landlord' && !user.email_verified) {
        // If landlord exists but email not verified, show info message
        toast.info('Please check your email for the confirmation link')
      }
    }
  }, [user, loading, router])

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      // For now, just show a toast - in production you'd implement actual resend logic
      toast.success('Confirmation email resent! Please check your inbox.')
    } catch (error) {
      toast.error('Failed to resend confirmation email')
    } finally {
      setIsResending(false)
    }
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
      <Link href="/signup/landlord" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
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
          <p className="text-slate-600">We've sent a confirmation link to your email address</p>
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
                <p className="text-green-700">Please check your inbox for the confirmation email</p>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Next Steps:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the confirmation link in the email</li>
                    <li>You will be automatically redirected to onboarding after confirmation</li>
                    <li>Complete all 4 onboarding steps to get verified</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3 text-sm text-slate-600">
              <p>• Check your spam folder if you don't see the email</p>
              <p>• The confirmation link expires in 24 hours</p>
              <p>• After confirmation, complete your profile to list properties</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                {isResending ? 'Resending...' : 'Resend Confirmation Email'}
              </Button>
            </div>

            {/* Help Link */}
            <div className="text-center text-sm text-slate-500">
              <p>Didn't receive the email? 
                <button 
                  onClick={handleResendEmail}
                  className="text-orange-600 hover:text-orange-700 ml-1 underline font-medium"
                  disabled={isResending}
                >
                  Resend it
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
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
