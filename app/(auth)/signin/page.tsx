"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { createClient } from '@/utils/supabase/client'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // ✅ NEW: Support both 'redirect_to' (from property detail) and 'callbackUrl' (legacy)
  // Also check localStorage in case redirect_to was stored during signup flow
  const redirectFromUrl = searchParams?.get('redirect_to') || searchParams?.get('callbackUrl')
  const redirectFromStorage = typeof window !== 'undefined' ? localStorage.getItem('signup_callback_url') : null
  const callbackUrl = redirectFromUrl || redirectFromStorage || '/properties'
  const error = searchParams?.get('error')
  const errorMessage = searchParams?.get('message')
  const { signIn, signInWithGoogle, loading, user } = useAuth()
  const supabase = createClient()
  
  console.log('🔐 [SIGNIN] Loaded with redirect_to from URL:', redirectFromUrl)
  console.log('🔐 [SIGNIN] Loaded with redirect_to from storage:', redirectFromStorage)
  console.log('🔐 [SIGNIN] Using callback URL:', callbackUrl)
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  // Redirect authenticated users away from signin page
  const [verifyingOnboarding, setVerifyingOnboarding] = useState(false)
  
  useEffect(() => {
    if (!loading && user) {
      console.log('🔄 [SIGNIN] User already authenticated, redirecting...')
      if (user.user_type === 'landlord') {
        if (!user.email_verified) {
          router.replace('/signup/landlord/confirmation')
        } else if (!user.onboarding_completed) {
          // FIX: For established users with unreliable network, verify in database
          // Only redirect to onboarding if database confirms it's incomplete
          const isNewUser = user.created_at && 
            (Date.now() - new Date(user.created_at).getTime()) < 5 * 60 * 1000; // Created less than 5 min ago
          
          if (isNewUser) {
            // New user - go to onboarding
            console.log('👤 [SIGNIN] New landlord user, redirecting to onboarding...')
            router.replace(`/onboarding/landlord/step-${user.onboarding_step || 1}`)
          } else {
            // Established user with potentially stale session metadata - verify in database
            console.log('⏳ [SIGNIN] Established landlord user, verifying onboarding status in database...')
            setVerifyingOnboarding(true)
            
            const verifyOnboarding = async () => {
              try {
                const supabase = createClient()
                const { data } = await supabase
                  .from('landlord_onboarding')
                  .select('all_steps_completed, submitted_for_review')
                  .eq('landlord_id', user.id)
                  .single()
                
                console.log('📊 [SIGNIN] Database check result:', data)
                
                // If onboarding is truly incomplete, go to step 1
                if (!data?.all_steps_completed || !data?.submitted_for_review) {
                  console.log('🎓 [SIGNIN] Onboarding incomplete, redirecting to step 1...')
                  router.replace(`/onboarding/landlord/step-${user.onboarding_step || 1}`)
                } else {
                  // Onboarding is actually complete, go to dashboard
                  console.log('✅ [SIGNIN] Onboarding complete, redirecting to dashboard...')
                  router.replace('/landlord/overview')
                }
              } catch (error) {
                console.error('⚠️ [SIGNIN] Database verification failed:', error)
                // On error, assume onboarding is complete (safer for established users)
                console.log('💭 [SIGNIN] Assuming onboarding complete due to verification error...')
                router.replace('/landlord/overview')
              } finally {
                setVerifyingOnboarding(false)
              }
            }
            
            verifyOnboarding()
          }
        } else {
          router.replace('/landlord/overview')
        }
      } else if (user.user_type === 'tenant') {
        if (!user.email_verified) {
          router.replace('/signup/tenant/confirmation')
        } else {
          router.replace('/tenant')
        }
      } else if (user.user_type === 'admin') {
        router.replace('/admin')
      }
    }
  }, [user, loading, router])

  // Show error message if redirected from social login with error
  useEffect(() => {
    if (error === 'EmailExists' && errorMessage) {
      setApiError(decodeURIComponent(errorMessage))
      toast.error('Email Already Registered', {
        description: decodeURIComponent(errorMessage),
        duration: 5000,
      })
    } else if (error === 'PKCE code verifier not found in storage') {
      // Handle PKCE error - clear the error and show a user-friendly message
      setApiError('Authentication session expired. Please try signing in again.')
      toast.error('Session Expired', {
        description: 'Please sign in again to continue.',
        duration: 5000,
      })
      // Clear the error from URL
      router.replace('/signin')
    }
  }, [error, errorMessage, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ FIXED: Parse signin errors to provide specific, helpful messages
  const parseSignInError = (error: any): { title: string; message: string } => {
    const errorMsg = error?.message?.toLowerCase() || error?.toString().toLowerCase() || ''
    
    // Wrong password or invalid credentials
    if (errorMsg.includes('invalid') || errorMsg.includes('incorrect') || errorMsg.includes('credentials')) {
      return {
        title: '❌ Invalid Credentials',
        message: 'The email or password you entered is incorrect. Please try again.',
      }
    }
    
    // User not found / email doesn't exist
    if (errorMsg.includes('user not found') || errorMsg.includes('no user') || errorMsg.includes('doesnt exist')) {
      return {
        title: '❌ Account Not Found',
        message: 'No account exists with this email address. Please sign up first.',
      }
    }
    
    // Email not confirmed
    if (errorMsg.includes('email not confirmed') || errorMsg.includes('email_not_confirmed')) {
      return {
        title: '📧 Email Not Verified',
        message: 'Please verify your email address first. Check your inbox for the verification link.',
      }
    }
    
    // User disabled/banned
    if (errorMsg.includes('disabled') || errorMsg.includes('banned')) {
      return {
        title: '🚫 Account Disabled',
        message: 'Your account has been disabled. Please contact support for help.',
      }
    }
    
    // Generic fallback
    return {
      title: '⚠️ Sign In Failed',
      message: error?.message || 'An error occurred during sign in. Please try again.',
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setApiError(null)
    
    try {
      console.log('🔐 [SIGNIN] Attempting sign in with:', formData.email)
      console.log('🔗 [SIGNIN] Callback URL:', callbackUrl)
      
      const { user, redirectPath } = await signIn(formData.email, formData.password, callbackUrl)
      
      if (!user) {
        console.error('❌ [SIGNIN] Sign in failed: No user returned')
        const errorInfo = parseSignInError('Sign in failed')
        setApiError(errorInfo.message)
        toast.error(errorInfo.title, {
          description: errorInfo.message,
          duration: 5000,
        })
      } else {
        // Success - redirect will be handled by AuthContext
        toast.success('Sign in successful!', {
          description: 'Welcome back!',
          duration: 2000,
        })
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error)
      
      // ✅ FIXED: Parse error to show specific message
      const errorInfo = parseSignInError(error)
      setApiError(errorInfo.message)
      
      toast.error(errorInfo.title, {
        description: errorInfo.message,
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 [SIGNIN] Google sign-in with redirect_to:', callbackUrl)
      // ✅ NEW: Pass callbackUrl to signInWithGoogle so it can be preserved
      await signInWithGoogle(callbackUrl)
    } catch (error: any) {
      setApiError(error.message || 'Google sign-in failed')
      toast.error('Google Sign-In Failed', {
        description: error.message || 'Please try again.',
        duration: 5000,
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Elements - MATCHING role-selection page */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
      </div>

      {/* Back Button */}
      <Link href="/" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-3xl font-bold">
              <span className="text-slate-800">Nulo</span> 
              <span className="text-orange-600">Africa</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-600">Sign in to your account to continue</p>
        </div>

          {/* Sign In Form */}
          <Card className="border-0 luxury-shadow-lg rounded-2xl luxury-glass-strong">
            <CardContent className="p-8">
              {/* API Error Display */}
              {apiError && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    {apiError}
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
            <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full h-12 pl-10 pr-4 rounded-xl border-2 transition-all duration-300 ${
                        errors.email 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' 
                          : 'border-slate-300 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20'
                      } focus:outline-none text-slate-800 placeholder:text-slate-400`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.email}
                    </p>
                  )}
              </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full h-12 pl-10 pr-12 rounded-xl border-2 transition-all duration-300 ${
                        errors.password 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' 
                          : 'border-slate-300 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20'
                      } focus:outline-none text-slate-800 placeholder:text-slate-400`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
              </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.password}
                    </p>
                  )}
            </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-orange-600 hover:text-orange-700 transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 luxury-gradient-button text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Or continue with</span>
                  </div>
              </div>

                {/* Social Sign In */}
                <div className="grid grid-cols-1 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="h-12 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-300"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </Button>
                </div>
            </form>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-slate-600">
              Don't have an account?{" "}
                  <Link 
                    href="/signup" 
                    className="text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-200"
                  >
                    Sign up for free
              </Link>
            </p>
              </div>
          </CardContent>
        </Card>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-6 text-slate-600">
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
