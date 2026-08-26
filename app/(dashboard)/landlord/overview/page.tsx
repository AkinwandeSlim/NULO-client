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
  Building2, Calendar, Clock, MessageSquare, DollarSign,
  Eye, Plus, MapPin, Bed, Bath, Square,
  ArrowRight, AlertCircle, CheckCircle, CheckCircle2,
  Bell, Settings, Activity, FileText,
  Upload, User, Zap, Award, Target, TrendingUp, Mail, X,
  FileCheck, AlertTriangle, Loader2, RefreshCw, Wallet, Banknote, Bot
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

import { paymentsAPI } from "@/lib/api/payments";

import { engagementAPI, getEngagementLevelColor, getEngagementLevelTextColor, getEngagementLevelBgColor, getTrustScoreColor, getTrustScoreTextColor, getTrustScoreBgColor, trackEngagement } from "@/lib/api/engagement"
import { isBannerDismissed, dismissBanner, buildBannerKey } from "@/lib/bannerStorage"
import { normalizeAppStatus } from "@/lib/utils/applicationStatus"



const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Derive effective status from timestamps
// ─────────────────────────────────────────────────────────────────────────────
/**
 * The DB `status` field can lag — e.g. a tenant signs but the backend hasn't
 * flipped `PENDING_TENANT` → `PENDING_LANDLORD` yet.
 * This function resolves the true status from timestamps (which are facts).
 */
function getEffectiveStatus(a: any) {
  const tenantSigned   = Boolean(a.tenant_signed_at)
  const landlordSigned = Boolean(a.landlord_signed_at)

  if (tenantSigned && !landlordSigned)  return "PENDING_LANDLORD"
  if (!tenantSigned && landlordSigned)  return "PENDING_TENANT"
  return a.status
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue snapshot (stale-while-revalidate)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * The overview page deliberately force-refreshes the dashboard on every mount
 * (bypassing the 60s cache), so for the first seconds of a visit the payments,
 * agreements and stats state is still empty — and the Revenue & Payments card
 * used to render that as real-looking ₦0 / 0 / 0% before flashing to the true
 * figures. A landlord refreshing the page could reasonably read it as "my
 * revenue just dropped to zero".
 *
 * The last settled figures are therefore persisted per-landlord and hydrated
 * synchronously on mount: a refresh instantly shows the previous real values,
 * then fresh data swaps in silently when the network settles. First-ever
 * visits (no snapshot yet) get skeleton placeholders instead of fake zeros.
 */
interface RevenueSnapshot {
  user_id: string
  ts: number
  totalCollected: number
  inEscrow: number
  withdrawn: number
  occupiedCount: number
  monthlyRevenue: number
  pendingRelease: number
  occupancyRate: number
}
const REVENUE_SNAPSHOT_KEY = 'landlord_revenue_snapshot_v1'
// Older than a day is too stale to present as "current" — fall back to skeletons.
const REVENUE_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000

function loadRevenueSnapshot(userId?: string | null): RevenueSnapshot | null {
  if (!userId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(REVENUE_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RevenueSnapshot
    if (parsed?.user_id !== userId) return null
    if (!parsed?.ts || Date.now() - parsed.ts > REVENUE_SNAPSHOT_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function saveRevenueSnapshot(snapshot: RevenueSnapshot): void {
  try {
    window.localStorage.setItem(REVENUE_SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch { /* storage full/unavailable — snapshot is best-effort */ }
}

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

  const [applications, setApplications] = useState<any[]>([])

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
    const fullySignedCount = agreements.filter(a => {
      const effectiveStatus = getEffectiveStatus(a)
      return effectiveStatus === 'SIGNED' || effectiveStatus === 'ACTIVE'
    }).length
    const pendingCount = agreements.filter(a => {
      const effectiveStatus = getEffectiveStatus(a)
      return effectiveStatus === 'PENDING_LANDLORD' || effectiveStatus === 'PENDING_TENANT'
    }).length
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

  // ✅ FIX: Use a ref to always call the LATEST fetchLandlordDashboard function
  // (which is recreated on every landlordData change due to useCallback in the
  // context), but exclude it from the useEffect's dependency array to avoid
  // an infinite re-fetch loop. Also use a guard ref to prevent overlapping
  // fetches if the effect somehow fires twice in a row.
  const fetchLandlordFnRef = useRef(fetchLandlordDashboard)
  fetchLandlordFnRef.current = fetchLandlordDashboard
  const landlordFetchInFlightRef = useRef(false)
  // Keep a ref to receivedPayments so the poller can compare lengths without
  // pulling receivedPayments into its dependency array (which would restart the
  // interval on every payment update, defeating the purpose).
  const receivedPaymentsRef = useRef(receivedPayments)
  receivedPaymentsRef.current = receivedPayments

  useEffect(() => {
    if (!mounted) return
    if (!user) return
    if (landlordFetchInFlightRef.current) return  // guard against rapid re-fires

    console.log(' [OVERVIEW] User data check:', {
      user_type: user?.user_type,
      verification_status: user?.verification_status
    })

    if (user.user_type === 'landlord') {
      // Fetch dashboard immediately — do not wait for userTypeConfirmed
      // ✅ FIX: Force a fresh fetch on every page mount. The 60s cache was
      // causing stale "Occupied: 1" / "0 signed" stats to persist after the
      // tenant's payment status changed. Now the user always sees the
      // freshest data when navigating via the navbar "Overview" button.
      // NOTE: Do NOT setHasFetchedOnce(false) here — that resets the guard
      // mid-render and causes a skeleton flash when data is already loaded.
      landlordFetchInFlightRef.current = true
      fetchLandlordFnRef.current(true)
        .catch(() => { /* error handled in context */ })
        .finally(() => {
          setHasFetchedOnce(true)
          landlordFetchInFlightRef.current = false
        })
    } else if (userTypeConfirmed) {
      // Only redirect AFTER DB has confirmed this is genuinely not a landlord.
      // Without this guard, a landlord with stale JWT gets kicked to '/'
      // before the background DB fetch corrects user_type.
      router.push('/')
      toast.error('Access denied. Landlord access required.')
    }
    // If user_type !== 'landlord' AND !userTypeConfirmed: wait silently

  }, [mounted, user, userTypeConfirmed, router, pathname])



  // ─────────────────────────────────────────────────────────────────────────────
  // Sync all sub-panel state from the single dashboard payload.
  // The DashboardContext already fetches viewings, applications, agreements,
  // and payments in one shot — no need for 5 separate API calls per mount.
  // ─────────────────────────────────────────────────────────────────────────────
  const paymentsSeededRef = useRef(false)
  const dashboardRefreshScheduledRef = useRef(false)

  useEffect(() => {
    if (!landlordData) return

    // Viewings — the backend already returns viewing_requests in the
    // dashboard payload; filter to actionable statuses for the overview.
    const rawViewings: any[] = Array.isArray(landlordData.viewingRequests)
      ? landlordData.viewingRequests
      : []
    setViewingRequests(rawViewings.filter((v: any) =>
      v.status === 'pending' || v.status === 'confirmed' || v.status === 'reschedule_proposed' || v.status === 'completed'
    ))
    setViewingsLoading(false)

    // Applications
    const rawApps: any[] = Array.isArray(landlordData.receivedApplications)
      ? landlordData.receivedApplications
      : []
    setApplications(rawApps.filter((app) => app.status !== 'withdrawn'))
    setApplicationsLoading(false)

    // Agreements — use effective status derived from timestamps
    const rawAgreements: any[] = Array.isArray(landlordData.agreements)
      ? landlordData.agreements
      : []
    setAgreements(rawAgreements.filter((a: any) =>
      ['ACTIVE', 'SIGNED', 'PENDING_LANDLORD', 'PENDING_TENANT', 'EXPIRED'].includes(getEffectiveStatus(a))
    ))
    setAgreementsLoading(false)

    // Payments — seed from dashboard payload only on the first successful
    // load.  After that the poller (below) owns this state to avoid the
    // dashboard cache overwriting freshly polled data.
    if (!paymentsSeededRef.current && landlordData.receivedPayments?.length) {
      setReceivedPayments(landlordData.receivedPayments as any[])
      setPaymentsLoading(false)
      paymentsSeededRef.current = true
    } else if (!paymentsSeededRef.current) {
      // No payments from the backend — mark seeded so the poller takes over
      paymentsSeededRef.current = true
      setPaymentsLoading(false)
    }
  }, [landlordData])

  // Engagement metrics — NOT included in the dashboard payload, so fetch
  // separately. Depends only on user?.id (stable) to fire once per session.
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    const fetchEngagement = async () => {
      try {
        const data = await engagementAPI.getEngagementMetrics(user.id)
        if (!cancelled) setEngagementMetrics(data)
      } catch (error) {
        console.error('❌ Failed to fetch engagement metrics:', error)
      }
    }

    fetchEngagement()
    return () => { cancelled = true }
  }, [user?.id])

  // Real-time payment polling: Check for new payments every 10 seconds.
  //   - skips while the tab is hidden (no wasted requests),
  //   - backs off after repeated failures so a dead server doesn't spam logs,
  //   - ignores 401 (handled by API client single-flight refresh),
  //   - debounces the heavy dashboard refresh to at most once per 60s so
  //     the 10s poller doesn't cascade the full dashboard fetch each tick.
  useEffect(() => {
    if (!user?.id || paymentsLoading) return

    let consecutiveFailures = 0
    const MAX_FAILURES_BEFORE_STOP = 5

    const pollInterval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return

      try {
        const data = await paymentsAPI.getReceivedPayments()
        const freshPayments = data.payments || []

        // Detect genuinely new payments (recently released)
        const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
        const hasNewPayment = freshPayments.some((p: any) =>
          p.disbursement_status === 'released' && new Date(p.released_at ?? p.updated_at ?? p.created_at).getTime() > fortyEightHoursAgo
        )

        consecutiveFailures = 0

        if (hasNewPayment || freshPayments.length !== receivedPaymentsRef.current.length) {
          console.log('💰 [OVERVIEW] New payments detected, updating...')
          setReceivedPayments(freshPayments)
          // Schedule a dashboard refresh at most once per 60s. The dashboard
          // payload includes receivedApplications which the "Continue in
          // PropFlow" banner needs to resolve the propflow thread. Without
          // debounce the 10s poll would cascade the heavy 9-worker dashboard
          // fetch on every tick that finds a new payment.
          if (!dashboardRefreshScheduledRef.current) {
            dashboardRefreshScheduledRef.current = true
            fetchLandlordFnRef.current(true)
            setTimeout(() => { dashboardRefreshScheduledRef.current = false }, 60_000)
          }
        }
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 401) return
        consecutiveFailures += 1
        if (status === 500) {
          console.warn(`⚠️ [OVERVIEW] Payments polling: server hiccup (500) [${consecutiveFailures}/${MAX_FAILURES_BEFORE_STOP}]`)
        } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
          console.warn(`⚠️ [OVERVIEW] Payments polling: timeout [${consecutiveFailures}/${MAX_FAILURES_BEFORE_STOP}]`)
        } else {
          console.warn('⚠️ Payment polling failed, will retry', error?.message || error)
        }
        if (consecutiveFailures >= MAX_FAILURES_BEFORE_STOP) {
          console.warn('⚠️ [OVERVIEW] Stopping payment polling after repeated failures — a page refresh restarts it.')
          clearInterval(pollInterval)
        }
      }
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [user?.id, paymentsLoading])



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

  // ── Stable Revenue & Payments display (stale-while-revalidate) ─────────────
  // Hydrated synchronously from localStorage so a page refresh shows the last
  // real figures instantly instead of ₦0 while the forced dashboard refresh is
  // still in flight. See the RevenueSnapshot note above the component.
  // ⚠️ These hooks MUST stay above every early return in this component (the
  // loading-skeleton and error gates further down) — a hook count that varies
  // between renders crashes with "Rendered more hooks than during the
  // previous render".
  const [revenueSnapshot, setRevenueSnapshot] = useState<RevenueSnapshot | null>(() => loadRevenueSnapshot(user?.id))
  // If auth resolved after mount (snapshot initialized against no user), pick
  // it up once the id is known.
  useEffect(() => {
    if (!revenueSnapshot) setRevenueSnapshot(loadRevenueSnapshot(user?.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Occupied = agreements that are actually ACTIVE (tenant paid) — same rule
  // the revenue card uses. Computed once here so display + persistence agree.
  const occupiedCount = useMemo(() => agreements.filter((a: any) => {
    return getEffectiveStatus(a) === 'ACTIVE'
  }).length, [agreements])

  // Stable reference for effect deps (a bare `?? {}` would allocate a fresh
  // object every render and re-run the persistence effect each time).
  const landlordStats = useMemo(() => landlordData?.stats ?? ({} as LandlordStats), [landlordData])

  // Persist the settled figures so the next visit/refresh starts from them.
  // Only writes once BOTH inputs have finished loading — never snapshots the
  // transient empty state.
  useEffect(() => {
    if (!user?.id || paymentsLoading || agreementsLoading) return
    saveRevenueSnapshot({
      user_id: user.id,
      ts: Date.now(),
      totalCollected: totalPaymentsCollected,
      inEscrow: totalPendingAmount,
      withdrawn: totalWithdrawnAmount,
      occupiedCount,
      monthlyRevenue: landlordStats.monthly_revenue || 0,
      pendingRelease: receivedPayments.filter((p: any) =>
        p.disbursement_status !== 'released' && p.reconciliation_status === 'FULL_PAYMENT').length,
      occupancyRate: landlordStats.total_properties > 0 ? Math.round((occupiedCount / landlordStats.total_properties) * 100) : 0,
    })
  }, [user?.id, paymentsLoading, agreementsLoading, receivedPayments, agreements, landlordStats,
      totalPaymentsCollected, totalPendingAmount, totalWithdrawnAmount, occupiedCount])

  // While loading WITH a snapshot → show the snapshot (stable previous values).
  // While loading WITHOUT one → skeletons. Settled → live values.
  const revenueLoading = paymentsLoading || agreementsLoading
  const revenueDisplay: Pick<RevenueSnapshot, 'totalCollected' | 'inEscrow' | 'withdrawn' | 'occupiedCount' | 'monthlyRevenue' | 'pendingRelease' | 'occupancyRate'> =
    revenueLoading && revenueSnapshot
      ? revenueSnapshot
      : {
          totalCollected: totalPaymentsCollected,
          inEscrow: totalPendingAmount,
          withdrawn: totalWithdrawnAmount,
          occupiedCount,
          monthlyRevenue: landlordStats.monthly_revenue || 0,
          pendingRelease: receivedPayments.filter((p: any) =>
            p.disbursement_status !== 'released' && p.reconciliation_status === 'FULL_PAYMENT').length,
          occupancyRate: landlordStats.total_properties > 0 ? Math.round((occupiedCount / landlordStats.total_properties) * 100) : 0,
        }
  const showRevenueSkeleton = revenueLoading && !revenueSnapshot



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

  // Helper variables for banner logic - must be defined BEFORE activeBanner useMemo
  const rawProperties = landlordData?.properties ?? []
  const properties = useMemo(
    () => (rawProperties ?? []).filter((p: any) => !p?.deleted_at),
    [rawProperties]
  )
  const hasProperties = properties.length > 0
  const hasActiveAgreements = agreements.some((a: any) => {
    const effectiveStatus = getEffectiveStatus(a)
    return effectiveStatus === 'ACTIVE'
  })



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
    // Only show onboarding banner if truly incomplete AND landlord has no properties/agreements
    const trulyNeedsOnboarding = !landlordData?.onboarding?.all_steps_completed && !hasProperties && !hasActiveAgreements
    if (trulyNeedsOnboarding) {
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
    // Also show PENDING_TENANT agreements so landlord knows tenant is reviewing
    console.log('📝 [LANDLORD BANNER DEBUG] All agreements:', agreements.map((a: any) => ({ 
      id: a.id, 
      status: a.status,
      effectiveStatus: getEffectiveStatus(a),
      title: a.property_title || a.property?.title,
      tenant_signed_at: a.tenant_signed_at,
      landlord_signed_at: a.landlord_signed_at,
      key: buildBannerKey('landlord_signature', a.id),
      isDismissed: isBannerDismissed(buildBannerKey('landlord_signature', a.id))
    })))
    const pendingSignatureAgreements = agreements.filter((a: any) => {
      const effectiveStatus = getEffectiveStatus(a)
      return (effectiveStatus === 'PENDING_LANDLORD' || effectiveStatus === 'PENDING_TENANT') && !isBannerDismissed(buildBannerKey('landlord_signature', a.id))
    })
    console.log('📝 [LANDLORD BANNER DEBUG] Pending signature agreements:', pendingSignatureAgreements)
    if (pendingSignatureAgreements.length > 0) {
      return { type: 'pending-signature', data: pendingSignatureAgreements[0] }
    }

    // Priority 5: New applications (pending review)
            const pendingApplications = applications.filter((app: any) =>
                normalizeAppStatus(app.status) === 'pending' && !isBannerDismissed(buildBannerKey('new_application', app.id))
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
      // Find PropFlow workflow context. Prefer the thread id carried directly
      // on the payment row (agreement.propflow_thread_id, written by
      // provision_nomba_dva) so the "Review & Release" button is self-aware
      // from the FIRST render — no dependence on the separately-polled
      // receivedApplications cross-ref. Fall back to the application match for
      // rows that predate the field.
      const firstPayment = pendingReleasePayments[0]
      const directThreadId = firstPayment?.propflow_thread_id
      const matchingApp = !directThreadId ? (landlordData?.receivedApplications?.find(
        (app: any) => app.property_id === firstPayment.property_id &&
                     app.tenant_id === firstPayment.tenant_id &&
                     app.propflow_thread_id
      ) ?? null) : null
      return {
        type: 'pending-release',
        data: {
          count: pendingReleasePayments.length,
          total: pendingReleasePayments.reduce((sum, p) => sum + (p.total_received_amount || 0), 0),
          propflowThreadId: directThreadId ?? matchingApp?.propflow_thread_id ?? null,
          agreementId: firstPayment?.agreement_id,
        }
      }
    }

    // Priority 7: Payment confirmed (48h window)
    if (!paymentsLoading && receivedPayments.length > 0) {
      const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
      const recentPayment = receivedPayments.find((p: any) =>
        p.disbursement_status === 'released' &&
        new Date(p.updated_at).getTime() > fortyEightHoursAgo &&
        !isBannerDismissed(buildBannerKey('payment_confirmed', p.id))
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
    console.log('🏠 [LANDLORD BANNER DEBUG] pendingViewingsCount:', pendingViewingsCount)
    if (pendingViewingsCount > 0 && !isBannerDismissed(buildBannerKey('viewing_request', `pending-${pendingViewingsCount}`))) {
      console.log('🏠 [LANDLORD BANNER DEBUG] Returning pending-viewings banner')
      return { type: 'pending-viewings', data: { count: pendingViewingsCount } }
    }

    // Priority 10: Verified but no properties
    console.log('🏠 [LANDLORD BANNER DEBUG] Check no properties:', { 
      profileExists: !!landlordData?.profile, 
      userVerified: user?.verification_status === 'approved', 
      totalProperties: landlordData?.stats?.total_properties 
    })
    if (landlordData?.profile && user?.verification_status === 'approved' && landlordData?.stats?.total_properties === 0) {
      console.log('🏠 [LANDLORD BANNER DEBUG] Returning no-properties banner')
      return { type: 'no-properties', data: null }
    }

    console.log('🏠 [LANDLORD BANNER DEBUG] No active banner')
    return null
  }, [landlordData, viewingRequestsList, receivedPayments, paymentsLoading, agreements, applications, user?.verification_status])

  // Memoize progressive banner to prevent unnecessary re-renders (legacy - will be replaced)
  const progressiveBanner = useMemo(() => {
    // Wait for landlordData to be loaded before showing any banner to prevent flashing!
    if (!landlordData) {
      return null
    }

    // ── State 1: Onboarding incomplete ────────────────────────────────────────
    // Only show onboarding banner if truly incomplete AND landlord has no properties/agreements
    // This prevents showing the banner for landlords who have already onboarded but have stale onboarding data
    const trulyNeedsOnboarding = !landlordData?.onboarding?.all_steps_completed && !hasProperties && !hasActiveAgreements

    if (trulyNeedsOnboarding) {

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

        const tenantName = recentPayment.tenant_name || 'your tenant'

        const propertyTitle = recentPayment.property_title || 'your property'

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

  }, [landlordData, viewingRequestsList, receivedPayments, paymentsLoading, agreements, agreementsLoading, user?.verification_status, hasProperties, hasActiveAgreements])

  // ─── Loading — same spinner as tenant ────────────────────────────────────────

  // Show skeleton until:
  //   • component has mounted (avoids SSR mismatch)
  //   • AND we have either landlordData (already loaded) OR hasFetchedOnce is true
  //     (first fetch has completed, even if it returned null/error)
  // Using `!landlordData && !hasFetchedOnce` instead of the old `!hasFetchedOnce`
  // alone prevents the flash that happened when setHasFetchedOnce(false) was
  // called right before a force-refresh: data was present but the flag was reset.
  if (!mounted || loading || (!landlordData && !hasFetchedOnce)) {
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
                <Card className="landlord-status-banner mb-8 border-orange-200 bg-orange-50">
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
                <Card className="landlord-status-banner mb-8 border-red-200 bg-red-50">
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
                <Card className="landlord-status-banner mb-8 border-blue-200 bg-blue-50">
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
              const effectiveStatus = getEffectiveStatus(agreement)
              const isTenantTurn = effectiveStatus === 'PENDING_TENANT'
              // Find the matching application to check for PropFlow workflow context
              const matchingApp = landlordData?.receivedApplications?.find(
                (app: any) => app.property_id === (agreement as any).property_id && app.propflow_thread_id
              )
              const hasPropFlow = !!matchingApp?.propflow_thread_id
              return (
                <Card className={`landlord-status-banner mb-8 border-2 ${isTenantTurn ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50' : 'border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50'} shadow-sm`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 ${isTenantTurn ? 'bg-blue-500' : 'bg-purple-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <FileCheck className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold ${isTenantTurn ? 'text-blue-900' : 'text-purple-900'} mb-1`}>
                          {isTenantTurn ? '📋 Agreement Awaiting Tenant Signature' : '📝 Agreement Awaiting Your Signature'}
                        </h3>
                        <p className={`${isTenantTurn ? 'text-blue-700' : 'text-purple-700'} text-sm mb-3`}>
                          {isTenantTurn
                            ? `The agreement for '${agreement.property_title || agreement.property?.title || 'Property'}' is ready for the tenant to review and sign.`
                            : `A tenant has signed the agreement for '${agreement.property_title || agreement.property?.title || 'Property'}'. Review and sign to finalize the rental agreement.`
                          }
                        </p>
                        <div className="flex items-center gap-3">
                          <Link href={`/landlord/agreements/${agreement.id}`}>
                            <Button className={`${isTenantTurn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white shadow-md`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Agreement
                            </Button>
                          </Link>
                          {!isTenantTurn && hasPropFlow ? (
                            <Button
                              variant="outline"
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('propflow:open', {
                                  detail: { workflow_id: matchingApp!.propflow_thread_id }
                                }))
                                window.location.href = `/landlord/agreements/${agreement.id}`
                              }}
                            >
                              <Bot className="mr-2 h-4 w-4" />
                              Continue with NEST AI
                            </Button>
                          ) : (
                            <Link href="/landlord/agreements">
                              <Button variant="outline" className={isTenantTurn ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'border-purple-300 text-purple-700 hover:bg-purple-50'}>
                                View All Agreements
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => dismissBanner(buildBannerKey('landlord_signature', agreement.id))}
                        className={`hidden sm:block ${isTenantTurn ? 'text-blue-400 hover:text-blue-600' : 'text-purple-400 hover:text-purple-600'} transition-colors`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div className="hidden sm:block">
                        <div className="text-4xl">{isTenantTurn ? '📋' : '📝'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            case 'new-application': {
              const { count, latest } = activeBanner.data
              const hasWorkflowContext = !!(latest as any)?.propflow_thread_id
              return (
                <Card className="landlord-status-banner mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
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
                          {count === 1 ? (
                            <>
                              {/* Direct link to the specific application detail page */}
                              <Link href={`/landlord/applications/${latest.id}`}>
                                <Button className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Review Application
                                </Button>
                              </Link>
                              {/* Context-aware PropFlow: links to the application detail page
                                   with ?from=propflow so the page can auto-scroll to AI Briefing */}
                              {hasWorkflowContext && (
                                <Link href={`/landlord/applications/${latest.id}?from=propflow`}>
                                  <Button
                                    variant="outline"
                                    className="border-green-300 text-green-700 hover:bg-green-50 shadow-sm"
                                  >
                                    <Bot className="mr-2 h-4 w-4" />
                                    Continue with NEST AI
                                  </Button>
                                </Link>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Multiple applications — go to the list */}
                              <Link href="/landlord/applications">
                                <Button className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Review Applications
                                </Button>
                              </Link>
                              {/* Context-aware PropFlow — links to the applications list page */}
                              <Link href="/landlord/applications">
                                <Button
                                  variant="outline"
                                  className="border-green-300 text-green-700 hover:bg-green-50 shadow-sm"
                                >
                                  <Bot className="mr-2 h-4 w-4" />
                                  Review with NEST AI
                                </Button>
                              </Link>
                            </>
                          )}
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
              const { count, total, propflowThreadId, agreementId } = activeBanner.data
              const hasPropFlow = !!propflowThreadId && !!agreementId
              return (
                <Card className="landlord-status-banner mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm">
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
                          {hasPropFlow && (
                            <Link href={`/landlord/payments/${agreementId}`}>
                              <Button
                                variant="outline"
                                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                              >
                                <Bot className="mr-2 h-4 w-4" />
                                Review &amp; Release
                              </Button>
                            </Link>
                          )}
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
              const tenantName = recentPayment.tenant_name || 'your tenant'
              const propertyTitle = recentPayment.property_title || 'your property'
              const isRent = recentPayment.transaction_type === 'rent_payment'
              const isDeposit = recentPayment.transaction_type === 'security_deposit'

              return (
                <Card className="landlord-status-banner mb-8 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
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
                <Card className="landlord-status-banner mb-8 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm">
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
                <Card className="landlord-status-banner mb-8 border-blue-200 bg-blue-50">
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
                <Card className="landlord-status-banner mb-8 border-green-200 bg-green-50">
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
          <div className="landlord-status-banner mb-8 p-5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
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

        {/* Revenue & Payment Tracking Card */}
        <div className="mb-12">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md dark:border-emerald-500/30 dark:from-emerald-950/70 dark:to-[#0A0A0A]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl text-slate-900 dark:text-white">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    Revenue &amp; Payments
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Track rental income and payment collections</p>
                </div>
                <Link href="/landlord/payments">
                  <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100 dark:border-emerald-500/40 dark:bg-black/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-5 rounded-lg bg-white border-2 border-green-200 dark:bg-black/70 dark:border-emerald-500/40">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600">Total Collected</p>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  {showRevenueSkeleton ? (
                    <span className="inline-block h-8 w-32 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  ) : (
                    <p className="text-3xl font-bold text-green-600 mb-1">{formatCurrency(revenueDisplay.totalCollected)}</p>
                  )}
                  <p className="text-xs text-slate-500">All-time rent payments</p>
                </div>
                <div className="p-5 rounded-lg bg-white border-2 border-orange-200 dark:bg-black/70 dark:border-orange-500/40">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600">In Escrow</p>
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  {showRevenueSkeleton ? (
                    <span className="inline-block h-8 w-32 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  ) : (
                    <p className="text-3xl font-bold text-orange-600 mb-1">{formatCurrency(revenueDisplay.inEscrow)}</p>
                  )}
                  <p className="text-xs text-slate-500">{revenueDisplay.inEscrow > 0 ? 'Ready for release' : 'No pending funds'}</p>
                </div>
                <div className="p-5 rounded-lg bg-white border-2 border-emerald-200 dark:bg-black/70 dark:border-emerald-500/40">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600">Withdrawn</p>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  {showRevenueSkeleton ? (
                    <span className="inline-block h-8 w-32 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  ) : (
                    <p className="text-3xl font-bold text-emerald-600 mb-1">{formatCurrency(revenueDisplay.withdrawn)}</p>
                  )}
                  <p className="text-xs text-slate-500">Released to your bank</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-green-100 dark:border-emerald-500/20">
                <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-black/40">
                  <p className="text-xs text-slate-500 mb-1">Occupied</p>
                  {/* ✅ FIX: Only count ACTIVE (paid) agreements as occupied.
                      SIGNED agreements (both parties signed, awaiting payment)
                      are NOT yet occupied — tenant hasn't paid first month rent. */}
                  {showRevenueSkeleton ? (
                    <span className="inline-block h-7 w-12 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">{revenueDisplay.occupiedCount}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">properties</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-black/40">
                  <p className="text-xs text-slate-500 mb-1">Monthly Rate</p>
                  {showRevenueSkeleton ? (
                    <span className="inline-block h-7 w-20 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueDisplay.monthlyRevenue)}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">per month</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-black/40">
                  <p className="text-xs text-slate-500 mb-1">Pending Release</p>
                  {showRevenueSkeleton ? (
                    <span className="inline-block h-7 w-12 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  ) : (
                    <p className="text-2xl font-bold text-orange-600">{revenueDisplay.pendingRelease}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">payments</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-black/40">
                  <p className="text-xs text-slate-500 mb-1">Occupancy Rate</p>
                  {showRevenueSkeleton ? (
                    <span className="inline-block h-7 w-14 rounded bg-slate-200 animate-pulse dark:bg-white/10" />
                  ) : (
                    <p className="text-2xl font-bold text-emerald-600">{revenueDisplay.occupancyRate}%</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">occupied</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats — Expanded grid with more activity and info */}

        <div className="mb-12">

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Property Management Overview</h2>

          {/* 9 cards → 3x3 symmetric grid on large screens; 2 cols on sm; 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">



            <Link href="/landlord/properties">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
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
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Active Leases</p>
                      {(() => {
                        // ✅ FIX: Only count ACTIVE agreements (payment received).
                        // SIGNED agreements (both parties signed but tenant hasn't paid yet)
                        // are counted in the new "Agreements Signed" card instead.
                        const activeLeaseCount = agreements.filter((a: any) => {
                          const effectiveStatus = getEffectiveStatus(a)
                          return effectiveStatus === 'ACTIVE'
                        }).length
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
            
            {/* Unread Messages */}
            <Link href="/landlord/messages">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Messages</p>
                      {(() => {
                        console.log('💬 [STAT CARD DEBUG] Stats object:', stats)
                        console.log('💬 [STAT CARD DEBUG] Total messages:', stats.total_messages)
                        console.log('💬 [STAT CARD DEBUG] Unread messages:', stats.unread_messages)
                        const totalMessages = stats.total_messages || 0
                        const unreadMessages = stats.unread_messages || 0
                        return (
                          <>
                            <p className="text-xl sm:text-3xl font-bold text-blue-600 truncate">
                              {totalMessages}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {unreadMessages > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  {unreadMessages} unread
                                </span>
                              ) : totalMessages > 0 ? (
                                <span className="text-xs text-slate-400">{totalMessages} total</span>
                              ) : (
                                <span className="text-xs text-slate-400">no messages</span>
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
            
            {/* Pending Viewings */}
            <Link href="/landlord/viewings">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Viewing Requests</p>
                      {(() => {
                        console.log('📅 [STAT CARD DEBUG] All viewing requests:', viewingRequests.map((v: any) => ({ id: v.id, status: v.status })))
                        const pendingViewingCount = viewingsLoading ? 0 : viewingRequests.filter((v: any) => v.status === 'pending').length
                        const confirmedViewingCount = viewingsLoading ? 0 : viewingRequests.filter((v: any) => v.status === 'confirmed').length
                        console.log('📅 [STAT CARD DEBUG] Pending viewing count:', pendingViewingCount, 'Confirmed viewing count:', confirmedViewingCount)
                        return (
                          <>
                            <p className="text-xl sm:text-3xl font-bold text-amber-600 truncate">
                              {pendingViewingCount + confirmedViewingCount}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {pendingViewingCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  {pendingViewingCount} pending
                                </span>
                              )}
                              {confirmedViewingCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                  {confirmedViewingCount} confirmed
                                </span>
                              )}
                              {pendingViewingCount + confirmedViewingCount === 0 && (
                                <span className="text-xs text-slate-400">no requests yet</span>
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
            
            {/* Pending Applications */}
            <Link href="/landlord/applications">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Applications</p>
                      {(() => {
                        console.log('📄 [STAT CARD DEBUG] All applications:', applications.map((a: any) => ({ id: a.id, status: a.status })))
                        const allAppsCount = applicationsLoading ? 0 : applications.length
                        const pendingAppCount = applicationsLoading ? 0 : applications.filter((a: any) => normalizeAppStatus(a.status) === 'pending').length
                        const approvedAppCount = applicationsLoading ? 0 : applications.filter((a: any) => a.status === 'approved').length
                        // ✅ "Fully signed" = approved application whose agreement has been
                        // counter-signed by both tenant and landlord. This is the count
                        // the landlord most cares about for the demo: it shows that
                        // their application has actually converted into a binding
                        // agreement awaiting payment, even though it no longer shows
                        // up as "pending".
                        const fullySignedAppCount = applicationsLoading
                          ? 0
                          : applications.filter((a: any) => {
                              if (a.status !== 'approved') return false
                              const linkedAgreement = (agreements || []).find((ag: any) =>
                                ag.application_id === a.id || ag.id === a.agreement_id
                              )
                              if (!linkedAgreement) return false
                              return Boolean(linkedAgreement.tenant_signed_at && linkedAgreement.landlord_signed_at)
                            }).length
                        console.log('📄 [STAT CARD DEBUG] All:', allAppsCount, 'Pending:', pendingAppCount, 'Approved:', approvedAppCount, 'FullySigned:', fullySignedAppCount)
                        return (
                          <>
                            <p className="text-xl sm:text-3xl font-bold text-purple-600 truncate">
                              {allAppsCount}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {fullySignedAppCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  {fullySignedAppCount} fully signed
                                </span>
                              )}
                              {pendingAppCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                                  {pendingAppCount} pending review
                                </span>
                              ) : allAppsCount === 0 ? (
                                <span className="text-xs text-slate-400">no applications yet</span>
                              ) : pendingAppCount === 0 && fullySignedAppCount === 0 ? (
                                <span className="text-xs text-slate-400">{approvedAppCount} approved</span>
                              ) : null}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            {/* Agreements Signed — both parties signed (regardless of payment status) */}
            <Link href="/landlord/agreements">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Agreements Signed</p>
                      {(() => {
                        console.log('📝 [STAT CARD DEBUG] All agreements:', agreements.map((a: any) => ({ 
                          id: a.id, 
                          status: a.status,
                          effectiveStatus: getEffectiveStatus(a),
                          tenant_signed_at: a.tenant_signed_at,
                          landlord_signed_at: a.landlord_signed_at,
                          property_title: a.property?.title || a.property_title
                        })))
                        // ✅ Counts ALL agreements where BOTH parties have signed
                        // regardless of payment status. This includes:
                        // - SIGNED agreements (awaiting payment)
                        // - ACTIVE agreements (payment received)
                        // This gives landlords a complete view of all signed agreements.
                        const fullySignedCount = agreementsLoading
                          ? 0
                          : agreements.filter((a: any) => {
                              const bothSigned = Boolean(a.tenant_signed_at && a.landlord_signed_at)
                              return bothSigned
                            }).length
                        const awaitingPaymentCount = agreementsLoading
                          ? 0
                          : agreements.filter((a: any) => {
                              const bothSigned = Boolean(a.tenant_signed_at && a.landlord_signed_at)
                              const effectiveStatus = getEffectiveStatus(a)
                              return bothSigned && effectiveStatus !== 'ACTIVE'
                            }).length
                        console.log('📝 [STAT CARD DEBUG] Fully signed count:', fullySignedCount, 'Awaiting payment:', awaitingPaymentCount)
                        return (
                          <>
                            <p className="text-xl sm:text-3xl font-bold text-indigo-600 truncate">
                              {fullySignedCount}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {awaitingPaymentCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                  {awaitingPaymentCount} awaiting payment
                                </span>
                              ) : fullySignedCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  all paid
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">no signed agreements</span>
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

            {/* Pending Signatures */}
            <Link href="/landlord/agreements">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Agreements to Sign</p>
                      {(() => {
                        console.log('📝 [STAT CARD DEBUG] All agreements:', agreements.map((a: any) => ({
                          id: a.id,
                          status: a.status,
                          effectiveStatus: getEffectiveStatus(a),
                          title: a.property?.title || a.property_title,
                          tenant_signed_at: a.tenant_signed_at,
                          landlord_signed_at: a.landlord_signed_at
                        })))
                        const pendingLandlordSignCount = agreementsLoading ? 0 : agreements.filter((a: any) => getEffectiveStatus(a) === 'PENDING_LANDLORD').length
                        const pendingTenantSignCount = agreementsLoading ? 0 : agreements.filter((a: any) => getEffectiveStatus(a) === 'PENDING_TENANT').length
                        const totalPending = pendingLandlordSignCount + pendingTenantSignCount
                        console.log('📝 [STAT CARD DEBUG] Pending landlord sign count:', pendingLandlordSignCount, 'Pending tenant sign count:', pendingTenantSignCount)
                        return (
                          <>
                            <p className="text-xl sm:text-3xl font-bold text-pink-600 truncate">
                              {pendingLandlordSignCount}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {pendingLandlordSignCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                                  {pendingLandlordSignCount} waiting for you
                                </span>
                              ) : pendingTenantSignCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                  {pendingTenantSignCount} tenant reviewing
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">all signed</span>
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
                  {viewingsLoading && viewingRequests.length === 0 ? (
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
                                {request.status === 'reschedule_proposed' ? (
                                  <Badge className="bg-violet-100 text-violet-800 border-violet-200 font-semibold"><Clock className="h-3 w-3 mr-1" />Awaiting Tenant</Badge>
                                ) : isConfirmed ? (
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
                  {applicationsLoading && applications.length === 0 ? (
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
                  {agreementsLoading && agreements.length === 0 ? (
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
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
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
                    <div className="py-8 text-center">
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mb-2">No activity yet</p>
                      <p className="text-xs text-slate-600">Activity from your listings will appear here</p>
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
