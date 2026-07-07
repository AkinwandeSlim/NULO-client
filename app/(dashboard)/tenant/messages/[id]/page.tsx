"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTenantDashboard } from "@/contexts/DashboardContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { Notification } from "@/contexts/NotificationContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Heart, MessageSquare, Calendar,
  MapPin, Bed, Bath, Square, Eye, Clock,
  ArrowRight, Search, Bell,
  Settings, User, Star, Zap, Activity,
  CheckCircle, AlertCircle, Building2,
  Target, Award, Users, FileText,
  X, FileCheck, DollarSign,
  AlertTriangle, CheckCheck, Loader2,
  RefreshCw, Wallet, CalendarClock, Plus
} from "lucide-react"
import Link from "next/link"
import { applicationsAPI } from "@/lib/api/applications"
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
import { getPaymentFrequencyMultiplier, getPaymentFrequencyLabel, normalizePaymentFrequency } from "@/lib/utils/rentalCalculations"

const DEFAULT_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"

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
  const { notifications, unreadCount } = state
  const router = useRouter()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRef = useRef(fetchTenantDashboard)
  useEffect(() => { fetchRef.current = fetchTenantDashboard })

  useEffect(() => {
    if (!user?.id) return
    fetchRef.current()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
      await fetchRef.current()
      toast.success("Dashboard refreshed")
    } catch {
      toast.error("Failed to refresh dashboard")
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.id, isRefreshing, invalidateTenantCache])

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

    const rentAmount = (activeAgreement as any).rent_amount ?? 0
    const paymentFrequency = normalizePaymentFrequency((activeAgreement as any).payment_frequency)
    const periodRent = rentAmount * getPaymentFrequencyMultiplier(paymentFrequency)
    const periodLabel = getPaymentFrequencyLabel(paymentFrequency).replace(' Rent', '')
    let daysUntilDue: number | null = null

    if ((activeAgreement as any).start_date) {
      const startDate = new Date((activeAgreement as any).start_date)
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
      return { state: "due" as const, rentAmount, periodRent, periodLabel, paymentFrequency, daysUntilDue }
    }

    return { state: "paid" as const, rentAmount, periodRent, periodLabel, paymentFrequency, daysUntilDue, completedPayments, totalPayments }
  }, [tenantData?.agreements, tenantData?.stats?.totalPayments, tenantData?.stats?.completedPayments])

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

  if (loading && !tenantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Your Dashboard</h3>
              <p className="text-slate-600">Fetching your property search activity...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">

        {tenantData && !tenantData.isComplete && (tenantData.failedSections?.length ?? 0) > 0 && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                Some sections could not load ({tenantData.failedSections!.join(", ")}). Data shown may be incomplete.
              </p>
            </div>
            <Button variant="outline" size="sm"
              className="flex-shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100"
              onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Retry
            </Button>
          </div>
        )}

        {/* Hero */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                Welcome back, {userName}!
              </h1>
              <p className="text-lg text-gray-600 mb-6">Your property search dashboard</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/properties">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                    <Search className="mr-2 h-4 w-4" />Browse Properties
                  </Button>
                </Link>
                <Link href="/tenant/applications">
                  <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                    <FileText className="mr-2 h-4 w-4" />My Applications
                  </Button>
                </Link>
                <Link href="/tenant/viewings">
                  <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                    <Calendar className="mr-2 h-4 w-4" />Viewings
                  </Button>
                </Link>
              </div>
            </div>

            {/* Icon-only buttons */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="lg"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={handleRefresh} disabled={isRefreshing} title="Refresh dashboard">
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Link href="/tenant/messages">
                <Button variant="outline" size="lg" className="relative border-orange-200 text-orange-700 hover:bg-orange-50">
                  <MessageSquare className="h-4 w-4" />
                  {(tenantData?.stats.unreadMessages ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {tenantData?.stats.unreadMessages ?? 0}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/tenant/profile">
                <Button variant="outline" size="lg" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Payment Success Banner - Next Steps */}
        {/* Only shown within 48h of the agreement becoming ACTIVE/SIGNED — same window as landlord dashboard.
            Without this guard the banner showed permanently for every tenant who had ever paid. */}
        {paymentSummary.state === "paid" && (tenantData?.stats?.completedPayments ?? 0) > 0 && (() => {
          const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
          const recentlyActivated = tenantData?.agreements?.some((a: any) =>
            (a.status === "ACTIVE" || a.status === "SIGNED") &&
            new Date(a.updated_at ?? a.created_at).getTime() > fortyEightHoursAgo
          )
          return recentlyActivated
        })() && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">Payment Received!</h3>
                  <p className="text-green-700 text-sm mb-3">
                    Your payment has been successfully processed. Keep track of your rental activity and stay in touch with your landlord.
                  </p>
                  <div className="flex items-center gap-3">
                    <Link href="/tenant/payments">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <DollarSign className="h-4 w-4 mr-2" />View Receipt
                      </Button>
                    </Link>
                    <Link href="/tenant/messages">
                      <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                        <MessageSquare className="h-4 w-4 mr-2" />Contact Landlord
                      </Button>
                    </Link>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stat Cards */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Your Overview</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full animate-pulse" style={{
                // map level strings to concrete colours at runtime; Tailwind can't scan dynamic class fragments
                ...(engagementDisplay.level === "high"   ? { backgroundColor: "#22c55e" } :
                    engagementDisplay.level === "medium" ? { backgroundColor: "#f97316" } :
                                                          { backgroundColor: "#94a3b8" })
              }} />

              <span className="text-sm font-medium text-slate-600">{engagementDisplay.level} Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Trust Score:</span>
                <Badge className={`${trustDisplay.bgColor} ${trustDisplay.textColor} border-0`}>{trustDisplay.score}/100</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            <Link href="/tenant/favorites">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-0.5">Saved</p>
                      <p className="text-2xl font-bold text-slate-900 leading-tight">{tenantData?.stats.totalFavorites ?? 0}</p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {(tenantData?.stats.totalFavorites ?? 0) === 0 ? "none saved yet" : "properties"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tenant/viewings">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-0.5">Viewings</p>
                      <p className="text-2xl font-bold text-slate-900 leading-tight">
                        {(tenantData?.stats?.pendingViewings ?? 0) + (tenantData?.stats?.confirmedViewings ?? 0)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {(tenantData?.stats?.pendingViewings ?? 0) > 0 && (
                          <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                            {tenantData?.stats.pendingViewings} pending
                          </span>
                        )}
                        {(tenantData?.stats?.confirmedViewings ?? 0) > 0 && (
                          <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                            {tenantData?.stats.confirmedViewings} confirmed
                          </span>
                        )}
                        {(tenantData?.stats?.pendingViewings ?? 0) === 0 && (tenantData?.stats?.confirmedViewings ?? 0) === 0 && (
                          <span className="text-[10px] text-slate-400">none scheduled</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tenant/messages">
              <Card className={`bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
                (tenantData?.stats.unreadMessages ?? 0) > 0
                  ? "border-orange-300 ring-2 ring-orange-100"
                  : "border-orange-200"
              }`}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        (tenantData?.stats.unreadMessages ?? 0) > 0 ? "bg-orange-100" : "bg-blue-100"
                      }`}>
                        <MessageSquare className={`h-4 w-4 ${
                          (tenantData?.stats.unreadMessages ?? 0) > 0 ? "text-orange-600" : "text-blue-600"
                        }`} />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Messages</p>
                    </div>
                    {(tenantData?.stats.unreadMessages ?? 0) > 0 ? (
                      <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                        {tenantData?.stats.unreadMessages} new
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {(tenantData?.conversations?.length ?? 0)} total
                      </span>
                    )}
                  </div>

                  {/* Latest conversation preview */}
                  {(() => {
                    const latest = (tenantData?.conversations ?? [])
                      .slice()
                      .sort((a: any, b: any) =>
                        new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
                        new Date(a.updated_at ?? a.created_at ?? 0).getTime()
                      )[0]

                    if (!latest) {
                      return (
                        <div className="text-center py-2">
                          <p className="text-xs text-slate-400">No conversations yet</p>
                          <p className="text-[10px] text-orange-500 mt-1">Browse properties to start chatting →</p>
                        </div>
                      )
                    }

                    const landlordName = (latest as any).landlord?.full_name || (latest as any).other_user_name || "Landlord"
                    const propertyTitle = (latest as any).property?.title || null
                    const lastMsg = (latest as any).last_message || "No messages yet"
                    const unread = (latest as any).unread_count ?? 0

                    return (
                      <div className={`rounded-lg p-2.5 border ${unread > 0 ? "bg-orange-50 border-orange-100" : "bg-slate-50 border-slate-100"}`}>
                        <div className="flex items-start gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
                            {landlordName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold text-slate-900 truncate">{landlordName}</p>
                              {unread > 0 && (
                                <span className="h-4 w-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                  {unread}
                                </span>
                              )}
                            </div>
                            {propertyTitle && (
                              <p className="text-[10px] text-orange-600 truncate leading-tight">{propertyTitle}</p>
                            )}
                            <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">{lastMsg}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  <p className="text-[10px] text-orange-600 text-right mt-2 font-medium">
                    {(tenantData?.stats.unreadMessages ?? 0) > 0 ? "Tap to read →" : "Open inbox →"}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tenant/applications">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-0.5">Applications</p>
                      <p className="text-2xl font-bold text-slate-900 leading-tight">{tenantData?.stats.applicationsSubmitted ?? 0}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {(tenantData?.stats?.pendingApplications ?? 0) > 0 && (
                          <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                            {tenantData?.stats?.pendingApplications} pending
                          </span>
                        )}
                        {(tenantData?.stats?.approvedApplications ?? 0) > 0 && (
                          <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                            {tenantData?.stats?.approvedApplications} approved
                          </span>
                        )}
                        {(tenantData?.stats?.applicationsSubmitted ?? 0) === 0 && (
                          <span className="text-[10px] text-slate-400">none yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tenant/agreements">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-0.5">Agreements</p>
                      <p className="text-2xl font-bold text-slate-900 leading-tight">{tenantData?.stats?.activeAgreements ?? 0}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {(tenantData?.stats?.pendingSignatures ?? 0) > 0 && (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            {tenantData?.stats?.pendingSignatures} to sign
                          </span>
                        )}
                        {(tenantData?.stats?.activeAgreements ?? 0) > 0 && (
                          <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                            {tenantData?.stats?.activeAgreements} active
                          </span>
                        )}
                        {(tenantData?.stats?.activeAgreements ?? 0) === 0 && (tenantData?.stats?.pendingSignatures ?? 0) === 0 && (
                          <span className="text-[10px] text-slate-400">none yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Rent / Payment — three-state card */}
            <button
              onClick={() => router.push("/tenant/payments")}
              className="w-full text-left group">
              <Card className={`bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
                paymentSummary.state === "due" ? "border-orange-300 ring-2 ring-orange-200"
                : paymentSummary.state === "paid" ? "border-green-200"
                : "border-orange-200"
              } group-hover:border-orange-300`}>
                <CardContent className="p-6">
                  {paymentSummary.state === "no-lease" && (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Wallet className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-600 mb-1">Rent Payments</p>
                        <p className="text-3xl font-bold text-slate-400 leading-tight">—</p>
                        <span className="text-xs text-slate-400 mt-1 block">No active lease</span>
                        <span className="text-xs text-orange-600 mt-1 block group-hover:text-orange-700">View history →</span>
                      </div>
                    </div>
                  )}
                  {paymentSummary.state === "due" && (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-600 mb-1">{paymentSummary.periodLabel} Due</p>
                        <p className="text-3xl font-bold text-slate-900 leading-tight">
                          {paymentSummary.rentAmount > 0 ? formatPrice(paymentSummary.periodRent) : "???"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">Payment Required</span>
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            {formatPrice(paymentSummary.rentAmount)}/month
                          </span>
                          {paymentSummary.daysUntilDue !== null && paymentSummary.daysUntilDue <= 7 && (
                            <span className="text-xs text-slate-500 flex items-center gap-0.5">
                              <CalendarClock className="h-3 w-3" />
                              {paymentSummary.daysUntilDue === 0 ? "Due today" : `Due in ${paymentSummary.daysUntilDue}d`}
                            </span>
                          )}
                          <span className="text-xs text-orange-600 group-hover:text-orange-700">View history →</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {paymentSummary.state === "paid" && (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Wallet className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-600 mb-1">{paymentSummary.periodLabel}</p>
                        <p className="text-3xl font-bold text-slate-900 leading-tight">
                          {paymentSummary.rentAmount > 0 ? formatPrice(paymentSummary.periodRent) : "???"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            {formatPrice(paymentSummary.rentAmount)}/month
                          </span>
                          <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            {paymentSummary.completedPayments} payment{paymentSummary.completedPayments !== 1 ? "s" : ""} made
                          </span>
                          {paymentSummary.daysUntilDue !== null && paymentSummary.daysUntilDue <= 7 && (
                            <span className="text-xs text-slate-500 flex items-center gap-0.5">
                              <CalendarClock className="h-3 w-3" />
                              {paymentSummary.daysUntilDue === 0 ? "Due today" : `Due in ${paymentSummary.daysUntilDue}d`}
                            </span>
                          )}
                          <span className="text-xs text-green-600 group-hover:text-green-700">View history →</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </button>

          </div>
        </div>

        {/* Engagement Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Search Progress</h2>
              <p className="text-gray-600">Track your property search journey</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Engagement Score:</span>
                <span className="text-lg font-bold text-orange-600">{engagementDisplay.score}/100</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Trust Score:</span>
                <span className="text-lg font-bold text-green-600">{trustDisplay.score}/100</span>
              </div>
            </div>
          </div>
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Overall Progress</span>
                    <span className="text-slate-600">{engagementDisplay.score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${engagementDisplay.score}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {[
                      { icon: Heart, count: tenantData?.stats?.totalFavorites ?? 0, label: "Saved", activeBg: "bg-red-100 text-red-700" },
                      { icon: Building2, count: tenantData?.stats?.propertiesContacted ?? 0, label: "Contacted", activeBg: "bg-purple-100 text-purple-700" },
                      { icon: CheckCircle, count: tenantData?.stats?.confirmedViewings ?? 0, label: "Viewings", activeBg: "bg-green-100 text-green-700" },
                      { icon: FileText, count: tenantData?.stats?.applicationsSubmitted ?? 0, label: "Applications", activeBg: "bg-blue-100 text-blue-700" },
                    ].map(({ icon: Icon, count, label, activeBg }) => (
                      <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${count > 0 ? activeBg : "bg-slate-100 text-slate-400"}`}>
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{count} {label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {engagementDisplay.icon && <engagementDisplay.icon className="h-5 w-5 text-orange-500" />}
                    <span className="text-sm font-medium text-slate-700">Level: {engagementDisplay.level}</span>
                  </div>
                </div>
                {/* Quick stats grid — mirrors landlord engagement card */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{tenantData?.stats?.totalFavorites ?? 0}</p>
                    <p className="text-xs text-slate-600">Properties Saved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">
                      {(tenantData?.stats?.pendingViewings ?? 0) + (tenantData?.stats?.confirmedViewings ?? 0)}
                    </p>
                    <p className="text-xs text-slate-600">Active Viewings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{tenantData?.stats?.applicationsSubmitted ?? 0}</p>
                    <p className="text-xs text-slate-600">Applications Sent</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main grid */}
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-8">

            {/* Saved Properties */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Saved Properties</h2>
                  <p className="text-gray-600">Properties you've saved for later</p>
                </div>
                <Link href="/tenant/favorites">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {showSkeletons ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {[1, 2].map(i => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />)}
                    </div>
                  ) : (tenantData?.favorites?.length ?? 0) === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No saved properties yet</h3>
                      <p className="text-slate-600 mb-6">Start browsing and save properties you are interested in</p>
                      <Link href="/properties">
                        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                          <Search className="mr-2 h-4 w-4" />Browse Properties
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {(tenantData?.favorites ?? []).slice(0, 4).map((fav) => (
                          <Link key={fav.id} href={`/properties/${fav.id}`}
                            onClick={() => trackActivity("property_viewed", { property_id: fav.id })}>
                            <div className="group relative bg-white rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
                              <div className="relative h-48 overflow-hidden">
                                <img src={fav.property_image || DEFAULT_PROPERTY_IMAGE}
                                  alt={fav.property_title || "Property"}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-3 right-3">
                                  <div className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-lg">
                                    <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                                  </div>
                                </div>
                                {(fav.rating ?? 0) > 0 && (
                                  <div className="absolute top-3 left-3">
                                    <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-current" />{fav.rating}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="p-5">
                                <p className="text-2xl font-bold text-orange-600 mb-3">
                                  {formatPrice(fav.price ?? 0)}<span className="text-sm font-normal text-slate-500">/mo</span>
                                </p>
                                <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                  {fav.property_title}
                                </h3>
                                <p className="text-sm text-slate-600 flex items-center mb-4">
                                  <MapPin className="h-4 w-4 mr-1.5 text-orange-500 flex-shrink-0" />
                                  <span className="line-clamp-1">{fav.location || fav.property_address || fav.property_city}</span>
                                </p>
                                <div className="flex items-center gap-4 text-sm text-slate-600 pt-4 border-t border-slate-100">
                                  <div className="flex items-center gap-1.5">
                                    <Bed className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium">{fav.beds}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Bath className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium">{fav.baths}</span>
                                  </div>
                                  {fav.sqft && (
                                    <div className="flex items-center gap-1.5">
                                      <Square className="h-4 w-4 text-orange-500" />
                                      <span className="font-medium">{fav.sqft.toLocaleString()} sqft</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {(tenantData?.favorites?.length ?? 0) > 4 && (
                        <div className="mt-4">
                          <Link href="/tenant/favorites">
                            <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                              View all {tenantData?.favorites?.length} saved properties <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Viewing Requests */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">My Viewings</h2>
                  <p className="text-gray-600">Upcoming and pending property viewings</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/tenant/viewings">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/properties">
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Search className="mr-2 h-3 w-3" />Browse
                    </Button>
                  </Link>
                </div>
              </div>
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {showSkeletons ? (
                    <SkeletonRows />
                  ) : (tenantData?.viewingRequests?.length ?? 0) === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No viewings scheduled</h3>
                      <p className="text-slate-600">Pending and confirmed requests will appear here</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {(tenantData?.viewingRequests ?? []).slice(0, 3).map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-slate-900 truncate">
                                  {request.property?.title || request.property_title || "Property"}
                                </h4>
                                {request.status === "confirmed" ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                                    <CheckCircle className="h-3 w-3 mr-1" />Confirmed
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                                    <AlertCircle className="h-3 w-3 mr-1" />Pending
                                  </Badge>
                                )}
                                {request.viewing_type && (
                                  <Badge variant="outline" className="text-slate-600 border-slate-300 text-xs">
                                    {formatViewingType(request.viewing_type)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                {formatDate(request.preferred_date)} {request.time_slot ? `· ${formatTimeSlot(request.time_slot)}` : ""}
                              </p>
                              {request.status === "confirmed" && request.created_at && request.updated_at && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Responded in {Math.max(0, Math.round((new Date(request.updated_at).getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60)))}h
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                              <Link href={`/properties/${request.property?.id || request.property_id}`}>
                                <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs gap-1.5">
                                  <Eye className="h-3.5 w-3.5" />View
                                </Button>
                              </Link>
                              {request.status === "confirmed" && (
                                <Link href="/tenant/messages">
                                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5" />Message
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {(tenantData?.viewingRequests?.length ?? 0) > 3 && (
                        <div className="mt-4">
                          <Link href="/tenant/viewings">
                            <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                              View all {tenantData?.viewingRequests?.length} viewings <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Applications */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">My Applications</h2>
                  <p className="text-gray-600">Track your rental applications and their status</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/tenant/applications">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/properties">
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <FileText className="mr-2 h-3 w-3" />New Application
                    </Button>
                  </Link>
                </div>
              </div>
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {showSkeletons ? (
                    <SkeletonRows />
                  ) : (tenantData?.applications?.length ?? 0) === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications yet</h3>
                      <p className="text-slate-600 mb-4">Ready to apply for your dream rental property?</p>
                      <Link href="/properties">
                        <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                          <Search className="mr-2 h-3 w-3" />Browse Properties
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {(tenantData?.applications ?? []).slice(0, 3).map((application) => (
                          <div key={application.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-slate-900 truncate">{application.property_title || "Property"}</h4>
                                {application.status === "approved" && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                                    <CheckCircle className="h-3 w-3 mr-1" />Approved
                                  </Badge>
                                )}
                                {application.status === "pending" && (
                                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                                    <AlertCircle className="h-3 w-3 mr-1" />Pending Review
                                  </Badge>
                                )}
                                {application.status === "rejected" && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold">
                                    <X className="h-3 w-3 mr-1" />Rejected
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-700 font-medium mb-1 truncate">
                                {application.property_location || "Location not specified"}
                              </p>
                              {application.property_price && (
                                <p className="text-sm text-orange-600 font-semibold">{formatPrice(application.property_price)}/mo</p>
                              )}
                              <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                                <span>Applied: {formatDate(application.created_at)}</span>
                                {application.move_in_date && <span>Move-in: {formatDate(application.move_in_date)}</span>}
                                {application.viewed_by_landlord && (
                                  <span className="text-green-600 flex items-center gap-0.5">
                                    <Eye className="h-3 w-3" />Viewed by landlord
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                              <Link href={`/tenant/applications/${application.id}`}>
                                <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs gap-1.5">
                                  <Eye className="h-3.5 w-3.5" />View Details
                                </Button>
                              </Link>
                              {application.status === "approved" && (
                                <Link href="/tenant/messages">
                                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5" />Contact Landlord
                                  </Button>
                                </Link>
                              )}
                              {application.status === "pending" && (
                                <Button variant="outline" size="sm"
                                  className="border-red-300 text-red-600 hover:bg-red-50 text-xs gap-1.5"
                                  onClick={async () => {
                                    try {
                                      await applicationsAPI.withdraw(application.id)
                                      toast.success("Application withdrawn successfully")
                                      invalidateTenantCache?.()
                                      fetchRef.current()
                                    } catch {
                                      toast.error("Failed to withdraw application")
                                    }
                                  }}>
                                  <X className="h-3.5 w-3.5" />Withdraw
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {(tenantData?.applications?.length ?? 0) > 3 && (
                        <div className="mt-4">
                          <Link href="/tenant/applications">
                            <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                              View all {tenantData?.applications?.length} applications <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Agreements — standalone sibling section, NOT nested in Applications */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">My Agreements</h2>
                  <p className="text-gray-600">Your active and pending rental agreements</p>
                </div>
                <Link href="/tenant/agreements">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {showSkeletons ? (
                    <SkeletonRows />
                  ) : (tenantData?.agreements?.length ?? 0) === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileCheck className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No active agreements yet</h3>
                      <p className="text-slate-600">Once your application is approved, your rental agreement will appear here.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {(tenantData?.agreements ?? []).slice(0, 3).map((agreement) => (
                          <div key={agreement.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-slate-900 truncate">
                                  {agreement.property?.title || agreement.property_title || "Property Agreement"}
                                </h4>
                                {agreement.status === "ACTIVE" && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                                    <CheckCheck className="h-3 w-3 mr-1" />Active
                                  </Badge>
                                )}
                                {agreement.status === "PENDING_TENANT" && (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-semibold">
                                    <AlertTriangle className="h-3 w-3 mr-1" />Awaiting Your Signature
                                  </Badge>
                                )}
                                {agreement.status === "PENDING_LANDLORD" && (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold">
                                    <FileText className="h-3 w-3 mr-1" />Landlord Signing
                                  </Badge>
                                )}
                                {agreement.status === "SIGNED" && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                                    <CheckCircle className="h-3 w-3 mr-1" />Fully Signed
                                  </Badge>
                                )}
                                {agreement.status === "EXPIRED" && (
                                  <Badge className="bg-slate-100 text-slate-800 border-slate-200 font-semibold">Expired</Badge>
                                )}
                                {agreement.status === "TERMINATED" && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold">Terminated</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 flex items-center mb-1">
                                <MapPin className="h-3 w-3 mr-2 text-orange-500 flex-shrink-0" />
                                {agreement.property?.location || agreement.property?.address || "Location not specified"}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                {agreement.lease_start_date && <span>From: {formatDate(agreement.lease_start_date)}</span>}
                                {agreement.lease_end_date && <span>Until: {formatDate(agreement.lease_end_date)}</span>}
                                {agreement.rent_amount > 0 && (
                                  <span className="text-orange-600 font-semibold">{formatPrice(agreement.rent_amount)}/mo</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                              <Link href={`/tenant/agreements/${agreement.id}`}>
                                <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs gap-1.5">
                                  <Eye className="h-3.5 w-3.5" />View
                                </Button>
                              </Link>
                              {agreement.status === "PENDING_TENANT" && (
                                <Link href={`/tenant/agreements/${agreement.id}/sign`}>
                                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs gap-1.5">
                                    <FileCheck className="h-3.5 w-3.5" />Sign Now
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {(tenantData?.agreements?.length ?? 0) > 3 && (
                        <div className="mt-4">
                          <Link href="/tenant/agreements">
                            <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                              View all {tenantData?.agreements?.length} agreements <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Maintenance Requests - for rented properties */}
            {tenantData?.agreements?.some((agreement: any) => agreement.status === 'ACTIVE' || agreement.status === 'SIGNED') && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Maintenance Requests</h2>
                    <p className="text-gray-600">Track maintenance issues for your rented property</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/tenant/maintenance">
                      <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                        View All <ArrowRight className="ml-1 h-4 w-4" />
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
                      <div className="text-center py-8">
                        <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Settings className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No maintenance requests</h3>
                        <p className="text-slate-600 mb-6">Report issues with your rented property here</p>
                        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                          <Plus className="mr-2 h-4 w-4" />Report Maintenance Issue
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">

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
                      <p className="text-xs text-slate-600">You are all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {notifications.slice(0, 5).map((notification: Notification) => (
                        <div key={notification.id}
                          className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}>
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              {notification.type === "visit"                 && <Calendar      className="h-4 w-4 text-orange-600"  />}
                              {notification.type === "viewing_confirmed"     && <CheckCircle   className="h-4 w-4 text-green-600"   />}
                              {notification.type === "message"               && <MessageSquare className="h-4 w-4 text-blue-600"    />}
                              {notification.type === "application_received"  && <FileText      className="h-4 w-4 text-purple-600"  />}
                              {notification.type === "email_verified"        && <CheckCircle   className="h-4 w-4 text-green-600"   />}
                              {notification.type === "system"                && <Bell          className="h-4 w-4 text-slate-600"   />}
                              {(!notification.type || !["visit","viewing_confirmed","message","application_received","email_verified","system","onboarding_submitted","onboarding_approved","onboarding_rejected"].includes(notification.type)) && (
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
                                {new Date(notification.created_at).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications.length > 5 && (
                        <Link href="/tenant/notifications">
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

            {/* Inbox Status — compact summary, full list is in main column */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">Inbox Status</h3>
                  {(tenantData?.stats.unreadMessages ?? 0) > 0 && (
                    <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                      {tenantData?.stats.unreadMessages} unread
                    </span>
                  )}
                </div>
                <Link href="/tenant/messages">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    Open →
                  </Button>
                </Link>
              </div>
              <Card className={`border-orange-200 bg-white/80 backdrop-blur-sm ${
                (tenantData?.stats.unreadMessages ?? 0) > 0 ? "ring-2 ring-orange-100" : ""
              }`}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-xl font-bold text-slate-900">{tenantData?.conversations?.length ?? 0}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Total</p>
                    </div>
                    <div className={`text-center p-2 rounded-lg border ${
                      (tenantData?.stats.unreadMessages ?? 0) > 0
                        ? "bg-orange-50 border-orange-200"
                        : "bg-slate-50 border-slate-100"
                    }`}>
                      <p className={`text-xl font-bold ${
                        (tenantData?.stats.unreadMessages ?? 0) > 0 ? "text-orange-600" : "text-slate-400"
                      }`}>{tenantData?.stats.unreadMessages ?? 0}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Unread</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-xl font-bold text-slate-900">
                        {(tenantData?.conversations ?? []).filter((c: any) => c.unread_count === 0).length}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Read</p>
                    </div>
                  </div>
                  <Link href="/tenant/messages">
                    <Button className={`w-full text-sm ${
                      (tenantData?.stats.unreadMessages ?? 0) > 0
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {(tenantData?.stats.unreadMessages ?? 0) > 0
                        ? `Read ${tenantData?.stats.unreadMessages} unread message${(tenantData?.stats.unreadMessages ?? 0) !== 1 ? "s" : ""}`
                        : "Open inbox"
                      }
                    </Button>
                  </Link>
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
                  {[
                    { href: "/properties", icon: Search, label: "Browse Properties",
                      badge: undefined },
                    { href: "/tenant/favorites", icon: Heart, label: "View Favorites",
                      badge: (tenantData?.stats?.totalFavorites ?? 0) > 0 ? `${tenantData?.stats?.totalFavorites}` : undefined },
                    { href: "/tenant/viewings", icon: Calendar, label: "My Viewings",
                      badge: (tenantData?.stats?.pendingViewings ?? 0) > 0 ? `${tenantData?.stats?.pendingViewings} pending` : undefined },
                    { href: "/tenant/applications", icon: FileText, label: "My Applications",
                      badge: (tenantData?.stats?.applicationsSubmitted ?? 0) > 0 ? `${tenantData?.stats?.applicationsSubmitted}` : undefined },
                    { href: "/tenant/agreements", icon: FileCheck, label: "My Agreements",
                      badge: (tenantData?.stats?.pendingSignatures ?? 0) > 0 ? `${tenantData?.stats?.pendingSignatures} to sign` : undefined },
                    { href: "/tenant/messages", icon: MessageSquare, label: "Messages",
                      badge: (tenantData?.stats?.unreadMessages ?? 0) > 0 ? `${tenantData?.stats?.unreadMessages} unread` : undefined },
                    { href: "/tenant/profile", icon: User, label: "Update Profile",
                      badge: undefined },
                  ].map(({ href, icon: Icon, label, badge }) => (
                    <Link key={href} href={href}>
                      <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                        <Icon className="mr-2 h-4 w-4" />{label}
                        {badge && <span className="ml-auto text-xs font-semibold text-orange-600">{badge}</span>}
                      </Button>
                    </Link>
                  ))}
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
                {(() => {
                  const items: { id: string; icon: any; iconBg: string; iconColor: string; title: string; date: string; href: string; timeAgo: string }[] = []

                  const toTimeAgo = (dateStr: string) => {
                    const diffMs = Date.now() - new Date(dateStr).getTime()
                    const mins = Math.floor(diffMs / 60000)
                    if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`
                    const hrs = Math.floor(mins / 60)
                    if (hrs < 24) return `${hrs}h ago`
                    return `${Math.floor(hrs / 24)}d ago`
                  }

                  tenantData?.viewingRequests?.forEach((v: any) => {
                    items.push({
                      id: v.id, icon: Calendar,
                      iconBg: v.status === "confirmed" ? "bg-green-100" : "bg-orange-100",
                      iconColor: v.status === "confirmed" ? "text-green-600" : "text-orange-600",
                      title: v.status === "confirmed"
                        ? `Viewing confirmed — ${v.property?.title || v.property_title || "Property"}`
                        : `Viewing requested — ${v.property?.title || v.property_title || "Property"}`,
                      date: v.created_at,
                      href: "/tenant/viewings",
                      timeAgo: toTimeAgo(v.created_at),
                    })
                  })
                  tenantData?.applications?.forEach((app: any) => {
                    items.push({
                      id: `app-${app.id}`, icon: FileText,
                      iconBg: app.status === "approved" ? "bg-green-100" : app.status === "rejected" ? "bg-red-100" : "bg-orange-100",
                      iconColor: app.status === "approved" ? "text-green-600" : app.status === "rejected" ? "text-red-600" : "text-orange-600",
                      title: `Application ${app.status} — ${app.property?.title || "Property"}`,
                      date: app.created_at,
                      href: `/tenant/applications/${app.id}`,
                      timeAgo: toTimeAgo(app.created_at),
                    })
                  })
                  tenantData?.conversations?.forEach((c: any) => {
                    if (c.last_message) items.push({
                      id: `msg-${c.id}`, icon: MessageSquare,
                      iconBg: c.unread_count > 0 ? "bg-orange-100" : "bg-slate-100",
                      iconColor: c.unread_count > 0 ? "text-orange-600" : "text-slate-500",
                      title: `${c.unread_count > 0 ? "Unread message" : "Message"} from ${c.landlord?.full_name || c.other_user_name || "Landlord"}`,
                      date: c.updated_at || c.created_at,
                      href: `/tenant/messages?conversation=${c.id}`,
                      timeAgo: toTimeAgo(c.updated_at || c.created_at),
                    })
                  })

                  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  const visible = items.slice(0, 5)

                  if (visible.length === 0) {
                    return (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-6 w-6 bg-slate-100 rounded-full flex items-center justify-center">
                          <Activity className="h-3 w-3 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-900 font-medium">No activity yet</p>
                          <p className="text-slate-600 text-xs">Activity from your searches will appear here</p>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3">
                      {visible.map((item) => (
                        <Link key={item.id} href={item.href ?? "#"}>
                          <div className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className={`h-7 w-7 ${item.iconBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <item.icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-900 font-medium leading-snug truncate group-hover:text-orange-600 transition-colors">{item.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{item.timeAgo}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}