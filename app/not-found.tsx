"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, Search, ArrowLeft, Hammer, Wrench, Construction } from 'lucide-react'

export default function NotFound() {
  useEffect(() => {
    // Log 404 errors for monitoring
    console.log('404 Page Not Found:', {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })
  }, [])

  const goBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* 404 Hero Section */}
        <div className="text-center space-y-4">
          {/* 404 Number */}
          <div className="relative">
            <div className="text-9xl font-bold text-orange-200 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Construction className="w-24 h-24 text-orange-500 animate-pulse" />
            </div>
          </div>
          
          {/* Main Message */}
          <h1 className="text-4xl font-bold text-slate-900">
            Oops! Page Under Development
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            The page you're looking for is currently being built or doesn't exist yet. 
            Our team is working hard to bring you amazing features!
          </p>
        </div>

        {/* Development Status Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2 border-orange-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-0 space-y-3">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Hammer className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Under Construction</h3>
              <p className="text-sm text-slate-600">
                This page is being built with care and attention to detail
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-0 space-y-3">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Wrench className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Coming Soon</h3>
              <p className="text-sm text-slate-600">
                We're adding new features to improve your experience
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-0 space-y-3">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Need Help?</h3>
              <p className="text-sm text-slate-600">
                Contact our support team for assistance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <Button 
            variant="outline"
            size="lg"
            onClick={goBack}
            className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <Card className="border-2 border-orange-200 rounded-2xl p-6">
          <CardContent className="p-0">
            <h3 className="font-semibold text-slate-900 mb-4 text-center">
              Popular Pages
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <Link 
                href="/properties"
                className="text-orange-600 hover:text-orange-700 hover:underline text-sm text-center"
              >
                Browse Properties
              </Link>
              <Link 
                href="/about"
                className="text-orange-600 hover:text-orange-700 hover:underline text-sm text-center"
              >
                About NuloAfrica
              </Link>
              <Link 
                href="/contact"
                className="text-orange-600 hover:text-orange-700 hover:underline text-sm text-center"
              >
                Contact Support
              </Link>
              <Link 
                href="/dashboard"
                className="text-orange-600 hover:text-orange-700 hover:underline text-sm text-center"
              >
                Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer Message */}
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-500">
            If you believe this is an error, please contact our support team
          </p>
          <p className="text-xs text-slate-400">
            Error ID: {typeof window !== 'undefined' ? btoa(window.location.pathname).slice(0, 8) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}
