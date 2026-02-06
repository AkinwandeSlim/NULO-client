'use client'

/**
 * Auth Callback Fallback Page
 * 
 * 🔍 FLOW:
 * - Primary handler: app/auth/callback/route.ts (API route)
 * - This page is a fallback for edge cases or direct navigation
 * - Most users won't see this - route.ts redirects them automatically
 * 
 * When direct navigation happens:
 * - Route exchanges code for session
 * - Fetches user type and determines redirect target
 * - This page shows loading state as backup
 */

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 [CALLBACK PAGE] Processing auth callback (fallback)...')
        
        // Check for error in URL parameters first
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('❌ OAuth callback error:', error, errorDescription)
          toast.error('Authentication Failed', {
            description: errorDescription || error,
            duration: 5000,
          })
          router.push('/signin')
          return
        }
        
        // Get the current session after OAuth callback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Auth callback error:', sessionError)
          toast.error('Authentication Failed', {
            description: sessionError.message,
            duration: 5000,
          })
          router.push('/signin')
          return
        }

        if (session?.user) {
          console.log('✅ Auth callback successful for user:', session.user.email)
          
          // Get user type from metadata
          const userType = session.user.user_metadata?.user_type || 'tenant'
          console.log('👤 User type detected:', userType)
          
          // Check for custom redirect
          const customRedirect = searchParams.get('redirect_to')
          
          // Determine redirect based on priority:
          // 1. Custom redirect (property detail page)
          // 2. User type default
          let redirectUrl = '/properties' // default
          
          if (customRedirect) {
            redirectUrl = decodeURIComponent(customRedirect)
            console.log('🔀 Using custom redirect:', redirectUrl)
          } else if (userType === 'admin') {
            redirectUrl = '/admin'
          } else if (userType === 'landlord') {
            redirectUrl = '/onboarding/landlord/step-1'
          } else if (userType === 'tenant') {
            redirectUrl = '/properties'
          }
          
          toast.success('Welcome back!', {
            description: 'Redirecting to your dashboard...',
            duration: 2000,
          })
          
          // Delay redirect to show toast
          setTimeout(() => {
            router.replace(redirectUrl)
          }, 1000)
        } else {
          // No session, redirect to signin
          console.log('❌ No session found in callback')
          router.push('/signin')
        }
      } catch (error: any) {
        console.error('❌ Unexpected callback error:', error)
        toast.error('Error', {
          description: 'An unexpected error occurred during authentication.',
          duration: 5000,
        })
        router.push('/signin')
      }
    }

    handleCallback()
  }, [router, searchParams, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Completing sign in...</h2>
        <p className="text-slate-600">Please wait while we set up your account.</p>
      </div>
    </div>
  )
}
