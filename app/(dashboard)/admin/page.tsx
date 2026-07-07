"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useDashboard } from "@/contexts/DashboardContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Users, Building2, CheckCircle, Clock, XCircle, TrendingUp,
  RefreshCw, ArrowRight, UserCheck, Building, Activity, Home,
  AlertCircle, Shield, ChevronRight, Zap, BarChart2, Eye,
} from "lucide-react"
import adminDashboardAPI from "@/lib/api/adminDashboard"
import type { AdminDashboardStats, RecentSignup } from "@/lib/api/adminDashboard"

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number | undefined | null) => (n ?? 0).toLocaleString("en-NG")

const pct = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100)

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── mini progress bar (no external chart lib) ──────────────────────────────

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  )
}

// ─── status pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    verified: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    active:   "bg-blue-100 text-blue-700 border-blue-200",
  }
  const cls = map[status?.toLowerCase()] ?? "bg-slate-100 text-slate-600 border-slate-200"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {status ?? "—"}
    </span>
  )
}

export default function AdminDashboardPage() {
  const router   = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { stats: dashboardStats, loading, fetchDashboardStats } = useDashboard()

  const [mounted,          setMounted]          = useState(false)
  const [refreshing,       setRefreshing]        = useState(false)
  const [recentSignups,    setRecentSignups]     = useState<RecentSignup[]>([])
  const [signupsLoading,   setSignupsLoading]    = useState(false)
  const [lastRefresh,      setLastRefresh]       = useState<Date | null>(null)

  // ── fetch recent signups ─────────────────────────────────────────────────
  const fetchSignups = useCallback(async () => {
    setSignupsLoading(true)
    try {
      const data = await adminDashboardAPI.getRecentSignups(7)
      const sorted = (data.recent_signups ?? []).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setRecentSignups(sorted)
    } catch {
      // silent — table will show empty state
    } finally {
      setSignupsLoading(false)
    }
  }, [])

  // ── mount + auth guard ───────────────────────────────────────────────────
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || authLoading) return
    if (!user) { router.push("/signin"); return }
    if (user.user_type !== "admin") { router.push("/admin"); return }
    if (!dashboardStats) fetchDashboardStats()
    fetchSignups()
    setLastRefresh(new Date())
  }, [mounted, authLoading, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── refresh ──────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await Promise.all([fetchDashboardStats(), fetchSignups()])
      setLastRefresh(new Date())
      toast.success("Dashboard refreshed")
    } catch {
      toast.error("Refresh failed")
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, fetchDashboardStats, fetchSignups])

  // ── derived numbers ──────────────────────────────────────────────────────
  const s = dashboardStats

  const totalPending = useMemo(
    () => (s ? adminDashboardAPI.getTotalPendingVerifications(s) : 0),
    [s]
  )
  const totalUsers = useMemo(
    () => (s ? (s.landlords.total + s.tenants.total) : 0),
    [s]
  )
  const totalVerified = useMemo(
    () => (s ? adminDashboardAPI.getTotalVerifiedUsers(s) : 0),
    [s]
  )

  // priority queue rows (what needs action right now)
  const priorityRows = useMemo(() => {
    if (!s) return []
    return [
      {
        label:    "Landlord verifications",
        count:    s.landlords.pending_verification,
        urgency:  s.landlords.pending_verification > 10 ? "high" : s.landlords.pending_verification > 0 ? "medium" : "low",
        href:     "/admin/landlord-verification",
        icon:     Building,
        color:    "text-orange-600",
        bg:       "bg-orange-50",
      },
      {
        label:    "Tenant verifications",
        count:    s.tenants.pending_verification,
        urgency:  s.tenants.pending_verification > 10 ? "high" : s.tenants.pending_verification > 0 ? "medium" : "low",
        href:     "/admin/tenant-verification",
        icon:     Users,
        color:    "text-purple-600",
        bg:       "bg-purple-50",
      },
      {
        label:    "Property reviews",
        count:    s.properties.pending_verification,
        urgency:  s.properties.pending_verification > 10 ? "high" : s.properties.pending_verification > 0 ? "medium" : "low",
        href:     "/admin/property-verification",
        icon:     Home,
        color:    "text-green-600",
        bg:       "bg-green-50",
      },
      {
        label:    "Onboarding in progress",
        count:    s.landlords.pending_onboarding,
        urgency:  "low" as const,
        href:     "/admin/landlord-verification?status=awaiting_submission",
        icon:     Clock,
        color:    "text-amber-600",
        bg:       "bg-amber-50",
      },
    ].filter(r => r.count > 0)
  }, [s])

  const urgencyBadge = (u: string) => {
    if (u === "high")   return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Urgent</Badge>
    if (u === "medium") return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Review</Badge>
    return <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">Info</Badge>
  }

  // ── loading skeleton ─────────────────────────────────────────────────────
  const isBooting = !mounted || (authLoading && !s)

  if (isBooting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-72 lg:col-span-2" />
            <Skeleton className="h-72" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {s
                ? `${fmt(totalUsers)} users · ${fmt(totalPending)} pending reviews · ${fmt(s.properties.total)} properties`
                : "Loading platform overview…"}
              {lastRefresh && (
                <span className="ml-2 text-slate-400">· refreshed {timeAgo(lastRefresh.toISOString())}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {totalPending > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                {totalPending} pending
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-orange-700 border-orange-200 hover:bg-orange-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/admin/settings")}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              Settings
            </Button>
          </div>
        </div>

        {/* ── URGENT ACTION BANNERS (only when something needs attention) ── */}
        {s && s.landlords.pending_verification > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 text-sm text-orange-900">
              <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                <strong>{s.landlords.pending_verification}</strong> landlord{s.landlords.pending_verification !== 1 ? "s" : ""} completed onboarding and are waiting for verification review.
              </span>
            </div>
            <Button size="sm" onClick={() => router.push("/admin/landlord-verification")}
              className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs">
              Review now <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
        {s && s.properties.pending_verification > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-sm text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{s.properties.pending_verification}</strong> propert{s.properties.pending_verification !== 1 ? "ies" : "y"} pending review.
              </span>
            </div>
            <Button size="sm" onClick={() => router.push("/admin/property-verification")}
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs">
              Review now <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}

        {/* ── 6-CELL KPI GRID ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

          {/* Total users */}
          <Card className="border-orange-200 bg-white/90">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Users</p>
                <Users className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{fmt(totalUsers)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {fmt(s?.landlords.total)} landlords · {fmt(s?.tenants.total)} tenants
              </p>
              <Bar value={totalVerified} max={totalUsers} color="bg-orange-400" />
              <p className="text-xs text-slate-400 mt-1">{pct(totalVerified, totalUsers)}% verified</p>
            </CardContent>
          </Card>

          {/* Landlords */}
          <Card className="border-orange-200 bg-white/90 cursor-pointer hover:border-orange-400 transition-colors"
            onClick={() => router.push("/admin/users/landlords")}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Landlords</p>
                <Building className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{fmt(s?.landlords.total)}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                <span className="text-xs text-green-600 font-medium">{fmt(s?.landlords.verified)} verified</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-amber-600 font-medium">{fmt(s?.landlords.pending_verification)} pending</span>
              </div>
              <Bar value={s?.landlords.verified ?? 0} max={s?.landlords.total ?? 1} color="bg-green-400" />
            </CardContent>
          </Card>

          {/* Tenants */}
          <Card className="border-purple-200 bg-white/90 cursor-pointer hover:border-purple-400 transition-colors"
            onClick={() => router.push("/admin/users/tenants")}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenants</p>
                <Users className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{fmt(s?.tenants.total)}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                <span className="text-xs text-green-600 font-medium">{fmt(s?.tenants.verified)} verified</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-amber-600 font-medium">{fmt(s?.tenants.pending_verification)} pending</span>
              </div>
              <Bar value={s?.tenants.verified ?? 0} max={s?.tenants.total ?? 1} color="bg-purple-400" />
            </CardContent>
          </Card>

          {/* Properties */}
          <Card className="border-green-200 bg-white/90 cursor-pointer hover:border-green-400 transition-colors"
            onClick={() => router.push("/admin/property-verification")}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Properties</p>
                <Home className="w-3.5 h-3.5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{fmt(s?.properties.total)}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                <span className="text-xs text-green-600 font-medium">{fmt(s?.properties.verified)} live</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-amber-600 font-medium">{fmt(s?.properties.pending_verification)} review</span>
              </div>
              <Bar value={s?.properties.verified ?? 0} max={s?.properties.total ?? 1} color="bg-green-400" />
            </CardContent>
          </Card>

          {/* Pending reviews (action KPI) */}
          <Card className={`border-2 bg-white/90 cursor-pointer transition-colors ${totalPending > 0 ? "border-red-200 hover:border-red-400" : "border-slate-200"}`}
            onClick={() => router.push("/admin/landlord-verification")}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</p>
                <Clock className={`w-3.5 h-3.5 ${totalPending > 0 ? "text-red-400" : "text-slate-300"}`} />
              </div>
              <p className={`text-2xl font-bold ${totalPending > 0 ? "text-red-600" : "text-slate-400"}`}>
                {fmt(totalPending)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">across all queues</p>
              {totalPending > 0
                ? <Badge className="mt-1.5 bg-red-100 text-red-700 border-red-200 text-xs"><Zap className="w-2.5 h-2.5 mr-1" />Action needed</Badge>
                : <p className="text-xs text-green-600 mt-1 font-medium">All clear ✓</p>}
            </CardContent>
          </Card>

          {/* Today's signups */}
          <Card className="border-slate-200 bg-white/90">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today</p>
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {fmt((s?.recent_activity.new_landlord_signups_today ?? 0) + (s?.recent_activity.new_tenant_signups_today ?? 0))}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">new signups</p>
              <div className="flex gap-1 mt-1">
                <span className="text-xs text-orange-600 font-medium">{fmt(s?.recent_activity.new_landlord_signups_today)} LL</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-purple-600 font-medium">{fmt(s?.recent_activity.new_tenant_signups_today)} T</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── MAIN 2-COL BODY ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — Priority Action Queue (2 cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Action queue table */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="w-4 h-4 text-orange-500" />
                    Priority Action Queue
                  </CardTitle>
                  <span className="text-xs text-slate-400">
                    {priorityRows.length === 0 ? "Nothing pending" : `${priorityRows.length} queue${priorityRows.length !== 1 ? "s" : ""} need attention`}
                  </span>
                </div>
                <CardDescription>Items requiring admin action right now</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {priorityRows.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">All queues clear</p>
                    <p className="text-xs text-slate-400 mt-1">No pending reviews across the platform</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Count</th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Priority</th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Volume</th>
                          <th className="py-2.5 px-4" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {priorityRows.map((row) => (
                          <tr key={row.label} className="hover:bg-orange-50/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-lg ${row.bg} flex items-center justify-center shrink-0`}>
                                  <row.icon className={`w-3.5 h-3.5 ${row.color}`} />
                                </div>
                                <span className="font-medium text-slate-900 text-sm">{row.label}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`text-xl font-bold ${row.color}`}>{fmt(row.count)}</span>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              {urgencyBadge(row.urgency)}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell w-40">
                              <Bar
                                value={row.count}
                                max={Math.max(...priorityRows.map(r => r.count), 1)}
                                color={
                                  row.urgency === "high" ? "bg-red-400" :
                                  row.urgency === "medium" ? "bg-amber-400" :
                                  "bg-slate-300"
                                }
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                onClick={() => router.push(row.href)}
                                className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                Review <ChevronRight className="w-3 h-3 ml-0.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Summary footer */}
                      <tfoot>
                        <tr className="border-t-2 border-orange-200 bg-orange-50/60">
                          <td className="py-2.5 px-4 text-xs font-semibold text-slate-600">Total pending</td>
                          <td className="py-2.5 px-4 text-right font-bold text-orange-700">{fmt(totalPending)}</td>
                          <td colSpan={3} className="py-2.5 px-4 text-xs text-slate-400">across all queues</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform breakdown table */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 className="w-4 h-4 text-orange-500" />
                  Platform Breakdown
                </CardTitle>
                <CardDescription>Verification status across all entity types</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected</th>
                        <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Landlords row */}
                      <tr className="hover:bg-orange-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
                              <Building className="w-3 h-3 text-orange-600" />
                            </div>
                            <span className="font-medium text-slate-900">Landlords</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">{fmt(s?.landlords.total)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-green-600 font-semibold">{fmt(s?.landlords.verified)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${(s?.landlords.pending_verification ?? 0) > 0 ? "text-amber-600" : "text-slate-400"}`}>
                            {fmt(s?.landlords.pending_verification)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${(s?.landlords.rejected ?? 0) > 0 ? "text-red-500" : "text-slate-400"}`}>
                            {fmt(s?.landlords.rejected)}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell w-28">
                          <div className="flex items-center gap-2">
                            <Bar value={s?.landlords.verified ?? 0} max={s?.landlords.total ?? 1} color="bg-orange-400" />
                            <span className="text-xs text-slate-500 shrink-0">
                              {pct(s?.landlords.verified ?? 0, s?.landlords.total ?? 0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Tenants row */}
                      <tr className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                              <Users className="w-3 h-3 text-purple-600" />
                            </div>
                            <span className="font-medium text-slate-900">Tenants</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">{fmt(s?.tenants.total)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-green-600 font-semibold">{fmt(s?.tenants.verified)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${(s?.tenants.pending_verification ?? 0) > 0 ? "text-amber-600" : "text-slate-400"}`}>
                            {fmt(s?.tenants.pending_verification)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${(s?.tenants.rejected ?? 0) > 0 ? "text-red-500" : "text-slate-400"}`}>
                            {fmt(s?.tenants.rejected)}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell w-28">
                          <div className="flex items-center gap-2">
                            <Bar value={s?.tenants.verified ?? 0} max={s?.tenants.total ?? 1} color="bg-purple-400" />
                            <span className="text-xs text-slate-500 shrink-0">
                              {pct(s?.tenants.verified ?? 0, s?.tenants.total ?? 0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Properties row */}
                      <tr className="hover:bg-green-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                              <Home className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="font-medium text-slate-900">Properties</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">{fmt(s?.properties.total)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-green-600 font-semibold">{fmt(s?.properties.verified)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${(s?.properties.pending_verification ?? 0) > 0 ? "text-amber-600" : "text-slate-400"}`}>
                            {fmt(s?.properties.pending_verification)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${(s?.properties.rejected ?? 0) > 0 ? "text-red-500" : "text-slate-400"}`}>
                            {fmt(s?.properties.rejected)}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell w-28">
                          <div className="flex items-center gap-2">
                            <Bar value={s?.properties.verified ?? 0} max={s?.properties.total ?? 1} color="bg-green-400" />
                            <span className="text-xs text-slate-500 shrink-0">
                              {pct(s?.properties.verified ?? 0, s?.properties.total ?? 0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    {/* Grand total footer */}
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td className="py-2.5 px-4 text-xs font-semibold text-slate-600">Platform total</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {fmt((s?.landlords.total ?? 0) + (s?.tenants.total ?? 0) + (s?.properties.total ?? 0))}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-green-600">
                          {fmt((s?.landlords.verified ?? 0) + (s?.tenants.verified ?? 0) + (s?.properties.verified ?? 0))}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-amber-600">
                          {fmt(totalPending)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-red-500">
                          {fmt((s?.landlords.rejected ?? 0) + (s?.tenants.rejected ?? 0) + (s?.properties.rejected ?? 0))}
                        </td>
                        <td className="py-2.5 px-4 hidden md:table-cell text-xs text-slate-400">
                          {pct(totalVerified, totalUsers)}% users verified
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT — Platform Health panel (1 col, sticky) */}
          <div className="space-y-4">

            {/* Health summary */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-orange-500" />
                  Platform Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Verification health */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600">User verification rate</span>
                    <span className="text-xs font-bold text-slate-900">{pct(totalVerified, totalUsers)}%</span>
                  </div>
                  <Bar value={totalVerified} max={totalUsers} color="bg-green-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600">Property approval rate</span>
                    <span className="text-xs font-bold text-slate-900">
                      {pct(s?.properties.verified ?? 0, s?.properties.total ?? 0)}%
                    </span>
                  </div>
                  <Bar value={s?.properties.verified ?? 0} max={s?.properties.total ?? 1} color="bg-blue-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600">Landlord onboarding rate</span>
                    <span className="text-xs font-bold text-slate-900">
                      {pct(
                        (s?.landlords.total ?? 0) - (s?.landlords.pending_onboarding ?? 0),
                        s?.landlords.total ?? 0
                      )}%
                    </span>
                  </div>
                  <Bar
                    value={(s?.landlords.total ?? 0) - (s?.landlords.pending_onboarding ?? 0)}
                    max={s?.landlords.total ?? 1}
                    color="bg-orange-400"
                  />
                </div>

                <Separator />

                {/* Today's activity */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Today's activity</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-orange-400" /> New landlords
                      </span>
                      <span className="text-xs font-bold text-orange-600">
                        +{fmt(s?.recent_activity.new_landlord_signups_today)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-purple-400" /> New tenants
                      </span>
                      <span className="text-xs font-bold text-purple-600">
                        +{fmt(s?.recent_activity.new_tenant_signups_today)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Home className="w-3 h-3 text-green-400" /> New properties
                      </span>
                      <span className="text-xs font-bold text-green-600">
                        +{fmt(s?.recent_activity.new_properties_today)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rejection rates */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rejection summary</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Landlords rejected", val: s?.landlords.rejected ?? 0, total: s?.landlords.total ?? 0 },
                      { label: "Tenants rejected",   val: s?.tenants.rejected ?? 0,   total: s?.tenants.total ?? 0 },
                      { label: "Properties rejected", val: s?.properties.rejected ?? 0, total: s?.properties.total ?? 0 },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{row.label}</span>
                        <span className={`text-xs font-semibold ${row.val > 0 ? "text-red-500" : "text-slate-400"}`}>
                          {fmt(row.val)}
                          {row.val > 0 && (
                            <span className="text-slate-400 font-normal ml-1">
                              ({pct(row.val, row.total)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Onboarding funnel card */}
            <Card className="border-amber-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Onboarding Funnel
                </CardTitle>
                <CardDescription>Landlord lifecycle stages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { stage: "Signed up",       val: s?.landlords.total ?? 0,                icon: "1", color: "bg-slate-200 text-slate-700" },
                  { stage: "In onboarding",   val: s?.landlords.pending_onboarding ?? 0,   icon: "2", color: "bg-amber-200 text-amber-800" },
                  { stage: "Submitted docs",  val: s?.onboarding?.completed_submissions ?? 0, icon: "3", color: "bg-orange-200 text-orange-800" },
                  { stage: "Under review",    val: s?.onboarding?.in_review ?? 0,           icon: "4", color: "bg-blue-200 text-blue-800" },
                  { stage: "Approved",        val: s?.landlords.verified ?? 0,             icon: "5", color: "bg-green-200 text-green-800" },
                ].map((row) => (
                  <div key={row.stage} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${row.color}`}>
                      {row.icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-slate-600">{row.stage}</span>
                        <span className="text-xs font-bold text-slate-900">{fmt(row.val)}</span>
                      </div>
                      <Bar value={row.val} max={s?.landlords.total ?? 1} color="bg-orange-300" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* ── RECENT SIGNUPS TABLE ─────────────────────────────────────── */}
        <Card className="border-orange-200 bg-white/90 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  Recent Signups
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Latest users across all types — last 7 days
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {signupsLoading && (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                )}
                <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                  {recentSignups.length} users
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {signupsLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded" />
                ))}
              </div>
            ) : recentSignups.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No signups in the last 7 days</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                        <th className="py-2.5 px-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentSignups.slice(0, 10).map((u) => (
                        <tr key={u.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                u.user_type === "landlord"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}>
                                {(u.full_name ?? "?").charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-900 truncate max-w-[120px]">
                                {u.full_name || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs hidden sm:table-cell truncate max-w-[180px]">
                            {u.email}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`text-xs border ${
                              u.user_type === "landlord"
                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                : "bg-purple-100 text-purple-700 border-purple-200"
                            }`}>
                              {u.user_type === "landlord" ? "Landlord" : "Tenant"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <StatusPill status={u.verification_status} />
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400 hidden md:table-cell whitespace-nowrap">
                            {timeAgo(u.created_at)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-orange-600 hover:bg-orange-50 hover:text-orange-700 px-2"
                              onClick={() => router.push(
                                u.user_type === "landlord"
                                  ? "/admin/landlord-verification"
                                  : "/admin/tenant-verification"
                              )}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {recentSignups.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-orange-200 bg-orange-50/60">
                          <td className="py-2.5 px-4 text-xs font-semibold text-slate-600">
                            Showing {Math.min(10, recentSignups.length)} of {recentSignups.length}
                          </td>
                          <td colSpan={5} className="py-2.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-orange-600 hover:bg-orange-100"
                              onClick={() => router.push("/admin/users/landlords")}
                            >
                              View all users <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── QUICK NAV GRID ───────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick navigation</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Landlord Verification", href: "/admin/landlord-verification", icon: Building,  color: "text-orange-600", bg: "bg-orange-50 hover:bg-orange-100 border-orange-200", badge: s?.landlords.pending_verification },
              { label: "Tenant Verification",   href: "/admin/tenant-verification",   icon: Users,     color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100 border-purple-200", badge: s?.tenants.pending_verification },
              { label: "Property Review",       href: "/admin/property-verification", icon: Home,      color: "text-green-600",  bg: "bg-green-50 hover:bg-green-100 border-green-200",   badge: s?.properties.pending_verification },
              { label: "All Landlords",         href: "/admin/users/landlords",       icon: Building2, color: "text-orange-600", bg: "bg-white hover:bg-orange-50 border-slate-200", badge: null },
              { label: "All Tenants",           href: "/admin/users/tenants",         icon: Users,     color: "text-purple-600", bg: "bg-white hover:bg-purple-50 border-slate-200", badge: null },
              { label: "Settings",              href: "/admin/settings",              icon: Shield,    color: "text-slate-600",  bg: "bg-white hover:bg-slate-50 border-slate-200",  badge: null },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center group ${item.bg}`}
              >
                {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center z-10">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
                <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-medium text-slate-700 leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
