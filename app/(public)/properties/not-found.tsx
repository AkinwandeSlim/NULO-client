"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, Search, ArrowLeft, Building, MapPin, Phone } from 'lucide-react'

export default function PropertiesNotFound() {
  useEffect(() => {
    console.log('Properties 404:', {
      url: window.location.href,
      timestamp: new Date().toISOString()
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Property-Specific 404 */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="text-8xl font-bold text-orange-200 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building className="w-20 h-20 text-orange-500 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900">
            Property Not Found
          </h1>
          
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            The property you're looking for is either unavailable, has been removed, or the link is incorrect. 
            But don't worry, we have many other amazing properties for you!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2 border-orange-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0 space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Browse Properties</h3>
              <p className="text-sm text-slate-600 mb-4">
                Explore our extensive collection of verified rental properties
              </p>
              <Button 
                asChild
                className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl"
              >
                <Link href="/properties">
                  View All Properties
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0 space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Popular Locations</h3>
              <p className="text-sm text-slate-600 mb-4">
                Find properties in Lagos, Abuja, Port Harcourt and more
              </p>
              <Button 
                asChild
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl"
              >
                <Link href="/properties?location=lagos">
                  Browse Lagos Properties
                </Link>
              </Button>
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
            onClick={() => window.history.back()}
            className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Help Section */}
        <Card className="border-2 border-orange-200 rounded-2xl p-6 bg-orange-50/50">
          <CardContent className="p-0 text-center space-y-3">
            <h3 className="font-semibold text-slate-900">Need Help Finding a Property?</h3>
            <p className="text-sm text-slate-600">
              Our property experts are here to help you find your perfect home
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                asChild
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl"
              >
                <Link href="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
