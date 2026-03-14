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
  Upload, User, Zap, Award, Target, TrendingUp, Mail, X,
  FileCheck, AlertTriangle, Loader2, RefreshCw
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
import { messagesAPI } from "@/lib/api/messages"
import { paymentsAPI } from "@/lib/api/payments"
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [allDataLoading, setAllDataLoading] = useState(true)
  const [engagementMetrics, setEngagementMetrics] = useState<any>(null)
  const [receivedPayments, setReceivedPayments] = useState<any[]>([])

  // Handle dashboard refresh
  const handleRefresh = useCallback(async () => {
    if (!user?.id || isRefreshing) return
    setIsRefreshing(true)
    try {
      invalidateLandlordCache?.()
      await fetchLandlordDashboard()
      toast.success("Dashboard refreshed")
    } catch {
      toast.error("Failed to refresh dashboard")
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.id, isRefreshing, invalidateLandlordCache, fetchLandlordDashboard])

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

  // Secondary fetch: payments and engagement metrics.
  // Viewings, applications, agreements now come from landlordData
  // (bundled into the main /api/v1/landlord/dashboard response).
  useEffect(() => {
    if (!landlordData) return

    const fetchSecondaryData = async () => {
      try {
        setAllDataLoading(true)

        const [paymentsResult, engagementResult] = await Promise.allSettled([
          paymentsAPI.getReceivedPayments(),
          user?.id ? engagementAPI.getEngagementMetrics(user.id) : Promise.resolve(null)
        ])

        // Payments
        if (paymentsResult.status === 'fulfilled') {
          const data = paymentsResult.value
          const list = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.payments)
            ? (data as any).payments
            : Array.isArray((data as any)?.data)
            ? (data as any).data
            : []
          setReceivedPayments(list)
        }

        // Engagement
        if (engagementResult.status === 'fulfilled') {
          setEngagementMetrics(engagementResult.value)
        }

      } catch (err) {
        console.error('Failed to fetch secondary data:', err)
      } finally {
        setAllDataLoading(false)
      }
    }

    fetchSecondaryData()
  }, [landlordData, user?.id])

  // Calculate payment amounts by type
  const totalRentAmount = useMemo(() => {
    const rentPayments = receivedPayments.filter(p => p.status === 'released' && p.transaction_type === 'rent_payment')
    console.log('🔍 [DEBUG] Rent payments:', rentPayments)
    return rentPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  }, [receivedPayments])

  const totalSecurityDeposits = useMemo(() => {
    const depositPayments = receivedPayments.filter(p => p.status === 'released' && p.transaction_type === 'security_deposit')
    console.log('🔍 [DEBUG] Deposit payments:', depositPayments)
    return depositPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  }, [receivedPayments])

  const totalReceivedAmount = useMemo(() => {
    const total = totalRentAmount + totalSecurityDeposits
    console.log('🔍 [DEBUG] Total calculated:', total, 'Rent:', totalRentAmount, 'Deposits:', totalSecurityDeposits)
    return total
  }, [totalRentAmount, totalSecurityDeposits])

  // Calculate pending amount
  const totalPendingAmount = useMemo(() => {
    return receivedPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }, [receivedPayments])

  // ─── Helper Functions ───────────────────────────────────────────────────────────
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'viewing_requested':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'viewing_confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'application_received':
        return <FileText className="h-4 w-4 text-purple-600" />
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case 'email_verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'system':
        return <Bell className="h-4 w-4 text-slate-600" />
      default:
        return <Activity className="h-4 w-4 text-slate-600" />
    }
  }

  // Handle property-specific messaging - ensures each property has its own conversation thread
  const handleMessageTenant = useCallback(async (propertyId: string, tenantId: string, tenantName: string) => {
    if (!user?.id) return
    
    try {
      const existingConversation = await messagesAPI.findConversation(propertyId, tenantId)
      const conversationId = existingConversation ? existingConversation.id : await messagesAPI.createConversation({
        property_id: propertyId,
        landlord_id: user.id,
        tenant_id: tenantId,  
        initial_message: `Hi ${tenantName.split(' ')[0]}! Thanks for the payment. I'm here to help with any questions about the property or next steps.`
      }).then(result => result.conversation_id)
      
      router.push(`/landlord/messages?conversation=${conversationId}`)
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start conversation')
    }
  }, [user?.id, router])

  const getActivityTitle = (type: string, activity: any) => {
    switch (type) {
      case 'viewing_requested':
        return `Viewing Request from ${activity.tenant?.full_name || 'Tenant'}`
      case 'viewing_confirmed':
        return `Viewing Confirmed with ${activity.tenant?.full_name || 'Tenant'}`
      case 'application_received':
        return `Application from ${activity.tenant?.full_name || 'Tenant'}`
      case 'message':
        return `Message from ${activity.sender?.full_name || activity.tenant?.full_name || 'User'}`
      case 'email_verified':
        return 'Email Verified'
      case 'system':
        return activity.title || 'System Update'
      default:
        return activity.title || 'Activity'
    }
  }

  const getActivityDescription = (type: string, activity: any) => {
    switch (type) {
      case 'viewing_requested':
        return `Requested viewing for ${activity.property?.title || 'Property'}`
      case 'viewing_confirmed':
        return `Viewing confirmed for ${activity.property?.title || 'Property'}`
      case 'application_received':
        return `Applied to ${activity.property?.title || 'Property'}`
      case 'message':
        return activity.message || 'New message'
      case 'email_verified':
        return 'Email address verified successfully'
      case 'system':
        return activity.message || activity.title || 'System update'
      default:
        return activity.message || activity.title || 'Activity update'
    }
  }

  // These were previously fetched separately. They now come from landlordData
  // because the backend bundles them in the /dashboard response.
  // Handle both camelCase and snake_case keys for compatibility
  const viewingRequests: any[]  = landlordData?.viewingRequests 
                                 ?? (landlordData as any)?.viewing_requests 
                                 ?? []
  const applications: any[]     = landlordData?.receivedApplications 
                                 ?? (landlordData as any)?.received_applications 
                                 ?? []
  const agreements: any[]       = landlordData?.agreements ?? []

  // Calculate agreement stats from fetched data
  const agreementStats = useMemo(() => {
    const totalCount = agreements.length
    const fullySignedCount = agreements.filter(a => a.status === 'SIGNED' || a.status === 'ACTIVE').length
    const pendingCount = agreements.filter(a => a.status === 'PENDING_LANDLORD' || a.status === 'PENDING_TENANT').length
    return { totalCount, fullySignedCount, pendingCount }
  }, [agreements])

  // Memoize progressive banner to prevent unnecessary re-renders
  const progressiveBanner = useMemo(() => {
    // ── State 1: Onboarding incomplete ────────────────────────────────────────
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

    // ── State 2: Submitted + awaiting admin review ─────────────────────────────
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

    // ── State 3: Verified but no properties yet ────────────────────────────────
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

    // ── State 4: Payment received (within last 48 hours) ──────────────────────
    // Shown BEFORE the viewings banner so the landlord sees the post-payment
    // next steps immediately — not buried below other noise.
    // Window is 48h (not 5min) because landlords don't live on the dashboard.
    if (!allDataLoading && receivedPayments.length > 0) {
      const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
      const recentPayment = receivedPayments.find((p: any) =>
        p.status === 'released' && new Date(p.released_at ?? p.created_at).getTime() > fortyEightHoursAgo
      )

      if (recentPayment) {
        const tenantName = recentPayment.tenant?.full_name || 'your tenant'
        const propertyTitle = recentPayment.property?.title || 'your property'
        const isRent = recentPayment.transaction_type === 'rent_payment'
        const isDeposit = recentPayment.transaction_type === 'security_deposit'

        return (
          <Card className="mb-8 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-green-900">
                      {isRent ? 'Rent Payment Confirmed' : isDeposit ? 'Security Deposit Received' : 'Payment Confirmed'}
                    </h3>
                    <Badge className="bg-green-600 text-white border-0">
                      {formatCurrency(recentPayment.amount)}
                    </Badge>
                  </div>

                  <p className="text-green-800 text-sm mb-1">
                    <span className="font-semibold">{tenantName}</span> has paid for{' '}
                    <span className="font-semibold">{propertyTitle}</span>.
                    {isRent && ' Their tenancy agreement is now active.'}
                  </p>

                  {/* Next-step checklist */}
                  <div className="mt-3 mb-4 space-y-1.5">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Your next steps</p>
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <div className="h-5 w-5 rounded-full border-2 border-green-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-green-600">1</span>
                      </div>
                      <span>Message <span className="font-semibold">{tenantName}</span> to confirm move-in date and key handover</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <div className="h-5 w-5 rounded-full border-2 border-green-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-green-600">2</span>
                      </div>
                      <span>Review the signed agreement to confirm move-in date and terms</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <div className="h-5 w-5 rounded-full border-2 border-green-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-green-600">3</span>
                      </div>
                      <span>Prepare the property — ensure utilities, access, and keys are ready</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {recentPayment.tenant_id && recentPayment.property_id && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleMessageTenant(recentPayment.property_id, recentPayment.tenant_id, tenantName)}
                      >
                        <Mail className="h-4 w-4 mr-2" />Message {tenantName.split(' ')[0]}
                      </Button>
                    )}
                    <Link href="/landlord/agreements">
                      <Button size="sm" variant="outline" className="border-green-400 text-green-700 hover:bg-green-100">
                        <FileCheck className="h-4 w-4 mr-2" />View Agreement
                      </Button>
                    </Link>
                    <Link href="/landlord/payments">
                      <Button size="sm" variant="ghost" className="text-green-700 hover:bg-green-100">
                        <DollarSign className="h-4 w-4 mr-2" />Payment Details
                      </Button>
                    </Link>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-300 flex-shrink-0">New</Badge>
              </div>
            </CardContent>
          </Card>
        )
      }
    }

    // ── State 5: ACTIVE agreement — coordinate move-in (no very recent payment,
    //    but tenant is active and landlord may still need to action things)   ────
    // Show if there's an ACTIVE agreement whose status changed in the last 7 days
    // and the landlord hasn't sent a message to this tenant recently.
    // We use `agreement.updated_at` as a proxy for "recently activated".
    if (!allDataLoading && agreements.length > 0) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const newlyActiveAgreement = agreements.find((a: any) =>
        a.status === 'ACTIVE' && new Date(a.updated_at ?? a.created_at).getTime() > sevenDaysAgo
      )

      if (newlyActiveAgreement) {
        const tenantName = newlyActiveAgreement.tenant?.full_name || 'Your tenant'
        const propertyTitle = newlyActiveAgreement.property?.title || 'your property'
        const startDate = newlyActiveAgreement.lease_start_date
          ? new Date(newlyActiveAgreement.lease_start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
          : null

        return (
          <Card className="mb-8 border-emerald-200 bg-emerald-50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-emerald-900 mb-1">
                    New Active Tenancy — Coordinate Move-In
                  </h3>
                  <p className="text-emerald-800 text-sm mb-3">
                    <span className="font-semibold">{tenantName}</span> is now your active tenant at{' '}
                    <span className="font-semibold">{propertyTitle}</span>.
                    {startDate && <> Move-in date: <span className="font-semibold">{startDate}</span>.</>}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {newlyActiveAgreement.tenant_id && (
                      <Link href={`/landlord/messages?tenant=${newlyActiveAgreement.tenant_id}&property=${newlyActiveAgreement.property_id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          <Mail className="h-4 w-4 mr-2" />Welcome {tenantName} to {propertyTitle}
                        </Button>
                      </Link>
                    )}
                    <Link href={`/landlord/agreements/${newlyActiveAgreement.id}`}>
                      <Button size="sm" variant="outline" className="border-emerald-400 text-emerald-700 hover:bg-emerald-100">
                        <FileCheck className="h-4 w-4 mr-2" />View Agreement
                      </Button>
                    </Link>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex-shrink-0">Move-In</Badge>
              </div>
            </CardContent>
          </Card>
        )
      }
    }

    // ── State 6: Pending viewing requests ─────────────────────────────────────
    if (viewingRequests.filter((v: any) => v.status === 'pending').length > 0) {
      const pendingViewings = viewingRequests.filter((v: any) => v.status === 'pending').length
      return (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  You have {pendingViewings} viewing request{pendingViewings > 1 ? 's' : ''}
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
              <Badge className="bg-blue-100 text-blue-800">{pendingViewings} Pending</Badge>
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }, [landlordData, viewingRequests, receivedPayments, allDataLoading, agreements])

  // ─── Loading — same spinner as tenant ────────────────────────────────────────
  if (!mounted || loading || allDataLoading) {
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

  // Debug: Log the actual data we're receiving
  console.log('🔍 [DEBUG] Landlord Data Stats:', stats)
  console.log('🔍 [DEBUG] Stats total_conversations:', stats?.total_conversations)
  console.log('🔍 [DEBUG] Stats unread_messages:', stats?.unread_messages)

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
  // for the banner or stat card. Fall back to 0 while data is still loading to prevent flashing.
  const pendingCount = allDataLoading
    ? 0
    : viewingRequests.filter((v: any) => v.status === 'pending').length
  const confirmedCount = allDataLoading
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
              <Button variant="outline" size="lg"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={handleRefresh} disabled={isRefreshing} title="Refresh dashboard">
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
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

        {/* Stats — Responsive 4-card grid with improved text sizing */}
        <div className="mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Your Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Total Properties</p>
                    <p className="text-xl sm:text-3xl font-bold text-slate-900 truncate">{stats.total_properties}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Annual Revenue</p>
                    <p className="text-xl sm:text-3xl font-bold text-slate-900 truncate">{formatCurrency((stats.monthly_revenue || 0) * 12)}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 mt-1">
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full inline-block w-fit">
                        {formatCurrency(stats.monthly_revenue || 0)}/month
                      </span>
                      <span className="text-xs text-slate-500 truncate">
                        from {stats.total_properties} propert{stats.total_properties !== 1 ? 'ies' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/landlord/payments">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Total Collected</p>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900 truncate">{formatCurrency(totalReceivedAmount)}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {totalRentAmount > 0 && (
                          <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full inline-block">
                            {formatCurrency(totalRentAmount)} rent
                          </span>
                        )}
                        {totalSecurityDeposits > 0 && (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-block">
                            {formatCurrency(totalSecurityDeposits)} deposits
                          </span>
                        )}
                        {totalPendingAmount > 0 && (
                          <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full inline-block">
                            {formatCurrency(totalPendingAmount)} pending
                          </span>
                        )}
                        {totalReceivedAmount === 0 && totalPendingAmount === 0 && !allDataLoading && (
                          <span className="text-xs text-slate-400">no payments yet</span>
                        )}
                        {allDataLoading && (
                          <span className="text-xs text-slate-400">loading...</span>
                        )}
                        <span className="text-xs text-purple-600 group-hover:text-purple-700 hidden sm:inline">View breakdown →</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/landlord/viewings">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Viewings</p>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900 truncate">{pendingCount}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pendingCount > 0 && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block">
                            {pendingCount} pending
                          </span>
                        )}
                        {confirmedCount > 0 && (
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                            {confirmedCount} confirmed
                          </span>
                        )}
                        {pendingCount === 0 && confirmedCount === 0 && !allDataLoading && (
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
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Applications</p>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900 truncate">{applications.length}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {applications.filter(a => a.status === 'pending').length > 0 && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block">
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

            <Link href="/landlord/messages">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      {stats.unread_messages > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Messages</p>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900 truncate">
                        {stats.total_conversations ?? stats.unread_messages ?? 0}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full inline-block">
                          {stats.total_conversations ?? stats.unread_messages ?? 0} conversation{((stats.total_conversations ?? stats.unread_messages ?? 0) !== 1) ? 's' : ''}
                        </span>
                        {stats.unread_messages > 0 && (
                          <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full inline-block">
                            {stats.unread_messages} unread
                          </span>
                        )}
                        {stats.unread_messages === 0 && ((stats.total_conversations || 0) > 0) && (
                          <span className="text-xs text-slate-500">all read</span>
                        )}
                        {((stats.total_conversations || 0) === 0) && (stats.unread_messages === 0) && (
                          <span className="text-xs text-slate-400">no messages yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/landlord/agreements">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Agreements</p>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900 truncate">{agreementStats.totalCount}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agreementStats.fullySignedCount > 0 && (
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                            {agreementStats.fullySignedCount} signed
                          </span>
                        )}
                        {agreementStats.pendingCount > 0 && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                            {agreementStats.pendingCount} pending
                          </span>
                        )}
                        {agreementStats.totalCount === 0 && (
                          <span className="text-xs text-slate-400">none yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
                              {/* Status & Verification badges - top right */}
                              <div className="absolute top-3 right-3 flex flex-col gap-2">
                                {/* Rental Status Badge */}
                                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  property.status === 'rented' ? 'bg-red-500 text-white' 
                                  : property.status === 'vacant' ? 'bg-green-500 text-white'
                                  : 'bg-slate-500 text-white'
                                }`}>
                                  {property.status === 'rented' ? '🔒 Rented'
                                    : property.status === 'vacant' ? '✅ Available'
                                    : '⏳ Draft'}
                                </div>
                                {/* Verification badge */}
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
                  {allDataLoading ? (
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
                  {allDataLoading ? (
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

            {/* Agreements Management Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Agreements Management</h2>
                  <p className="text-gray-600">Track and manage all tenant rental agreements</p>
                </div>
                <Link href="/landlord/agreements">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                {allDataLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : agreements.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No agreements yet</h3>
                    <p className="text-slate-600">When tenants are approved for your properties, agreements will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agreements.slice(0, 3).map((agreement) => (
                      <div key={agreement.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-slate-900">{agreement.tenant?.full_name || 'Tenant'}</h4>
                            {agreement.status === 'ACTIVE' && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            {agreement.status === 'SIGNED' && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Fully Signed
                              </Badge>
                            )}
                            {agreement.status === 'PENDING_LANDLORD' && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-semibold">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Awaiting Your Signature
                              </Badge>
                            )}
                            {agreement.status === 'PENDING_TENANT' && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold">
                                <FileText className="h-3 w-3 mr-1" />
                                Tenant Signing
                              </Badge>
                            )}
                            {agreement.status === 'EXPIRED' && (
                              <Badge className="bg-slate-100 text-slate-800 border-slate-200 font-semibold">
                                Expired
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 flex items-center mb-2">
                            <Building2 className="h-3 w-3 mr-2 text-orange-500" />
                            {agreement.property?.title || 'Property'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            {agreement.lease_start_date && (
                              <span>From: {formatDate(agreement.lease_start_date)}</span>
                            )}
                            {agreement.lease_end_date && (
                              <span>Until: {formatDate(agreement.lease_end_date)}</span>
                            )}
                            {agreement.rent_amount && (
                              <span className="text-orange-600 font-semibold">{formatCurrency(agreement.rent_amount)}/mo</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Link href={`/landlord/agreements/${agreement.id}`} className="ml-3 flex-shrink-0">
                            <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs gap-1.5">
                              <Eye className="h-3.5 w-3.5" />View Agreement
                            </Button>
                          </Link>
                          {agreement.status === 'PENDING_LANDLORD' && (
                            <Link href={`/landlord/agreements/${agreement.id}/sign`} className="ml-3 flex-shrink-0">
                              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs gap-1.5">
                                <FileCheck className="h-3.5 w-3.5" />Sign Now
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                    {agreements.length > 3 && (
                      <Link href="/landlord/agreements">
                        <Button variant="outline" size="sm" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
                          View all {agreements.length} agreements <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
                </CardContent>
              </Card>
            </section>

            {/* Property Maintenance — for rented properties */}
            {properties?.some((p: any) => p.status === 'rented') && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Maintenance</h2>
                    <p className="text-gray-600">Track maintenance status for your rented properties</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/landlord/maintenance">
                      <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                        Manage Maintenance <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />New Request
                    </Button>
                  </div>
                </div>

                <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {properties?.filter((p: any) => p.status === 'rented').slice(0, 3).map((property: any) => (
                        <div key={property.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4 className="font-semibold text-slate-900 truncate">{property.title}</h4>
                              <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold">
                                <AlertCircle className="h-3 w-3 mr-1" />Rented
                              </Badge>
                              <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />Good Condition
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 flex items-center mb-2">
                              <MapPin className="h-3 w-3 mr-2 text-orange-500" />
                              {property.city}, {property.state}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>Tenant: {property.current_tenant?.full_name || 'Active Tenant'}</span>
                              {property.lease_end && (
                                <span>Lease ends: {formatDate(property.lease_end)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Link href={`/landlord/properties/${property.id}/maintenance`} className="flex-shrink-0">
                              <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs gap-1.5">
                                <Settings className="h-3.5 w-3.5" />Maintenance
                              </Button>
                            </Link>
                            <Link href={`/landlord/properties/${property.id}/inspection`} className="flex-shrink-0">
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 text-xs gap-1.5">
                                <Eye className="h-3.5 w-3.5" />Inspect
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span>Good Condition</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                            <span>Needs Attention</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                            <span>Urgent</span>
                          </div>
                        </div>
                        <Link href="/landlord/maintenance">
                          <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                            View All Maintenance <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

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
                      <Link href="/landlord/payments">
                        <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                          <DollarSign className="mr-2 h-4 w-4" />Payment History
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
                  ) : (
                    recentActivity?.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 mb-1">{getActivityTitle(activity.type, activity)}</p>
                          <p className="text-xs text-slate-600 mb-2">{getActivityDescription(activity.type, activity)}</p>
                          <p className="text-xs text-slate-400">{formatDate(activity.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}