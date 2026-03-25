"use client"



import { useState, useEffect, useMemo, useCallback,useRef } from "react"

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

import { viewingRequestsAPI as landlordViewingRequestsAPI } from "@/lib/api/viewingRequestsLandlord"

import { applicationsAPI, type Application } from "@/lib/api/applications"

import { agreementsAPI } from "@/lib/api/agreements"

import { paymentsAPI } from "@/lib/api/payments"

import { engagementAPI, getEngagementLevelColor, getEngagementLevelTextColor, getEngagementLevelBgColor, getTrustScoreColor, getTrustScoreTextColor, getTrustScoreBgColor, trackEngagement } from "@/lib/api/engagement"



const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'



export default function LandlordDashboard() {

  const router = useRouter()

  const pathname = usePathname()

  const { user, userProfile, userTypeConfirmed, refreshUserData, setUser } = useAuth()

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

  // Track notification IDs we've already acted on so the approval watcher
  // never fires more than once per unique notification.
  const processedNotifIds = useRef<Set<string>>(new Set())

  const [viewingRequests, setViewingRequests] = useState<any[]>([])

  const [viewingsLoading, setViewingsLoading] = useState(true)

  const [applications, setApplications] = useState<Application[]>([])

  const [applicationsLoading, setApplicationsLoading] = useState(true)

  const [engagementMetrics, setEngagementMetrics] = useState<any>(null)

  const [agreements, setAgreements] = useState<any[]>([])

  const [agreementsLoading, setAgreementsLoading] = useState(true)

  const [receivedPayments, setReceivedPayments] = useState<any[]>([])

  const [paymentsLoading, setPaymentsLoading] = useState(true)

  // Track dismissed payment confirmation banners by payment ID
  const [dismissedPaymentBanners, setDismissedPaymentBanners] = useState<string[]>([])
  
  // Track dismissed viewing request banners
  const [dismissedViewingBanner, setDismissedViewingBanner] = useState(false)

  // Track dismissed message banners with 30-minute auto-dismiss
  const [dismissedMessageBanners, setDismissedMessageBanners] = useState<string[]>([])



  // Handle dashboard refresh

  const handleRefresh = useCallback(async () => {

    if (!user?.id || isRefreshing) return

    setIsRefreshing(true)

    try {

      invalidateLandlordCache?.()

      await fetchLandlordDashboard(true)

      toast.success("Dashboard refreshed")

    } catch {

      toast.error("Failed to refresh dashboard")

    } finally {

      setIsRefreshing(false)

    }

  }, [user?.id, isRefreshing, invalidateLandlordCache, fetchLandlordDashboard])



  // ─── Auto-detect approval via notifications ────────────────────────────────
  // Watches the notifications array for an approval notification that has NOT
  // been processed yet. Uses processedNotifIds ref to ensure each notification
  // only triggers one refresh — prevents the infinite re-fetch loop that occurs
  // when the watcher fires on every poll because it sees the same old notification.
  useEffect(() => {
    if (!notifications || !user?.id) return
    if (user.verification_status === 'approved') return // already up to date

    const approvalNotif = notifications.find((n: any) => {
      // Already handled this one
      if (processedNotifIds.current.has(n.id)) return false

      return (
        n.type === 'onboarding_approved' ||
        n.type === 'verification_approved' ||
        (typeof n.title === 'string' && n.title.toLowerCase().includes('verified')) ||
        (typeof n.message === 'string' && n.message.toLowerCase().includes('verified'))
      )
    })

    if (approvalNotif) {
      // Mark as processed immediately so subsequent polls don't re-trigger
      processedNotifIds.current.add(approvalNotif.id)
      console.log('[OVERVIEW] New approval notification detected — optimistic update + DB refresh')

      // ✅ Flip the banner IMMEDIATELY based on the notification — no DB roundtrip needed
      if (user) setUser({ ...user, verification_status: 'approved' })

      // Then confirm with a fresh DB fetch + force-reload dashboard data
      refreshUserData?.().then(() => {
        invalidateLandlordCache?.()
        fetchLandlordDashboard(true)
      })
    }
  }, [notifications, user?.verification_status, user?.id, setUser, refreshUserData, invalidateLandlordCache, fetchLandlordDashboard])



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



  // Calculate agreement stats from fetched data

  const agreementStats = useMemo(() => {

    const totalCount = agreements.length

    const fullySignedCount = agreements.filter(a => a.status === 'SIGNED' || a.status === 'ACTIVE').length

    const pendingCount = agreements.filter(a => a.status === 'PENDING_LANDLORD' || a.status === 'PENDING_TENANT').length

    return { totalCount, fullySignedCount, pendingCount }

  }, [agreements])

  // Calculate total payments collected — updates in real-time as payments come in
  const totalPaymentsCollected = useMemo(() => {

    return receivedPayments

      .filter((p: any) => p.status === 'released')

      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  }, [receivedPayments])



  const handleNotificationClick = useCallback(async (notification: Notification) => {

    if (!notification.read) {

      try {

        await landlordDashboardAPI.markNotificationRead(notification.id)

        invalidateLandlordCache()

      } catch {}

    }

    if (notification.link) router.push(notification.link)

  }, [invalidateLandlordCache, router])

  // Restore dismissed message banners from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('dismissed-message-banners')
    if (stored) {
      setDismissedMessageBanners(JSON.parse(stored))
    }
  }, [])

  // Auto-expire message banner dismissals after 30 minutes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const thirtyMinutes = 30 * 60 * 1000
    const interval = setInterval(() => {
      setDismissedMessageBanners(prev => {
        const now = Date.now()
        const filtered = prev.filter(id => {
          const timestamp = parseInt(localStorage.getItem(`message-banner-${id}`) || '0')
          return now - timestamp < thirtyMinutes
        })
        if (filtered.length !== prev.length) {
          localStorage.setItem('dismissed-message-banners', JSON.stringify(filtered))
        }
        return filtered
      })
    }, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return

    if (!user) return

    console.log(' [OVERVIEW] User data check:', {
      user_type: user?.user_type,
      verification_status: user?.verification_status
    })

    if (user.user_type === 'landlord') {
      // Fetch dashboard immediately — do not wait for userTypeConfirmed
      if (!landlordData) {
        fetchLandlordDashboard()
      }
    } else if (userTypeConfirmed) {
      // Only redirect AFTER DB has confirmed this is genuinely not a landlord.
      // Without this guard, a landlord with stale JWT gets kicked to '/'
      // before the background DB fetch corrects user_type.
      router.push('/')
      toast.error('Access denied. Landlord access required.')
    }
    // If user_type !== 'landlord' AND !userTypeConfirmed: wait silently

  }, [mounted, user, userTypeConfirmed, landlordData, fetchLandlordDashboard, router])



  // Fetch viewing requests once landlordData is available.

  // First check if data is in cache, otherwise fetch separately

  useEffect(() => {

    if (!landlordData) return

    

    const fetchViewings = async () => {

      try {

        // 💾 CHECK CACHE FIRST: Use cached data if available

        if (landlordData.viewingRequests && landlordData.viewingRequests.length > 0) {

          console.log('📦 [OVERVIEW] Using cached viewing requests')

          setViewingRequests(landlordData.viewingRequests.filter((v: any) => v.status === 'pending' || v.status === 'confirmed'))

          setViewingsLoading(false)

          return

        }



        // 🔄 FALLBACK: Fetch separately if not in cache

        console.log('🔄 [OVERVIEW] Fetching viewing requests from API...')

        setViewingsLoading(true)

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

        console.error('❌ Failed to fetch viewings for overview:', err)

        setViewingRequests([])

      } finally {

        setViewingsLoading(false)

      }

    }

    fetchViewings()

  }, [landlordData])



  // Fetch landlord applications (from tenant applicants)

  // First check if data is in cache, otherwise fetch separately

  useEffect(() => {

    if (!landlordData) return

    

    const fetchApplications = async () => {

      try {

        // 💾 CHECK CACHE FIRST: Use cached data if available

        if (landlordData.receivedApplications && landlordData.receivedApplications.length > 0) {

          console.log('📦 [OVERVIEW] Using cached received applications')

          setApplications(landlordData.receivedApplications as any[])

          setApplicationsLoading(false)

          return

        }



        // 🔄 FALLBACK: Fetch separately if not in cache

        console.log('🔄 [OVERVIEW] Fetching applications from API...')

        setApplicationsLoading(true)

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

        console.error('❌ Failed to fetch applications for overview:', err)

        setApplications([])

      } finally {

        setApplicationsLoading(false)

      }

    }

    fetchApplications()

  }, [landlordData])



  // Fetch landlord agreements

  // First check if data is in cache, otherwise fetch separately

  useEffect(() => {

    if (!landlordData) return

    

    const fetchAgreements = async () => {

      try {

        // 💾 CHECK CACHE FIRST: Use cached data if available

        if (landlordData.agreements && landlordData.agreements.length > 0) {

          console.log('📦 [OVERVIEW] Using cached agreements')

          setAgreements(landlordData.agreements)

          setAgreementsLoading(false)

          return

        }



        // 🔄 FALLBACK: Fetch separately if not in cache

        console.log('🔄 [OVERVIEW] Fetching agreements from API...')

        setAgreementsLoading(true)

        const data = await agreementsAPI.getMyAgreements()

        // Handle array or wrapped response

        const list: any[] = Array.isArray(data)

          ? data

          : Array.isArray((data as any)?.agreements)

          ? (data as any).agreements

          : Array.isArray((data as any)?.data)

          ? (data as any).data

          : []

        // Show all agreements with relevant statuses

        const filtered = list.filter((agreement: any) => 

          ['ACTIVE', 'SIGNED', 'PENDING_LANDLORD', 'PENDING_TENANT', 'EXPIRED'].includes(agreement.status)

        )

        setAgreements(filtered)

      } catch (err) {

        console.error('❌ Failed to fetch agreements for overview:', err)

        setAgreements([])

      } finally {

        setAgreementsLoading(false)

      }

    }

    fetchAgreements()

  }, [landlordData])



  // Fetch engagement metrics

  // First check if data is in cache, otherwise fetch separately

  useEffect(() => {

    if (!user?.id) return

    

    const fetchEngagementMetrics = async () => {

      try {

        // 💾 CHECK CACHE FIRST: Use cached data if available

        if (landlordData?.engagementMetrics) {

          console.log('📦 [OVERVIEW] Using cached engagement metrics')

          setEngagementMetrics(landlordData.engagementMetrics)

          return

        }



        // 🔄 FALLBACK: Fetch separately if not in cache

        console.log('🔄 [OVERVIEW] Fetching engagement metrics from API...')

        const engagementData = await engagementAPI.getEngagementMetrics(user.id)

        setEngagementMetrics(engagementData)

      } catch (error) {

        console.error('❌ Failed to fetch engagement metrics:', error)

      }

    }

    

    fetchEngagementMetrics()

  }, [user?.id, landlordData?.engagementMetrics])



  // Fetch received payments — check cache first, then fetch fresh data
  // Then poll every 10s while rendered to catch new payments in real-time
  useEffect(() => {
    if (!user?.id) return

    const fetchPayments = async () => {
      try {
        // 💾 CHECK CACHE FIRST: Use cached data if available + recent
        if (landlordData?.receivedPayments && landlordData.receivedPayments.length > 0) {
          console.log('📦 [OVERVIEW] Using cached received payments')
          setReceivedPayments(landlordData.receivedPayments as any[])
          setPaymentsLoading(false)
          return
        }

        // 🔄 FALLBACK: Fetch fresh data
        console.log('🔄 [OVERVIEW] Fetching received payments from API...')
        setPaymentsLoading(true)
        const data = await paymentsAPI.getReceivedPayments()
        setReceivedPayments(data.payments || [])
      } catch (error) {
        console.error('❌ Failed to fetch payments:', error)
        setReceivedPayments([])
      } finally {
        setPaymentsLoading(false)
      }
    }

    fetchPayments()
  }, [user?.id, landlordData?.receivedPayments])

  // Real-time payment polling: Check for new payments every 5 seconds
  // This ensures the "Rent Payment Confirmed" banner appears quickly without page refresh
  useEffect(() => {
    if (!user?.id || paymentsLoading) return

    const pollInterval = setInterval(async () => {
      try {
        const data = await paymentsAPI.getReceivedPayments()
        const freshPayments = data.payments || []
        
        // Check if there are new recently-released payments
        const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
        const hasNewPayment = freshPayments.some((p: any) =>
          p.status === 'released' && new Date(p.released_at ?? p.created_at).getTime() > fortyEightHoursAgo
        )
        
        // Only update if there's new data (prevents unnecessary re-renders)
        if (hasNewPayment || freshPayments.length !== receivedPayments.length) {
          console.log('💰 [OVERVIEW] New payments detected, updating...')
          setReceivedPayments(freshPayments)
        }
      } catch (error) {
        console.warn('⚠️ Payment polling failed, will retry', error)
      }
    }, 5000) // Poll every 5 seconds for faster detection

    return () => clearInterval(pollInterval)
  }, [user?.id, paymentsLoading, receivedPayments.length])



  // Calculate payment amounts by type

  const totalRentAmount = useMemo(() => {

    return receivedPayments

      .filter(p => p.status === 'released' && p.transaction_type === 'rent_payment')

      .reduce((sum, p) => sum + (p.amount || 0), 0)

  }, [receivedPayments])



  const totalSecurityDeposits = useMemo(() => {

    return receivedPayments

      .filter(p => p.status === 'released' && p.transaction_type === 'security_deposit')

      .reduce((sum, p) => sum + (p.amount || 0), 0)

  }, [receivedPayments])



  const totalReceivedAmount = useMemo(() => {

    return totalRentAmount + totalSecurityDeposits

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



  // Memoize viewing requests list to prevent unnecessary re-renders

  const viewingRequestsList = useMemo(() => viewingRequests, [viewingRequests])



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

    if (landlordData?.onboarding?.all_steps_completed && landlordData?.onboarding?.submitted_for_review && landlordData?.profile && user?.verification_status !== 'approved') {

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

    if (landlordData?.profile && user?.verification_status === 'approved' && landlordData?.stats?.total_properties === 0) {

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

    if (!paymentsLoading && receivedPayments.length > 0) {

      const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000

      const recentPayment = receivedPayments.find((p: any) =>
        p.status === 'released' && new Date(p.released_at ?? p.created_at).getTime() > fortyEightHoursAgo
      )

      // Only show banner if payment exists and hasn't been dismissed
      if (recentPayment && !dismissedPaymentBanners.includes(recentPayment.id)) {

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

                    {recentPayment.tenant_id && (

                      <Link href={`/landlord/messages?tenant=${recentPayment.tenant_id}`}>

                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">

                          <Mail className="h-4 w-4 mr-2" />Message {tenantName.split(' ')[0]}

                        </Button>

                      </Link>

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

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setDismissedPaymentBanners(prev => [...prev, recentPayment.id])
                    }}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    title="Dismiss this notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <Badge className="bg-green-100 text-green-800 border-green-300">New</Badge>
                </div>

              </div>

            </CardContent>

          </Card>

        )

      }

    }

    // ── State 5: CONSOLIDATED into "Rent Payment Confirmed" banner above ────
    // Previously: "New Active Tenancy" banner for ACTIVE agreements
    // Now: Payment confirmation banner handles move-in coordination (more important workflow)
    // This reduces UI clutter and focuses on the revenue event that triggers move-in actions



    // ── State 6: Pending viewing requests ─────────────────────────────────────

    if (!dismissedViewingBanner && viewingRequestsList.filter((v: any) => v.status === 'pending').length > 0) {

      const pendingViewings = viewingRequestsList.filter((v: any) => v.status === 'pending').length

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

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setDismissedViewingBanner(true)
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Dismiss this notification"
                >
                  <X className="h-4 w-4" />
                </button>
                <Badge className="bg-blue-100 text-blue-800">{pendingViewings} Pending</Badge>
              </div>

            </div>

          </CardContent>

        </Card>

      )

    }



    return null

  }, [landlordData, viewingRequestsList, receivedPayments, paymentsLoading, agreements, agreementsLoading, user?.verification_status])



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



  // Read verification status from fresh user data (not cached profile data).
  // This ensures banner updates immediately after admin approval.
  const isVerified = user?.verification_status === 'approved'




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

        {/* Messages Banner — Task-based (auto-dismiss after 30 min) */}
        {stats.unread_messages > 0 && !dismissedMessageBanners.includes('unread-messages') && (
          <div className="mb-8 p-5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Mail className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-1">New Messages</h3>
                  <p className="text-purple-700 text-sm mb-3">
                    You have <span className="font-bold">{stats.unread_messages}</span> unread message{stats.unread_messages > 1 ? 's' : ''} from tenant{stats.unread_messages > 1 ? 's' : ''}.
                  </p>
                  <Link href="/landlord/messages">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Messages
                    </Button>
                  </Link>
                </div>
              </div>
              <button
                onClick={() => {
                  setDismissedMessageBanners(prev => [...prev, 'unread-messages'])
                  localStorage.setItem(`message-banner-unread-messages`, Date.now().toString())
                  localStorage.setItem('dismissed-message-banners', JSON.stringify([...dismissedMessageBanners, 'unread-messages']))
                }}
                className="text-purple-600 hover:text-purple-900 flex-shrink-0 mt-0.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

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

                        {totalReceivedAmount === 0 && totalPendingAmount === 0 && !paymentsLoading && (

                          <span className="text-xs text-slate-400">no payments yet</span>

                        )}

                        {paymentsLoading && (

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

                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">

                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />

                    </div>

                    <div className="flex-1 min-w-0">

                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Unread Messages</p>

                      <p className="text-xl sm:text-3xl font-bold text-slate-900 truncate">{stats.unread_messages}</p>

                      <div className="flex items-center gap-1 mt-1">

                        {stats.unread_messages > 0 && (

                          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block">

                            {stats.unread_messages} unread

                          </span>

                        )}

                        {stats.unread_messages === 0 && (

                          <span className="text-xs text-slate-400">all read</span>

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

                {agreementsLoading ? (

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

                            {agreement.start_date && (

                              <span>From: {formatDate(agreement.start_date)}</span>

                            )}

                            {agreement.end_date && (

                              <span>Until: {formatDate(agreement.end_date)}</span>

                            )}

                            {agreement.monthly_rent && (

                              <span className="text-orange-600 font-semibold">{formatCurrency(agreement.monthly_rent)}/mo</span>

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

