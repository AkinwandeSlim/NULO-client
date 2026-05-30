"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search, FileText, ArrowLeft,
  CheckCircle2, Clock, Eye, PenLine,
  MapPin, Banknote
} from "lucide-react"
import Link from "next/link"
import { agreementsAPI, type AgreementWithDetails } from "@/lib/api/agreements"
import { toast } from "sonner"
import { AIBadge } from "@/components/ui/ai-badge"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed="

// ─────────────────────────────────────────────────────────────────────────────
// Rule 22: all helpers and sub-components defined at module level
// ─────────────────────────────────────────────────────────────────────────────

const formatNGN = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG")}`

// FIX: use en-NG locale — not en-US
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric", month: "short", day: "numeric",
  })

/**
 * FIX: Single flat lookup table.
 * Removed the 3-param (status, tenantSignedAt, landlordSignedAt) helper functions —
 * the DB status field is the source of truth and must be trusted directly.
 */
const STATUS_CONFIG: Record<AgreementWithDetails["status"], {
  label: string
  bg: string
  text: string
  dot: string
  border: string
}> = {
  DRAFT:            { label: "Draft",                     bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400",   border: "border-l-slate-300"   },
  PENDING_TENANT:   { label: "Awaiting Tenant Signature", bg: "bg-orange-100",  text: "text-orange-600",  dot: "bg-orange-500",  border: "border-l-orange-400"  },
  PENDING_LANDLORD: { label: "Awaiting Your Signature",   bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   border: "border-l-amber-500"   },
  SIGNED:           { label: "Fully Signed",              bg: "bg-green-100",   text: "text-green-700",   dot: "bg-green-500",   border: "border-l-green-500"   },
  ACTIVE:           { label: "Active",                    bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-l-emerald-500" },
  EXPIRED:          { label: "Expired",                   bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400",   border: "border-l-slate-300"   },
  TERMINATED:       { label: "Terminated",                bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-400",     border: "border-l-red-400"     },
}

/**
 * Derive the display/logic status from signature timestamps, falling back to the DB status.
 *
 * Why this exists: the DB `status` field can lag — e.g. a tenant signs but the
 * backend hasn't flipped `PENDING_TENANT` → `PENDING_LANDLORD` yet, so the landlord
 * sees "Awaiting Tenant Signature" on a card where the tenant already signed, and the
 * "Your Signature Needed" stat shows 0 instead of 1.
 *
 * Timestamp resolution order (timestamps are facts; status is derived):
 *   tenant_signed_at && !landlord_signed_at  → PENDING_LANDLORD  (your turn)
 *   !tenant_signed_at && landlord_signed_at  → PENDING_TENANT    (their turn — edge case)
 *   tenant_signed_at && landlord_signed_at   → defer to DB status (SIGNED / ACTIVE)
 *   neither signed                           → defer to DB status (DRAFT / PENDING_TENANT)
 */
function getEffectiveStatus(a: AgreementWithDetails): AgreementWithDetails["status"] {
  const tenantSigned   = Boolean(a.tenant_signed_at)
  const landlordSigned = Boolean(a.landlord_signed_at)

  if (tenantSigned && !landlordSigned)  return "PENDING_LANDLORD"
  if (!tenantSigned && landlordSigned)  return "PENDING_TENANT"
  return a.status
}

const STATUS_SORT_ORDER: AgreementWithDetails["status"][] = [
  "PENDING_LANDLORD",
  "PENDING_TENANT",
  "SIGNED",
  "ACTIVE",
  "DRAFT",
  "EXPIRED",
  "TERMINATED",
]

function sortAgreements(list: AgreementWithDetails[]): AgreementWithDetails[] {
  return [...list].sort(
    (a, b) =>
      STATUS_SORT_ORDER.indexOf(getEffectiveStatus(a)) -
      STATUS_SORT_ORDER.indexOf(getEffectiveStatus(b))
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge (Rule 22)
// ─────────────────────────────────────────────────────────────────────────────

// Accepts the full agreement so it can use getEffectiveStatus
function StatusBadge({ agreement }: { agreement: AgreementWithDetails }) {
  const effective = getEffectiveStatus(agreement)
  const cfg = STATUS_CONFIG[effective] ?? STATUS_CONFIG.DRAFT
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AgreementCard (Rule 22)
// ─────────────────────────────────────────────────────────────────────────────

function AgreementCard({ agreement }: { agreement: AgreementWithDetails }) {
  const { property, tenant } = agreement
  // Use effective status so timestamps override stale DB status
  const effective = getEffectiveStatus(agreement)
  const cfg = STATUS_CONFIG[effective] ?? STATUS_CONFIG.DRAFT

  return (
    <Card className={`border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 ${cfg.border}`}>
      <CardContent className="p-5">
        <div className="flex gap-5">

          {/* Property thumbnail */}
          <div className="relative flex-shrink-0">
            <div className="w-36 h-28 rounded-xl overflow-hidden bg-slate-100">
              <img
                src={property?.images?.[0] ?? DEFAULT_PROPERTY_IMAGE}
                alt={property?.title ?? "Property"}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
              {formatNGN(agreement.rent_amount)}/mo
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Title + badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate" style={{ fontFamily: "Syne, sans-serif" }}>
                  {property?.title ?? "Property Agreement"}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                  <span className="truncate">
                    {property?.city ?? property?.location ?? "—"}
                    {property?.state ? `, ${property.state}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge agreement={agreement} />
                <AIBadge agreement={agreement} variant="compact" />
              </div>
            </div>

            {/* Tenant pill */}
            <div className="flex items-center gap-2.5 mb-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <Avatar className="w-7 h-7">
                <AvatarImage src={tenant?.avatar_url ?? `${DEFAULT_AVATAR}${tenant?.id}`} />
                <AvatarFallback className="text-xs bg-orange-100 text-orange-700 font-bold">
                  {tenant?.full_name?.[0] ?? "T"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{tenant?.full_name ?? "—"}</p>
                <p className="text-xs text-slate-500 truncate">{tenant?.email ?? "—"}</p>
              </div>
            </div>

            {/* Key figures */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-0.5">Annual Rent</p>
                {/* Nigeria: show annual upfront figure prominently */}
                <p className="text-sm font-semibold text-orange-600">{formatNGN(agreement.rent_amount * 12)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-0.5">Duration</p>
                <p className="text-sm font-semibold text-slate-800">{agreement.lease_duration} months</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-0.5">Start</p>
                <p className="text-sm font-semibold text-slate-800">{formatDate(agreement.lease_start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-0.5">End</p>
                <p className="text-sm font-semibold text-slate-800">{formatDate(agreement.lease_end_date)}</p>
              </div>
            </div>

            {/* Signature dots */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${agreement.tenant_signed_at ? "bg-green-500" : "bg-orange-400"}`} />
                <span className="text-xs text-slate-600">
                  Tenant: <span className="font-medium">{agreement.tenant_signed_at ? "Signed" : "Pending"}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${agreement.landlord_signed_at ? "bg-green-500" : "bg-orange-400"}`} />
                <span className="text-xs text-slate-600">
                  You: <span className="font-medium">{agreement.landlord_signed_at ? "Signed" : "Pending"}</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
              <Link href={`/landlord/agreements/${agreement.id}`}>
                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-8 text-xs">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View Agreement
                </Button>
              </Link>

              {/* Use effective status so a stale DB status still shows the Sign Now button */}
              {effective === "PENDING_LANDLORD" && (
                <Link href={`/landlord/agreements/${agreement.id}`}>
                  <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 h-8 text-xs transition-colors">
                    <PenLine className="mr-1.5 h-3.5 w-3.5" />
                    Sign Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function LandlordAgreementsPage() {
  const { user } = useAuth()
  const router = useRouter()

  // FIX: typed as AgreementWithDetails[] — not any[]
  const [agreements, setAgreements] = useState<AgreementWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    fetchAgreements()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * FIX 1: `getMyAgreements()` returns `{ success, agreements, count }` — not a raw array.
   *         Old code checked `Array.isArray(response)` which was always false → always showed error toast.
   * FIX 2: Backend enriches each agreement with property/tenant/landlord already.
   *         Removed the propertiesAPI.getById() loop — it was redundant and added N extra network calls.
   * FIX 3: Sort result so PENDING_LANDLORD (needs your action) appears first.
   */
  const fetchAgreements = useCallback(async () => {
    try {
      setLoading(true)
      const response = await agreementsAPI.getMyAgreements()

      if (response.success && response.agreements) {
        setAgreements(sortAgreements(response.agreements))
      } else {
        toast.error(response.error ?? "Failed to load agreements")
      }
    } catch (error) {
      console.error("[AgreementsList] fetch error:", error)
      toast.error("Failed to load agreements")
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side filtering across enriched fields
  const filtered = agreements.filter((a) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      a.property?.title?.toLowerCase().includes(q) ||
      a.property?.city?.toLowerCase().includes(q) ||
      a.property?.location?.toLowerCase().includes(q) ||
      a.tenant?.full_name?.toLowerCase().includes(q) ||
      a.tenant?.email?.toLowerCase().includes(q)

    const matchesStatus = statusFilter === "all" || getEffectiveStatus(a) === statusFilter

    return matchesSearch && matchesStatus
  })

  // Stats derived from unfiltered list.
  // Use getEffectiveStatus so a stale DB status field doesn't cause undercounting.
  const stats = {
    total:           agreements.length,
    pendingLandlord: agreements.filter(a => getEffectiveStatus(a) === "PENDING_LANDLORD").length,
    pendingTenant:   agreements.filter(a => getEffectiveStatus(a) === "PENDING_TENANT").length,
    active:          agreements.filter(a => {
                       const s = getEffectiveStatus(a)
                       return s === "ACTIVE" || s === "SIGNED"
                     }).length,
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Agreements</h3>
          <p className="text-slate-600">Fetching your rental agreements...</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/landlord/overview">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
                Rental Agreements
              </h1>
              <p className="text-slate-600">
                Manage your rental agreements and tenant signatures
              </p>
            </div>
            <Link href="/landlord/applications">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                <FileText className="mr-2 h-4 w-4" />
                View Applications
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-0.5">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-0.5">Your Signature Needed</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingLandlord}</p>
              </div>
              <div className={`w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center ${stats.pendingLandlord > 0 ? 'animate-pulse' : ''}`}>
                <PenLine className="h-5 w-5 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-0.5">Awaiting Tenant</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingTenant}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-0.5">Signed / Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by property, location, or tenant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="PENDING_LANDLORD">Awaiting Your Signature</option>
            <option value="PENDING_TENANT">Awaiting Tenant Signature</option>
            <option value="SIGNED">Signed</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {/* List / empty state */}
        {filtered.length === 0 ? (
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-14 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {agreements.length === 0 ? "No Agreements Yet" : "No Matching Agreements"}
              </h3>
              <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                {agreements.length === 0
                  ? "Once you approve a tenant application, the agreement will appear here automatically."
                  : "Try adjusting your search or filter."}
              </p>
              {agreements.length === 0 && (
                <Link href="/landlord/applications">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                    <Eye className="h-4 w-4 mr-2" />
                    View Applications
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((agreement) => (
              <AgreementCard key={agreement.id} agreement={agreement} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}