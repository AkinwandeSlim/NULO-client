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
        if (!searchParams) {
          console.error('❌ No searchParams available')
          router.push('/signin')
          return
        }
        
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
          
          // ✅ CRITICAL: Client-side fallback to check cookie for redirect path
          let effectiveRedirect: string | null = null;
          
          // Try to read from localStorage (might have been set during signup flow)
          if (typeof window !== 'undefined') {
            effectiveRedirect = localStorage.getItem('signup_callback_url');
            if (effectiveRedirect) {
              console.log('📍 [CALLBACK PAGE] Found redirect in localStorage:', effectiveRedirect);
              localStorage.removeItem('signup_callback_url'); // Clean up
            }
          }
          
          // Determine redirect based on priority:
          // 1. Custom redirect (from localStorage or OAuth)
          // 2. User type default
          let redirectUrl = '/properties' // default
          
          if (effectiveRedirect) {
            redirectUrl = decodeURIComponent(effectiveRedirect)
            console.log('🔀 Using localStorage redirect:', redirectUrl)
          } else if (userType === 'admin') {
            redirectUrl = '/admin'
          } else if (userType === 'landlord') {
            // Check if this might be a network error situation
            // If user has onboarding_completed metadata, go to dashboard instead
            const onboardingCompleted = session.user.user_metadata?.onboarding_completed
            if (onboardingCompleted) {
              redirectUrl = '/landlord/overview'
              console.log('🏠 [CALLBACK PAGE] Landlord already onboarded, going to dashboard')
            } else {
              redirectUrl = '/onboarding/landlord/step-1?verified=1'
              console.log('🎓 [CALLBACK PAGE] New landlord, going to onboarding')
            }
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
