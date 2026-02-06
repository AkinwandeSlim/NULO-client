"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useLandlordDashboard } from "@/contexts/DashboardContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Home, Building2, Calendar, MessageSquare,
  DollarSign, TrendingUp, Eye, Plus,
  MapPin, Bed, Bath, Square, Users,
  ArrowRight, AlertCircle, CheckCircle, Shield, 
  RefreshCw, XCircle, Star, Bell, Settings,
  Activity, BarChart3, Clock, ChevronRight,
  FileText, Upload, User, Mail, Phone
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import landlordDashboardAPI, { 
  LandlordProfile, 
  LandlordOnboarding,
  LandlordStats,
  LandlordProperties,
  RecentActivity,
  Notification,
  isLandlordVerified,
  isOnboardingCompleted,
  getOnboardingProgress,
  getVerificationStatusColor,
  getPropertyStatusColor,
  formatCurrency,
  formatDate
} from "@/lib/api/landlordDashboard"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function LandlordDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userProfile } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  // ✅ Use context hook for cached landlord data
  const { 
    landlordData, 
    loading, 
    refreshing, 
    fetchLandlordDashboard,
    invalidateLandlordCache
  } = useLandlordDashboard()

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await fetchLandlordDashboard(true) // Force refresh
      toast.success('Dashboard refreshed')
    } catch (error: any) {
      console.error('Error refreshing dashboard:', error)
      toast.error('Failed to refresh dashboard')
    }
  }

  // Mount check
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch landlord data on mount
  useEffect(() => {
    if (mounted && user?.user_type === 'landlord') {
      if (!landlordData) {
        fetchLandlordDashboard()
      }
    }
  }, [mounted, user, landlordData, fetchLandlordDashboard])

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await landlordDashboardAPI.markNotificationRead(notification.id)
        // Invalidate cache so fresh data is fetched next time
        invalidateLandlordCache()
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
    
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  // Get verification status badge
  const getVerificationBadge = (profile: LandlordProfile) => {
    const color = getVerificationStatusColor(profile.verification_status)
    const status = profile.verification_status.charAt(0).toUpperCase() + profile.verification_status.slice(1)
    
    return (
      <Badge className={`bg-${color}-100 text-${color}-800 border-${color}-200`}>
        {status}
      </Badge>
    )
  }

  // Get onboarding progress component
  const renderOnboardingProgress = (onboarding: LandlordOnboarding | null) => {
    if (!onboarding) return null
    
    const progress = getOnboardingProgress(onboarding)
    const isCompleted = isOnboardingCompleted(onboarding)
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Onboarding Progress</span>
          <span className="text-sm text-slate-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-slate-600">
          {isCompleted ? '✅ Completed - Under Review' : `Step ${onboarding.current_step} of 4`}
        </div>
      </div>
    )
  }

  // Progressive Banner System
  const getProgressiveBanner = () => {
    // Case 1: Not verified or onboarding not completed
    if (!isVerified || !hasCompletedOnboarding) {
      return (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">
                  {!hasCompletedOnboarding ? 'Complete Your Onboarding' : 'Verification Pending'}
                </h3>
                <p className="text-orange-700 text-sm mb-3">
                  {!hasCompletedOnboarding 
                    ? 'Complete your onboarding process to start listing properties.'
                    : 'Your verification is under review. You\'ll be notified once approved.'
                  }
                </p>
                
                {!hasCompletedOnboarding && (
                  <Link href="/landlord/onboarding">
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      <Upload className="h-4 w-4 mr-2" />
                      Complete Onboarding
                    </Button>
                  </Link>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {getVerificationBadge(profile)}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Case 2: Verified but no properties listed
    if (isVerified && hasCompletedOnboarding && stats.total_properties === 0) {
      return (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">
                  🎉 Congratulations! Your account is verified.
                </h3>
                <p className="text-green-700 text-sm mb-3">
                  Ready to list your first property? Get started now and reach thousands of potential tenants.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/landlord/properties/new">
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      List Your First Property
                    </Button>
                  </Link>
                  <Link href="/landlord/guides/property-listing">
                    <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
                      <FileText className="h-4 w-4 mr-2" />
                      Property Listing Guide
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getVerificationBadge(profile)}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Case 3: Has properties with pending viewing requests
    if (stats.total_properties > 0 && stats.pending_viewings > 0) {
      return (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  📅 You have {stats.pending_viewings} viewing request{stats.pending_viewings > 1 ? 's' : ''}
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  Tenants are interested in your properties! Review and respond to viewing requests promptly.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/landlord/viewings">
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      <Eye className="h-4 w-4 mr-2" />
                      Review Viewing Requests
                    </Button>
                  </Link>
                  <Link href="/landlord/properties">
                    <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
                      <Building2 className="h-4 w-4 mr-2" />
                      Manage Properties
                    </Button>
                  </Link>
                </div>
              </div>
              
              <Badge className="bg-blue-100 text-blue-800">
                {stats.pending_viewings} New
              </Badge>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Case 4: Has properties, check if any are approved/live
    if (stats.total_properties > 0) {
      // Check if any properties are approved (verification_status = 'approved')
      const hasApprovedProperties = (properties ?? []).some((p: any) => 
        p.verification_status === 'approved' || p.verification_status === 'verified'
      )
      
      if (hasApprovedProperties) {
        return (
          <Card className="mb-6 border-slate-200 bg-slate-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    📊 Your properties are live!
                  </h3>
                  <p className="text-slate-700 text-sm mb-3">
                    Monitor viewing requests, applications, and track your property performance from your dashboard.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/landlord/analytics">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </Link>
                    <Link href="/landlord/properties">
                      <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
                        <Building2 className="h-4 w-4 mr-2" />
                        Manage Properties
                      </Button>
                    </Link>
                    <Link href="/landlord/properties/new">
                      <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Property
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    {stats.active_listings} Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      } else {
        // Properties exist but none are approved yet
        return (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">
                    ⏳ Properties pending verification
                  </h3>
                  <p className="text-orange-700 text-sm mb-3">
                    Your properties have been submitted and are currently under review by our admin team. You'll receive a notification once they're approved and live.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/landlord/properties">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        <Eye className="h-4 w-4 mr-2" />
                        Review Properties
                      </Button>
                    </Link>
                    <Link href="/landlord/properties/new">
                      <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Property
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-800">
                    {stats.total_properties} Pending
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }
    }

    // Default: No banner needed
    return null
  }

  // Load data on mount and route change
  useEffect(() => {
    if (mounted && user && user.user_type === 'landlord') {
      if (!landlordData) {
        fetchLandlordDashboard()
      }
    } else if (user && user.user_type !== 'landlord') {
      router.push('/dashboard')
      toast.error('Access denied. Landlord access required.')
    }
  }, [mounted, user, landlordData, fetchLandlordDashboard])

  // Loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i: number) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
              <div className="h-96 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (!landlordData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Error</h2>
          <p className="text-slate-600 mb-6">Unable to load dashboard data</p>
          <Button onClick={handleRefresh} className="bg-orange-500 hover:bg-orange-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const { profile, onboarding, stats, properties = [], recentActivity = [], notifications = [] } = landlordData
  const isVerified = isLandlordVerified(profile)
  const hasCompletedOnboarding = onboarding ? isOnboardingCompleted(onboarding) : false

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {userProfile?.full_name || 'Landlord'}!
            </h1>
            <p className="text-slate-600">
              Here's what's happening with your properties today
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Link href="/landlord/settings">
              <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Progressive Banner System */}
        {getProgressiveBanner()}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {stats.total_properties}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{stats.total_properties}</h3>
              <p className="text-sm text-slate-600">Total Properties</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {stats.active_listings}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.monthly_revenue)}</h3>
              <p className="text-sm text-slate-600">Monthly Revenue</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <Badge className="bg-orange-100 text-orange-800">
                  {stats.pending_viewings}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{stats.pending_viewings}</h3>
              <p className="text-sm text-slate-600">Pending Viewings</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  {stats.unread_messages}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{stats.unread_messages}</h3>
              <p className="text-sm text-slate-600">Unread Messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Properties List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Properties Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Your Properties</h2>
              {isVerified && (
                <Link href="/landlord/properties/new">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </Link>
              )}
            </div>

            {/* Properties Grid */}
            {(properties?.length ?? 0) > 0 ? (
              <div className="grid gap-4">
                {(properties ?? []).slice(0, 3).map((property) => (
                  <Card key={property.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Property Image */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <img
                            src={property.images[0] || DEFAULT_PROPERTY_IMAGE}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Property Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-900 truncate">{property.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge className={getPropertyStatusColor(property.status)}>
                                {property.status}
                              </Badge>
                              <Badge className={
                                property.verification_status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : property.verification_status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-orange-100 text-orange-800'
                              }>
                                {property.verification_status === 'approved'
                                  ? '✓ Approved'
                                  : property.verification_status === 'rejected'
                                  ? '✗ Rejected'
                                  : '⏳ Pending'
                                }
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{property.city}, {property.state}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Bed className="h-4 w-4" />
                              <span>{property.beds}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="h-4 w-4" />
                              <span>{property.baths}</span>
                            </div>
                            {property.sqft && (
                              <div className="flex items-center gap-1">
                                <Square className="h-4 w-4" />
                                <span>{property.sqft.toLocaleString()} sqft</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-orange-600">
                              {formatCurrency(property.price)}
                              <span className="text-sm text-slate-500 font-normal">/year</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{property.view_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{property.application_count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Property Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Link href={`/landlord/properties/${property.id}`}>
                          <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/properties/${property.id}`}>
                          <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                            <Eye className="h-4 w-4 mr-1" />
                            Public View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Properties Yet</h3>
                  <p className="text-slate-600 mb-6">
                    {isVerified 
                      ? 'Add your first property to start receiving applications.'
                      : 'Complete verification to start listing properties.'
                    }
                  </p>
                  {isVerified && (
                    <Link href="/landlord/properties/new">
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Property
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
            
            {(properties?.length ?? 0) > 3 && (
              <div className="text-center">
                <Link href="/landlord/properties">
                  <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                    View All Properties ({properties?.length ?? 0})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Onboarding Progress */}
            {onboarding && !hasCompletedOnboarding && (
              <Card className="border-slate-200">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Onboarding Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {renderOnboardingProgress(onboarding)}
                  
                  <div className="mt-4">
                    <Link href="/landlord/onboarding">
                      <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                        Continue Onboarding
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {(recentActivity?.length ?? 0) > 0 ? (
                  <div className="space-y-4">
                    {(recentActivity ?? []).slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'viewing_request' ? 'bg-blue-100' :
                          activity.type === 'application' ? 'bg-green-100' :
                          activity.type === 'message' ? 'bg-purple-100' :
                          'bg-slate-100'
                        }`}>
                          {activity.type === 'viewing_request' ? <Calendar className="h-4 w-4 text-blue-600" /> :
                           activity.type === 'application' ? <FileText className="h-4 w-4 text-green-600" /> :
                           activity.type === 'message' ? <MessageSquare className="h-4 w-4 text-purple-600" /> :
                           <Activity className="h-4 w-4 text-slate-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                          <p className="text-xs text-slate-600 truncate">{activity.description}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {(notifications?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    {(notifications ?? []).slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          notification.read 
                            ? 'border-slate-100 bg-slate-50' 
                            : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.read ? 'bg-slate-300' : 'bg-orange-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                            <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-2">{formatDate(notification.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">No notifications</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isVerified ? (
              <>
                <Link href="/landlord/properties/new">
                  <Card className="border-2 border-orange-200 hover:border-orange-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-to-br from-white to-orange-50/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Add Property</p>
                          <p className="text-sm text-slate-600">List a new rental</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/landlord/applications">
                  <Card className="border-2 border-slate-200 hover:border-slate-400 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-500 rounded-xl flex items-center justify-center shadow-lg">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Applications</p>
                          <p className="text-sm text-slate-600">Review applications</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/landlord/messages">
                  <Card className="border-2 border-slate-200 hover:border-slate-400 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-500 rounded-xl flex items-center justify-center shadow-lg">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Messages</p>
                          <p className="text-sm text-slate-600">Chat with tenants</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </>
            ) : (
              <>
                <Link href="/landlord/onboarding">
                  <Card className="border-2 border-orange-200 hover:border-orange-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-to-br from-white to-orange-50/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Complete Onboarding</p>
                          <p className="text-sm text-slate-600">Finish verification</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/landlord/profile">
                  <Card className="border-2 border-slate-200 hover:border-slate-400 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-500 rounded-xl flex items-center justify-center shadow-lg">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Update Profile</p>
                          <p className="text-sm text-slate-600">Edit your info</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link href="/help">
                  <Card className="border-2 border-slate-200 hover:border-slate-400 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Get Help</p>
                          <p className="text-sm text-slate-600">View resources</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
