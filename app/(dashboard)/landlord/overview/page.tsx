"use client"



import { useState, useEffect, useMemo, useCallback,useRef } from "react"

import { useRouter, usePathname } from "next/navigation"

import { useAuth } from "@/contexts/AuthContext"

import { useLandlordDashboard } from "@/contexts/DashboardContext"

import { useNotifications } from "@/contexts/NotificationContext"

import { Notification } from "@/contexts/NotificationContext"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { PropertyLifecycleBadge } from "@/components/ui/verification-badge"
import { PropertyCard } from "@/components/landlord/PropertyCard"
import {
  Building2, Calendar, MessageSquare, DollarSign,
  Eye, Plus, MapPin, Bed, Bath, Square,
  ArrowRight, AlertCircle, CheckCircle, CheckCircle2,
  Bell, Settings, Activity, FileText,
  Upload, User, Zap, Award, Target, TrendingUp, Mail, X,
  FileCheck, AlertTriangle, Loader2, RefreshCw, Wallet, Banknote
} from "lucide-react"

import Link from "next/link"

import { toast } from "sonner"

import landlordDashboardAPI, {

  LandlordProfile,

  LandlordOnboarding,

  LandlordStats,

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
import { isBannerDismissed, dismissBanner, buildBannerKey } from "@/lib/bannerStorage"



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

  // ✅ FIX: Tracks whether the initial landlord-dashboard fetch has been
  // attempted at least once. Prevents the flash of "Could not load dashboard"
  // error UI that happens between `mounted=true` and the data-fetch effect
  // setting `loading=true` (a one-render gap where mounted=true, loading=false,
  // landlordData=null fell through to the error branch).
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)

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

  // ✅ Banner dismissals use synchronous localStorage via bannerStorage utility.
  // No React state needed — the utility reads/writes localStorage directly
  // and works the same way on hard refresh, new session, or different page.
  // See lib/bannerStorage.ts.



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

      // ✅ FIXED: Only check type, not title/message to avoid duplicate matches
      // The notification service creates notifications with type='onboarding_approved'
      // Checking both type AND text content was causing the same notification
      // to match multiple conditions
      return (
        n.type === 'onboarding_approved' ||
        n.type === 'verification_approved'
      )
    })

    if (approvalNotif) {
      // Mark as processed immediately so subsequent polls don't re-trigger
      processedNotifIds.current.add(approvalNotif.id)
      console.log('[OVERVIEW] ✅ New approval notification detected — optimistic update + DB refresh')

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

  // Total Collected = ALL payments received (escrow + withdrawn combined)
  // This is the gross amount tenants have ever paid into the platform.
  const totalPaymentsCollected = useMemo(() => {
    return receivedPayments
      .filter((p: any) => p.reconciliation_status === 'FULL_PAYMENT')
      .reduce((sum: number, p: any) => sum + (p.total_received_amount || 0), 0)
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

  // ✅ Banner dismissal persistence handled by lib/bannerStorage.ts.
  // No useEffect needed — the utility reads localStorage synchronously.

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
        setHasFetchedOnce(false)
        fetchLandlordDashboard()
          .catch(() => { /* error handled in context */ })
          .finally(() => setHasFetchedOnce(true))
      } else {
        // We already have data (e.g., from cache or navigation) — mark as fetched
        setHasFetchedOnce(true)
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
          setViewingRequests(landlordData.viewingRequests.filter((v: any) => v.status === 'pending' || v.status === 'confirmed' || v.status === 'completed'))
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

        setViewingRequests(list.filter((v: any) => v.status === 'pending' || v.status === 'confirmed' || v.status === 'completed'))

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
        const data = await paymentsAPI.getReceivedPayments(50)
        setReceivedPayments(data.payments || [])
      } catch (error: any) {
        // Don't blank out receivedPayments on transient errors -- keep the last
        // known good data so the "Total Collected" card doesn't flicker to ₦0
        // during network glitches or 500 errors.
        const status = error?.response?.status
        if (status === 500) {
          console.warn('⚠️ [OVERVIEW] Failed to fetch payments (server hiccup 500), keeping previous data')
        } else if (status === 401) {
          console.warn('⚠️ [OVERVIEW] Failed to fetch payments (auth), keeping previous data')
        } else {
          console.warn('⚠️ [OVERVIEW] Failed to fetch payments, keeping previous data:', error?.message || error)
        }
        // Note: do NOT call setReceivedPayments([]) here on transient errors.
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
          p.disbursement_status === 'released' && new Date(p.released_at ?? p.updated_at ?? p.created_at).getTime() > fortyEightHoursAgo
        )

        // Only update if there's new data (prevents unnecessary re-renders)
        if (hasNewPayment || freshPayments.length !== receivedPayments.length) {
          console.log('💰 [OVERVIEW] New payments detected, updating...')
          setReceivedPayments(freshPayments)
        }
      } catch (error: any) {
        // Network glitch or server hiccup -- keep the previous payments data intact
        // and just log so we don't blank out the "Total Collected" stat card.
        // Suppress the noisy 500 in console -- we'll retry on next tick.
        const status = error?.response?.status
        if (status === 500) {
          console.warn('⚠️ [OVERVIEW] Payments polling: server hiccup (500), will retry in 5s')
        } else if (status === 401) {
          console.warn('⚠️ [OVERVIEW] Payments polling: auth expired, will retry')
        } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
          console.warn('⚠️ [OVERVIEW] Payments polling: timeout, will retry')
        } else {
          console.warn('⚠️ Payment polling failed, will retry', error?.message || error)
        }
        // Intentionally do NOT clear receivedPayments on transient errors
        // so the "Total Collected" card doesn't flicker between 0 and the real value.
      }
    }, 5000) // Poll every 5 seconds for faster detection

    return () => clearInterval(pollInterval)
  }, [user?.id, paymentsLoading, receivedPayments.length])



  // Calculate payment amounts by type

  const totalRentAmount = useMemo(() => {

    return receivedPayments

      .filter(p => p.disbursement_status === 'released' && p.reconciliation_status === 'FULL_PAYMENT')

      .reduce((sum, p) => sum + (p.total_received_amount || 0), 0)

  }, [receivedPayments])



  const totalSecurityDeposits = useMemo(() => {

    // Nomba flow doesn't separate transaction types - all payments are rent
    return 0

  }, [])



  const totalReceivedAmount = useMemo(() => {

    return totalRentAmount + totalSecurityDeposits

  }, [totalRentAmount, totalSecurityDeposits])



  // Calculate pending amount (escrow balance - funds held but not released)
  const totalPendingAmount = useMemo(() => {

    return receivedPayments

      .filter(p => p.reconciliation_status === 'FULL_PAYMENT' && p.disbursement_status !== 'released')

      .reduce((sum, p) => sum + (p.total_received_amount || 0), 0)

  }, [receivedPayments])

  // Calculate total withdrawn amount (funds released to landlord)
  const totalWithdrawnAmount = useMemo(() => {

    return receivedPayments

      .filter(p => p.disbursement_status === 'released' && p.reconciliation_status === 'FULL_PAYMENT')

      .reduce((sum, p) => sum + (p.total_received_amount || 0), 0)

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



  // Priority-based banner system for landlord dashboard
  // Priority order:
  // 1. Onboarding incomplete (blocks everything)
  // 2. Verification rejected (blocks everything)
  // 3. Verification pending (blocks everything)
  // 4. Pending landlord signature (action required)
  // 5. New applications (action required)
  // 6. Pending payments release (action required)
  // 7. Payment confirmed (informational, 48h window)
  // 8. Expiring lease reminder (informational)
  // 9. Pending viewing requests (informational)
  // 10. Verified but no properties (informational)

  const activeBanner = useMemo(() => {
    // Wait for landlordData to be loaded before showing any banner to prevent flashing!
    if (!landlordData) {
      return null
    }

    // Priority 1: Onboarding incomplete
    if (!landlordData?.onboarding?.all_steps_completed) {
      return { type: 'onboarding-incomplete', data: null }
    }

    // Priority 2: Verification rejected
    if (landlordData?.onboarding?.all_steps_completed && user?.verification_status === 'rejected') {
      const adminFeedback =
        (landlordData?.onboarding as any)?.admin_feedback ||
        (landlordData?.profile as any)?.admin_feedback ||
        ''
      return { type: 'verification-rejected', data: { adminFeedback } }
    }

    // Priority 3: Verification pending
    // Only show if user is truly pending (not approved and not rejected)
    // This prevents showing pending banner for landlords who were already approved
    // but changed their auth method (e.g., from Google to password)
    if (landlordData?.onboarding?.all_steps_completed &&
        landlordData?.onboarding?.submitted_for_review &&
        landlordData?.profile &&
        user?.verification_status !== 'approved' &&
        user?.verification_status !== 'rejected') {
      return { type: 'verification-pending', data: null }
    }

    // Priority 4: Pending landlord signature (agreements waiting for landlord)
    const pendingSignatureAgreements = agreements.filter((a: any) => 
      a.status === 'PENDING_LANDLORD' && !isBannerDismissed(buildBannerKey('landlord_signature', a.id))
    )
    if (pendingSignatureAgreements.length > 0) {
      return { type: 'pending-signature', data: pendingSignatureAgreements[0] }
    }

    // Priority 5: New applications (pending review)
    const pendingApplications = applications.filter((app: Application) => 
      app.status === 'pending' && !isBannerDismissed(buildBannerKey('new_application', app.id))
    )
    if (pendingApplications.length > 0) {
      return { type: 'new-application', data: { count: pendingApplications.length, latest: pendingApplications[0] } }
    }

    // Priority 6: Pending payments release (received but not released)
    const pendingReleasePayments = receivedPayments.filter((p: any) =>
      p.reconciliation_status === 'FULL_PAYMENT' &&
      p.disbursement_status !== 'released' &&
      p.disbursement_status !== 'pending' &&
      !isBannerDismissed(buildBannerKey('pending_release', p.agreement_id))
    )
    if (pendingReleasePayments.length > 0) {
      return { type: 'pending-release', data: { count: pendingReleasePayments.length, total: pendingReleasePayments.reduce((sum, p) => sum + (p.total_received_amount || 0), 0) } }
    }

    // Priority 7: Payment confirmed (48h window)
    if (!paymentsLoading && receivedPayments.length > 0) {
      const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
      const recentPayment = receivedPayments.find((p: any) =>
        p.disbursement_status === 'released' &&
        new Date(p.updated_at).getTime() > fortyEightHoursAgo &&
        !isBannerDismissed(buildBannerKey('payment_confirmed', p.agreement_id))
      )
      if (recentPayment) {
        return { type: 'payment-confirmed', data: recentPayment }
      }
    }

    // Priority 8: Expiring lease reminder (30 days before expiration)
    const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000
    const expiringAgreements = agreements.filter((a: any) => {
      if (!a.end_date || a.status !== 'ACTIVE') return false
      const endDate = new Date(a.end_date).getTime()
      const isExpiring = endDate > Date.now() && endDate < thirtyDaysFromNow
      return isExpiring && !isBannerDismissed(buildBannerKey('expiring_lease', a.id))
    })
    if (expiringAgreements.length > 0) {
      return { type: 'expiring-lease', data: { count: expiringAgreements.length, latest: expiringAgreements[0] } }
    }

    // Priority 9: Pending viewing requests
    const pendingViewingsCount = viewingRequestsList.filter((v: any) => v.status === 'pending').length
    if (pendingViewingsCount > 0 && !isBannerDismissed(buildBannerKey('viewing_request', `pending-${pendingViewingsCount}`))) {
      return { type: 'pending-viewings', data: { count: pendingViewingsCount } }
    }

    // Priority 10: Verified but no properties
    if (landlordData?.profile && user?.verification_status === 'approved' && landlordData?.stats?.total_properties === 0) {
      return { type: 'no-properties', data: null }
    }

    return null
  }, [landlordData, viewingRequestsList, receivedPayments, paymentsLoading, agreements, applications, user?.verification_status])

  // Memoize progressive banner to prevent unnecessary re-renders (legacy - will be replaced)
  const progressiveBanner = useMemo(() => {
    // Wait for landlordData to be loaded before showing any banner to prevent flashing!
    if (!landlordData) {
      return null
    }

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

                <Link href="/onboarding/landlord/step-1">

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



    // ── State 1.5: Rejected — must show BEFORE the pending state so the
    //               rejected banner is visible (ONBD-09) ─────────────────────────
    if (
      landlordData?.onboarding?.all_steps_completed &&
      user?.verification_status === 'rejected'
    ) {
      const adminFeedback =
        (landlordData?.onboarding as any)?.admin_feedback ||
        (landlordData?.profile as any)?.admin_feedback ||
        ''

      return (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  Verification Rejected
                </h3>
                <p className="text-red-700 text-sm">
                  Your landlord account was rejected. You cannot list new
                  properties until verification is approved.
                  {adminFeedback && (
                    <>
                      {' '}Reason: <span className="font-medium">{adminFeedback}</span>
                    </>
                  )}
                </p>
                <p className="text-red-700 text-sm mt-2">
                  Please contact support or resubmit your verification documents to continue.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href="/onboarding/landlord/step-1">
                    <Button size="sm" className="bg-red-500 hover:bg-red-600">
                      <Upload className="h-4 w-4 mr-2" />Resubmit Verification
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                      <MessageSquare className="h-4 w-4 mr-2" />Contact Support
                    </Button>
                  </Link>
                </div>
              </div>
              <Badge className="bg-red-100 text-red-800 border-red-200">
                Rejected
              </Badge>
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
                <p className="text-blue-700 text-sm mt-2">
                  Once your verification is approved, you'll be able to list properties and start receiving applications from verified tenants.
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
        p.disbursement_status === 'released' && new Date(p.released_at ?? p.updated_at ?? p.created_at).getTime() > fortyEightHoursAgo
      )

      // Only show banner if payment exists and hasn't been dismissed
      if (recentPayment && !isBannerDismissed(buildBannerKey('payment_confirmed', recentPayment.id))) {

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

                      {formatCurrency(recentPayment.total_received_amount || recentPayment.amount)}

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
                      dismissBanner(buildBannerKey('payment_confirmed', recentPayment.id))
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
    // Banner key includes the count so a NEW viewing request causes it to re-surface
    const pendingViewingsCount = viewingRequestsList.filter((v: any) => v.status === 'pending').length
    if (pendingViewingsCount > 0 && !isBannerDismissed(buildBannerKey('viewing_request', `pending-${pendingViewingsCount}`))) {

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
                  dismissBanner(buildBannerKey('viewing_request', `pending-${pendingViewings}`))
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

  // REG-08 fix (defense in depth): backend now also excludes soft-deleted
  // properties by default, but a stale cache snapshot may still contain one.
  // Filter here so the overview never renders a "Deleted"-labelled tile.
  // Soft-delete data is preserved in the DB for admin / moderation access.
  // NOTE: must live BEFORE the early returns below to satisfy Rules of Hooks.
  const rawProperties = landlordData?.properties ?? []
  const properties = useMemo(
    () => (rawProperties ?? []).filter((p: any) => !p?.deleted_at),
    [rawProperties]
  )



  // ─── Loading — same spinner as tenant ────────────────────────────────────────

  // ✅ FIX: Include `!hasFetchedOnce` so we show the loading skeleton during
  // the brief window between mount and the first fetch being attempted.
  // Previously the page would flash the "Could not load dashboard" error
  // because `mounted` flipped to true before `loading` did.
  if (!mounted || loading || (user?.user_type === 'landlord' && !hasFetchedOnce)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Skeleton */}
          <div className="mb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="flex-1">
                <Skeleton className="h-10 w-3/4 mb-3" />
                <Skeleton className="h-6 w-1/2 mb-6" />
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Stat Cards Skeleton */}
          <div className="mb-12">
            <Skeleton className="h-8 w-40 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border-orange-200 bg-white/80">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-8 w-16" />
                        <div className="flex flex-wrap gap-1">
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Engagement Progress Skeleton */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-8 w-56 mb-2" />
                <Skeleton className="h-5 w-64" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
            <Card className="border-orange-200 bg-white/80">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-28 rounded-full" />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="text-center space-y-1">
                        <Skeleton className="h-6 w-8 mx-auto" />
                        <Skeleton className="h-3 w-20 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid Skeleton */}
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-8">
              {/* Properties Skeleton */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
                <Card className="border-orange-200 bg-white/80">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                          <Skeleton className="h-48 w-full" />
                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-7 w-32" />
                              <Skeleton className="h-5 w-20" />
                            </div>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-5 w-40" />
                            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                              <Skeleton className="h-4 w-12" />
                              <Skeleton className="h-4 w-12" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Viewing Requests Skeleton */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Skeleton className="h-8 w-56 mb-2" />
                    <Skeleton className="h-5 w-64" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
                <Card className="border-orange-200 bg-white/80">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-1 space-y-8">
              <Card className="border-orange-200 bg-white/80">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-6" />
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-8 w-full rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-white/80">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-64 w-full rounded-xl" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }



  // ─── Error — same centered layout as tenant ───────────────────────────────────

  // ✅ FIX: Only show the error UI when a fetch was actually attempted and
  // failed (or returned no data). Without this guard, the error UI would
  // briefly flash before the very first fetch had a chance to run.
  if (!landlordData && hasFetchedOnce && !loading) {

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

  // ✅ FIX: Use the proper LandlordOnboarding / LandlordStats types from the
  // dashboard data so TypeScript doesn't fall back to `{}` (which is why
  // `onboarding?.all_steps_completed` and `stats.unread_messages` failed
  // to type-check). At runtime, an empty cast is safe — all numeric
  // property accesses in the JSX use `> 0` checks, and `undefined > 0`
  // is `false`, so a missing stat simply renders the fallback (e.g. "0").
  const onboarding: LandlordOnboarding | null = landlordData?.onboarding ?? null
  const stats: LandlordStats = landlordData?.stats ?? ({} as LandlordStats)
  const recentActivity: any[] = landlordData?.recentActivity ?? []



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

  const completedCount = viewingsLoading
    ? 0
    : viewingRequests.filter((v: any) => v.status === 'completed').length

  const totalViewingsCount = viewingsLoading
    ? 0
    : viewingRequests.length



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

                  <Link href="/onboarding/landlord/step-1">

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

              <Link href="/landlord/profile">

                <Button variant="outline" size="lg" className="border-orange-200 text-orange-700 hover:bg-orange-50">

                  <Settings className="h-4 w-4" />

                </Button>

              </Link>

            </div>

          </div>

        </div>



        {/* Unified Banner Display (Priority System) */}
        {activeBanner && (() => {
          switch (activeBanner.type) {
            case 'onboarding-incomplete':
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
                        <Link href="/onboarding/landlord/step-1">
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

            case 'verification-rejected': {
              const { adminFeedback } = activeBanner.data
              return (
                <Card className="mb-8 border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 mb-1">
                          Verification Rejected
                        </h3>
                        <p className="text-red-700 text-sm">
                          Your landlord account was rejected. You cannot list new
                          properties until verification is approved.
                          {adminFeedback && (
                            <>
                              {' '}Reason: <span className="font-medium">{adminFeedback}</span>
                            </>
                          )}
                        </p>
                        <p className="text-red-700 text-sm mt-2">
                          Please contact support or resubmit your verification documents to continue.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Link href="/onboarding/landlord/step-1">
                            <Button size="sm" className="bg-red-500 hover:bg-red-600">
                              <Upload className="h-4 w-4 mr-2" />Resubmit Verification
                            </Button>
                          </Link>
                          <Link href="/contact">
                            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                              <MessageSquare className="h-4 w-4 mr-2" />Contact Support
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Rejected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            case 'verification-pending':
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
                        <p className="text-blue-700 text-sm mt-2">
                          Once your verification is approved, you'll be able to list properties and start receiving applications from verified tenants.
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">Under Review</Badge>
                    </div>
                  </CardContent>
                </Card>
              )

            case 'pending-signature': {
              const agreement = activeBanner.data
              return (
                <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileCheck className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-purple-900 mb-1">
                          📝 Agreement Awaiting Your Signature
                        </h3>
                        <p className="text-purple-700 text-sm mb-3">
                          A tenant has signed the agreement for '{agreement.property_title || 'Property'}'. Review and sign to finalize the rental agreement.
                        </p>
                        <div className="flex items-center gap-3">
                          <Link href={`/landlord/agreements/${agreement.id}`}>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                              <FileCheck className="mr-2 h-4 w-4" />
                              Review & Sign
                            </Button>
                          </Link>
                          <Link href="/landlord/agreements">
                            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                              View All Agreements
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissBanner(buildBannerKey('landlord_signature', agreement.id))}
                        className="hidden sm:block text-purple-400 hover:text-purple-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div className="hidden sm:block">
                        <div className="text-4xl">📝</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            case 'new-application': {
              const { count, latest } = activeBanner.data
              return (
                <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-green-900 mb-1">
                          🎉 New Rental Application{count > 1 ? `s (${count})` : ''}
                        </h3>
                        <p className="text-green-700 text-sm mb-3">
                          {count === 1 
                            ? `You have a new application from '${latest.tenant?.full_name || 'Tenant'}' for '${latest.property_title || 'Property'}'.`
                            : `You have ${count} pending applications from interested tenants. Review and respond promptly.`
                          }
                        </p>
                        <div className="flex items-center gap-3">
                          <Link href="/landlord/applications">
                            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                              <Eye className="mr-2 h-4 w-4" />
                              Review Applications
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissBanner(buildBannerKey('new_application', latest.id))}
                        className="hidden sm:block text-green-400 hover:text-green-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div className="hidden sm:block">
                        <div className="text-4xl">📋</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            case 'pending-release': {
              const { count, total } = activeBanner.data
              return (
                <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-amber-900 mb-1">
                          💰 Payments Ready for Release
                        </h3>
                        <p className="text-amber-700 text-sm mb-3">
                          You have {count} payment{count > 1 ? 's' : ''} totaling {formatCurrency(total)} awaiting your release approval.
                        </p>
                        <div className="flex items-center gap-3">
                          <Link href="/landlord/payments">
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                              <DollarSign className="mr-2 h-4 w-4" />
                              Review Payments
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissBanner(buildBannerKey('pending_release', 'all'))}
                        className="hidden sm:block text-amber-400 hover:text-amber-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div className="hidden sm:block">
                        <div className="text-4xl">💸</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            case 'payment-confirmed': {
              const recentPayment = activeBanner.data
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
                            {formatCurrency(recentPayment.total_received_amount || recentPayment.amount)}
                          </Badge>
                        </div>
                        <p className="text-green-800 text-sm mb-1">
                          <span className="font-semibold">{tenantName}</span> has paid for{' '}
                          <span className="font-semibold">{propertyTitle}</span>.
                          {isRent && ' Their tenancy agreement is now active.'}
                        </p>
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
                          onClick={() => dismissBanner(buildBannerKey('payment_confirmed', recentPayment.id))}
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

            case 'expiring-lease': {
              const { count, latest } = activeBanner.data
              const daysUntilExpiry = Math.ceil((new Date(latest.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <Card className="mb-8 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-orange-900 mb-1">
                          ⚠️ Lease Expiring Soon ({daysUntilExpiry} days)
                        </h3>
                        <p className="text-orange-700 text-sm mb-3">
                          {count === 1 
                            ? `The lease for '${latest.property_title || 'Property'}' expires on ${formatDate(latest.end_date)}. Contact your tenant to discuss renewal.`
                            : `You have ${count} lease{count > 1 ? 's' : ''} expiring soon. Contact tenants to discuss renewals.`
                          }
                        </p>
                        <div className="flex items-center gap-3">
                          <Link href="/landlord/agreements">
                            <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md">
                              <FileCheck className="mr-2 h-4 w-4" />
                              Manage Agreements
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissBanner(buildBannerKey('expiring_lease', latest.id))}
                        className="hidden sm:block text-orange-400 hover:text-orange-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div className="hidden sm:block">
                        <div className="text-4xl">📅</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            case 'pending-viewings': {
              const { count } = activeBanner.data
              return (
                <Card className="mb-8 border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">
                          You have {count} viewing request{count > 1 ? 's' : ''}
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
                          onClick={() => dismissBanner(buildBannerKey('viewing_request', `pending-${count}`))}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Dismiss this notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <Badge className="bg-blue-100 text-blue-800">{count} Pending</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            case 'no-properties':
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

            default:
              return null
          }
        })()}

        {/* Messages Banner — Task-based (auto-dismiss after 30 min) */}
        {stats.unread_messages > 0 && !isBannerDismissed(buildBannerKey('message', 'unread-messages')) && (
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
                  dismissBanner(buildBannerKey('message', 'unread-messages'))
                }}
                className="text-purple-600 hover:text-purple-900 flex-shrink-0 mt-0.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stats — Optimized 4-card grid focused on property management */}

        <div className="mb-12">

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Property Management Overview</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">



            <Link href="/landlord/properties">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Total Properties</p>
                      <p className="text-xl sm:text-3xl font-bold text-slate-900 truncate">
                        {stats.total_properties}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {stats.properties_vacant > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full"
                            title="Approved and currently vacant (available to tenants)"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
                            <span className="font-semibold">Vacant:</span> {stats.properties_vacant}
                          </span>
                        )}
                        {stats.properties_occupied > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"
                            title="Approved and currently occupied (leased)"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                            <span className="font-semibold">Occupied:</span> {stats.properties_occupied}
                          </span>
                        )}
                        {stats.properties_pending > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"
                            title="Awaiting admin approval"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                            <span className="font-semibold">Pending:</span> {stats.properties_pending}
                          </span>
                        )}
                        {stats.properties_rejected > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full"
                            title="Rejected by admin — edit and resubmit"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
                            <span className="font-semibold">Rejected:</span> {stats.properties_rejected}
                          </span>
                        )}
                        {stats.total_properties === 0 && (
                          <span className="text-xs text-slate-400">no properties</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>



            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">

              <CardContent className="p-4 sm:p-6">

                <div className="flex items-start gap-3 sm:gap-4">

                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">

                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />

                  </div>

                  <div className="flex-1 min-w-0">

                    <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Monthly Revenue</p>

                    <p className="text-xl sm:text-3xl font-bold text-green-600 truncate">{formatCurrency(stats.monthly_revenue || 0)}</p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">

                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">

                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />

                        {formatCurrency((stats.monthly_revenue || 0) * 12)}/yr

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

                      <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />

                    </div>

                    <div className="flex-1 min-w-0">

                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Total Collected</p>

                      <p className="text-xl sm:text-3xl font-bold text-purple-600 truncate">{formatCurrency(totalPaymentsCollected)}</p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">

                        {totalPendingAmount > 0 && (

                          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">

                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" />

                            {formatCurrency(totalPendingAmount)} escrow

                          </span>

                        )}

                        {totalWithdrawnAmount > 0 && (

                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">

                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />

                            {formatCurrency(totalWithdrawnAmount)} paid out

                          </span>

                        )}

                        {totalPaymentsCollected === 0 && !paymentsLoading && (

                          <span className="text-xs text-slate-400">no payments yet</span>

                        )}

                      </div>

                    </div>

                  </div>

                </CardContent>

              </Card>

            </Link>


            {/* Active Leases */}
            <Link href="/landlord/occupied-properties">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Active Leases</p>
                      {(() => {
                        // Use agreements (fetched separately) as the reliable source.
                        // stats.properties_occupied may be stale if property.status
                        // was never synced when the agreement became ACTIVE.
                        const activeLeaseCount = agreements.filter((a: any) => a.status === 'ACTIVE' || a.status === 'SIGNED').length
                        const vacantCount = Math.max(0, stats.total_properties - stats.properties_pending - stats.properties_rejected - activeLeaseCount)
                        return (
                          <>
                            <p className="text-xl sm:text-3xl font-bold text-emerald-600 truncate">
                              {activeLeaseCount}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {activeLeaseCount} occupied
                              </span>
                              {vacantCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                                  {vacantCount} vacant
                                </span>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

          </div>
        </div>

        {/* Revenue & Payment Tracking Card */}
        <div className="mb-12">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    Revenue &amp; Payments
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Track rental income and payment collections</p>
                </div>
                <Link href="/landlord/payments">
                  <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-5 rounded-lg bg-white border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600">Total Collected</p>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-600 mb-1">{formatCurrency(totalPaymentsCollected)}</p>
                  <p className="text-xs text-slate-500">All-time rent payments</p>
                </div>
                <div className="p-5 rounded-lg bg-white border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600">In Escrow</p>
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-orange-600 mb-1">{formatCurrency(totalPendingAmount)}</p>
                  <p className="text-xs text-slate-500">{totalPendingAmount > 0 ? 'Ready for release' : 'No pending funds'}</p>
                </div>
                <div className="p-5 rounded-lg bg-white border-2 border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600">Withdrawn</p>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 mb-1">{formatCurrency(totalWithdrawnAmount)}</p>
                  <p className="text-xs text-slate-500">Released to your bank</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-green-100">
                <div className="text-center p-3 rounded-lg bg-white/60">
                  <p className="text-xs text-slate-500 mb-1">Occupied</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {agreements.filter((a: any) => a.status === 'ACTIVE' || a.status === 'SIGNED').length}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">properties</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60">
                  <p className="text-xs text-slate-500 mb-1">Monthly Rate</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthly_revenue || 0)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">per month</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60">
                  <p className="text-xs text-slate-500 mb-1">Pending Release</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {receivedPayments.filter((p: any) => p.disbursement_status !== 'released' && p.reconciliation_status === 'FULL_PAYMENT').length}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">payments</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60">
                  <p className="text-xs text-slate-500 mb-1">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.total_properties > 0
                      ? Math.round((agreements.filter((a: any) => a.status === 'ACTIVE' || a.status === 'SIGNED').length / stats.total_properties) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">occupied</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main grid — 3/4 + 1/4 */}
        <div className="grid gap-8 lg:grid-cols-4">

          {/* Left 3 cols */}
          <div className="lg:col-span-3 space-y-8">

            {/* Properties */}
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
                    <div className="text-center py-12">
                      <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties listed yet</h3>
                      <p className="text-slate-600 mb-6">
                        {isVerified ? 'Add your first property to start receiving viewing requests.' : 'Complete your verification to start listing properties.'}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(properties ?? [])
                        .slice()
                        .sort((a: any, b: any) => {
                          const order: Record<string, number> = { occupied: 0, vacant: 1 }
                          return (order[a.status] ?? 2) - (order[b.status] ?? 2)
                        })
                        .slice(0, 4)
                        .map((property: any) => (
                        <PropertyCard key={property.id} property={property} variant="compact" formatPrice={formatCurrency} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Viewing Requests */}
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
                    <div className="space-y-3">{[1,2,3].map(i => <div key={`viewing-skeleton-${i}`} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
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
                        const isConfirmed = request.status === 'confirmed'
                        const tenantName = request.tenant?.full_name || request.tenant?.first_name || 'Tenant'
                        const propertyTitle = request.property?.title || request.property_title || 'Your Property'
                        const viewingDate = request.preferred_date || request.scheduled_date || request.created_at
                        const viewingType = request.viewing_type
                          ? request.viewing_type.charAt(0) + request.viewing_type.slice(1).toLowerCase().replace('_', ' ')
                          : 'Physical'
                        return (
                          <div key={request.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-slate-900 truncate">{tenantName}</h4>
                                {isConfirmed ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>
                                ) : (
                                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>
                                )}
                                <Badge variant="outline" className="text-slate-600 border-slate-300 text-xs">{viewingType}</Badge>
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

            {/* Tenant Applications */}
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
                    <div className="space-y-3">{[1,2,3].map(i => <div key={`application-skeleton-${i}`} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications yet</h3>
                      <p className="text-slate-600">Tenants will submit applications when interested in your properties</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.slice(0, 3).map((application: any) => {
                        const tenantName = application.user?.full_name || 'Tenant'
                        const propertyTitle = application.property?.title || 'Property'
                        const propertyLocation = application.property?.location || 'Location not specified'
                        return (
                          <div key={application.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-300">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-semibold text-slate-900 truncate">{tenantName}</h4>
                                {application.status === 'approved' && <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>}
                                {application.status === 'pending' && <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>}
                                {application.status === 'rejected' && <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold"><X className="h-3 w-3 mr-1" />Rejected</Badge>}
                              </div>
                              <p className="text-sm text-slate-700 font-medium mb-1 truncate">{propertyTitle}</p>
                              <p className="text-sm text-slate-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-orange-500 flex-shrink-0" />{propertyLocation}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                <span>Applied: {formatDate(application.created_at)}</span>
                                {application.viewed_by_landlord && <span className="text-green-600"><Eye className="h-3 w-3 inline mr-1" />Viewed</span>}
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

            {/* Agreements */}
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
                    <div className="space-y-3">{[1,2,3].map(i => <div key={`agreement-skeleton-${i}`} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
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
                      {agreements.slice(0, 3).map((agreement: any) => (
                        <div key={agreement.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-slate-900">{agreement.tenant?.full_name || 'Tenant'}</h4>
                              {agreement.status === 'ACTIVE' && <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>}
                              {agreement.status === 'SIGNED' && <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold"><CheckCircle className="h-3 w-3 mr-1" />Fully Signed</Badge>}
                              {agreement.status === 'PENDING_LANDLORD' && <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-semibold"><AlertTriangle className="h-3 w-3 mr-1" />Awaiting Your Signature</Badge>}
                              {agreement.status === 'PENDING_TENANT' && <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold"><FileText className="h-3 w-3 mr-1" />Tenant Signing</Badge>}
                              {agreement.status === 'EXPIRED' && <Badge className="bg-slate-100 text-slate-800 border-slate-200 font-semibold">Expired</Badge>}
                            </div>
                            <p className="text-sm text-slate-600 flex items-center mb-2">
                              <Building2 className="h-3 w-3 mr-2 text-orange-500" />{agreement.property?.title || 'Property'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              {agreement.start_date && <span>From: {formatDate(agreement.start_date)}</span>}
                              {agreement.end_date && <span>Until: {formatDate(agreement.end_date)}</span>}
                              {agreement.monthly_rent && <span className="text-orange-600 font-semibold">{formatCurrency(agreement.monthly_rent)}/mo</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                            <Link href={`/landlord/agreements/${agreement.id}`}>
                              <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs gap-1.5">
                                <Eye className="h-3.5 w-3.5" />View
                              </Button>
                            </Link>
                            {agreement.status === 'PENDING_LANDLORD' && (
                              <Link href={`/landlord/agreements/${agreement.id}/sign`}>
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
                  <Link href="/onboarding/landlord/step-1">
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
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${getOnboardingProgress(onboarding)}%` }} />
                      </div>
                      <p className="text-sm text-slate-600">Complete all steps to unlock property listing and receive tenant applications.</p>
                      <Link href="/onboarding/landlord/step-1">
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

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Payment Timeline */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent Payments</h3>
                <Link href="/landlord/payments">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 -mr-2">
                    View All
                  </Button>
                </Link>
              </div>
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  {paymentsLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <div key={`payment-skeleton-${i}`} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
                  ) : receivedPayments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">No payments yet</h3>
                      <p className="text-xs text-slate-600">Tenant payments will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {receivedPayments.slice(0, 6).map((payment: any) => {
                        const isReleased = payment.disbursement_status === 'released'
                        const isEscrow = payment.reconciliation_status === 'FULL_PAYMENT' && !isReleased && payment.disbursement_status !== 'pending'
                        return (
                          <Link key={payment.agreement_id} href={`/landlord/payments/${payment.agreement_id}`}>
                            <div className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                              <div className="flex items-start gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isReleased ? 'bg-green-100' : isEscrow ? 'bg-orange-100' : 'bg-slate-100'}`}>
                                  {isReleased
                                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                                    : isEscrow
                                    ? <Activity className="h-4 w-4 text-orange-600" />
                                    : <DollarSign className="h-4 w-4 text-slate-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(payment.total_received_amount || 0)}</p>
                                    {isReleased && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Released</Badge>}
                                    {isEscrow && <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Escrow</Badge>}
                                    {payment.disbursement_status === 'pending' && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Pending</Badge>}
                                  </div>
                                  <p className="text-xs text-slate-600 truncate">
                                    {payment.tenant?.full_name || 'Tenant'} · {payment.property?.title || 'Property'}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(payment.created_at)}</p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Notifications */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && <Badge className="bg-orange-500 text-white animate-pulse">{unreadCount}</Badge>}
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
                        <div key={notification.id}
                          className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}>
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              {notification.type === 'viewing_requested' && <Calendar className="h-4 w-4 text-orange-600" />}
                              {notification.type === 'viewing_confirmed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {notification.type === 'application_received' && <FileText className="h-4 w-4 text-purple-600" />}
                              {notification.type === 'message' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                              {notification.type === 'email_verified' && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {notification.type === 'system' && <Bell className="h-4 w-4 text-slate-600" />}
                              {(!notification.type || !['viewing_requested','viewing_confirmed','application_received','message','email_verified','system'].includes(notification.type)) && (
                                <Bell className="h-4 w-4 text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">{notification.title}</p>
                                {!notification.read && <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 mb-2">{notification.message}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(notification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications && notifications.length > 5 && (
                        <Link href="/landlord/notifications">
                          <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">View All Notifications</Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Recent Messages */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent Messages</h3>
                <Link href="/landlord/messages">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">View All</Button>
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
                              <p className="text-sm font-semibold text-slate-900 truncate">{msg.title || 'Tenant'}</p>
                              {msg.unread && <Badge className="bg-green-500 text-white text-xs">New</Badge>}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">{msg.description || 'No preview available'}</p>
                          </div>
                        </Link>
                      ))}
                      <Link href="/landlord/messages">
                        <Button variant="outline" size="sm" className="w-full border-green-300 text-green-600 hover:bg-green-50">View All Messages</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Quick Actions */}
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
                      <Link href="/onboarding/landlord/step-1">
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

            {/* Recent Activity */}
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
                        <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
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
