"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useLandlordDashboard } from "@/contexts/DashboardContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { Notification } from "@/contexts/NotificationContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2, Calendar, MessageSquare, DollarSign,
  Eye, Plus, MapPin, Bed, Bath, Square,
  ArrowRight, AlertCircle, CheckCircle,
  Bell, Settings, Activity, FileText,
  Upload, User, Zap, Award, Target, TrendingUp, Mail, X
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import landlordDashboardAPI, {
  LandlordProfile,
  LandlordOnboarding,
  isLandlordVerified,
  isOnboardingCompleted,
  getOnboardingProgress,
  formatCurrency,
  formatDate
} from "@/lib/api/landlordDashboard"
import { viewingRequestsAPI as landlordViewingRequestsAPI } from "@/lib/api/viewingRequestsLandlord"
import { applicationsAPI, type Application } from "@/lib/api/applications"
import { engagementAPI, getEngagementLevelColor, getEngagementLevelTextColor, getEngagementLevelBgColor, getTrustScoreColor, getTrustScoreTextColor, getTrustScoreBgColor, trackEngagement } from "@/lib/api/engagement"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function LandlordDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userProfile } = useAuth()
  const { state } = useNotifications()
  const { notifications, unreadCount } = state

  const {
    landlordData,
    loading,
    refreshing,
    fetchLandlordDashboard,
    invalidateLandlordCache
  } = useLandlordDashboard()

  const [mounted, setMounted] = useState(false)
  const [viewingRequests, setViewingRequests] = useState<any[]>([])
  const [viewingsLoading, setViewingsLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [engagementMetrics, setEngagementMetrics] = useState<any>(null)

  // Track engagement activities
  const trackActivity = useCallback(async (activityType: any, metadata?: any) => {
    if (user?.id) {
      await trackEngagement(user.id, activityType, metadata)
    }
  }, [user?.id])

  // Memoize expensive calculations and event handlers (must be before early returns)
  const getUserName = useMemo(() => () =>
    userProfile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'there'
  , [userProfile, user])

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.read) {
      try {
        await landlordDashboardAPI.markNotificationRead(notification.id)
        invalidateLandlordCache()
      } catch {}
    }
    if (notification.link) router.push(notification.link)
  }, [invalidateLandlordCache, router])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && user?.user_type === 'landlord' && !landlordData) {
      // Only fetch if no cached data exists.
      // Cache is explicitly invalidated by useOnboarding after submission,
      // so we never need to force-refresh here — the cache is always correct.
      fetchLandlordDashboard()
    } else if (mounted && user && user.user_type !== 'landlord') {
      router.push('/dashboard')
      toast.error('Access denied. Landlord access required.')
    }
  }, [mounted, user, landlordData])

  // Fetch viewing requests once landlordData is available.
  // Tied to landlordData (not mounted/user) to avoid race conditions during auth hydration.
  // Mirrors the tenant dashboard pattern: direct fetch, no user_type re-check needed.
  useEffect(() => {
    if (!landlordData) return
    const fetchViewings = async () => {
      setViewingsLoading(true)
      try {
        const data = await landlordViewingRequestsAPI.getLandlord()
        // getLandlord() returns typed objects directly -- handle array or wrapped response
        const list: any[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.viewing_requests)
          ? (data as any).viewing_requests
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : []
        // Show pending + confirmed only -- completed/cancelled not actionable on overview
        setViewingRequests(list.filter((v: any) => v.status === 'pending' || v.status === 'confirmed'))
      } catch (err) {
        console.error('Failed to fetch viewings for overview:', err)
        setViewingRequests([])
      } finally {
        setViewingsLoading(false)
      }
    }
    fetchViewings()
  }, [landlordData])

  // Fetch landlord applications (from tenant applicants)
  useEffect(() => {
    if (!landlordData) return
    const fetchApplications = async () => {
      setApplicationsLoading(true)
      try {
        const data = await applicationsAPI.getReceivedApplications()
        // Handle array or wrapped response
        const list: Application[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.applications)
          ? (data as any).applications
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : []
        // Show only relevant statuses: pending review, approved, rejected (not withdrawn)
        const filtered = list.filter((app: Application) => 
          app.status !== 'withdrawn'
        )
        setApplications(filtered)
      } catch (err) {
        console.error('Failed to fetch applications for overview:', err)
        setApplications([])
      } finally {
        setApplicationsLoading(false)
      }
    }
    fetchApplications()
  }, [landlordData])

  // Fetch engagement metrics
  useEffect(() => {
    if (!user?.id) return
    
    const fetchEngagementMetrics = async () => {
      try {
        const engagementData = await engagementAPI.getEngagementMetrics(user.id)
        setEngagementMetrics(engagementData)
      } catch (error) {
        console.error('Failed to fetch engagement metrics:', error)
      }
    }
    
    fetchEngagementMetrics()
  }, [user?.id])

  // Memoize viewing requests list to prevent unnecessary re-renders
  const viewingRequestsList = useMemo(() => viewingRequests, [viewingRequests])

  // Memoize progressive banner to prevent unnecessary re-renders
  const progressiveBanner = useMemo(() => {
    // State 1: Onboarding steps not all done
    if (!landlordData?.onboarding?.all_steps_completed) {
      return (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">Complete Your Onboarding</h3>
                <p className="text-orange-700 text-sm mb-3">
                  Complete your onboarding process to start listing properties.
                </p>
                <Link href="/landlord/onboarding">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Upload className="h-4 w-4 mr-2" />Continue Onboarding
                  </Button>
                </Link>
              </div>
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">Incomplete</Badge>
            </div>
          </CardContent>
        </Card>
      )
    }

    // State 2: All steps done + submitted → awaiting admin review
    if (landlordData?.onboarding?.all_steps_completed && landlordData?.onboarding?.submitted_for_review && landlordData?.profile && !isLandlordVerified(landlordData.profile)) {
      return (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Verification Pending</h3>
                <p className="text-blue-700 text-sm">
                  Your documents are under review. You'll be notified by email once approved — this usually takes 1–2 business days.
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">Under Review</Badge>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (landlordData?.profile && isLandlordVerified(landlordData.profile) && landlordData?.stats?.total_properties === 0) {
      return (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Your account is verified!</h3>
                <p className="text-green-700 text-sm mb-3">
                  Ready to list your first property? Reach thousands of verified tenants.
                </p>
                <Link href="/landlord/properties/new">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />List Your First Property
                  </Button>
                </Link>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (viewingRequestsList.filter((v: any) => v.status === 'pending').length > 0) {
      return (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  You have {viewingRequestsList.filter((v: any) => v.status === 'pending').length} viewing request{viewingRequestsList.filter((v: any) => v.status === 'pending').length > 1 ? 's' : ''}
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  Tenants are interested in your properties! Review and respond promptly.
                </p>
                <Link href="/landlord/viewings">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Eye className="h-4 w-4 mr-2" />Review Requests
                  </Button>
                </Link>
              </div>
              <Badge className="bg-blue-100 text-blue-800">{viewingRequestsList.filter((v: any) => v.status === 'pending').length} Pending</Badge>
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }, [landlordData, viewingRequestsList])

  // ─── Loading — same spinner as tenant ────────────────────────────────────────
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Your Dashboard</h3>
              <p className="text-slate-600">Please wait while we fetch your property management activity...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Error — same centered layout as tenant ───────────────────────────────────
  if (!landlordData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-red-300 border-t-transparent rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Could not load dashboard</h3>
              <p className="text-slate-600 mb-6">Please try refreshing the page.</p>
              <Button
                onClick={() => fetchLandlordDashboard(true)}
                disabled={refreshing}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
              >
                {refreshing ? 'Retrying...' : 'Try Again'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const profile = landlordData?.profile || null
  const { onboarding, stats, properties = [], recentActivity = [] } = landlordData || {}

  // Read verification status from landlordData.profile (fresh from API).
  // isLandlordVerified checks profile.verification_status === 'approved'.
  const isVerified = profile ? isLandlordVerified(profile) : false

  // Three distinct states read directly from onboarding object fields.
  // Never use isOnboardingCompleted() alone — it collapses two states into one.
  //   allStepsDone=false               → banner: "Complete Onboarding" (link to /onboarding)
  //   allStepsDone=true, submitted=false → banner: "Submit for Review" (shouldn't normally happen)
  //   allStepsDone=true, submitted=true  → banner: "Verification Pending"
  //   isVerified=true                  → no banner
  const allStepsDone = onboarding?.all_steps_completed === true
  const hasSubmitted = onboarding?.submitted_for_review === true
  const hasCompletedOnboarding = allStepsDone && hasSubmitted
  const recentMessages = (recentActivity ?? []).filter((a: any) => a.type === 'message')

  // Derive accurate counts from real viewingRequests data (fetched from landlord API).
  // stats.pending_viewings from the backend counts confirmed viewings too -- do not use it
  // for the banner or stat card. Fall back to 0 while viewings are still loading to prevent flashing.
  const pendingCount = viewingsLoading
    ? 0
    : viewingRequests.filter((v: any) => v.status === 'pending').length
  const confirmedCount = viewingsLoading
    ? 0
    : viewingRequests.filter((v: any) => v.status === 'confirmed').length

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="container mx-auto px-4 py-8">

        {/* Hero — same structure as tenant */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                Welcome back, {getUserName()}!
              </h1>
              <p className="text-lg text-gray-600 mb-6">Your property management dashboard</p>

              <div className="flex flex-wrap gap-3">
                {isVerified ? (
                  <Link href="/landlord/properties/new">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                      <Plus className="mr-2 h-4 w-4" />Add Property
                    </Button>
                  </Link>
                ) : hasCompletedOnboarding ? (
                  // Don't show primary action button when verification is pending
                  // User needs to wait for admin review
                  null
                ) : (
                  <Link href="/landlord/onboarding">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                      <Upload className="mr-2 h-4 w-4" />Complete Onboarding
                    </Button>
                  </Link>
                )}
                <Link href="/landlord/properties">
                  <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                    <Building2 className="mr-2 h-4 w-4" />My Properties
                  </Button>
                </Link>
                <Link href="/landlord/viewings">
                  <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                    <Calendar className="mr-2 h-4 w-4" />Viewings
                  </Button>
                </Link>
              </div>
            </div>

            {/* Icon-only buttons — same as tenant */}
            <div className="flex items-center gap-3">
              <Link href="/landlord/messages">
                <Button variant="outline" size="lg" className="relative border-orange-200 text-orange-700 hover:bg-orange-50">
                  <MessageSquare className="h-4 w-4" />
                  {stats.unread_messages > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {stats.unread_messages}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/landlord/settings">
                <Button variant="outline" size="lg" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Progressive Banner */}
        {progressiveBanner}

        {/* Stats — same 4-card grid as tenant, same card anatomy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Properties</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total_properties}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-slate-900">{formatCurrency(stats.monthly_revenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/landlord/viewings">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-600 mb-1">Viewings</p>
                      <p className="text-3xl font-bold text-slate-900">{pendingCount}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {pendingCount > 0 && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            {pendingCount} pending
                          </span>
                        )}
                        {confirmedCount > 0 && (
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {confirmedCount} confirmed
                          </span>
                        )}
                        {pendingCount === 0 && confirmedCount === 0 && !viewingsLoading && (
                          <span className="text-xs text-slate-400">none active</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/landlord/applications">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-600 mb-1">Applications</p>
                      <p className="text-3xl font-bold text-slate-900">{applications.length}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {applications.filter(a => a.status === 'pending').length > 0 && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            {applications.filter(a => a.status === 'pending').length} pending
                          </span>
                        )}
                        {applications.filter(a => a.status === 'approved').length > 0 && (
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {applications.filter(a => a.status === 'approved').length} approved
                          </span>
                        )}
                        {applications.length === 0 && (
                          <span className="text-xs text-slate-400">none yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Unread Messages</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.unread_messages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Engagement Progress Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Performance Progress</h2>
              <p className="text-gray-600">Track your landlord engagement and tenant interaction</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Engagement Score:</span>
                <span className="text-lg font-bold text-orange-600">{engagementMetrics?.engagement_score || 0}/100</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Trust Score:</span>
                <span className="text-lg font-bold text-green-600">{engagementMetrics?.trust_score || 0}/100</span>
              </div>
            </div>
          </div>
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Overall Engagement</span>
                    <span className="text-slate-600">{engagementMetrics?.engagement_score || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${engagementMetrics?.engagement_score || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Achievement Badges */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      (engagementMetrics?.metrics?.properties_listed || 0) > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">{engagementMetrics?.metrics?.properties_listed || 0} Listed</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      (engagementMetrics?.metrics?.viewing_responses_count || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm font-medium">{engagementMetrics?.metrics?.viewing_responses_count || 0} Responses</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      (engagementMetrics?.metrics?.messages_sent_count || 0) > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Mail className="h-4 w-4" />
                      <span className="text-sm font-medium">{engagementMetrics?.metrics?.messages_sent_count || 0} Messages</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Level: {engagementMetrics?.engagement_level || 'Low'}
                    </span>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{engagementMetrics?.metrics?.properties_listed || 0}</p>
                    <p className="text-xs text-slate-600">Properties Listed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{engagementMetrics?.metrics?.viewing_responses_count || 0}</p>
                    <p className="text-xs text-slate-600">Responses Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{engagementMetrics?.metrics?.avg_response_time_hours || 0}h</p>
                    <p className="text-xs text-slate-600">Avg Response Time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main grid — 3/4 + 1/4 exactly as tenant */}
        <div className="grid gap-8 lg:grid-cols-4">

          {/* Left 3 cols */}
          <div className="lg:col-span-3 space-y-8">

            {/* Properties — mirrors tenant "Saved Properties" section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Properties</h2>
                  <p className="text-gray-600">Properties you've listed on NuloAfrica</p>
                </div>
                <Link href="/landlord/properties">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {(properties?.length ?? 0) === 0 ? (
                    /* Empty — same anatomy as tenant empty state */
                    <div className="text-center py-12">
                      <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties listed yet</h3>
                      <p className="text-slate-600 mb-6">
                        {isVerified
                          ? 'Add your first property to start receiving viewing requests from tenants.'
                          : 'Complete your verification to start listing properties.'}
                      </p>
                      {isVerified && (
                        <Link href="/landlord/properties/new">
                          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                            <Plus className="mr-2 h-4 w-4" />List Your First Property
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    /* Cards — exact same card anatomy as tenant property cards */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {(properties ?? []).slice(0, 4).map((property: any) => (
                        <Link key={property.id} href={`/landlord/properties/${property.id}`}>
                          <div className="group relative bg-white rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                                alt={property.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              {/* Verification badge — top right, same position as tenant Heart */}
                              <div className="absolute top-3 right-3">
                                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  property.verification_status === 'approved' ? 'bg-green-500 text-white'
                                  : property.verification_status === 'rejected' ? 'bg-red-500 text-white'
                                  : 'bg-orange-500 text-white'
                                }`}>
                                  {property.verification_status === 'approved' ? '✓ Approved'
                                    : property.verification_status === 'rejected' ? '✗ Rejected'
                                    : '⏳ Pending'}
                                </div>
                              </div>
                              {/* View count — top left, same position as tenant Star rating */}
                              {property.view_count > 0 && (
                                <div className="absolute top-3 left-3">
                                  <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-slate-700 shadow-lg">
                                    <Eye className="h-3 w-3" />{property.view_count} views
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="p-5">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-2xl font-bold text-orange-600">
                                  {formatCurrency(property.price)}
                                  <span className="text-sm font-normal text-slate-500">/yr</span>
                                </p>
                                {property.application_count > 0 && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    {property.application_count} applicant{property.application_count > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>

                              <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                {property.title}
                              </h3>

                              <p className="text-sm text-slate-600 flex items-center mb-4">
                                <MapPin className="h-4 w-4 mr-1.5 text-orange-500 flex-shrink-0" />
                                <span className="line-clamp-1">{property.city}, {property.state}</span>
                              </p>

                              <div className="flex items-center gap-4 text-sm text-slate-600 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <Bed className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium">{property.beds}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Bath className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium">{property.baths}</span>
                                </div>
                                {property.sqft && (
                                  <div className="flex items-center gap-1.5">
                                    <Square className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium">{property.sqft.toLocaleString()} sqft</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Viewing Requests — sourced from /landlord viewings API, not recentActivity */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Viewing Requests</h2>
                  <p className="text-gray-600">Tenants requesting to view your properties</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/landlord/viewings">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/landlord/properties">
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      Manage Properties
                    </Button>
                  </Link>
                </div>
              </div>

              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {viewingsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                      ))}
                    </div>
                  ) : viewingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No active viewing requests</h3>
                      <p className="text-slate-600">Pending and confirmed requests from tenants will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {viewingRequests.slice(0, 3).map((request: any) => {
                        const isPending = request.status === 'pending'
                        const isConfirmed = request.status === 'confirmed'
                        const tenantName = request.tenant?.full_name || request.tenant?.first_name || 'Tenant'
                        const propertyTitle = request.property?.title || request.property_title || 'Your Property'
                        const viewingDate = request.preferred_date || request.scheduled_date || request.created_at
                        const viewingType = request.viewing_type
                          ? request.viewing_type.charAt(0) + request.viewing_type.slice(1).toLowerCase().replace('_', ' ')
                          : 'Physical'

                        return (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-slate-900 truncate">{tenantName}</h4>
                                {isConfirmed ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                                    <CheckCircle className="h-3 w-3 mr-1" />Confirmed
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                                    <AlertCircle className="h-3 w-3 mr-1" />Pending
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-slate-600 border-slate-300 text-xs">
                                  {viewingType}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-700 font-medium mb-1 truncate">{propertyTitle}</p>
                              <p className="text-sm text-slate-600 flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                {viewingDate ? formatDate(viewingDate) : 'Date TBD'}
                              </p>
                            </div>
                            <Link href="/landlord/viewings" className="ml-3 flex-shrink-0">
                              <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                                <Eye className="h-4 w-4 mr-1" />Review
                              </Button>
                            </Link>
                          </div>
                        )
                      })}
                      {viewingRequests.length > 3 && (
                        <Link href="/landlord/viewings">
                          <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                            View all {viewingRequests.length} requests <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Applications Section — Track tenant applications */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Tenant Applications</h2>
                  <p className="text-gray-600">Applications from tenants interested in your properties</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/landlord/applications">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/landlord/properties">
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      Manage Properties
                    </Button>
                  </Link>
                </div>
              </div>

              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {applicationsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                      ))}
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications yet</h3>
                      <p className="text-slate-600">Tenants will submit applications when they're interested in your properties</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.slice(0, 3).map((application) => {
                        const tenantName = application.user?.full_name || 'Tenant'
                        const propertyTitle = application.property?.title || 'Property'
                        const propertyLocation = application.property?.location || 'Location not specified'
                        
                        return (
                          <div
                            key={application.id}
                            className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-semibold text-slate-900 truncate">{tenantName}</h4>
                                {application.status === 'approved' && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                                    <CheckCircle className="h-3 w-3 mr-1" />Approved
                                  </Badge>
                                )}
                                {application.status === 'pending' && (
                                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                                    <AlertCircle className="h-3 w-3 mr-1" />Pending
                                  </Badge>
                                )}
                                {application.status === 'rejected' && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold">
                                    <X className="h-3 w-3 mr-1" />Rejected
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-700 font-medium mb-1 truncate">{propertyTitle}</p>
                              <p className="text-sm text-slate-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                {propertyLocation}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                <span>Applied: {formatDate(application.created_at)}</span>
                                {application.viewed_by_landlord && (
                                  <span className="text-green-600">
                                    <Eye className="h-3 w-3 inline mr-1" />
                                    Viewed
                                  </span>
                                )}
                              </div>
                            </div>
                            <Link href={`/landlord/applications/${application.id}`} className="ml-3 flex-shrink-0">
                              <Button variant="outline" size="sm" className="border-green-300 text-green-600 hover:bg-green-50">
                                <Eye className="h-4 w-4 mr-1" />Review
                              </Button>
                            </Link>
                          </div>
                        )
                      })}
                      {applications.length > 3 && (
                        <Link href="/landlord/applications">
                          <Button variant="outline" size="sm" className="w-full border-green-300 text-green-600 hover:bg-green-50">
                            View all {applications.length} applications <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Onboarding Progress — only when incomplete */}
            {onboarding && !hasCompletedOnboarding && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Onboarding Progress</h2>
                    <p className="text-gray-600">Complete all steps to get verified and list properties</p>
                  </div>
                  <Link href="/landlord/onboarding">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      Continue <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">Step {onboarding.current_step} of 4</span>
                        <span className="text-sm font-bold text-orange-600">{Math.round(getOnboardingProgress(onboarding))}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${getOnboardingProgress(onboarding)}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-600">
                        Complete all steps to unlock property listing and receive tenant applications.
                      </p>
                      <Link href="/landlord/onboarding">
                        <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                          <Upload className="mr-2 h-4 w-4" />Continue Onboarding
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

 

          </div>

          {/* Sidebar 1/4 — same as tenant */}
          <div className="space-y-6">

            {/* Notifications — exact same card as tenant sidebar */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-orange-500 text-white animate-pulse">{unreadCount}</Badge>
                )}
              </div>

              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  {(!notifications || notifications.length === 0) ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">No notifications</h3>
                      <p className="text-xs text-slate-600">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {notifications.slice(0, 5).map((notification: Notification) => (
                        <div
                          key={notification.id}
                          className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              {notification.type === 'viewing_requested'    && <Calendar      className="h-4 w-4 text-orange-600" />}
                              {notification.type === 'viewing_confirmed'    && <CheckCircle   className="h-4 w-4 text-green-600"  />}
                              {notification.type === 'application_received' && <FileText      className="h-4 w-4 text-purple-600" />}
                              {notification.type === 'message'              && <MessageSquare className="h-4 w-4 text-blue-600"   />}
                              {notification.type === 'email_verified'       && <CheckCircle   className="h-4 w-4 text-green-600"  />}
                              {notification.type === 'system'               && <Bell          className="h-4 w-4 text-slate-600"  />}
                              {(!notification.type || !['viewing_requested','viewing_confirmed','application_received','message','email_verified','system'].includes(notification.type)) && (
                                <Bell className="h-4 w-4 text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">{notification.title}</p>
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 mb-2">{notification.message}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(notification.created_at).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications && notifications.length > 5 && (
                        <Link href="/landlord/notifications">
                          <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                            View All Notifications
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Recent Messages — exact same card as tenant sidebar */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent Messages</h3>
                <Link href="/landlord/messages">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    View All
                  </Button>
                </Link>
              </div>

              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  {recentMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">No messages yet</h3>
                      <p className="text-xs text-slate-600">Messages from tenants will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentMessages.slice(0, 3).map((msg: any) => (
                        <Link key={msg.id} href="/landlord/messages">
                          <div className="p-3 rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-300 cursor-pointer">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {msg.title || 'Tenant'}
                              </p>
                              {msg.unread && (
                                <Badge className="bg-green-500 text-white text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {msg.description || 'No preview available'}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <Link href="/landlord/messages">
                        <Button variant="outline" size="sm" className="w-full border-green-300 text-green-600 hover:bg-green-50">
                          View All Messages
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

           {/* Quick Actions — exact same card as tenant */}
            <Card className="border-2 border-slate-200 rounded-2xl shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-200 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-orange-700" />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {isVerified ? (
                    <>
                      <Link href="/landlord/properties/new">
                        <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                          <Plus className="mr-2 h-4 w-4" />Add New Property
                        </Button>
                      </Link>
                      <Link href="/landlord/properties">
                        <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                          <Building2 className="mr-2 h-4 w-4" />Manage Properties
                        </Button>
                      </Link>
                      <Link href="/landlord/viewings">
                        <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                          <Calendar className="mr-2 h-4 w-4" />Review Viewings
                        </Button>
                      </Link>
                      <Link href="/landlord/applications">
                        <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                          <FileText className="mr-2 h-4 w-4" />Applications
                        </Button>
                      </Link>
                      <Link href="/landlord/messages">
                        <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                          <MessageSquare className="mr-2 h-4 w-4" />Messages
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/landlord/onboarding">
                        <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                          <Upload className="mr-2 h-4 w-4" />Complete Onboarding
                        </Button>
                      </Link>
                      <Link href="/landlord/profile">
                        <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                          <User className="mr-2 h-4 w-4" />Update Profile
                        </Button>
                      </Link>
                      <Link href="/landlord/messages">
                        <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                          <MessageSquare className="mr-2 h-4 w-4" />Messages
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity — exact same card as tenant */}
            <Card className="border-2 border-slate-200 rounded-2xl shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900">Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {(recentActivity ?? []).length === 0 ? (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-6 w-6 bg-slate-100 rounded-full flex items-center justify-center">
                        <Activity className="h-3 w-3 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 font-medium">No activity yet</p>
                        <p className="text-slate-600 text-xs">Activity from your listings will appear here</p>
                      </div>
                    </div>
                  ) : (recentActivity ?? []).slice(0, 4).map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3 text-sm">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'viewing_request' ? 'bg-blue-100'
                        : activity.type === 'application'   ? 'bg-green-100'
                        : activity.type === 'message'       ? 'bg-purple-100'
                        : 'bg-slate-100'
                      }`}>
                        {activity.type === 'viewing_request' && <Calendar      className="h-3 w-3 text-blue-600"   />}
                        {activity.type === 'application'     && <FileText      className="h-3 w-3 text-green-600"  />}
                        {activity.type === 'message'         && <MessageSquare className="h-3 w-3 text-purple-600" />}
                        {!['viewing_request','application','message'].includes(activity.type) && (
                          <Activity className="h-3 w-3 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 font-medium">{activity.title}</p>
                        <p className="text-slate-600 text-xs">{formatDate(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
  )
}