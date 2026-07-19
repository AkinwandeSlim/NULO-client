"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Home, User, Building, CheckCircle, ArrowLeft, Shield, TrendingUp, Crown, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { useTheme } from "@/contexts/ThemeContext"

const WAITLIST_URL = "https://nest-by-nulo.vercel.app/"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { theme, toggleTheme } = useTheme()

  // Redirect if already logged in
  useEffect(() => {
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
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden ${theme === "dark" ? "bg-black" : "bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50"}`}>
      {/* Background Elements - NuloAfrica Brand Theme */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
      </div>

      {/* Back Button */}
      <Link
        href="/"
        className={`absolute top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-300 rounded-lg md:top-6 md:left-6 md:px-4 md:text-base ${theme === "dark" ? "text-white/70 hover:text-orange-400 hover:bg-white/10" : "text-slate-600 hover:text-orange-600 hover:bg-white/50 backdrop-blur-sm"}`}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-5xl relative z-10 px-4">
        {/* Header with mobile-first spacing */}
        <div className="text-center mb-8 pt-12 md:mb-10 md:pt-0">
          <Link href="/" className="inline-block mb-4 md:mb-6">
            <div className="text-2xl md:text-3xl font-bold">
              <span className={theme === "dark" ? "text-white" : "text-slate-800"}>Nulo</span>
              <span className="text-orange-600">Africa</span>
            </div>
          </Link>
          <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            Join NuloAfrica
          </h1>
          <p className={`text-sm md:text-lg mb-1 md:mb-2 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
            Let&apos;s get you started. What brings you here today?
          </p>
          <p className={`text-xs md:text-sm ${theme === "dark" ? "text-white/40" : "text-slate-500"}`}>
            Choose your role to get started with the best rental experience in Nigeria
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

          {/* Tenant Card */}
          <Link href="/signup/tenant">
            <Card className={`relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-2xl cursor-pointer group h-full ${theme === "dark" ? "border-white/10 hover:border-orange-400 bg-black" : "border-slate-200 hover:border-orange-300 bg-white"}`}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 ${theme === "dark" ? "bg-orange-900/30" : "bg-orange-100"}`}>
                    <Home className="h-10 w-10 text-orange-600" />
                  </div>

                  {/* Title */}
                  <h3 className={`text-xl md:text-2xl font-bold mb-3 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    I&apos;m looking for a property
                  </h3>

                  {/* Description */}
                  <p className={`text-sm mb-4 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                    Find your perfect home from verified listings across Nigeria
                  </p>

                  {/* Benefits */}
                  <div className="space-y-2 w-full">
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Browse verified properties</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Zero agency fees</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Direct contact with landlords</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Secure payments</span>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="mt-6 w-full">
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all duration-300 group-hover:bg-orange-700"
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
            <Card className={`relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-2xl cursor-pointer group h-full ${theme === "dark" ? "border-white/10 hover:border-orange-400 bg-black" : "border-slate-200 hover:border-orange-300 bg-white"}`}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 ${theme === "dark" ? "bg-orange-900/30" : "bg-orange-100"}`}>
                    <Building className="h-10 w-10 text-orange-600" />
                  </div>

                  {/* Title */}
                  <h3 className={`text-xl md:text-2xl font-bold mb-3 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    I&apos;m listing properties
                  </h3>

                  {/* Description */}
                  <p className={`text-sm mb-4 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                    Manage and list your rental properties with ease
                  </p>

                  {/* Benefits */}
                  <div className="space-y-2 w-full">
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>List unlimited properties</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Connect with verified tenants</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Manage applications easily</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Secure payment processing</span>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="mt-6 w-full">
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all duration-300 group-hover:bg-orange-700"
                      size="lg"
                    >
                      Get Started as Landlord
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Investor / NEST Card */}
          <Link href={WAITLIST_URL} target="_blank" rel="noopener noreferrer">
            <Card className={`relative overflow-hidden border-2 hover:shadow-lg hover:shadow-orange-100 transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-2xl cursor-pointer group h-full ${theme === "dark" ? "border-orange-500/30 bg-orange-950/30 hover:border-orange-400" : "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:border-orange-400"}`}>
              {/* Premium shimmer accent */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full ${theme === "dark" ? "bg-orange-500/20" : "bg-gradient-to-bl from-orange-200/40 to-transparent"}`} />
              <CardContent className="p-8 relative">
                <div className="flex flex-col items-center text-center">
                  {/* Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-4 ${theme === "dark" ? "bg-orange-900/30 text-orange-400" : "bg-orange-100 text-orange-700"}`}>
                    <Crown className="h-3 w-3" />
                    Coming Soon
                  </div>

                  {/* Icon */}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 ${theme === "dark" ? "bg-orange-900/40" : "bg-orange-200/60"}`}>
                    <TrendingUp className="h-10 w-10 text-orange-600" />
                  </div>

                  {/* Title */}
                  <h3 className={`text-xl md:text-2xl font-bold mb-3 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    I want to invest
                  </h3>

                  {/* Description */}
                  <p className={`text-sm mb-4 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                    Co-own high-yield rental properties through NEST and earn monthly returns
                  </p>

                  {/* Benefits */}
                  <div className="space-y-2 w-full">
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Start with small amounts</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Monthly rental income</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Fully managed properties</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                      <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span>Transparent reporting</span>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="mt-6 w-full">
                    <Button
                      className={`w-full font-semibold transition-all duration-300 group-hover:bg-slate-800 ${theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                      size="lg"
                    >
                      Join NEST Waitlist
                      <Crown className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Admin Access */}
        <div className="text-center mt-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme === "dark" ? "bg-white/10" : "bg-slate-100"}`}>
            <Shield className={`h-4 w-4 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`} />
            <span className={`text-sm ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>Admin Access?</span>
          </div>
          <Link
            href="/signup/admin"
            className={`ml-2 text-sm font-medium transition-colors ${theme === "dark" ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-700"}`}
          >
            Register as Administrator
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className={`flex items-center justify-center gap-8 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
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