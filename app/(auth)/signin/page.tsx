"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle, Sun, Moon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
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
  const isReset = searchParams?.get('reset') === 'true'
  const { signIn, signInWithGoogle, loading, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const supabase = createClient()
  
  console.log('🔐 [SIGNIN] Loaded with redirect_to from URL:', redirectFromUrl)
  console.log('🔐 [SIGNIN] Loaded with redirect_to from storage:', redirectFromStorage)
  console.log('🔐 [SIGNIN] Using callback URL:', callbackUrl)
  console.log('🔐 [SIGNIN] Is reset password mode:', isReset)
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)

  // Redirect authenticated users away from signin page
  const [verifyingOnboarding, setVerifyingOnboarding] = useState(false)
  const [verifyingTenantActivity, setVerifyingTenantActivity] = useState(false)

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
          // ✅ FIX: Match the smart redirect logic in AuthContext.signIn() so
          // both paths agree on the destination and we don't flash between
          // /tenant and /properties. Returning tenants (have applications
          // or viewings) → /tenant. New tenants (no activity) → /properties.
          setVerifyingTenantActivity(true)
          const checkTenantActivity = async () => {
            try {
              const [applicationsResponse, viewingsResponse] = await Promise.allSettled([
                import('@/lib/api/applications').then(({ applicationsAPI }) => applicationsAPI.getMyApplicationsFast()),
                import('@/lib/api/viewingRequestsTenant').then(({ viewingRequestsAPI }) => viewingRequestsAPI.getMyRequests())
              ])

              const hasApplications = applicationsResponse.status === 'fulfilled' &&
                applicationsResponse.value.success &&
                applicationsResponse.value.applications.length > 0

              const hasViewings = viewingsResponse.status === 'fulfilled' &&
                viewingsResponse.value.success &&
                viewingsResponse.value.data.length > 0

              if (hasApplications || hasViewings) {
                console.log('🏠 [SIGNIN] Returning tenant (has activity), redirecting to /tenant')
                router.replace('/tenant')
              } else {
                console.log('🏠 [SIGNIN] New tenant (no activity), redirecting to /properties')
                router.replace('/properties')
              }
            } catch (error) {
              console.warn('⚠️ [SIGNIN] Tenant activity check failed, defaulting to /properties:', error)
              router.replace('/properties')
            } finally {
              setVerifyingTenantActivity(false)
            }
          }

          checkTenantActivity()
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

  const validatePasswordResetForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordResetForm()) return
    
    setIsLoading(true)
    setApiError(null)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) throw error

      console.log('✅ [SIGNIN] Password updated successfully')
      toast.success('Password updated!', {
        description: 'You can now sign in with your new password.',
      })
      setPasswordResetSuccess(true)

      // Wait a bit and redirect
      setTimeout(() => {
        router.replace('/signin')
      }, 2000)
    } catch (error: any) {
      console.error('❌ Password reset error:', error)
      setApiError(error?.message || 'Failed to update password')
      toast.error('Password Update Failed', {
        description: error?.message || 'Please try again.',
      })
    } finally {
      setIsLoading(false)
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

  if (passwordResetSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden ${theme === "dark" ? "bg-black" : "bg-slate-50"}`}>
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <Card className={`border-0 shadow-2xl rounded-2xl ${theme === "dark" ? "bg-black border-white/10" : "bg-white"}`}>
            <CardContent className="p-8 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${theme === "dark" ? "bg-green-900/30" : "bg-green-100"}`}>
                <CheckCircle className={`h-8 w-8 ${theme === "dark" ? "text-green-400" : "text-green-600"}`} />
              </div>
              <h1 className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Password updated!</h1>
              <p className={theme === "dark" ? "text-white/60" : "text-slate-600"}>You can now sign in with your new password. Redirecting you to sign in...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ✅ FIX: While we're checking onboarding/activity before redirecting an
  // already-authenticated user, show a full-screen loader. Prevents the
  // flash of the signin form before the redirect fires.
  if (verifyingOnboarding || verifyingTenantActivity) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${theme === "dark" ? "bg-black" : "bg-slate-50"}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`font-medium ${theme === "dark" ? "text-white" : "text-slate-600"}`}>Signing you in…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden ${theme === "dark" ? "bg-black" : "bg-slate-50"}`}>
      {/* Background Elements - MATCHING role-selection page */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
      </div>

      {/* Back Button */}
      <Link href="/" className={`absolute top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-300 rounded-lg cursor-pointer md:top-6 md:left-6 md:px-4 md:text-base ${theme === "dark" ? "text-white/70 hover:text-orange-400 hover:bg-white/10" : "text-slate-600 hover:text-orange-600 hover:bg-slate-100"}`}>
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Header with mobile-first spacing */}
        <div className="text-center mb-6 pt-12 md:mb-8 md:pt-0">
          <Link href="/" className="inline-block mb-4 md:mb-6">
            <div className="text-2xl md:text-3xl font-bold">
              <span className={theme === "dark" ? "text-white" : "text-slate-800"}>Nulo</span>
              <span className="text-orange-600">Africa</span>
            </div>
          </Link>
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            {isReset ? "Reset your password" : "Welcome back"}
          </h1>
          <p className={`text-sm md:text-base ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
            {isReset ? "Enter your new password below" : "Sign in to your account to continue"}
          </p>
        </div>

          {/* Sign In Form */}
          <Card className={`border-0 luxury-shadow-lg rounded-2xl ${theme === "dark" ? "bg-black border-white/10" : "bg-white"}`}>
            <CardContent className="p-8">
              {/* API Error Display */}
              {apiError && (
                <div className={`mb-6 p-4 border-2 rounded-xl ${theme === "dark" ? "bg-red-900/20 border-red-500/30" : "bg-red-50 border-red-200"}`}>
                  <p className={`text-sm flex items-center gap-2 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                    <span className={`w-2 h-2 rounded-full ${theme === "dark" ? "bg-red-400" : "bg-red-600"}`}></span>
                    {apiError}
                  </p>
                </div>
              )}
              
              <form onSubmit={isReset ? handlePasswordResetSubmit : handleSubmit} className="space-y-6">
                {!isReset && (
                  /* Email Field - Only shown on sign in form */
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-white" : "text-slate-700"}`}>
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full h-12 pl-10 pr-4 rounded-xl border-2 transition-all duration-300 ${
                          errors.email 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' 
                            : theme === "dark" ? 'border-white/10 bg-white/5 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 text-white placeholder:text-white/30' : 'border-slate-300 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 text-slate-800 placeholder:text-slate-400'
                        } focus:outline-none`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && (
                      <p className={`mt-2 text-sm flex items-center gap-1 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                        <span className={`w-1 h-1 rounded-full ${theme === "dark" ? "bg-red-400" : "bg-red-600"}`}></span>
                        {errors.email}
                      </p>
                    )}
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-white" : "text-slate-700"}`}>
                    {isReset ? "New Password" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full h-12 pl-10 pr-12 rounded-xl border-2 transition-all duration-300 ${
                        errors.password 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' 
                          : theme === "dark" ? 'border-white/10 bg-white/5 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 text-white placeholder:text-white/30' : 'border-slate-300 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 text-slate-800 placeholder:text-slate-400'
                      } focus:outline-none`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${theme === "dark" ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
              </div>
                  {errors.password && (
                    <p className={`mt-2 text-sm flex items-center gap-1 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                      <span className={`w-1 h-1 rounded-full ${theme === "dark" ? "bg-red-400" : "bg-red-600"}`}></span>
                      {errors.password}
                    </p>
                  )}
                </div>

                {isReset && (
                  /* Confirm Password Field - Only shown on reset form */
                  <div>
                    <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-white" : "text-slate-700"}`}>
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full h-12 pl-10 pr-12 rounded-xl border-2 transition-all duration-300 ${
                          errors.confirmPassword 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' 
                            : theme === "dark" ? 'border-white/10 bg-white/5 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 text-white placeholder:text-white/30' : 'border-slate-300 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 text-slate-800 placeholder:text-slate-400'
                        } focus:outline-none`}
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${theme === "dark" ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className={`mt-2 text-sm flex items-center gap-1 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                        <span className={`w-1 h-1 rounded-full ${theme === "dark" ? "bg-red-400" : "bg-red-600"}`}></span>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {!isReset && (
                  /* Remember Me & Forgot Password - Only shown on sign in form */
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className={`w-4 h-4 text-orange-600 rounded focus:ring-orange-500 focus:ring-2 ${theme === "dark" ? "border-white/20 bg-white/10" : "border-slate-300"}`}
                      />
                      <span className={`text-sm ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>Remember me</span>
                    </label>
                    <Link 
                      href="/forgot-password" 
                      className={`text-sm transition-colors duration-200 ${theme === "dark" ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700"}`}
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 luxury-gradient-button text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isReset ? "Updating..." : "Signing in..."}
                    </div>
                  ) : (
                    isReset ? "Reset password" : "Sign In"
                  )}
                </Button>

                {!isReset && (
                  <>
                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t ${theme === "dark" ? "border-white/10" : "border-slate-300"}`}></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className={`px-2 ${theme === "dark" ? "bg-black text-white/50" : "bg-white text-slate-500"}`}>Or continue with</span>
                      </div>
                  </div>

                    {/* Social Sign In */}
                    <div className="grid grid-cols-1 gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className={`h-12 rounded-xl transition-all duration-300 ${theme === "dark" ? "border-white/10 text-white hover:bg-white/10" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
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
                  </>
                )}
            </form>

              {!isReset ? (
                /* Sign Up Link - Only shown on sign in form */
                <div className="mt-8 text-center">
                  <p className={theme === "dark" ? "text-white/60" : "text-slate-600"}>
                    Don't have an account?{" "}
                    <Link 
                      href="/signup" 
                      className={`font-semibold transition-colors duration-200 ${theme === "dark" ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700"}`}
                    >
                      Sign up for free
                    </Link>
                  </p>
                </div>
              ) : (
                /* Sign In Link - Only shown on reset form */
                <div className="mt-8 text-center">
                  <p className={theme === "dark" ? "text-white/60" : "text-slate-600"}>
                    Remember your password?{" "}
                    <Link 
                      href="/signin" 
                      className={`font-semibold transition-colors duration-200 ${theme === "dark" ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700"}`}
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              )}
          </CardContent>
        </Card>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className={`flex items-center justify-center gap-6 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
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

          {/* Theme Toggle */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === "dark" ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </div>
      </div>
  
  )
}
