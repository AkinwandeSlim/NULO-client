"use client"

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, RefreshCw, AlertTriangle, Bug } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for monitoring
    console.error('Public Route Group Error:', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      routeGroup: '(public)'
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Error Hero Section */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="text-8xl font-bold text-red-200 select-none">
              Error
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle className="w-20 h-20 text-red-500 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900">
            Something Went Wrong
          </h1>
          
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            We encountered an unexpected error. Our team has been notified and is working to fix this issue.
          </p>
        </div>

        {/* Error Details Card */}
        <Card className="border-2 border-red-200 rounded-2xl p-6 bg-red-50/30">
          <CardContent className="p-0 space-y-4">
            <div className="flex items-center gap-3">
              <Bug className="w-6 h-6 text-red-600" />
              <h3 className="font-semibold text-slate-900">Error Details</h3>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium text-slate-700">Message:</span>
                <p className="text-slate-600 mt-1">{error.message}</p>
              </div>
              
              {error.digest && (
                <div className="text-sm">
                  <span className="font-medium text-slate-700">Error ID:</span>
                  <p className="text-slate-600 font-mono text-xs mt-1">{error.digest}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={reset}
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          
          <Button 
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl transition-all duration-300"
          >
            <a href="/">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </a>
          </Button>
        </div>

        {/* Help Section */}
        <Card className="border-2 border-orange-200 rounded-2xl p-6">
          <CardContent className="p-0 text-center space-y-3">
            <h3 className="font-semibold text-slate-900">Still Having Trouble?</h3>
            <p className="text-sm text-slate-600">
              If this error persists, please contact our support team with the Error ID above
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                asChild
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl"
              >
                <a href="/contact">
                  Contact Support
                </a>
              </Button>
              <Button 
                asChild
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl"
              >
                <a href="mailto:support@nuloafrica.com">
                  Email Support
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-slate-400">
            We apologize for the inconvenience. This error has been logged for our development team.
          </p>
        </div>
      </div>
    </div>
  )
}
