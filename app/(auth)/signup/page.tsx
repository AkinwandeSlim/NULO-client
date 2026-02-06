"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Home, User, Building, CheckCircle, ArrowLeft, Shield, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    // Check if user is logged in via localStorage or session
    const checkAuth = () => {
      const user = localStorage.getItem('user')
      if (user) {
        window.location.href = '/properties'
      }
    }
    checkAuth()
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      // Redirect to sign in page with Google OAuth
      window.location.href = '/signin?provider=google'
    } catch (error: any) {
      toast.error('Google sign-in failed', {
        description: error.message || 'Please try again',
        duration: 5000,
      })
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

      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <div className="text-3xl font-bold">
              <span className="text-slate-800">Nulo</span>
              <span className="text-orange-600">Africa</span>
            </div>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Join NuloAfrica 🏠
          </h1>
          <p className="text-lg text-slate-600 mb-2">
            Let's get you started. What brings you here today?
          </p>
          <p className="text-sm text-slate-500">
            Choose your role to get started with the best rental experience in Nigeria
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Tenant Card */}
          <Link href="/signup/tenant">
            <Card className="relative overflow-hidden border-2 border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-2xl cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-orange-200 group-hover:scale-110">
                    <Home className="h-10 w-10 text-orange-600" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">
                    I'm looking for a property
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4">
                    Find your perfect home from verified listings across Nigeria
                  </p>

                  {/* Benefits */}
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Browse verified properties</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Zero agency fees</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Direct contact with landlords</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Secure payments</span>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="mt-6">
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all duration-300 group-hover:bg-orange-700 group-hover:scale-105"
                      size="lg"
                    >
                      Get Started as Tenant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Landlord Card */}
          <Link href="/signup/landlord">
            <Card className="relative overflow-hidden border-2 border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-2xl cursor-pointer group">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-orange-200 group-hover:scale-110">
                    <Building className="h-10 w-10 text-orange-600" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">
                    I'm listing properties
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4">
                    Manage and list your rental properties with ease
                  </p>

                  {/* Benefits */}
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>List unlimited properties</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Connect with verified tenants</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Manage applications easily</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Secure payment processing</span>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="mt-6">
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all duration-300 group-hover:bg-orange-700 group-hover:scale-105"
                      size="lg"
                    >
                      Get Started as Landlord
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Admin Access */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
            <Shield className="h-4 w-4 text-slate-600" />
            <span className="text-sm text-slate-600">Admin Access?</span>
          </div>
          <Link 
            href="/signup/admin" 
            className="ml-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            Register as Administrator
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-8 text-slate-600">
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
