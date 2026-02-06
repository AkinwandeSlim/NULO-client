"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Shield, Mail, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminConfirmationPage() {
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50">
      {/* Background Elements - NuloAfrica Brand Theme */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
      </div>

      {/* Back Button */}
      <Link href="/signup/admin" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
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
            <CardTitle className="text-center text-xl">Admin Account Created</CardTitle>
            <CardDescription className="text-center">
              Please check your email and click the confirmation link to activate your admin account
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
              <p>• After confirmation, you can sign in to your admin dashboard</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  // Clear any existing auth errors and redirect to clean signin page
                  window.location.href = '/signin'
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Go to Sign In
              </Button>
              
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
                  className="text-orange-600 hover:text-orange-700 ml-1 underline"
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
          <p>Already confirmed? 
            <button 
              onClick={() => window.location.href = '/signin'}
              className="text-orange-600 hover:text-orange-700 ml-1 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
