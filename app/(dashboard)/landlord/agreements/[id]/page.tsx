"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft, Download, FileText, Loader2, CheckCircle,
  AlertCircle, Calendar, MapPin, Users, Building2,
  Eye, Shield, Clock, Mail, Phone, FilePlus2,
  PenLine, Banknote, CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { agreementsAPI, type AgreementWithDetails } from "@/lib/api/agreements"
import { toast } from "sonner"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed="

// ─────────────────────────────────────────────────────────────────────────────
// Rule 22: All helpers and sub-components defined at module level
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a number as Nigerian Naira.
 * Always show ₦ — never DollarSign icon or USD formatting.
 */
const formatNGN = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG")}`

/**
 * Format an ISO date string for display.
 */
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

/**
 * Format a timestamp with time for the signature audit trail.
 */
const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

/**
 * Status config aligned exactly to the handoff spec colour system.
 * From the landlord's perspective — labels reflect what the landlord needs to know.
 */
const LANDLORD_STATUS_CONFIG: Record<AgreementWithDetails["status"], {
  label: string
  bg: string
  text: string
  dot: string
}> = {
  DRAFT:            { label: "Draft",                    bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  PENDING_TENANT:   { label: "Awaiting Tenant Signature", bg: "bg-orange-100",  text: "text-orange-600",  dot: "bg-orange-500"  },
  PENDING_LANDLORD: { label: "Awaiting Your Signature",   bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  SIGNED:           { label: "Fully Signed",              bg: "bg-green-100",   text: "text-green-700",   dot: "bg-green-500"   },
  ACTIVE:           { label: "Active",                    bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  EXPIRED:          { label: "Expired",                   bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400"   },
  TERMINATED:       { label: "Terminated",                bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-500"     },
}

// ─────────────────────────────────────────────────────────────────────────────
// getEffectiveStatus — resolve display state from timestamps, fall back to DB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The DB `status` can lag after a signature is recorded.
 * e.g. tenant signs but `status` stays "PENDING_TENANT" instead of flipping to
 * "PENDING_LANDLORD", so the sidebar wrongly shows "Waiting for Tenant" when
 * the landlord is actually the one who needs to act right now.
 *
 * Signing flow: tenant always signs first → landlord is final.
 *   tenant_signed_at && !landlord_signed_at  → PENDING_LANDLORD (landlord's turn)
 *   all other cases                          → defer to DB status field
 */
function getEffectiveStatus(a: AgreementWithDetails): AgreementWithDetails["status"] {
  if (a.tenant_signed_at && !a.landlord_signed_at) return "PENDING_LANDLORD"
  return a.status
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (Rule 22 — defined outside page function)
// ─────────────────────────────────────────────────────────────────────────────

// Accepts the full agreement so it can call getEffectiveStatus
function StatusBadge({ agreement }: { agreement: AgreementWithDetails }) {
  const cfg = LANDLORD_STATUS_CONFIG[getEffectiveStatus(agreement)] ?? LANDLORD_STATUS_CONFIG.DRAFT
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

interface SignatureRowProps {
  label: string
  signedAt: string | null | undefined
  ip?: string | null
  isYou?: boolean
}

function SignatureRow({ label, signedAt, ip, isYou }: SignatureRowProps) {
  const signed = Boolean(signedAt)
  return (
    <div className={`flex items-start justify-between p-4 rounded-lg border ${
      signed ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${
          signed ? "bg-green-500" : "bg-orange-400"
        }`} />
        <div>
          <p className="font-medium text-slate-900 text-sm">
            {label}{isYou && <span className="ml-1 text-xs text-slate-500">(you)</span>}
          </p>
          {signed ? (
            <>
              <p className="text-xs text-slate-600 mt-0.5">{formatDateTime(signedAt)}</p>
              {ip && <p className="text-xs text-slate-400 mt-0.5">IP: {ip}</p>}
            </>
          ) : (
            <p className="text-xs text-orange-600 mt-0.5">Not yet signed</p>
          )}
        </div>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        signed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"
      }`}>
        {signed ? "Signed" : "Pending"}
      </span>
    </div>
  )
}

interface FinancialRowProps {
  label: string
  amount: number | null | undefined
  isTotal?: boolean
  highlight?: boolean
}

function FinancialRow({ label, amount, isTotal, highlight }: FinancialRowProps) {
  if (amount == null) return null
  return (
    <div className={`flex items-center justify-between py-3 ${
      isTotal
        ? "border-t-2 border-slate-300 mt-1 pt-4"
        : "border-b border-slate-100"
    }`}>
      <span className={`text-sm ${isTotal ? "font-bold text-slate-900" : highlight ? "font-semibold text-slate-800" : "text-slate-600"}`}>
        {label}
      </span>
      <span className={`font-semibold ${
        isTotal ? "text-lg text-orange-600" : highlight ? "text-slate-900" : "text-slate-700"
      }`}>
        {formatNGN(amount)}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────

export default function LandlordAgreementDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const agreementId = (params?.id as string) || ""

  const [agreement, setAgreement] = useState<AgreementWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  // Checkbox must be checked before signing — per handoff spec
  const [termsAccepted, setTermsAccepted] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAgreement = useCallback(async () => {
    try {
      setIsLoading(true)
      // FIX: API returns { success, agreement } — not the agreement directly.
      // The backend already enriches with tenant, landlord, property — no extra fetches needed.
      const response = await agreementsAPI.getById(agreementId)

      if (response.success && response.agreement) {
        setAgreement(response.agreement)
      } else {
        toast.error(response.error ?? "Failed to load agreement")
        router.push("/landlord/agreements")
      }
    } catch (error) {
      console.error("[AgreementDetail] fetch error:", error)
      toast.error("Failed to load agreement")
      router.push("/landlord/agreements")
    } finally {
      setIsLoading(false)
    }
  }, [agreementId, router])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    if (agreementId) fetchAgreement()
  }, [user, agreementId, fetchAgreement, router])

  // ── Sign ───────────────────────────────────────────────────────────────────

  const handleSignAgreement = async () => {
    if (!agreement || !termsAccepted) return
    setIsSigning(true)
    try {
      // Fetch client IP for audit trail — graceful fallback on failure
      let clientIP: string | undefined
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json")
        const ipData = await ipRes.json()
        clientIP = ipData.ip
      } catch {
        // Non-fatal — IP is optional for the signature call
        console.warn("[AgreementDetail] Could not fetch client IP")
      }

      // FIX: API returns { success, agreement, message } — check .success not .id
      const response = await agreementsAPI.sign(agreementId, { ip_address: clientIP })

      if (response.success && response.agreement) {
        toast.success("Agreement signed successfully!")
        setAgreement(response.agreement)  // Use the fresh enriched data from response
        setTermsAccepted(false)
      } else {
        toast.error(response.error ?? "Failed to sign agreement")
      }
    } catch (error) {
      console.error("[AgreementDetail] sign error:", error)
      toast.error("Failed to sign agreement. Please try again.")
    } finally {
      setIsSigning(false)
    }
  }

  // ── Generate PDF ───────────────────────────────────────────────────────────

  const handleGeneratePdf = async () => {
    if (!agreement) return
    setIsGeneratingPdf(true)
    try {
      const response = await agreementsAPI.generatePdf(agreementId)
      if (response.success && response.document_url) {
        toast.success("PDF generated successfully!")
        // Refresh so document_url appears on the agreement
        await fetchAgreement()
      } else {
        toast.error(response.error ?? "Failed to generate PDF")
      }
    } catch (error) {
      console.error("[AgreementDetail] generatePdf error:", error)
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // ── canSign — uses getEffectiveStatus so stale DB status never hides the Sign block
  // Tenant always signs first; once tenant_signed_at is set and landlord hasn't,
  // getEffectiveStatus returns PENDING_LANDLORD regardless of what status field says.
  const effectiveStatus = agreement ? getEffectiveStatus(agreement) : null
  const canSign =
    effectiveStatus === "PENDING_LANDLORD" &&
    !agreement?.landlord_signed_at

  // ── Financial totals — Nigeria: rent is annual upfront ────────────────────
  const annualRent = agreement ? agreement.rent_amount * 12 : 0
  const totalDue = agreement
    ? annualRent +
      agreement.deposit_amount +
      agreement.platform_fee +
      (agreement.service_charge ?? 0)
    : 0

  // ── Signing progress ───────────────────────────────────────────────────────
  const signaturesCount =
    (agreement?.tenant_signed_at ? 1 : 0) + (agreement?.landlord_signed_at ? 1 : 0)

  // ─────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Agreement</h3>
            <p className="text-slate-600">Fetching agreement details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <AlertCircle className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Agreement Not Found</h3>
          <p className="text-slate-500 mb-6">This agreement may have been removed or you don't have access.</p>
          <Link href="/landlord/agreements">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Agreements
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <Link href="/landlord/agreements">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agreements
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
              Rental Agreement
            </h1>
            <p className="text-slate-600">
              Ref: {agreement.id.slice(0, 8).toUpperCase()}
              {" · "}
              Created {formatDate(agreement.created_at)}
            </p>
          </div>
          <StatusBadge agreement={agreement} />
        </div>
        </div>

        {/* ── Property Hero ── */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm mb-8 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="relative h-56 md:h-72">
            <img
              src={agreement.property?.images?.[0] ?? DEFAULT_PROPERTY_IMAGE}
              alt={agreement.property?.title ?? "Property"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
                {agreement.property?.title ?? "Property"}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {agreement.property?.city ?? agreement.property?.location ?? "—"}
                  {agreement.property?.state ? `, ${agreement.property.state}` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Banknote className="h-4 w-4" />
                  {formatNGN(agreement.rent_amount)}/mo
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(agreement.lease_start_date)} → {formatDate(agreement.lease_end_date)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Main content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Parties */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Users className="h-4 w-4 text-orange-500" />
                  Parties to this Agreement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tenant */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tenant</p>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={agreement.tenant?.avatar_url ?? `${DEFAULT_AVATAR}${agreement.tenant_id}`} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                          {agreement.tenant?.full_name?.[0] ?? "T"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {agreement.tenant?.full_name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {agreement.tenant?.email ?? "—"}
                      </div>
                      {agreement.tenant?.phone_number && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {agreement.tenant.phone_number}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Landlord (you) */}
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Landlord (You)</p>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={agreement.landlord?.avatar_url ?? `${DEFAULT_AVATAR}${agreement.landlord_id}`} />
                        <AvatarFallback className="bg-orange-200 text-orange-800 font-bold">
                          {agreement.landlord?.full_name?.[0] ?? "L"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {agreement.landlord?.full_name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {agreement.landlord?.email ?? "—"}
                      </div>
                      {agreement.landlord?.phone_number && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {agreement.landlord.phone_number}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Banknote className="h-4 w-4 text-orange-500" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* FIX: annual upfront culture — show monthly AND annual, plus all fee lines */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <FinancialRow label="Monthly Rent" amount={agreement.rent_amount} />
                  <FinancialRow label="Annual Rent (×12)" amount={annualRent} highlight />
                  <FinancialRow label="Caution Fee (Security Deposit)" amount={agreement.deposit_amount} />
                  <FinancialRow label="Platform Fee" amount={agreement.platform_fee} />
                  {/* FIX: service_charge is nullable — only show if non-null */}
                  {agreement.service_charge != null && (
                    <FinancialRow label="Service Charge" amount={agreement.service_charge} />
                  )}
                  {/* Total Due — the key number for Nigerian annual upfront */}
                  <FinancialRow label="Total Due on Move-in" amount={totalDue} isTotal />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  * Rent is payable annually in advance per Nigerian tenancy convention.
                  No agency fee — NuloAfrica charges only the platform fee above.
                </p>
              </CardContent>
            </Card>

            {/* Lease Period */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Lease Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Start Date</p>
                    <p className="font-semibold text-slate-900 text-sm">{formatDate(agreement.lease_start_date)}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-xs text-orange-500 mb-1">Duration</p>
                    <p className="font-semibold text-orange-700 text-sm">{agreement.lease_duration} months</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">End Date</p>
                    <p className="font-semibold text-slate-900 text-sm">{formatDate(agreement.lease_end_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agreement Terms */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Agreement Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                    {agreement.terms ?? "Agreement terms will appear here."}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Signature History */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Shield className="h-4 w-4 text-orange-500" />
                  Signature History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SignatureRow
                  label="Tenant Signature"
                  signedAt={agreement.tenant_signed_at}
                  ip={agreement.tenant_signature_ip}
                />
                <SignatureRow
                  label="Landlord Signature"
                  signedAt={agreement.landlord_signed_at}
                  ip={agreement.landlord_signature_ip}
                  isYou
                />

                {/* Signing progress bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">Signing Progress</span>
                    <span className="text-xs text-slate-500">{signaturesCount} of 2 signed</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-green-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(signaturesCount / 2) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Sticky sidebar ── */}
          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">

            {/* Status card */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Agreement Status</p>
                <StatusBadge agreement={agreement} />
                <p className="text-xs text-slate-500 mt-2">
                  Agreement ID: <span className="font-mono">{agreement.id.slice(0, 12)}…</span>
                </p>
              </CardContent>
            </Card>

            {/* ── Signing Block ──────────────────────────────────────────────
                Show only when it's the landlord's turn to sign.
                Per handoff: checkbox must be checked before button is enabled.
                FIX: Use status state machine, not manual timestamp comparison.
            ─────────────────────────────────────────────────────────────────── */}
            {canSign && (
              <Card className="border-amber-200 bg-amber-50/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <PenLine className="h-4 w-4" />
                    Your Signature Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-amber-700">
                    The tenant has signed. Review all terms carefully before signing.
                  </p>

                  {/* Checkbox — must be checked first */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
                    <Checkbox
                      id="terms-accept"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
                      className="mt-0.5 border-amber-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <label
                      htmlFor="terms-accept"
                      className="text-xs text-slate-700 cursor-pointer leading-relaxed"
                    >
                      I have read and agree to all terms and conditions in this rental agreement
                    </label>
                  </div>

                  {/* Sign button — disabled until checkbox checked */}
                  <Button
                    onClick={handleSignAgreement}
                    disabled={isSigning || !termsAccepted}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-200 disabled:to-slate-300 text-white font-semibold shadow-sm transition-all duration-300"
                  >
                    {isSigning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing…
                      </>
                    ) : (
                      <>
                        <PenLine className="mr-2 h-4 w-4" />
                        Sign Agreement
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── Contextual status info card ────────────────────────────
                All three states use effectiveStatus so a stale DB status never
                shows the wrong message.

                Flow: tenant signs first → PENDING_LANDLORD → landlord signs → SIGNED
                  PENDING_TENANT:   neither has signed yet, waiting for tenant
                  PENDING_LANDLORD: tenant has signed, landlord must sign now
                  SIGNED / ACTIVE:  both signed, agreement complete
            ─────────────────────────────────────────────────────────────────── */}

            {/* Tenant has signed — landlord's turn (shown even if DB status is stale) */}
            {effectiveStatus === "PENDING_LANDLORD" && !canSign && (
              <Card className="border-amber-200 bg-amber-50/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">Your Signature Required</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        The tenant has signed. Review the terms and sign above to complete the agreement.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Waiting for tenant — agreement just generated, no one has signed */}
            {effectiveStatus === "PENDING_TENANT" && (
              <Card className="border-orange-200 bg-orange-50/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-5 pb-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-800 text-sm">Awaiting Tenant Signature</p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        Agreement sent to tenant. Send a reminder to expedite signing.
                      </p>
                    </div>
                  </div>
                  {/* Quick action: Message tenant about signing */}
                  <Link href={`/landlord/messages?property=${agreement.property_id}&tenant=${agreement.tenant_id}&context=agreement_signing`} className="block">
                    <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 text-sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Remind Tenant to Sign
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Both signed — awaiting tenant payment */}
            {(effectiveStatus === "SIGNED" || effectiveStatus === "ACTIVE") && (
              <Card className="border-green-200 bg-green-50/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-green-700">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 pb-3 border-b border-green-200">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800 text-sm">Agreement Fully Signed</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        Both parties have signed. Awaiting tenant payment.
                      </p>
                    </div>
                  </div>
                  {/* Payment status */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg border border-green-200">
                    <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-700">Awaiting Payment</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatNGN(totalDue)} due from tenant
                      </p>
                    </div>
                  </div>
                  {/* Message tenant about payment */}
                  <Link href={`/landlord/messages?property=${agreement.property_id}&tenant=${agreement.tenant_id}&context=agreement_payment`} className="block">
                    <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50 text-sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Message About Payment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* ── PDF Actions ───────────────────────────────────────────────
                FIX: Correctly gate PDF actions on status === 'SIGNED' and document_url.
                Show "Generate PDF" first, then "Download PDF" once URL exists.
                ALSO: Detect old fake URLs (from https://storage.nuloafrica.com) and force regeneration.
            ─────────────────────────────────────────────────────────────────── */}
            {(effectiveStatus === "SIGNED" || effectiveStatus === "ACTIVE") && (
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700">Agreement Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Check if URL is real (Supabase CDN) vs old fake placeholder */}
                  {agreement.document_url && agreement.document_url.includes("supabase.co") ? (
                    // Real Supabase URL — show download link
                    <a href={agreement.document_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                        <Download className="mr-2 h-4 w-4" />
                        Download Signed PDF
                      </Button>
                    </a>
                  ) : (
                    // Old fake URL or no URL — show generate button
                    <Button
                      onClick={handleGeneratePdf}
                      disabled={isGeneratingPdf}
                      variant="outline"
                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      {isGeneratingPdf ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating PDF…
                        </>
                      ) : (
                        <>
                          <FilePlus2 className="mr-2 h-4 w-4" />
                          {agreement.document_url ? "Regenerate PDF" : "Generate PDF"}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation actions */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-50 border-b border-orange-100">
                <CardTitle className="text-orange-900 text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-2">
                <Link href={`/landlord/applications/${agreement.application_id}`} className="block">
                  <Button variant="outline" className="w-full text-slate-700 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-colors">
                    <Eye className="mr-2 h-4 w-4" />
                    View Application
                  </Button>
                </Link>
                <Link href={`/landlord/messages?tenant=${agreement.tenant_id}`} className="block">
                  <Button variant="ghost" className="w-full text-slate-600 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                    <Mail className="mr-2 h-4 w-4" />
                    Message Tenant
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}