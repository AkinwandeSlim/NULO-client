 "use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Shield, Mail, Lock, User, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { adminSignupSchema, type AdminSignupFormData, getPasswordStrength } from "@/lib/validations/admin"
import { useAuth } from "@/contexts/AuthContext"

export default function AdminSignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUpAdmin } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
    getValues
  } = useForm<AdminSignupFormData>({
    resolver: zodResolver(adminSignupSchema),
    mode: 'onChange',
  })
  
  const password = watch('password')
  const passwordStrength = getPasswordStrength(password || '')

  const onSubmit = async (data: AdminSignupFormData) => {
    setIsLoading(true)

    try {
      console.log('🔐 [ADMIN SIGNUP] Starting registration process...')
      console.log('📋 [ADMIN SIGNUP] Form data:', data)
      
      // Step 1: Sign up admin using new AuthContext method
      const authData = await signUpAdmin(data.fullName, data.email, data.password, data.adminCode)
      
      console.log('✅ [ADMIN SIGNUP] Admin registration completed:', authData)
      
      // ✅ Check if signup failed (has error) FIRST
      if (authData?.error) {
        console.error('❌ [ADMIN SIGNUP] Signup failed:', authData.error)
        // Error already shown by AuthContext
        setIsLoading(false)
        return
      }
      
      // Check if email confirmation is needed (only if signup succeeded)
      if (authData?.needsEmailConfirmation) {
        // Redirect to email confirmation page
        setTimeout(() => {
          router.push('/signup/admin/confirmation')
        }, 2000)
        return
      }
      
      // If no email confirmation needed, AuthContext handles redirect automatically
      // The user will be redirected to /admin dashboard
      
    } catch (error: any) {
      console.error('❌ [ADMIN SIGNUP] Registration failed:', error)
      
      // If it's a duplicate user error, offer clear & retry option
      if (error.message?.includes('already exists')) {
        setError('email', { 
          type: 'manual', 
          message: 'Email already exists. Try "Clear & Retry" button below.' 
        })
      } else {
        toast.error(error.message || "Failed to create admin account")
      }
    } finally {
      setIsLoading(false)
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
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-white/50 backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <div className="text-3xl font-bold">
              <span className="text-slate-800">Nulo</span>
              <span className="text-orange-600">Africa</span>
            </div>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Admin Registration🏠
          </h1>
          <p className="text-lg text-slate-600">
            Create your administrator account
          </p>
        </div>

        {/* Admin Registration Card */}
        <Card className="shadow-lg border-2 border-slate-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 transition-all duration-300 hover:scale-105">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Admin Signup
            </CardTitle>
            <CardDescription className="text-slate-600">
              Register for administrative access to NuloAfrica
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    {...register('fullName')}
                    className={`pl-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 ${errors.fullName ? "border-red-500" : ""} transition-all duration-300`}
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@nuloafrica.com"
                    {...register('email')}
                    className={`pl-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 ${errors.email ? "border-red-500" : ""} transition-all duration-300`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    {...register('password')}
                    className={`pl-10 pr-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 ${errors.password ? "border-red-500" : ""} transition-all duration-300`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-500' : 
                        passwordStrength.score <= 3 ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                    className={`pl-10 pr-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 ${errors.confirmPassword ? "border-red-500" : ""} transition-all duration-300`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Admin Authorization Code */}
              <div className="space-y-2">
                <Label htmlFor="adminCode" className="text-sm font-medium text-slate-700">Admin Authorization Code</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="adminCode"
                    type="password"
                    placeholder="Enter admin authorization code"
                    {...register('adminCode')}
                    className={`pl-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 ${errors.adminCode ? "border-red-500" : ""} transition-all duration-300`}
                    disabled={isLoading}
                  />
                </div>
                {errors.adminCode && (
                  <p className="text-sm text-red-500">{errors.adminCode.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Contact system administrator for authorization code
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Admin Account...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Create Admin Account
                  </>
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 rounded-lg border bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 flex-shrink-0 text-orange-600" />
                <p className="text-sm text-slate-700">
                  This is a privileged NuloAfrica administrator account. You will have full access to system settings, user management, and verification processes.
                </p>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-slate-600">
                Already have an admin account?{" "}
                <Link 
                  href="/signin" 
                  className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-300"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-10 text-center">
          <div className="flex items-center justify-center gap-8 text-slate-600">
            <div className="flex items-center gap-2 transition-all duration-300 hover:text-orange-600">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Secure</span>
            </div>
            <div className="flex items-center gap-2 transition-all duration-300 hover:text-orange-600">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Verified</span>
            </div>
            <div className="flex items-center gap-2 transition-all duration-300 hover:text-orange-600">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Trusted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
