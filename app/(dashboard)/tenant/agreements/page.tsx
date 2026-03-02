"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileText,
  Home,
  Clock,
  CheckCircle2,
  Eye,
  Search,
  PenLine,
  MapPin,
  Banknote,
  User
} from "lucide-react"
import Link from "next/link"
import { agreementsAPI, type AgreementWithDetails } from "@/lib/api/agreements"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed="

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (Rule 22 — module level)
// ─────────────────────────────────────────────────────────────────────────────

// FIX: ₦ symbol directly — no Intl currency wrapper that adds "NGN" text
const formatNGN = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG")}`

// FIX: use en-NG locale
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// getEffectiveStatus — resolve display state from timestamps, fall back to DB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tenant perspective. The DB `status` can lag after tenant signs.
 * e.g. tenant signs but status stays "PENDING_TENANT" instead of flipping to
 * "PENDING_LANDLORD", so the badge still says "Awaiting Your Signature" and
 * "Sign Now" stays visible even though the tenant already signed.
 *
 * Signing flow: tenant signs first → landlord countersigns.
 *   !tenant_signed_at                          → PENDING_TENANT  (your turn)
 *   tenant_signed_at && !landlord_signed_at    → PENDING_LANDLORD (awaiting landlord)
 *   both signed                                → defer to DB status (SIGNED / ACTIVE)
 */
function getEffectiveStatus(a: AgreementWithDetails): AgreementWithDetails["status"] {
  if (!a.tenant_signed_at && !a.landlord_signed_at) return a.status   // nothing signed yet — trust DB
  if (a.tenant_signed_at && !a.landlord_signed_at) return "PENDING_LANDLORD"  // tenant done, landlord's turn
  return a.status                                                        // both signed or other terminal state
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS_CONFIG — tenant perspective labels & colours
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AgreementWithDetails["status"], {
  label: string
  bg: string
  text: string
  dot: string
  border: string
}> = {
  DRAFT:            { label: "Draft",                       bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400",   border: "border-l-slate-300"   },
  PENDING_TENANT:   { label: "Awaiting Your Signature",     bg: "bg-orange-100",  text: "text-orange-600",  dot: "bg-orange-500",  border: "border-l-orange-500"  },
  PENDING_LANDLORD: { label: "Awaiting Landlord Signature", bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   border: "border-l-amber-400"   },
  SIGNED:           { label: "Fully Signed",                bg: "bg-green-100",   text: "text-green-700",   dot: "bg-green-500",   border: "border-l-green-500"   },
  ACTIVE:           { label: "Active",                      bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-l-emerald-500" },
  EXPIRED:          { label: "Expired",                     bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400",   border: "border-l-slate-300"   },
  TERMINATED:       { label: "Terminated",                  bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-400",     border: "border-l-red-400"     },
}

// Sort: PENDING_TENANT (needs your action) first, then PENDING_LANDLORD, then rest
const STATUS_SORT_ORDER: AgreementWithDetails["status"][] = [
  "PENDING_TENANT", "PENDING_LANDLORD", "SIGNED", "ACTIVE", "DRAFT", "EXPIRED", "TERMINATED",
]

function sortAgreements(list: AgreementWithDetails[]): AgreementWithDetails[] {
  return [...list].sort(
    (a, b) => STATUS_SORT_ORDER.indexOf(getEffectiveStatus(a)) - STATUS_SORT_ORDER.indexOf(getEffectiveStatus(b))
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge (Rule 22)
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ agreement }: { agreement: AgreementWithDetails }) {
  const cfg = STATUS_CONFIG[getEffectiveStatus(agreement)] ?? STATUS_CONFIG.DRAFT
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AgreementCard (Rule 22 — never inline in .map())
// ─────────────────────────────────────────────────────────────────────────────

function AgreementCard({ agreement }: { agreement: AgreementWithDetails }) {
  const { property, landlord } = agreement
  const effective = getEffectiveStatus(agreement)
  const cfg = STATUS_CONFIG[effective] ?? STATUS_CONFIG.DRAFT

  return (
    <Card className={`border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 ${cfg.border}`}>
      <CardContent className="p-5">
        <div className="flex gap-5">

          {/* Property thumbnail */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-24 rounded-xl overflow-hidden bg-slate-100">
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
              <StatusBadge agreement={agreement} />
            </div>

            {/* Landlord pill */}
            <div className="flex items-center gap-2.5 mb-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {landlord?.full_name ?? "—"}
                </p>
                <p className="text-xs text-slate-500">Property Owner</p>
              </div>
            </div>

            {/* Key figures — annual rent prominent for Nigerian context */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-0.5">Annual Rent</p>
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
                  You: <span className="font-medium">{agreement.tenant_signed_at ? "Signed" : "Pending"}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${agreement.landlord_signed_at ? "bg-green-500" : "bg-orange-400"}`} />
                <span className="text-xs text-slate-600">
                  Landlord: <span className="font-medium">{agreement.landlord_signed_at ? "Signed" : "Pending"}</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
              <Link href={`/tenant/agreements/${agreement.id}`}>
                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-8 text-xs">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View Agreement
                </Button>
              </Link>

              {/* FIX: use effective status — stale DB status won't hide the Sign Now button */}
              {effective === "PENDING_TENANT" && !agreement.tenant_signed_at && (
                <Link href={`/tenant/agreements/${agreement.id}`}>
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 h-8 text-xs transition-colors">
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

export default function TenantAgreementsPage() {
  const router = useRouter()
  const { user } = useAuth()

  // FIX: typed as AgreementWithDetails[] — not (Agreement & any)[]
  const [agreements, setAgreements] = useState<AgreementWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    fetchAgreements()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * FIX 1: getMyAgreements() returns { success, agreements, count } — not an array.
   *         Old code: Array.isArray(response) was always false → list never loaded.
   * FIX 2: Backend already enriches each agreement with property/tenant/landlord.
   *         Removed the propertiesAPI.getById() N+1 loop and separate properties state.
   * FIX 3: Sort result so PENDING_TENANT (needs your action) appears first.
   */
  const fetchAgreements = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await agreementsAPI.getMyAgreements()

      if (response.success && response.agreements) {
        setAgreements(sortAgreements(response.agreements))
      } else {
        toast.error(response.error ?? "Failed to load agreements")
      }
    } catch (error) {
      console.error("[TenantAgreements] fetch error:", error)
      toast.error("Failed to load agreements")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Client-side filter — use enriched agreement.property fields directly
  const filteredAgreements = agreements.filter((a) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !q ||
      a.property?.title?.toLowerCase().includes(q) ||
      a.property?.city?.toLowerCase().includes(q) ||
      a.property?.location?.toLowerCase().includes(q) ||
      a.landlord?.full_name?.toLowerCase().includes(q)

    // FIX: filter uses getEffectiveStatus so stale DB status matches correctly
    const matchesStatus = statusFilter === "all" || getEffectiveStatus(a) === statusFilter

    return matchesSearch && matchesStatus
  })

  // FIX: stats use getEffectiveStatus — no more undercounting from stale status
  const stats = {
    total:   agreements.length,
    pending: agreements.filter(a => getEffectiveStatus(a) === "PENDING_TENANT").length,
    signed:  agreements.filter(a => {
               const s = getEffectiveStatus(a); return s === "SIGNED" || s === "ACTIVE"
             }).length,
    active:  agreements.filter(a => getEffectiveStatus(a) === "ACTIVE").length,
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
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
          <Link href="/tenant">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
                My Agreements
              </h1>
              <p className="text-slate-600">
                Manage your rental agreements and signatures
              </p>
            </div>
            <Link href="/tenant/applications">
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
                {/* FIX: label is tenant perspective — "Your Signature Needed" */}
                <p className="text-sm font-medium text-slate-600 mb-0.5">Your Signature Needed</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className={`w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center ${stats.pending > 0 ? 'animate-pulse' : ''}`}>
                <PenLine className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-0.5">Signed / Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-0.5">Active Leases</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Home className="h-5 w-5 text-emerald-600" />
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
              placeholder="Search by property name, location, or landlord..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="PENDING_TENANT">Awaiting Your Signature</option>
            <option value="PENDING_LANDLORD">Awaiting Landlord Signature</option>
            <option value="SIGNED">Signed</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {/* List / empty state */}
        {filteredAgreements.length === 0 ? (
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
                  ? "Once a landlord approves your application, your agreement will appear here."
                  : "Try adjusting your search or filter."}
              </p>
              {agreements.length === 0 && (
                <Link href="/tenant/applications">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                    <Eye className="h-4 w-4 mr-2" />
                    View My Applications
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* FIX: AgreementCard is defined at module level (Rule 22) — not inline here */}
            {filteredAgreements.map((agreement) => (
              <AgreementCard key={agreement.id} agreement={agreement} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}