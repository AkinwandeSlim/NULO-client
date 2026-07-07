"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  ArrowLeft, RefreshCw, TrendingUp, Banknote, Wallet,
  ArrowRightLeft, Activity, AlertCircle, CheckCircle2,
  Clock, BarChart2, Building, Loader2, TrendingDown,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import adminDashboardAPI from "@/lib/api/adminDashboard"
import type { AdminAnalyticsSummary, GmvTrendPoint } from "@/lib/api/adminDashboard"

// ─── formatting helpers ──────────────────────────────────────────────────────

const fmtNGN = (n: number | null | undefined) =>
  n == null ? "—" : `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtCount = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("en-NG")

const pct = (part: number, total: number) =>
  total === 0 ? 0 : Math.min(100, Math.round((part / total) * 100))

// ─── period label helper ──────────────────────────────────────────────────────

const periodLabel: Record<string, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last 12 months",
}

// ─── inline bar (no chart lib) ────────────────────────────────────────────────

function Bar({ value, max, color, h = "h-1.5" }: {
  value: number; max: number; color: string; h?: string
}) {
  const w = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={`${h} w-full rounded-full bg-slate-100 overflow-hidden`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${w}%` }} />
    </div>
  )
}

// ─── GMV area chart (Recharts) ────────────────────────────────────────────────

// Compact NGN axis tick: ₦50k, ₦1.2m etc.
function fmtAxisNGN(val: number): string {
  if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}m`
  if (val >= 1_000)     return `₦${(val / 1_000).toFixed(0)}k`
  return `₦${val}`
}

// Compact x-axis label: strip year prefix so "2026-06-24" → "24 Jun"
function fmtAxisDate(raw: string): string {
  // ISO week format "2026-WW" → keep as-is trimmed
  if (/^\d{4}-\d{2}$/.test(raw)) return raw.replace(/^\d{4}-/, "W")
  // ISO date "2026-06-24" → "24 Jun"
  try {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" })
    }
  } catch { /**/ }
  return raw
}

function TrendChart({ data }: { data: GmvTrendPoint[] }) {
  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!data.length) {
    return (
      <div className="h-52 flex flex-col items-center justify-center gap-3 rounded-lg bg-slate-50 border border-dashed border-slate-200">
        <TrendingDown className="w-10 h-10 text-slate-300" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">No payment data yet</p>
          <p className="text-xs text-slate-400 mt-1">
            GMV trend will appear once rent payments are collected
          </p>
        </div>
      </div>
    )
  }

  // ── Single data point: show a flat line with a dot instead of an empty area ─
  // Recharts needs ≥2 points for a meaningful area curve. Duplicate the point
  // with a slightly different label so it renders cleanly.
  const chartData = data.length === 1
    ? [data[0], { ...data[0], period: `${data[0].period} ` }]
    : data

  // Average line value for context
  const avg = data.reduce((s, d) => s + d.amount_ngn, 0) / data.length

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700">
        <p className="font-medium mb-1 text-slate-300">{label}</p>
        <p className="font-bold text-orange-300 text-sm">
          {fmtNGN(payload[0]?.value)}
        </p>
      </div>
    )
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        >
          {/* gradient fill */}
          <defs>
            <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

          <XAxis
            dataKey="period"
            tickFormatter={fmtAxisDate}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            // Show at most 8 labels regardless of data density
            interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
          />

          <YAxis
            tickFormatter={fmtAxisNGN}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "4 2" }} />

          {/* Average reference line */}
          <ReferenceLine
            y={avg}
            stroke="#f97316"
            strokeDasharray="4 3"
            strokeOpacity={0.4}
            label={{ value: "avg", position: "insideTopRight", fontSize: 9, fill: "#f97316", opacity: 0.6 }}
          />

          <Area
            type="monotone"
            dataKey="amount_ngn"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#gmvGradient)"
            dot={data.length <= 7 ? { r: 3, fill: "#f97316", strokeWidth: 0 } : false}
            activeDot={{ r: 5, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
            isAnimationActive={true}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── KPI metric card ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, border, iconColor,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  border: string
  iconColor: string
}) {
  return (
    <Card className={`${border} bg-white/90`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [mounted,      setMounted]      = useState(false)
  const [period,       setPeriod]       = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [data,         setData]         = useState<AdminAnalyticsSummary | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [lastFetch,    setLastFetch]    = useState<Date | null>(null)

  // ── auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || authLoading) return
    if (!user) { router.push("/signin"); return }
    if (user.user_type !== "admin") { router.push("/admin"); return }
  }, [mounted, authLoading, user, router])

  // ── fetch analytics ────────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async (p: typeof period) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminDashboardAPI.getAdminAnalyticsSummary(p)
      setData(result)
      setLastFetch(new Date())
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Failed to load analytics"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  // initial load + period change
  useEffect(() => {
    if (mounted && user?.user_type === "admin") {
      fetchAnalytics(period)
    }
  }, [mounted, user, period]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = (p: typeof period) => {
    if (p !== period) setPeriod(p)
  }

  // ── derived values ──────────────────────────────────────────────────────────
  const disbReleasedPct = data
    ? pct(data.disbursements.released_ngn, data.disbursements.total_ngn)
    : 0

  const isBooting = !mounted || authLoading

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (isBooting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Platform payment performance · {periodLabel[period]}
              {lastFetch && (
                <span className="ml-2 text-slate-400">
                  · updated {lastFetch.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Period toggle */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              {(["7d", "30d", "90d", "1y"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    period === p
                      ? "bg-orange-500 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => fetchAnalytics(period)}
              disabled={loading}
              className="text-orange-700 border-orange-200 hover:bg-orange-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs text-red-700 hover:bg-red-100"
              onClick={() => fetchAnalytics(period)}>
              Retry
            </Button>
          </div>
        )}

        {/* ── 5 KPI cards ── */}
        {loading && !data ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              label="GMV"
              value={fmtNGN(data?.gmv.total_ngn)}
              sub={`${fmtCount(data?.gmv.payment_count)} payments`}
              icon={TrendingUp}
              border="border-orange-200"
              iconColor="text-orange-500"
            />
            <KpiCard
              label="Disbursed"
              value={fmtNGN(data?.disbursements.released_ngn)}
              sub={`${fmtCount(data?.disbursements.count)} transfers`}
              icon={ArrowRightLeft}
              border="border-green-200"
              iconColor="text-green-500"
            />
            <KpiCard
              label="Pending Payout"
              value={fmtNGN(data?.disbursements.pending_ngn)}
              sub="awaiting release"
              icon={Clock}
              border="border-amber-200"
              iconColor="text-amber-500"
            />
            <KpiCard
              label="Platform Revenue"
              value={fmtNGN(data?.revenue.platform_fee_ngn)}
              sub={
                data?.revenue.take_rate_pct != null
                  ? `${data.revenue.take_rate_pct.toFixed(1)}% take rate`
                  : undefined
              }
              icon={Banknote}
              border="border-purple-200"
              iconColor="text-purple-500"
            />
            <KpiCard
              label="Active Agreements"
              value={fmtCount(data?.health.active_agreements)}
              sub={
                data?.health.failed_payment_rate_pct != null
                  ? `${data.health.failed_payment_rate_pct.toFixed(1)}% partial rate`
                  : undefined
              }
              icon={Activity}
              border="border-slate-200"
              iconColor="text-slate-500"
            />
          </div>
        )}

        {/* ── Row 2: GMV trend (2/3) + live wallet (1/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* GMV trend chart */}
          <Card className="border-orange-200 bg-white/90 shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart2 className="w-4 h-4 text-orange-500" />
                    GMV Trend
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Rent collected per {period === "7d" || period === "30d" ? "day" : period === "90d" ? "week" : "month"}
                    {" · "}{periodLabel[period]}
                  </CardDescription>
                </div>
                {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
              </div>
            </CardHeader>
            <CardContent>
              {loading && !data ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <>
                  <TrendChart data={data?.gmv.trend ?? []} />
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Total GMV</p>
                      <p className="text-sm font-bold text-slate-900">{fmtNGN(data?.gmv.total_ngn)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Payments</p>
                      <p className="text-sm font-bold text-slate-900">{fmtCount(data?.gmv.payment_count)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Avg per payment</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data?.gmv.payment_count && data.gmv.payment_count > 0
                          ? fmtNGN(data.gmv.total_ngn / data.gmv.payment_count)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Live Nomba wallet */}
          <Card className="border-blue-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="w-4 h-4 text-blue-500" />
                Live Wallet Balance
              </CardTitle>
              <CardDescription>NuloAfrica Nomba sub-account</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !data ? (
                <Skeleton className="h-20 w-full" />
              ) : data?.live_balance.error ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-800 mb-0.5">Balance unavailable</p>
                    <p className="text-xs text-red-600">{data.live_balance.error}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4">
                    <p className="text-xs text-blue-600 font-medium mb-1">Available balance</p>
                    <p className="text-3xl font-bold text-blue-800">
                      {fmtNGN(data?.live_balance.amount_ngn)}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">NGN · real-time from Nomba</p>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Released ({periodLabel[period]})</span>
                        <span className="font-medium text-green-700">
                          {fmtNGN(data?.disbursements.released_ngn)}
                        </span>
                      </div>
                      <Bar value={disbReleasedPct} max={100} color="bg-green-400" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Pending</span>
                        <span className="font-medium text-amber-700">
                          {fmtNGN(data?.disbursements.pending_ngn)}
                        </span>
                      </div>
                      <Bar
                        value={pct(data?.disbursements.pending_ngn ?? 0, data?.disbursements.total_ngn ?? 1)}
                        max={100}
                        color="bg-amber-400"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Disbursement + Revenue ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Disbursement breakdown */}
          <Card className="border-green-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRightLeft className="w-4 h-4 text-green-500" />
                Disbursement Breakdown
              </CardTitle>
              <CardDescription>{periodLabel[period]}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !data ? <Skeleton className="h-36 w-full" /> : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Released",  val: data?.disbursements.released_ngn, cls: "bg-green-50 border-green-200",  text: "text-green-700"  },
                      { label: "Pending",   val: data?.disbursements.pending_ngn,  cls: "bg-amber-50 border-amber-200",  text: "text-amber-700"  },
                      { label: "Total",     val: data?.disbursements.total_ngn,    cls: "bg-slate-50 border-slate-200",  text: "text-slate-900"  },
                    ].map(r => (
                      <div key={r.label} className={`p-3 rounded-lg border ${r.cls}`}>
                        <p className="text-xs text-slate-500 mb-0.5">{r.label}</p>
                        <p className={`text-sm font-bold ${r.text}`}>{fmtNGN(r.val)}</p>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  {/* Stacked released/pending bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Released vs pending</span>
                      <span>{disbReleasedPct}% released</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div className="h-full bg-green-400 rounded-l-full transition-all duration-500"
                        style={{ width: `${disbReleasedPct}%` }} />
                      <div className="h-full bg-amber-400 rounded-r-full transition-all duration-500"
                        style={{ width: `${100 - disbReleasedPct}%` }} />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Released
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Pending
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Total transactions</span>
                    <span className="font-bold text-slate-900">{fmtCount(data?.disbursements.count)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue / take rate */}
          <Card className="border-purple-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="w-4 h-4 text-purple-500" />
                Platform Revenue
              </CardTitle>
              <CardDescription>{periodLabel[period]}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !data ? <Skeleton className="h-36 w-full" /> : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium mb-1">Platform fee collected</p>
                    <p className="text-3xl font-bold text-purple-800">
                      {fmtNGN(data?.revenue.platform_fee_ngn)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Take rate</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                          {data?.revenue.take_rate_pct?.toFixed(1) ?? "—"}%
                        </span>
                        {data?.revenue.take_rate_pct != null && (
                          <Badge className={
                            data.revenue.take_rate_pct >= 4.5 && data.revenue.take_rate_pct <= 5.5
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                          }>
                            {data.revenue.take_rate_pct >= 4.5 && data.revenue.take_rate_pct <= 5.5
                              ? "On target" : "Off target"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* 0–10% bar, target marker at 50% */}
                    <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((data?.revenue.take_rate_pct ?? 0) / 10) * 100)}%` }} />
                      {/* target line */}
                      <div className="absolute top-0 bottom-0 w-px bg-purple-700 opacity-50"
                        style={{ left: "50%" }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0%</span>
                      <span className="text-purple-500 font-medium">Target ~5%</span>
                      <span>10%</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">GMV this period</span>
                    <span className="font-bold text-slate-900">{fmtNGN(data?.gmv.total_ngn)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: Top landlords + Payment health ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top landlords table */}
          <div className="lg:col-span-2">
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="w-4 h-4 text-orange-500" />
                  Top Landlords by Volume
                </CardTitle>
                <CardDescription>Ranked by total disbursed · {periodLabel[period]}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading && !data ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
                  </div>
                ) : !data?.top_landlords_by_volume.length ? (
                  <div className="py-12 text-center">
                    <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No disbursements in this period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Landlord</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Disbursed</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">% of total</th>
                          <th className="py-2.5 px-4 hidden md:table-cell" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.top_landlords_by_volume.map((ll, idx) => {
                          const share = pct(ll.total_disbursed_ngn, data.disbursements.total_ngn)
                          return (
                            <tr key={ll.landlord_id} className="hover:bg-orange-50/40 transition-colors">
                              <td className="py-3 px-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-900 text-sm">{ll.full_name || "—"}</p>
                                <p className="text-xs text-slate-400">{ll.email}</p>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900">
                                {fmtNGN(ll.total_disbursed_ngn)}
                              </td>
                              <td className="py-3 px-4 text-right text-xs text-slate-500 hidden md:table-cell">
                                {share}%
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell w-28">
                                <Bar value={share} max={100} color="bg-orange-400" h="h-1.5" />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-orange-200 bg-orange-50/60">
                          <td colSpan={2} className="py-2.5 px-4 text-xs font-semibold text-slate-600">
                            All disbursements
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-orange-700">
                            {fmtNGN(data.disbursements.total_ngn)}
                          </td>
                          <td colSpan={2} className="py-2.5 px-4 text-xs text-slate-400 hidden md:table-cell">
                            {fmtCount(data.disbursements.count)} transactions
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment health panel */}
          <div>
            <Card className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-slate-500" />
                  Payment Health
                </CardTitle>
                <CardDescription>{periodLabel[period]}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loading && !data ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <>
                    {/* Active agreements */}
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-slate-700">Active agreements</span>
                      </div>
                      <span className="text-lg font-bold text-green-700">
                        {fmtCount(data?.health.active_agreements)}
                      </span>
                    </div>

                    <Separator />

                    {/* Transfer totals */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Transfer outcomes
                      </p>
                      <div className="space-y-3">
                        {[
                          {
                            label: "Successful",
                            val: (data?.health.total_transfers ?? 0) - (data?.health.failed_count ?? 0),
                            total: data?.health.total_transfers ?? 0,
                            color: "bg-green-400",
                            textColor: "text-green-700",
                          },
                          {
                            label: "Partial / failed",
                            val: data?.health.failed_count ?? 0,
                            total: data?.health.total_transfers ?? 0,
                            color: "bg-red-400",
                            textColor: "text-red-600",
                          },
                        ].map(row => (
                          <div key={row.label}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-600">{row.label}</span>
                              <span className={`text-xs font-semibold ${row.textColor}`}>
                                {fmtCount(row.val)}{" "}
                                <span className="text-slate-400 font-normal">
                                  ({pct(row.val, row.total)}%)
                                </span>
                              </span>
                            </div>
                            <Bar value={row.val} max={row.total} color={row.color} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Failure rate */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Partial / failed rate</span>
                      <span className={`text-sm font-bold ${
                        (data?.health.failed_payment_rate_pct ?? 0) > 10
                          ? "text-red-600"
                          : (data?.health.failed_payment_rate_pct ?? 0) > 5
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}>
                        {data?.health.failed_payment_rate_pct?.toFixed(1) ?? "—"}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Total transfers</span>
                      <span className="text-sm font-bold text-slate-900">
                        {fmtCount(data?.health.total_transfers)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
