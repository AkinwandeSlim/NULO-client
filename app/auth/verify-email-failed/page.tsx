'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function VerifyEmailFailedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const errorDetails: Record<string, { title: string; description: string; actions: string[] }> = {
    'otp_expired': {
      title: '⏰ Email Link Expired',
      description: 'Your email verification link has expired (usually after 24 hours). This is normal for security reasons.',
      actions: [
        '1. Sign in with your email and password',
        '2. We\'ll send you a new verification link',
        '3. Click the new link to verify your email'
      ]
    },
    'invalid_otp': {
      title: '❌ Invalid Verification Link',
      description: 'The verification link you used is invalid or has already been used. Don\'t worry, we can send you a new one.',
      actions: [
        '1. Sign in to your account',
        '2. Request a new verification email',
        '3. Click the fresh link immediately'
      ]
    },
    'access_denied': {
      title: '🔒 Verification Denied',
      description: 'There was an issue verifying your email. Please try the process again.',
      actions: [
        '1. Return to sign in',
        '2. Try signing in or signing up again',
        '3. Request a new verification email'
      ]
    },
    'no_code': {
      title: '🤔 Missing Verification Code',
      description: 'The verification link appears to be incomplete or corrupted. Please check if you copied the entire link.',
      actions: [
        '1. Check your email again',
        '2. Copy the entire verification link',
        '3. Paste it into a new browser tab'
      ]
    },
  }

  const details = errorDetails[error as string] || {
    title: '⚠️ Verification Failed',
    description: message || 'Something went wrong during email verification. Please try again.',
    actions: ['Sign in to your account', 'Request a new verification email', 'Try again immediately']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 space-y-6">
          
          {/* Header */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {details.title}
              </h1>
              <p className="text-slate-600">
                {details.description}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <p className="text-sm text-slate-700">
              <strong>Quick tip:</strong> Email verification links are time-sensitive for security. If expired, simply sign in and request a new one.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900">What to do next:</h2>
            <ul className="space-y-2">
              {details.actions.map((action, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-slate-600">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-600">
                    {idx + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-4">
            <Link href="/signin" className="block">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Mail className="h-4 w-4 mr-2" />
                Go to Sign In
              </Button>
            </Link>

            <Link href="/signup" className="block">
              <Button variant="outline" className="w-full border-slate-300">
                Create New Account
              </Button>
            </Link>

            <button
              onClick={() => router.back()}
              className="w-full text-sm text-slate-600 hover:text-slate-900 py-2 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>

          {/* Error Details */}
          <div className="pt-4 border-t border-slate-200">
            <details className="text-xs text-slate-500 cursor-pointer">
              <summary className="hover:text-slate-600">Error details</summary>
              <p className="mt-2 font-mono bg-slate-100 p-2 rounded break-all">
                {error || 'Unknown error'}
              </p>
            </details>
          </div>
        </div>

        {/* Help Footer */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>
            Still having trouble?{' '}
            <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-semibold">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
