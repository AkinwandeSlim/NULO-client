"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTenantDashboard } from "@/contexts/DashboardContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { Notification } from "@/contexts/NotificationContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Heart, MessageSquare, Calendar,
  MapPin, Bed, Bath, Square, Eye, Clock,
  ArrowRight, Search, Bell,
  Settings, User, Star, Zap, Activity,
  CheckCircle, AlertCircle, Building2,
  Target, Award, Users, FileText,
  X, FileCheck, DollarSign,
  AlertTriangle, CheckCheck, Loader2,
  RefreshCw, Wallet, CalendarClock, Plus, Mail, CheckCircle2,
  Home, CreditCard, TrendingUp, Bot,
} from "lucide-react"
import Link from "next/link"
import { applicationsAPI } from "@/lib/api/applications"
import { paymentsAPI, type AgreementPaymentRow } from "@/lib/api/payments"
import { useBannerDismissals } from "@/hooks/useBannerDismissals"
import {
  getEngagementLevelColor,
  getEngagementLevelTextColor,
  getEngagementLevelBgColor,
  getTrustScoreColor,
  getTrustScoreTextColor,
  getTrustScoreBgColor,
  trackEngagement,
} from "@/lib/api/engagement"
import { toast } from "sonner"
import { notificationsAPI } from "@/lib/api/notifications"
import { calculateAgreementBreakdown } from "@/lib/utils/rentalCalculations"
import { normalizeAppStatus } from "@/lib/utils/applicationStatus"
import { viewingRequestsAPI } from "@/lib/api/viewingRequestsTenant"
import { ReportIssueModal } from "@/components/maintenance/ReportIssueModal"

import {
  isBannerDismissed,
  dismissBanner as persistBannerDismissal,
  buildBannerKey,
  buildStatusHash,
} from "@/lib/bannerStorage"

const DEFAULT_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"

/**
 * Merge a fresh payment-poll response over the last known-good rows.
 *
 * The backend /api/v1/agreements/ endpoint degrades gracefully when one of
 * its batch enrichment queries hits a transient Supabase/Cloudflare error:
 * the row still comes back, but display fields (property title, landlord
 * name, NUBAN, ...) can arrive as null. Replacing state with that degraded
 * payload made the payment card flicker (titles blinking blank). This merge
 * keeps the last known-good value for any field the fresh response lost,
 * while always trusting fresh NON-null values (status, amounts, etc.).
 */
function mergePaymentRows(current: any[], incoming: any[]): any[] {
  const currentByAgreementId = new Map(
    (current || []).map((p: any) => [p?.agreement_id, p])
  )
  return (incoming || []).map((p: any) => {
    const prev = currentByAgreementId.get(p?.agreement_id)
    if (!prev) return p
    const merged: any = { ...prev, ...p }
    for (const key of Object.keys(p || {})) {
      const incomingVal = p[key]
      const prevVal = (prev as any)[key]
      const incomingEmpty = incomingVal === null || incomingVal === undefined || incomingVal === ""
      const prevHasValue =
        prevVal !== null && prevVal !== undefined && prevVal !== ""
      if (incomingEmpty && prevHasValue) {
        merged[key] = prevVal
      }
    }
    return merged
  })
}

function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
}

export default function TenantDashboard() {
  const { user } = useAuth()
  const { tenantData, loading, fetchTenantDashboard, invalidateTenantCache } = useTenantDashboard()
  const { state } = useNotifications()
  const { dismiss: dismissServerBanner, isReady: bannerDismissalsReady } = useBannerDismissals()
  const { notifications, unreadCount } = state
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [dismissedApprovalBanner, setDismissedApprovalBanner] = useState<string[]>([])

  // Track dismissed payment ready banners by agreement ID
  const [dismissedPaymentBanners, setDismissedPaymentBanners] = useState<string[]>([])

  // Track dismissed payment CONFIRMED banners by payment ID (time-based, not auto-dismissing)
  const [dismissedPaymentConfirmedBanners, setDismissedPaymentConfirmedBanners] = useState<string[]>([])

  // Track dismissed viewing confirmed banners by viewing ID
  const [dismissedViewingBanners, setDismissedViewingBanners] = useState<string[]>([])

  // Track dismissed message banners with 30-minute auto-dismiss
  const [dismissedMessageBanners, setDismissedMessageBanners] = useState<string[]>([])

  // Track dismissed tenancy status banners
  const [dismissedTenancyBanners, setDismissedTenancyBanners] = useState<string[]>([])

  // ✅ Banner dismissal: synchronous localStorage-based check (no flash, no network dependency)
  // Uses bannerStorage utility directly — see lib/bannerStorage.ts

  // Maintenance report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [rentedProperties, setRentedProperties] = useState<any[]>([])

  // ── Poller plumbing ──────────────────────────────────────────────────────
  // fetchTenantDashboard / invalidateTenantCache are recreated whenever the
  // auth `user` object changes, and recentPayments changes on every poll hit.
  // Keeping those in poller dep arrays restarted the intervals constantly, so
  // the pollers read them through refs and keep stable deps instead.
  const fetchTenantDashboardRef = useRef(fetchTenantDashboard)
  fetchTenantDashboardRef.current = fetchTenantDashboard
  const recentPaymentsRef = useRef(recentPayments)
  recentPaymentsRef.current = recentPayments

  // Shared 60s throttle for poller-triggered refreshes — no matter how many
  // pollers detect changes, the heavy dashboard endpoint is hit at most once
  // per minute.
  const lastForcedRefreshAtRef = useRef(0)
  const triggerLiveDashboardRefresh = useCallback(() => {
    const now = Date.now()
    if (now - lastForcedRefreshAtRef.current < 60_000) return
    lastForcedRefreshAtRef.current = now
    fetchTenantDashboardRef.current(true, { silent: true }).catch(() => { /* handled in context */ })
  }, [])



  useEffect(() => { setMounted(true) }, [])

  // Rented properties for the maintenance modal — derived from the dashboard
  // payload. The agreements are already fetched by the tenant dashboard
  // endpoint; a separate getMyAgreements('ACTIVE') call per mount was
  // redundant. Property status in the payload is the effective status, so
  // filtering on ACTIVE matches what the dedicated API returned.
  useEffect(() => {
    if (!tenantData?.agreements) return
    setRentedProperties(
      tenantData.agreements.filter((a: any) => a.status === 'ACTIVE')
    )
  }, [tenantData?.agreements])

  // ✅ Initialize dismissed banners from localStorage on mount (PERMANENT dismissal)
  useEffect(() => {
    if (!mounted) return

    // Restore all dismissed banners from localStorage (PERMANENT, no auto-expiration)
    const restoreDismissedBanners = () => {
      // Restore approval banners
      const storedApprovals: string[] = []
      for (const [key] of Object.entries(localStorage)) {
        if (key.startsWith('approval-banner-')) {
          storedApprovals.push(key.replace('approval-banner-', ''))
        }
      }
      if (storedApprovals.length > 0) {
        setDismissedApprovalBanner(storedApprovals)
      }

      // Restore viewing banners
      const storedViewingBanners: string[] = []
      for (const [key] of Object.entries(localStorage)) {
        if (key.startsWith('viewing-confirmed-banner-')) {
          storedViewingBanners.push(key.replace('viewing-confirmed-banner-', ''))
        }
      }
      // Also restore upcoming viewing banners
      for (const [key] of Object.entries(localStorage)) {
        if (key.startsWith('upcoming-viewing-banner-')) {
          const viewingId = key.replace('upcoming-viewing-banner-', '')
          storedViewingBanners.push(`upcoming-${viewingId}`)
        }
      }
      if (storedViewingBanners.length > 0) {
        setDismissedViewingBanners(storedViewingBanners)
      }

      // Restore payment ready banners
      const storedPaymentBanners: string[] = []
      for (const [key] of Object.entries(localStorage)) {
        if (key.startsWith('payment-ready-banner-')) {
          storedPaymentBanners.push(key.replace('payment-ready-banner-', ''))
        }
      }
      if (storedPaymentBanners.length > 0) {
        setDismissedPaymentBanners(storedPaymentBanners)
      }

      // Restore message banners
      const storedMessages: string[] = []
      for (const [key] of Object.entries(localStorage)) {
        if (key.startsWith('message-banner-')) {
          storedMessages.push(key.replace('message-banner-', ''))
        }
      }
      if (storedMessages.length > 0) {
        setDismissedMessageBanners(storedMessages)
      }

      // Restore payment confirmed banners
      const storedPaymentConfirmed = localStorage.getItem('dismissed-payment-confirmed-banners')
      if (storedPaymentConfirmed) {
        setDismissedPaymentConfirmedBanners(JSON.parse(storedPaymentConfirmed))
      }

      // Restore tenancy status banners
      const storedTenancyBanners: string[] = []
      for (const [key] of Object.entries(localStorage)) {
        if (key.startsWith('tenancy-banner-')) {
          storedTenancyBanners.push(key.replace('tenancy-banner-', ''))
        }
      }
      if (storedTenancyBanners.length > 0) {
        setDismissedTenancyBanners(storedTenancyBanners)
      }
    }

    restoreDismissedBanners()
  }, [mounted])

  // Optimized dashboard data fetching - fetch ONCE on mount
  useEffect(() => {
    if (!mounted || !user || user.user_type !== 'tenant') {
      setInitialLoad(false)
      return
    }

    // Initial load - use cached data for faster display
    const loadDashboard = async () => {
      try {
        // Use cache on initial load for instant display, unless explicitly refreshing
        await fetchTenantDashboard(false)
        // Debug: Log tenant data after fetch
        console.log('📊 [TENANT PAGE] Dashboard data loaded:', {
          stats: tenantData?.stats,
          hasAgreements: tenantData?.agreements?.length || 0,
          hasApplications: tenantData?.applications?.length || 0,
          hasViewings: tenantData?.viewingRequests?.length || 0,
          hasFavorites: tenantData?.favorites?.length || 0,
        })
      } catch (error) {
        console.error('❌ Dashboard fetch failed:', error)
      } finally {
        setInitialLoad(false)
      }
    }

    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user?.id, user?.user_type])

  // Fetch tenant payments for banner notifications
  useEffect(() => {
    if (!user?.id || user.user_type !== 'tenant') return

    const fetchPayments = async () => {
      try {
        setPaymentsLoading(true)
        const response = await paymentsAPI.getMyPayments()

        if (response.success && response.payments) {
          setRecentPayments(response.payments)
        }
      } catch (error: any) {
        // Use console.warn to avoid alarming red errors in console
        // The payment banner is not critical, so we silently fail
        console.warn('⚠️ Payments fetch failed (non-critical):', error?.response?.status || error?.message || 'Unknown error')
        // NOTE: do NOT wipe recentPayments here. A single flaky Supabase /
        // Cloudflare response used to empty the payment card until the next
        // successful 30s poll — that was the card disappearing/appearing.
        // Keep whatever rows are already in state; the poller will recover.
      } finally {
        setPaymentsLoading(false)
      }
    }

    fetchPayments()
  }, [user?.id])

  // Real-time payment polling: Check for new payments every 30 seconds
  // This ensures "Payment Confirmed" banner appears quickly without page refresh.
  // Deps are stable — payments are read through recentPaymentsRef so a payment
  // update no longer tears down and recreates the interval. Tenants with zero
  // payments still poll: the old early-return killed the poller for them, so
  // their FIRST payment confirmation was never detected live.
  useEffect(() => {
    if (!user?.id || paymentsLoading) return

    // Track consecutive failures so we can stop polling quickly
    let consecutiveFailures = 0
    const MAX_FAILURES_BEFORE_STOP = 3 // Stop after 3 consecutive failures

    const pollInterval = setInterval(async () => {
      // Skip while the tab is hidden — no wasted requests in background
      if (typeof document !== 'undefined' && document.hidden) return

      try {
        const response = await paymentsAPI.getMyPayments()

        if (response.success && response.payments) {
          // Reset failure counter on success
          consecutiveFailures = 0
          // Detect REAL payment-state changes. Rows are keyed by agreement_id.
          // A simulated/confirmed payment changes reconciliation_status and
          // total_received_amount. NOTE: disbursement_status is deliberately
          // excluded — the backend batch-enrichment query degrades to null on
          // transient Supabase/Cloudflare errors, and including it used to
          // fire "change detected" on every flaky response, causing the card
          // to flicker and forcing needless dashboard refreshes.
          const buildPaymentSignature = (payments: any[]) =>
            payments
              .map((p: any) => `${p.agreement_id}|${p.status}|${p.reconciliation_status}|${Number(p.total_received_amount ?? 0)}`)
              .sort()
              .join(',')

          const currentSignature = buildPaymentSignature(recentPaymentsRef.current)
          const nextSignature = buildPaymentSignature(response.payments)

          if (currentSignature !== nextSignature) {
            console.log('[TENANT] Payment change detected via polling - updating banner')
            // Merge new rows over the previous ones: a degraded response can
            // lose enriched display fields (property title, names, ...) even
            // though the payment state itself is fine. Keep the last known
            // good values so the UI does not flicker blank titles.
            setRecentPayments(mergePaymentRows(recentPaymentsRef.current, response.payments))

            // Refresh the dashboard (throttled to 1/min) so agreements and
            // stats reflect the new payment without waiting for the 5-min
            // auto-refresh. force=true bypasses the client cache, so a bare
            // invalidateTenantCache() call is unnecessary here.
            triggerLiveDashboardRefresh()
          }
        }
      } catch (error: any) {
        // Extract HTTP status code if available
        const status = error?.response?.status
        const isServerError = status >= 500 && status < 600

        // 401 is handled transparently by the API client's single-flight
        // refresh — if it bubbled here, the interceptor is about to redirect
        // to /signin (which tears down this interval anyway), so don't count
        // it as a polling failure or spam the console.
        if (status === 401) {
          return
        }

        consecutiveFailures += 1

        // Log first failure only (using warn to avoid alarming red errors)
        if (consecutiveFailures === 1) {
          console.warn(
            `[TENANT] Payment polling paused (server returned ${status || 'error'}). Will retry ${MAX_FAILURES_BEFORE_STOP - 1} more time(s) before stopping.`
          )
        }

        // Stop polling immediately on server errors (5xx) to reduce noise
        if (isServerError) {
          console.warn('[TENANT] Server error detected - stopping payment polling to avoid spam.')
          clearInterval(pollInterval)
          return
        }

        // Stop polling after 3 consecutive errors (non-server errors)
        if (consecutiveFailures >= MAX_FAILURES_BEFORE_STOP) {
          console.warn('[TENANT] Stopping payment polling after multiple failures.')
          clearInterval(pollInterval)
        }
      }
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(pollInterval)
  }, [user?.id, paymentsLoading, triggerLiveDashboardRefresh])

  // ── Live dashboard refresh (landlord approval / agreement availability /
  // viewing confirmation) ──
  // The landlord approves + the agreement is generated on the server while
  // the tenant is sitting on this page, and the dashboard cache TTL is 5 min.
  // Instead of forcing the full dashboard endpoint every 20s (~15 server
  // queries per tick, forever), poll two LIGHT endpoints (my applications +
  // my viewing requests) and only force the dashboard fetch when an
  // application or viewing status actually changed — throttled to once per
  // 60s. Silent = no spinner, no toasts.
  useEffect(() => {
    if (!mounted || !user?.id || user.user_type !== 'tenant') return

    const LIVE_POLL_MS = 20_000
    let inFlight = false
    let consecutiveFailures = 0
    const MAX_FAILURES = 3
    // Baseline signature from the first poll — changes are only detected
    // between polls, never against differently-shaped dashboard data.
    let baselineSignature: string | null = null

    const buildSignature = (apps: any[], viewings: any[]) =>
      `apps:${apps.map((a) => `${a.id}:${a.status}`).sort().join(',')}|vw:${viewings.map((v) => `${v.id}:${v.status}`).sort().join(',')}`

    const pollInterval = setInterval(async () => {
      // Skip when the tab is hidden — no point burning requests in background
      if (document.hidden || inFlight) return
      inFlight = true
      try {
        const [appsRes, viewingsRes] = await Promise.all([
          applicationsAPI.getMyApplicationsFast(),
          viewingRequestsAPI.getAll(),
        ])
        // Both light clients swallow errors and return success:false — treat
        // that as a failed poll so an empty list is never misread as a change
        // (which would trigger a pointless forced dashboard refresh).
        if (!appsRes?.success || !viewingsRes?.success) {
          throw new Error('light poll returned success:false')
        }
        consecutiveFailures = 0

        const sig = buildSignature(
          appsRes.applications || [],
          (viewingsRes.data as any)?.viewing_requests || [],
        )

        // First successful poll establishes the baseline — don't refresh on it
        if (baselineSignature === null) {
          baselineSignature = sig
          return
        }
        if (sig !== baselineSignature) {
          console.log('[TENANT] Application/viewing change detected via light poll — refreshing dashboard')
          baselineSignature = sig
          triggerLiveDashboardRefresh()
        }
      } catch {
        consecutiveFailures += 1
        if (consecutiveFailures >= MAX_FAILURES) {
          console.warn('[TENANT] Live dashboard polling stopped after repeated failures.')
          clearInterval(pollInterval)
        }
      } finally {
        inFlight = false
      }
    }, LIVE_POLL_MS)

    return () => clearInterval(pollInterval)
  }, [mounted, user?.id, user?.user_type, triggerLiveDashboardRefresh])

  // Show loading spinner if context is loading OR initial load
  const isLoading = loading || initialLoad

  const trackActivity = useCallback(
    async (activityType: any, metadata?: any) => {
      if (user?.id) await trackEngagement(user.id, activityType, metadata)
    },
    [user?.id]
  )

  const handleRefresh = useCallback(async () => {
    if (!user?.id || isRefreshing) return
    setIsRefreshing(true)
    try {
      invalidateTenantCache?.()
      // Force refresh the dashboard data (bypass cache)
      await fetchTenantDashboard(true)
      toast.success("Dashboard refreshed")
    } catch (error) {
      console.error('❌ Refresh failed:', error)
      toast.error("Failed to refresh dashboard")
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.id, isRefreshing, invalidateTenantCache, fetchTenantDashboard])

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      if (!notification.read) {
        try {
          // Mark as read so the unread dot + badge count clear immediately
          await notificationsAPI.markAsRead(notification.id)
          invalidateTenantCache?.()
        } catch { /* non-fatal — navigate anyway */ }
      }
      if (notification.link) router.push(notification.link)
    },
    [router, invalidateTenantCache]
  )

  const dismissBanner = useCallback((bannerKey: string) => {
    persistBannerDismissal(bannerKey)

    if (!bannerDismissalsReady) return

    const bannerType = (bannerKey.split(':')[0] || 'message') as any
    void dismissServerBanner({
      banner_key: bannerKey,
      banner_type: bannerType,
      status_hash: buildStatusHash({ banner_key: bannerKey }),
    }).catch((error) => {
      console.warn('⚠️ Failed to persist banner dismissal to server:', error)
    })
  }, [bannerDismissalsReady, dismissServerBanner])

  const userName = useMemo(
    () => user?.full_name || user?.email?.split("@")[0] || "there",
    [user?.full_name, user?.email]
  )

  const engagementDisplay = useMemo(() => {
    const score = tenantData?.stats.engagementScore ?? 0
    const level = tenantData?.stats.engagementLevel ?? "none"
    return {
      score,
      level,
      color: getEngagementLevelColor(level),
      textColor: getEngagementLevelTextColor(level),
      bgColor: getEngagementLevelBgColor(level),
      icon: level === "high" ? Award : level === "medium" ? Target : Users,
    }
  }, [tenantData?.stats.engagementScore, tenantData?.stats.engagementLevel])

  const trustDisplay = useMemo(() => {
    const score = tenantData?.stats.trustScore ?? 50
    return {
      score,
      color: getTrustScoreColor(score),
      textColor: getTrustScoreTextColor(score),
      bgColor: getTrustScoreBgColor(score),
    }
  }, [tenantData?.stats.trustScore])

  const paymentSummary = useMemo(() => {
    const totalPayments = tenantData?.stats?.totalPayments ?? 0
    const completedPayments = tenantData?.stats?.completedPayments ?? 0
    const activeAgreement =
      tenantData?.agreements?.find((a: any) => a.status === "ACTIVE") ||
      tenantData?.agreements?.find((a: any) => a.status === "SIGNED") ||
      tenantData?.agreements?.find((a: any) => a.status === "PENDING_TENANT")

    if (!activeAgreement) return { state: "no-lease" as const }

    // Use the consistent rental calculation utility
    const rentalBreakdown = calculateAgreementBreakdown(activeAgreement)
    
    let daysUntilDue: number | null = null

    if ((activeAgreement as any).lease_start_date) {
      const startDate = new Date((activeAgreement as any).lease_start_date)
      const today = new Date()
      const nextDue = new Date(startDate)
      nextDue.setMonth(today.getMonth())
      nextDue.setDate(startDate.getDate())
      if (nextDue < today) {
        nextDue.setMonth(today.getMonth() + 1)
      }
      daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Use actual payment data instead of agreement payment_pending
    if (completedPayments === 0 && totalPayments === 0) {
      return { 
        state: "due" as const, 
        rentAmount: rentalBreakdown.monthlyRent, 
        totalAnnualRent: rentalBreakdown.totalDue, 
        cautionFee: rentalBreakdown.cautionFee,
        daysUntilDue 
      }
    }
    
    return { 
      state: "paid" as const, 
      rentAmount: rentalBreakdown.monthlyRent, 
      totalAnnualRent: rentalBreakdown.totalDue, 
      cautionFee: rentalBreakdown.cautionFee,
      daysUntilDue, 
      completedPayments, 
      totalPayments 
    }
  }, [tenantData?.agreements, tenantData?.stats?.totalPayments, tenantData?.stats?.completedPayments])

  // ─── Payment Overview Card data ──────────────────────────────────────────────
  // Derived purely from recentPayments (already fetched + polled above).
  // Picks the most actionable agreement: unpaid FULL_PAYMENT first, then
  // any SIGNED/ACTIVE agreement that hasn't been fully paid yet.
  const paymentOverview = useMemo(() => {
    if (!recentPayments.length) return null

    const fmtNGN = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`

    // Frequency → human label + periods per year
    const freqMeta: Record<string, { label: string; periodsPerYear: number }> = {
      MONTHLY:     { label: "Monthly",     periodsPerYear: 12 },
      QUARTERLY:   { label: "Quarterly",   periodsPerYear: 4  },
      SEMI_ANNUAL: { label: "Semi-annual", periodsPerYear: 2  },
      ANNUAL:      { label: "Annual",      periodsPerYear: 1  },
    }

    // Sort: unpaid active agreements first
    const sorted = [...recentPayments].sort((a, b) => {
      const aActive = (a.status === "ACTIVE" || a.status === "SIGNED") ? 0 : 1
      const bActive = (b.status === "ACTIVE" || b.status === "SIGNED") ? 0 : 1
      const aPaid   = a.reconciliation_status === "FULL_PAYMENT" ? 1 : 0
      const bPaid   = b.reconciliation_status === "FULL_PAYMENT" ? 1 : 0
      return (aActive - bActive) || (aPaid - bPaid)
    })

    const row = sorted[0] as AgreementPaymentRow
    if (!row) return null

    // ✅ Only show payment overview for SIGNED and ACTIVE agreements (not pending)
    // Pending agreements shouldn't show payment details yet
    if (!["ACTIVE", "SIGNED"].includes(row.status)) {
      return null
    }

    const rentalBreakdown = calculateAgreementBreakdown(row)
    const totalRent    = rentalBreakdown.annualRent // Annual rent is total for progress bar
    const totalPaid    = Number(row.total_received_amount ?? 0)
    const outstanding  = Math.max(rentalBreakdown.periodRent - totalPaid, 0)
    const paymentPct   = totalRent > 0 ? Math.min(100, Math.round((totalPaid / totalRent) * 100)) : 0
    const isFullyPaid  = row.reconciliation_status === "FULL_PAYMENT" || totalPaid >= rentalBreakdown.periodRent

    const freq         = row.payment_frequency ?? "ANNUAL"
    const meta         = freqMeta[freq] ?? freqMeta.ANNUAL

    // Next due date: advance from lease_start by the next billing period boundary
    let nextDueDate: Date | null = null
    let daysUntilDue: number | null = null
    if (row.lease_start_date && !isFullyPaid) {
      const start   = new Date(row.lease_start_date)
      const today   = new Date()
      const monthsPerPeriod = 12 / meta.periodsPerYear
      // Walk forward until we find a due date >= today
      const candidate = new Date(start)
      while (candidate < today) {
        candidate.setMonth(candidate.getMonth() + monthsPerPeriod)
      }
      nextDueDate  = candidate
      daysUntilDue = Math.ceil((candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    const nextDueLabel = nextDueDate
      ? nextDueDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
      : null

    return {
      row,
      propertyTitle:    row.property_title || "Your Property",
      freqLabel:        meta.label,
      totalRent,
      totalPaid,
      outstanding,
      paymentPct,
      isFullyPaid,
      perPaymentAmount: rentalBreakdown.periodRent,
      perPaymentLabel:  fmtNGN(rentalBreakdown.periodRent),
      totalPaidLabel:   fmtNGN(totalPaid),
      outstandingLabel: fmtNGN(outstanding),
      nextDueLabel,
      daysUntilDue,
      hasNuban:         Boolean(row.virtual_account_number),
      agreementId:      row.agreement_id,
      totalAgreements:  recentPayments.length,
    }
  }, [recentPayments])

  // ─── Tenant Banner System ─────────────────────────────────────────────────────
  // Prevent banner conflicts by showing only the highest priority banner at a time
  // Priority order (highest to lowest):
  // 1. Payment Ready (needs action to secure rental)
  // 2. Application Approval (needs signing)
  // 3. Viewing Confirmed (upcoming event)
  // 4. Tenancy Status (informational)
  // 5. Payment Success (informational, 48h window)

  const activeBanner = useMemo(() => {
    // Priority 1: Payment Ready Banner
    const readyToPayAgreements = tenantData?.agreements?.filter((agreement: any) => {
      // ✅ Check timestamps first (source of truth) before status field
      // The status field may lag behind actual signature state
      const bothSigned = Boolean(agreement.tenant_signed_at && agreement.landlord_signed_at)
      const isSigned = agreement.status === "SIGNED" || agreement.status === "ACTIVE" || bothSigned
      const received = Number(agreement.total_received_amount ?? 0)
      const expected = Number(agreement.expected_payment_amount ?? 0)
      
      // Check if payment is complete via reconciliation status OR received amount
      const isFullyPaid =
        agreement.reconciliation_status === "FULL_PAYMENT" ||
        agreement.reconciliation_status === "RECONCILED" ||
        (received > 0 && expected > 0 && received >= expected)
      
      const needsPayment = isSigned && !isFullyPaid
      
      console.log('🔍 [PAYMENT BANNER DEBUG] Agreement:', agreement.id, {
        bothSigned,
        status: agreement.status,
        tenant_signed_at: agreement.tenant_signed_at,
        landlord_signed_at: agreement.landlord_signed_at,
        reconciliation_status: agreement.reconciliation_status,
        received,
        expected,
        isFullyPaid,
        needsPayment,
        isSigned
      })
      
      // If payment is not needed (already paid), banner should never show
      if (!needsPayment) {
        console.log('✅ [PAYMENT BANNER DEBUG] Agreement fully paid, skipping banner:', agreement.id)
        return false
      }
      
      // ALWAYS show if both are signed and payment needed - override dismissal
      // This ensures the banner reappears when status changes to signed
      if (bothSigned && needsPayment) {
        console.log('✅ [PAYMENT BANNER DEBUG] Both signed and payment needed - SHOWING BANNER:', agreement.id)
        return true
      }
      
      // For other cases, check dismissal
      const isDismissed = 
        isBannerDismissed(buildBannerKey('agreement_signed', `payment-${agreement.id}`)) ||
        dismissedPaymentBanners.includes(agreement.id)
      
      console.log('🔍 [PAYMENT BANNER DEBUG] Dismissal check:', {
        agreementId: agreement.id,
        isDismissed,
        bannerKey: buildBannerKey('agreement_signed', `payment-${agreement.id}`),
        dismissedPaymentBanners
      })
      
      return !isDismissed
    }) || []

    if (readyToPayAgreements.length > 0) {
      return { type: 'payment-ready', data: readyToPayAgreements[0] }
    }

    // Priority 2: Application Approval Banner
    // Trigger: agreement waiting for tenant signature (PENDING_TENANT), OR
    //          approved application without an agreement yet (edge case).
    const pendingAgreements = tenantData?.agreements?.filter((agreement: any) => {
      const isPending = agreement.status === "PENDING_TENANT" ||
                       (agreement.status === "PENDING" && !agreement.tenant_signed_at)
      return isPending && !isBannerDismissed(buildBannerKey('agreement_signed', agreement.id)) && !dismissedApprovalBanner.includes(agreement.id)
    }) || []

    // Also detect approved applications that haven't produced an agreement yet.
    // The PropFlow workflow sets agreement_drafted which creates the agreement row,
    // so this is defensive — it catches any race where the agreement hasn't been
    // created but the application is approved.
    const approvedNoAgreement = tenantData?.applications?.filter((app: any) => {
      if (app.status !== "approved") return false
      const hasAgreement = tenantData?.agreements?.some(
        (a: any) => a.property_id === app.property_id
      )
      return !hasAgreement && !dismissedApprovalBanner.includes(app.id)
    }) || []

    const approvalData = pendingAgreements.length > 0
      ? { type: 'approval' as const, data: pendingAgreements[0] }
      : approvedNoAgreement.length > 0
        ? { type: 'approval' as const, data: approvedNoAgreement[0] }
        : null

    if (approvalData) {
      return approvalData
    }

    // Priority 3: Viewing Confirmed Banner
    const viewingConfirmed = tenantData?.viewingRequests?.filter((viewing: any) => {
      const isViewingConfirmed = viewing.status === 'confirmed'
      const isNotDismissed = !isBannerDismissed(buildBannerKey('viewing_confirmed', viewing.id)) && !dismissedViewingBanners.includes(viewing.id)
      return isViewingConfirmed && isNotDismissed
    }) || []

    if (viewingConfirmed.length > 0) {
      return { type: 'viewing', data: viewingConfirmed[0] }
    }

    // Priority 4: Tenancy Status Banner
    if (tenantData?.agreements && tenantData.agreements.length > 0) {
      const activeAgreement = tenantData.agreements.find((a: any) => a.status === 'ACTIVE')
      const isActive = !!activeAgreement
      const bannerId = `tenancy-${isActive ? 'active' : 'pending'}`
      if (!isBannerDismissed(buildBannerKey('tenancy_status', bannerId)) && !dismissedTenancyBanners.includes(bannerId)) {
        return { type: 'tenancy', data: { isActive, activeAgreement, agreements: tenantData.agreements } }
      }
    }

    // Priority 5: Payment Success Banner (48h window)
    if (paymentSummary.state === "paid" && (tenantData?.stats?.completedPayments ?? 0) > 0) {
      const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
      const recentlyActivated = tenantData?.agreements?.some((a: any) =>
        (a.status === "ACTIVE" || a.status === "SIGNED") &&
        new Date(a.updated_at ?? a.created_at).getTime() > fortyEightHoursAgo
      )
      if (recentlyActivated) {
        return { type: 'payment-success', data: null }
      }
    }

    return null
  }, [tenantData, dismissedPaymentBanners, dismissedApprovalBanner, dismissedViewingBanners, dismissedTenancyBanners, paymentSummary])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency", currency: "NGN",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(price)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBD"
    return new Date(dateStr).toLocaleDateString("en-NG", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    })
  }

  const formatTimeSlot = (slot: string) =>
    ({ morning: "Morning (9AM-12PM)", afternoon: "Afternoon (12PM-4PM)", evening: "Evening (4PM-7PM)" }
      [slot?.toLowerCase()] ?? slot)

  const formatViewingType = (type: string) =>
    ({ PHYSICAL: "Physical", VIRTUAL: "Virtual", LIVE_VIDEO: "Live Video" }[type] ?? type)

 

  const showSkeletons = isRefreshing
  const fmtNGN = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`
  const hasActiveLease = tenantData?.agreements?.some((a: any) => a.status === "ACTIVE")
  const hasSignedLease = tenantData?.agreements?.some((a: any) => a.status === "SIGNED")

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="border-orange-200 bg-white/80">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
            <div className="space-y-5">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!tenantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-slate-600 mb-6">We couldn't load your dashboard data. Please try again.</p>
          <Button onClick={handleRefresh} disabled={isRefreshing} className="bg-orange-500 hover:bg-orange-600">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Retrying..." : "Try Again"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="tenant-dashboard min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Partial-load warning ── */}
        {!tenantData.isComplete && (tenantData.failedSections?.length ?? 0) > 0 && (
          <div className="tenant-status-banner flex items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                Some sections couldn't load ({tenantData.failedSections!.join(", ")}). Data may be incomplete.
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100"
              onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Retry
            </Button>
          </div>
        )}

        {/* ── Hero ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-1">
              Welcome back, {userName}!
            </h1>
            <p className="text-slate-600 text-sm">
              {hasActiveLease
                ? "Manage your active tenancy and payments"
                : hasSignedLease
                ? "You have a signed agreement — complete your payment to activate"
                : "Find your next home across Nigeria"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/properties">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9">
                <Search className="mr-1.5 h-3.5 w-3.5" />Browse
              </Button>
            </Link>
            <Link href="/tenant/applications">
              <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 text-sm h-9">
                <FileText className="mr-1.5 h-3.5 w-3.5" />Applications
              </Button>
            </Link>
            <Link href="/tenant/viewings">
              <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 text-sm h-9">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />Viewings
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50 h-9 w-9 p-0"
              onClick={handleRefresh} disabled={isRefreshing} title="Refresh">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Link href="/tenant/messages">
              <Button variant="outline" size="sm" className="relative border-orange-200 text-orange-700 hover:bg-orange-50 h-9 w-9 p-0">
                <MessageSquare className="h-4 w-4" />
                {(tenantData?.stats.unreadMessages ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {tenantData.stats.unreadMessages}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/tenant/profile">
              <Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50 h-9 w-9 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>


        {/* ── Priority Banner ── */}
        {activeBanner && (() => {
          switch (activeBanner.type) {
            case "payment-ready": {
              const a = activeBanner.data as any
              const bothSigned = Boolean(a.tenant_signed_at && a.landlord_signed_at)
              const matchingApp = tenantData?.applications?.find(
                (app: any) => app.property_id === a.property_id && app.propflow_thread_id
              )
              const hasPropFlow = !!matchingApp?.propflow_thread_id
              return (
                <div className="tenant-status-banner flex items-center justify-between gap-4 px-4 py-3 rounded-xl border-2 border-purple-200 bg-purple-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-purple-900">
                        {bothSigned
                          ? "✅ Both parties signed! Complete payment to activate your tenancy"
                          : "Agreement signed — make your payment to activate tenancy"}
                      </p>
                      <p className="text-xs text-purple-700 truncate">{a.property_title || "Your property"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/tenant/agreements/${a.id}`}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs">Pay Now</Button>
                    </Link>
                    {hasPropFlow && (
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('propflow:open', {
                            detail: {
                              workflow_id: matchingApp!.propflow_thread_id,
                              bothSigned: true  // skip sign stage – show payment simulation
                            }
                          }))
                          setDismissedPaymentBanners(p => [...p, a.id])
                          dismissBanner(buildBannerKey("agreement_signed", `payment-${a.id}`))
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 text-xs font-semibold shadow-sm transition-all duration-150"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        Continue in PropFlow
                      </button>
                    )}
                    <button onClick={() => { setDismissedPaymentBanners(p => [...p, a.id]); dismissBanner(buildBannerKey("agreement_signed", `payment-${a.id}`)) }}
                      className="text-purple-400 hover:text-purple-600" aria-label="Dismiss">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            }
            case "approval": {
              const a = activeBanner.data as any
              const matchingApp = tenantData?.applications?.find(
                (app: any) => app.property_id === a.property_id && app.propflow_thread_id
              )
              const hasPropFlow = !!matchingApp?.propflow_thread_id
              // When the banner data is an actual agreement (PENDING_TENANT),
              // deep-link straight to the agreement detail page for the
              // read-then-sign flow. When it's just an approved application
              // (agreement not yet generated), fall back to the list page.
              const isAgreement = a.status !== "approved"
              const signHref = isAgreement && a.id
                ? `/tenant/agreements/${a.id}`
                : "/tenant/agreements"
              return (
                <div className="tenant-status-banner flex items-center justify-between gap-4 px-4 py-3 rounded-xl border-2 border-green-200 bg-green-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-green-900">Application approved — sign your rental agreement</p>
                      <p className="text-xs text-green-700 truncate">{a.property_title || "Your property"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={signHref}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                        onClick={() => { setDismissedApprovalBanner(p => [...p, a.id]); dismissBanner(buildBannerKey("agreement_signed", a.id)) }}>
                        Sign Now
                      </Button>
                    </Link>
                    {hasPropFlow && (
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('propflow:open', {
                            detail: {
                              workflow_id: matchingApp!.propflow_thread_id,
                              // Pass the agreement id (when the banner is an
                              // agreement) so the chat card deep-links straight
                              // to the read-then-sign page.
                              agreement_id: isAgreement ? a.id : undefined,
                            }
                          }))
                          setDismissedApprovalBanner(p => [...p, a.id])
                          dismissBanner(buildBannerKey("agreement_signed", a.id))
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 text-xs font-semibold shadow-sm transition-all duration-150"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        Continue in PropFlow
                      </button>
                    )}
                    <button onClick={() => { setDismissedApprovalBanner(p => [...p, a.id]); dismissBanner(buildBannerKey("agreement_signed", a.id)) }}
                      className="text-green-400 hover:text-green-600" aria-label="Dismiss">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            }
            case "viewing": {
              const v = activeBanner.data as any
              return (
                <div className="tenant-status-banner flex items-center justify-between gap-4 px-4 py-3 rounded-xl border-2 border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-blue-900 truncate">
                      Viewing confirmed — {v.property_title || "Property"} on {v.confirmed_date ? new Date(v.confirmed_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "your scheduled date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href="/tenant/viewings">
                      <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 h-8 text-xs">View</Button>
                    </Link>
                    <button onClick={() => { setDismissedViewingBanners(p => [...p, v.id]); dismissBanner(buildBannerKey("viewing_confirmed", v.id)) }}
                      className="text-blue-400 hover:text-blue-600" aria-label="Dismiss">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            }
            case "tenancy": {
              const { isActive, activeAgreement: aa, agreements } = activeBanner.data as any
              const bannerId = `tenancy-${isActive ? "active" : "pending"}`
              return (
                <div className={`tenant-status-banner flex items-center justify-between gap-4 px-4 py-3 rounded-xl border-2 ${isActive ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {isActive
                      ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      : <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />}
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-green-900" : "text-amber-900"}`}>
                      {isActive
                        ? `Tenancy active — ${aa?.property_title || "your property"}`
                        : `${agreements?.length ?? 0} agreement${(agreements?.length ?? 0) !== 1 ? "s" : ""} pending — complete your application`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={isActive ? "/tenant/active-rent" : "/tenant/applications"}>
                      <Button size="sm" className={`h-8 text-xs ${isActive ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"} text-white`}>
                        {isActive ? "Manage" : "View"}
                      </Button>
                    </Link>
                    <button onClick={() => { setDismissedTenancyBanners(p => [...p, bannerId]); dismissBanner(buildBannerKey("tenancy_status", bannerId)) }}
                      className={`${isActive ? "text-green-400 hover:text-green-600" : "text-amber-400 hover:text-amber-600"}`} aria-label="Dismiss">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            }
            case "payment-success":
              return (
                <div className="tenant-status-banner flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-green-200 bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                  <p className="text-sm font-semibold text-green-900 flex-1">Payment received — tenancy is active!</p>
                  <Link href="/tenant/payments">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">View Receipt</Button>
                  </Link>
                </div>
              )
            default: return null
          }
        })()}


        {/* ── Payment Overview Card ── */}
        {/* Only show when payment data is loaded and there's an actionable payment */}
        {paymentOverview && (
              <Card className={`border-2 bg-white/90 shadow-sm ${
                paymentOverview.isFullyPaid ? "border-green-200"
                : paymentOverview.daysUntilDue !== null && paymentOverview.daysUntilDue <= 3 ? "border-red-200"
                : "border-orange-200"
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${paymentOverview.isFullyPaid ? "bg-green-100" : "bg-orange-100"}`}>
                        <CreditCard className={`w-4 h-4 ${paymentOverview.isFullyPaid ? "text-green-600" : "text-orange-600"}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Payment Overview</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{paymentOverview.propertyTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs border ${paymentOverview.isFullyPaid ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"}`}>
                        {paymentOverview.freqLabel}
                      </Badge>
                      {paymentOverview.totalAgreements > 1 && (
                        <Badge className="text-xs bg-slate-100 text-slate-600 border-slate-200">{paymentOverview.totalAgreements} leases</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Payment progress</span>
                      <span className={`text-xs font-bold ${paymentOverview.isFullyPaid ? "text-green-600" : "text-orange-600"}`}>{paymentOverview.paymentPct}%</span>
                    </div>
                    <Progress value={paymentOverview.paymentPct} className="h-2" style={{ ["--progress-color" as string]: paymentOverview.isFullyPaid ? "#22c55e" : "#f97316" }} />
                    <style>{`[role="progressbar"] > div { background-color: var(--progress-color, #f97316); }`}</style>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                      <p className="text-xs text-slate-500 mb-0.5">Per payment</p>
                      <p className="text-sm font-bold text-orange-700 truncate">{paymentOverview.perPaymentLabel}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-green-50 border border-green-100">
                      <p className="text-xs text-slate-500 mb-0.5">Paid so far</p>
                      <p className="text-sm font-bold text-green-700 truncate">{paymentOverview.totalPaidLabel}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${paymentOverview.isFullyPaid ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"}`}>
                      <p className="text-xs text-slate-500 mb-0.5">Outstanding</p>
                      <p className={`text-sm font-bold truncate ${paymentOverview.isFullyPaid ? "text-green-700" : "text-amber-700"}`}>
                        {paymentOverview.isFullyPaid ? "₦0" : paymentOverview.outstandingLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {paymentOverview.isFullyPaid ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span className="text-xs font-medium text-green-700">Fully paid · Tenancy active</span></>
                      ) : paymentOverview.nextDueLabel ? (
                        <><CalendarClock className={`w-4 h-4 shrink-0 ${paymentOverview.daysUntilDue !== null && paymentOverview.daysUntilDue <= 3 ? "text-red-500" : "text-slate-400"}`} />
                        <span className={`text-xs font-medium ${paymentOverview.daysUntilDue !== null && paymentOverview.daysUntilDue <= 3 ? "text-red-600" : "text-slate-600"}`}>
                          {paymentOverview.daysUntilDue === 0 ? "Due today" : (paymentOverview.daysUntilDue ?? 0) < 0 ? "Overdue" : `Next: ${paymentOverview.nextDueLabel}`}
                          {(paymentOverview.daysUntilDue ?? 0) > 0 && <span className="text-slate-400 font-normal ml-1">({paymentOverview.daysUntilDue}d)</span>}
                        </span></>
                      ) : <span className="text-xs text-slate-400">No lease dates set</span>}
                    </div>
                    <Link href={`/tenant/payments/${paymentOverview.agreementId}`}
                      onClick={(e) => {
                        // Check if both parties have signed
                        const { tenant_signed_at, landlord_signed_at } = paymentOverview.row
                        if (!paymentOverview.isFullyPaid && (!tenant_signed_at || !landlord_signed_at)) {
                          e.preventDefault()
                          toast.warning("Please wait for both parties to sign the agreement before making payment")
                        }
                      }}
                    >
                      <Button size="sm" className={`h-8 text-xs shrink-0 ${paymentOverview.isFullyPaid ? "border-green-300 text-green-700 hover:bg-green-50" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
                        variant={paymentOverview.isFullyPaid ? "outline" : "default"}>
                        {paymentOverview.isFullyPaid ? <><Eye className="w-3.5 h-3.5 mr-1.5" />Receipt</> : <><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Pay Now</>}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

        {/* ── 8-cell Activity Stats (mirrors landlord) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">Your Activity</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: engagementDisplay.level === "high" ? "#22c55e" : engagementDisplay.level === "medium" ? "#f97316" : "#94a3b8" }} />
                <span className="text-xs text-slate-500 capitalize">{engagementDisplay.level} activity</span>
              </div>
              <Badge className={`${trustDisplay.bgColor} ${trustDisplay.textColor} border-0 text-xs`}>Trust {trustDisplay.score}/100</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {(() => {
              // Compute shared derivations once
              const allAgreements = tenantData?.agreements ?? []
              // ✅ ACTIVE = payment received (the only true "Active Lease")
              const activeAgreements = allAgreements.filter((a: any) => a.status === "ACTIVE")
              // ✅ "Fully signed" includes SIGNED + ACTIVE + both timestamps present.
              // Used for the Agreements card to show "X signed" completion count.
              const signedAgreements = allAgreements.filter((a: any) =>
                a.status === "SIGNED" ||
                a.status === "ACTIVE" ||
                (a.tenant_signed_at && a.landlord_signed_at)
              )
              // ✅ "Signed but not yet paid" = SIGNED-only (no payment yet).
              // Used for the Active Lease card pill to surface "awaiting payment"
              // without falsely showing it when everything is already paid.
              const signedNotActive = allAgreements.filter((a: any) => {
                const isActive = a.status === "ACTIVE"
                const isSigned = a.status === "SIGNED" || (a.tenant_signed_at && a.landlord_signed_at)
                return isSigned && !isActive
              })
              // Agreements that still need the CURRENT tenant's signature
              const awaitingTenantSign = allAgreements.filter((a: any) =>
                !a.tenant_signed_at &&
                a.landlord_signed_at &&
                a.status !== "REJECTED" && a.status !== "CANCELLED" && a.status !== "EXPIRED"
              )
              // Agreements that still need the LANDLORD's signature
              // (tenant has signed, landlord hasn't yet)
              const awaitingLandlordSign = allAgreements.filter((a: any) =>
                a.tenant_signed_at &&
                !a.landlord_signed_at &&
                a.status !== "REJECTED" && a.status !== "CANCELLED" && a.status !== "EXPIRED"
              )
              const allApplications = tenantData?.applications ?? []
              const pendingApps = allApplications.filter((a: any) => normalizeAppStatus(a.status) === "pending")
              const approvedApps = allApplications.filter((a: any) => a.status === "approved")
              const allViewings = tenantData?.viewingRequests ?? []
              const pendingViewings = allViewings.filter((v: any) => v.status === "pending")
              const confirmedViewings = allViewings.filter((v: any) => v.status === "confirmed")
              const totalFavorites = tenantData?.favorites?.length ?? 0
              const completedPayments = tenantData?.stats?.completedPayments ?? 0
              const totalPayments = tenantData?.stats?.totalPayments ?? 0
              const totalMessages = tenantData?.stats?.totalConversations ?? 0
              const unreadMessages = tenantData?.stats?.unreadMessages ?? 0
              const propertiesContacted = tenantData?.stats?.propertiesContacted ?? 0

              const cards: Array<{
                key: string
                href: string | null
                icon: any
                bg: string
                iconCls: string
                value: number
                label: string
                valueCls: string
                pills: Array<{ text: string; bg: string; textCls: string; dot: string; pulse?: boolean }>
                emptyText: string
              }> = [
                {
                  key: "active-lease",
                  href: "/tenant/active-rent",
                  icon: Home,
                  bg: "bg-emerald-100",
                  iconCls: "text-emerald-600",
                  value: activeAgreements.length,
                  label: "Active Lease",
                  valueCls: "text-emerald-600",
                  // ✅ FIX: Pill only shows "X signed · pay pending" when there is
                  // at least one SIGNED-but-not-ACTIVE agreement. If all signed
                  // agreements are paid (ACTIVE), show "all paid up" instead.
                  pills: signedNotActive.length > 0
                    ? [{ text: `${signedNotActive.length} signed · pay pending`, bg: "bg-amber-50", textCls: "text-amber-700", dot: "bg-amber-500" }]
                    : activeAgreements.length === 0
                      ? []
                      : [{ text: "all paid up", bg: "bg-emerald-50", textCls: "text-emerald-700", dot: "bg-emerald-500" }],
                  emptyText: "no active lease",
                },
                {
                  key: "applications",
                  href: "/tenant/applications",
                  icon: FileText,
                  bg: "bg-blue-100",
                  iconCls: "text-blue-600",
                  value: allApplications.length,
                  label: "Applications",
                  valueCls: "text-blue-600",
                  pills: [
                    ...(approvedApps.length > 0 ? [{ text: `${approvedApps.length} approved`, bg: "bg-emerald-50", textCls: "text-emerald-700", dot: "bg-emerald-500" }] : []),
                    ...(pendingApps.length > 0 ? [{ text: `${pendingApps.length} pending`, bg: "bg-amber-50", textCls: "text-amber-700", dot: "bg-amber-500" }] : []),
                  ],
                  emptyText: "no applications yet",
                },
                {
                  key: "agreements",
                  href: "/tenant/agreements",
                  icon: FileCheck,
                  bg: "bg-indigo-100",
                  iconCls: "text-indigo-600",
                  value: allAgreements.length,
                  label: "Agreements",
                  valueCls: "text-indigo-600",
                  pills: [
                    ...(signedAgreements.length > 0 ? [{ text: `${signedAgreements.length} signed`, bg: "bg-emerald-50", textCls: "text-emerald-700", dot: "bg-emerald-500" }] : []),
                    // Most-urgent first: YOUR signature pending beats landlord's
                    ...(awaitingTenantSign.length > 0 ? [{ text: `${awaitingTenantSign.length} to sign (you)`, bg: "bg-pink-50", textCls: "text-pink-700", dot: "bg-pink-500", pulse: true }] : []),
                    ...(awaitingLandlordSign.length > 0 ? [{ text: `${awaitingLandlordSign.length} landlord to sign`, bg: "bg-sky-50", textCls: "text-sky-700", dot: "bg-sky-500" }] : []),
                  ],
                  emptyText: "no agreements",
                },
                {
                  key: "viewings",
                  href: "/tenant/viewings",
                  icon: Calendar,
                  bg: "bg-teal-100",
                  iconCls: "text-teal-600",
                  value: allViewings.length,
                  label: "Viewings",
                  valueCls: "text-teal-600",
                  pills: [
                    ...(confirmedViewings.length > 0 ? [{ text: `${confirmedViewings.length} confirmed`, bg: "bg-emerald-50", textCls: "text-emerald-700", dot: "bg-emerald-500" }] : []),
                    ...(pendingViewings.length > 0 ? [{ text: `${pendingViewings.length} pending`, bg: "bg-amber-50", textCls: "text-amber-700", dot: "bg-amber-500" }] : []),
                  ],
                  emptyText: "no viewings yet",
                },
                {
                  key: "messages",
                  href: "/tenant/messages",
                  icon: MessageSquare,
                  bg: "bg-purple-100",
                  iconCls: "text-purple-600",
                  value: totalMessages,
                  label: "Messages",
                  valueCls: "text-purple-600",
                  pills: unreadMessages > 0
                    ? [{ text: `${unreadMessages} unread`, bg: "bg-orange-50", textCls: "text-orange-700", dot: "bg-orange-500", pulse: true }]
                    : [],
                  emptyText: totalMessages === 0 ? "no messages yet" : "all caught up",
                },
                {
                  key: "favorites",
                  href: "/tenant/favorites",
                  icon: Heart,
                  bg: "bg-rose-100",
                  iconCls: "text-rose-600",
                  value: totalFavorites,
                  label: "Favorites",
                  valueCls: "text-rose-600",
                  pills: totalFavorites > 0
                    ? [{ text: "saved properties", bg: "bg-rose-50", textCls: "text-rose-700", dot: "bg-rose-500" }]
                    : [],
                  emptyText: "no favorites yet",
                },
                {
                  key: "payments",
                  href: "/tenant/payments",
                  icon: Wallet,
                  bg: "bg-amber-100",
                  iconCls: "text-amber-600",
                  value: totalPayments,
                  label: "Payments",
                  valueCls: "text-amber-600",
                  pills: [
                    ...(completedPayments > 0 ? [{ text: `${completedPayments} completed`, bg: "bg-emerald-50", textCls: "text-emerald-700", dot: "bg-emerald-500" }] : []),
                    ...((totalPayments - completedPayments) > 0 ? [{ text: `${totalPayments - completedPayments} pending`, bg: "bg-orange-50", textCls: "text-orange-700", dot: "bg-orange-500" }] : []),
                  ],
                  emptyText: "no payments yet",
                },
                {
                  key: "contacted",
                  href: "/tenant/messages",
                  icon: Mail,
                  bg: "bg-sky-100",
                  iconCls: "text-sky-600",
                  value: propertiesContacted,
                  label: "Properties Contacted",
                  valueCls: "text-sky-600",
                  pills: propertiesContacted > 0
                    ? [{ text: "landlords reached", bg: "bg-sky-50", textCls: "text-sky-700", dot: "bg-sky-500" }]
                    : [],
                  emptyText: "no outreach yet",
                },
              ]

              return cards.map((card) => {
                const Icon = card.icon
                const cardBody = (
                  <Card className="border-orange-200 bg-white/80 backdrop-blur-sm h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 ${card.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconCls}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">{card.label}</p>
                          <p className={`text-xl sm:text-3xl font-bold ${card.valueCls} truncate`}>{card.value}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {card.pills.length > 0
                              ? card.pills.map((pill, i) => (
                                  <span key={i} className={`inline-flex items-center gap-1 text-xs font-medium ${pill.textCls} ${pill.bg} px-2 py-0.5 rounded-full`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${pill.dot} ${pill.pulse ? "animate-pulse" : ""}`} aria-hidden="true" />
                                    {pill.text}
                                  </span>
                                ))
                              : <span className="text-xs text-slate-400">{card.emptyText}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
                return card.href ? (
                  <Link key={card.key} href={card.href}>{cardBody}</Link>
                ) : (
                  <div key={card.key}>{cardBody}</div>
                )
              })
            })()}
          </div>
        </div>


        {/* ── Main 2-col grid ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">

            {/* Active Rent Panel — only when has active/signed lease */}
            {(hasActiveLease || hasSignedLease) && (() => {
              const activeLease = tenantData?.agreements?.find((a: any) => a.status === "ACTIVE" || a.status === "SIGNED")
              if (!activeLease) return null
              const leaseRow = recentPayments.find(p => p.agreement_id === activeLease.id) ?? recentPayments[0]
              return (
                <Card className="border-emerald-200 bg-white/90 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Home className="w-4 h-4 text-emerald-600" />
                      Active Rent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Property</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">{activeLease.property?.title || (activeLease as any).property_title || "—"}</p>
                        <p className="text-xs text-slate-500 truncate">{activeLease.property?.location || (activeLease as any).property_city || ""}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Landlord</p>
                        <p className="text-sm font-semibold text-slate-900">{(activeLease as any).landlord?.full_name || (activeLease as any).landlord_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Lease period</p>
                        <p className="text-sm font-medium text-slate-700">
                          {activeLease.lease_start_date ? new Date(activeLease.lease_start_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          {" → "}
                          {activeLease.lease_end_date ? new Date(activeLease.lease_end_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </p>
                      </div>
                      {leaseRow?.virtual_account_number && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Your NUBAN</p>
                          <code className="text-sm font-mono font-semibold text-slate-900">{leaseRow.virtual_account_number}</code>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {leaseRow?.agreement_id && (
                        <Link href={`/tenant/payments/${leaseRow.agreement_id}`}>
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs">
                            <Wallet className="w-3.5 h-3.5 mr-1.5" />Manage Payment
                          </Button>
                        </Link>
                      )}
                      <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 h-8 text-xs"
                        onClick={() => setReportModalOpen(true)}>
                        <Settings className="w-3.5 h-3.5 mr-1.5" />Report Issue
                      </Button>
                      <Link href="/tenant/agreements">
                        <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs">
                          <FileCheck className="w-3.5 h-3.5 mr-1.5" />Agreement
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Payment History Summary */}
            {recentPayments.length > 0 && (
              <Card className="border-orange-200 bg-white/90 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wallet className="w-4 h-4 text-orange-600" />
                      Payment History
                    </CardTitle>
                    <Link href="/tenant/payments">
                      <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 h-7 text-xs">
                        View all <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Received</th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="py-2.5 px-4" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentPayments.slice(0, 4).map((p: AgreementPaymentRow) => {
                          const isPaid = p.reconciliation_status === "FULL_PAYMENT"
                          const isPartial = p.reconciliation_status === "UNDERPAYMENT"
                          return (
                            <tr key={p.agreement_id} className="hover:bg-orange-50/40 transition-colors">
                              <td className="py-3 px-4">
                                <p className="text-sm font-medium text-slate-900 truncate max-w-[140px]">{p.property_title || "—"}</p>
                                <p className="text-xs text-slate-400">{p.property_city || ""}</p>
                              </td>
                              <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                                {fmtNGN(Number(p.expected_payment_amount ?? p.rent_amount ?? 0))}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-slate-700 hidden sm:table-cell">
                                {Number(p.total_received_amount ?? 0) > 0 ? fmtNGN(Number(p.total_received_amount)) : "—"}
                              </td>
                              <td className="py-3 px-4">
                                {isPaid ? (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />Paid
                                  </Badge>
                                ) : isPartial ? (
                                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Partial</Badge>
                                ) : p.virtual_account_number ? (
                                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Awaiting</Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">Pending</Badge>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link href={`/tenant/payments/${p.agreement_id}`}>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-600 hover:bg-orange-50 px-2">
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Viewings */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    My Viewings
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Link href="/tenant/viewings">
                      <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 h-7 text-xs">
                        All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showSkeletons ? <SkeletonRows count={2} /> : (tenantData?.viewingRequests?.length ?? 0) === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-3">No viewings yet</p>
                    <Link href="/properties"><Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white"><Search className="w-3.5 h-3.5 mr-1.5" />Browse</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(tenantData?.viewingRequests ?? []).slice(0, 3).map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-orange-200 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900 truncate">{req.property?.title || req.property_title || "Property"}</p>
                            {req.status === "confirmed" && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs"><CheckCircle className="w-2.5 h-2.5 mr-1" />Confirmed</Badge>}
                            {req.status === "pending" && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Pending</Badge>}
                            {req.status === "completed" && <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Done</Badge>}
                          </div>
                          <p className="text-xs text-slate-500">{formatDate(req.preferred_date)}{req.time_slot ? ` · ${formatTimeSlot(req.time_slot)}` : ""}</p>
                        </div>
                        <Link href={`/properties/${req.property?.id || req.property_id}`}>
                          <Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50 h-7 text-xs ml-2 shrink-0">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Applications */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4 text-green-600" />
                    My Applications
                  </CardTitle>
                  <Link href="/tenant/applications">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 h-7 text-xs">
                      All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {showSkeletons ? <SkeletonRows count={2} /> : (tenantData?.applications?.length ?? 0) === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-3">No applications yet</p>
                    <Link href="/properties"><Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white"><Search className="w-3.5 h-3.5 mr-1.5" />Browse</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(tenantData?.applications ?? []).slice(0, 3).map((app: any) => (
                      <div key={app.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-green-200 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900 truncate">{app.property_title || "Property"}</p>
                            {app.status === "approved" && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs"><CheckCircle className="w-2.5 h-2.5 mr-1" />Approved</Badge>}
                            {app.status === "pending" && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Pending</Badge>}
                            {app.status === "rejected" && <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Rejected</Badge>}
                          </div>
                          <p className="text-xs text-slate-500">{app.property_location || ""}{app.property_price ? ` · ${formatPrice(app.property_price)}/mo` : ""}</p>
                        </div>
                        <Link href={`/tenant/applications/${app.id}`}>
                          <Button variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50 h-7 text-xs ml-2 shrink-0">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Properties */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="w-4 h-4 text-red-500" />
                    Saved Properties
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {(tenantData?.favorites?.length ?? 0) > 0 && (
                      <Link href="/tenant/favorites">
                        <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 h-7 text-xs">
                          All {tenantData?.favorites?.length} <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                    <Link href="/properties">
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs">
                        <Search className="w-3 h-3 mr-1" />Browse
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showSkeletons ? <SkeletonRows count={2} /> : (tenantData?.favorites?.length ?? 0) === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-3">No saved properties yet</p>
                    <Link href="/properties"><Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white"><Search className="w-3.5 h-3.5 mr-1.5" />Browse Properties</Button></Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(tenantData?.favorites ?? []).slice(0, 4).map((fav: any) => {
                      const imageUrl = fav?.images?.[0]?.url || fav?.property_image || fav?.images?.[0] || DEFAULT_PROPERTY_IMAGE
                      const price = Number(fav?.price || fav?.monthly_rent || 0)
                      return (
                        <Link key={fav?.id} href={`/properties/${fav?.id}`} onClick={() => trackActivity("property_viewed", { property_id: fav?.id })}>
                          <div className="group flex gap-3 p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer">
                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                              <img src={imageUrl} alt={fav?.title || "Property"} className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PROPERTY_IMAGE }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-orange-600 transition-colors">{fav?.title || "Property"}</p>
                              <p className="text-xs text-slate-500 truncate flex items-center gap-1"><MapPin className="w-3 h-3" />{fav?.location || fav?.city || "—"}</p>
                              {price > 0 && <p className="text-xs font-bold text-orange-600 mt-0.5">{formatPrice(price)}/mo</p>}
                            </div>
                            <Heart className="w-4 h-4 text-red-400 fill-red-400 shrink-0 mt-0.5" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>


          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Payment Timeline */}
            {paymentOverview && paymentOverview.row?.lease_start_date && (
              <Card className="border-orange-200 bg-white/90 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarClock className="w-4 h-4 text-orange-600" />
                      Payment Timeline
                    </CardTitle>
                    <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                      {paymentOverview.freqLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const freqMeta: Record<string, number> = {
                      MONTHLY: 12, QUARTERLY: 4, SEMI_ANNUAL: 2, ANNUAL: 1,
                    }
                    const periodsPerYear = freqMeta[paymentOverview.row.payment_frequency ?? "ANNUAL"] ?? 1
                    const monthsPerPeriod = 12 / periodsPerYear
                    const leaseStart = new Date(paymentOverview.row.lease_start_date!)
                    const today = new Date()
                    
                    const periods: Array<{
                      date: Date
                      label: string
                      isPaid: boolean
                      isCurrent: boolean
                      daysLeft: number | null
                    }> = []

                    for (let i = 0; i < periodsPerYear; i++) {
                      const periodDate = new Date(leaseStart)
                      periodDate.setMonth(leaseStart.getMonth() + i * monthsPerPeriod)
                      
                      const daysUntil = Math.ceil((periodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      const isCurrent = daysUntil >= 0 && daysUntil <= 30
                      
                      const totalPaidSoFar = Number(paymentOverview.row.total_received_amount ?? 0)
                      const amountForThisPeriod = paymentOverview.perPaymentAmount * (i + 1)
                      const isPaid = totalPaidSoFar >= amountForThisPeriod

                      periods.push({
                        date: periodDate,
                        label: periodDate.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
                        isPaid,
                        isCurrent,
                        daysLeft: isCurrent && !isPaid ? daysUntil : null,
                      })
                    }

                    const visiblePeriods = periods.slice(0, Math.min(6, periodsPerYear))

                    return (
                      <div className="space-y-1.5">
                        {visiblePeriods.map((period, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                              period.isPaid
                                ? "bg-green-50 border-green-200"
                                : period.isCurrent
                                ? "bg-orange-50 border-orange-300"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div
                              className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                                period.isPaid
                                  ? "bg-green-500"
                                  : period.isCurrent
                                  ? "bg-orange-500 animate-pulse"
                                  : "bg-slate-300"
                              }`}
                            >
                              {period.isPaid ? (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              ) : period.isCurrent ? (
                                <Clock className="h-3 w-3 text-white" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <p className={`text-xs font-semibold flex-1 ${
                              period.isPaid ? "text-green-900" : period.isCurrent ? "text-orange-900" : "text-slate-600"
                            }`}>
                              {period.label}
                            </p>
                            {period.isPaid ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            ) : period.daysLeft !== null ? (
                              <Badge className={`text-xs py-0 h-5 ${
                                period.daysLeft <= 3
                                  ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
                                  : period.daysLeft <= 7
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-orange-100 text-orange-700 border-orange-200"
                              }`}>
                                {period.daysLeft === 0 ? "Today" : `${period.daysLeft}d`}
                              </Badge>
                            ) : null}
                          </div>
                        ))}
                        {periodsPerYear > 6 && (
                          <p className="text-xs text-center text-slate-400 pt-1">
                            +{periodsPerYear - 6} more
                          </p>
                        )}
                        <Link href={`/tenant/payments/${paymentOverview.agreementId}`} className="block">
                          <Button variant="outline" size="sm" className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-50 h-7 text-xs">
                            View Full Payment Details
                          </Button>
                        </Link>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="w-4 h-4 text-orange-600" />
                    Notifications
                  </CardTitle>
                  {unreadCount > 0 && <Badge className="bg-orange-500 text-white text-xs animate-pulse">{unreadCount}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                {(!notifications || notifications.length === 0) ? (
                  <div className="text-center py-6">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.slice(0, 5).map((notif: Notification) => (
                      <div key={notif.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:border-orange-200 cursor-pointer transition-colors"
                        onClick={() => handleNotificationClick(notif)}>
                        <div className="h-7 w-7 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                          {notif.type === "message" ? <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                            : notif.type === "viewing_confirmed" ? <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            : <Bell className="h-3.5 w-3.5 text-orange-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">{notif.title}</p>
                            {!notif.read && <div className="h-1.5 w-1.5 bg-orange-500 rounded-full shrink-0 animate-pulse" />}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Messages
                  </CardTitle>
                  <Link href="/tenant/messages">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 h-7 text-xs">All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {(tenantData?.conversations?.length ?? 0) === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(tenantData?.conversations ?? []).slice(0, 3).map((conv: any) => (
                      <Link key={conv.id} href={`/tenant/messages/${conv.id}`}>
                        <div className="flex items-start justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-200 cursor-pointer transition-colors">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{conv.landlord?.full_name || conv.other_user_name || "Landlord"}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[140px]">{conv.last_message || "No messages"}</p>
                          </div>
                          {conv.unread_count > 0 && <Badge className="bg-green-500 text-white text-xs shrink-0 ml-2">{conv.unread_count}</Badge>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4 text-orange-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {[
                  { href: "/properties", icon: Search, label: "Browse Properties" },
                  { href: "/tenant/payments", icon: Wallet, label: "Payments" },
                  { href: "/tenant/agreements", icon: FileCheck, label: "Agreements" },
                  { href: "/tenant/maintenance", icon: Settings, label: "Maintenance" },
                  { href: "/tenant/profile", icon: User, label: "Profile" },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={href} href={href}>
                    <Button variant="outline" size="sm" className="w-full justify-start border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50 h-8 text-xs">
                      <Icon className="w-3.5 h-3.5 mr-2 text-orange-600" />{label}
                    </Button>
                  </Link>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.dispatchEvent(new CustomEvent('propflow:open'))}
                  className="w-full justify-start border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 h-8 text-xs font-semibold text-orange-700"
                >
                  <Bot className="w-3.5 h-3.5 mr-2 text-orange-600" />AI PropFlow Assistant
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-slate-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const items: { id: string; icon: any; iconBg: string; iconColor: string; title: string; date: string }[] = []
                  tenantData?.viewingRequests?.forEach((v: any) => items.push({
                    id: v.id, icon: Calendar,
                    iconBg: v.status === "confirmed" ? "bg-green-100" : "bg-orange-100",
                    iconColor: v.status === "confirmed" ? "text-green-600" : "text-orange-600",
                    title: `Viewing ${v.status} — ${v.property?.title || v.property_title || "Property"}`,
                    date: v.created_at,
                  }))
                  tenantData?.applications?.forEach((app: any) => items.push({
                    id: `app-${app.id}`, icon: FileText,
                    iconBg: app.status === "approved" ? "bg-green-100" : "bg-slate-100",
                    iconColor: app.status === "approved" ? "text-green-600" : "text-slate-500",
                    title: `Application ${app.status} — ${app.property_title || "Property"}`,
                    date: app.created_at,
                  }))
                  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  const visible = items.slice(0, 4)
                  return visible.length === 0 ? (
                    <div className="text-center py-4">
                      <Activity className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {visible.map(item => (
                        <div key={item.id} className="flex items-start gap-2.5">
                          <div className={`h-6 w-6 ${item.iconBg} rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                            <item.icon className={`h-3 w-3 ${item.iconColor}`} />
                          </div>
                          <p className="text-xs text-slate-700 leading-snug">{item.title}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

          </div>
        </div>

      </div>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        rentedProperties={rentedProperties.map(agreement => ({
          property_id: agreement.property_id,
          property: agreement.property ? {
            id: agreement.property.id,
            title: agreement.property.title,
            address: agreement.property.address ?? agreement.property.location ?? undefined,
            city: agreement.property.city ?? undefined,
          } : undefined,
        }))}
        onSuccess={() => { invalidateTenantCache() }}
      />

    </div>
  )
}
