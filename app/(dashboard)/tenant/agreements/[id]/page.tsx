"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTenantDashboard } from "@/contexts/DashboardContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft, FileText, MapPin, Calendar, Users,
  Loader2, AlertCircle, Phone, Mail, Shield,
  Clock, PenLine, Banknote, CheckCircle2,
  FilePlus2, Download, Eye, Copy, Check, Sparkles
} from "lucide-react"
import Link from "next/link"
import { agreementsAPI, type AgreementWithDetails } from "@/lib/api/agreements"
import { paymentsAPI, type AgreementPaymentRow } from "@/lib/api/payments"
import { toast } from "sonner"
import { formatNGN, calculateAgreementBreakdown, getPaymentFrequencyMultiplier } from "@/lib/utils/rentalCalculations"
import { AIBadge } from "@/components/ui/ai-badge"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed="

// ─────────────────────────────────────────────────────────────────────────────
// Rule 22: All helpers and sub-components at module level
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

/**
 * STATUS_CONFIG — tenant perspective.
 * PENDING_TENANT  = your turn to sign.
 * PENDING_LANDLORD = you've signed, waiting for landlord to countersign.
 */
const TENANT_STATUS_CONFIG: Record<AgreementWithDetails["status"], {
  label: string
  bg: string
  text: string
  dot: string
}> = {
  DRAFT:            { label: "Draft",                       bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  PENDING_TENANT:   { label: "Awaiting Your Signature",     bg: "bg-orange-100",  text: "text-orange-600",  dot: "bg-orange-500"  },
  PENDING_LANDLORD: { label: "Awaiting Landlord Signature", bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  SIGNED:           { label: "Fully Signed",                bg: "bg-green-100",   text: "text-green-700",   dot: "bg-green-500"   },
  ACTIVE:           { label: "Active",                      bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  EXPIRED:          { label: "Expired",                     bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400"   },
  TERMINATED:       { label: "Terminated",                  bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-500"     },
}

/**
 * Tenant-perspective effective status.
 * DB `status` can lag after a signature is recorded.
 *
 * Tenant signs first → landlord countersigns.
 *   !tenant_signed_at                        → PENDING_TENANT  (your turn)
 *   tenant_signed_at && !landlord_signed_at  → PENDING_LANDLORD (landlord's turn)
 *   both signed                              → defer to DB status
 */
function getEffectiveStatus(a: AgreementWithDetails): AgreementWithDetails["status"] {
  if (!a.tenant_signed_at && !a.landlord_signed_at) return a.status
  if (a.tenant_signed_at && !a.landlord_signed_at) return "PENDING_LANDLORD"
  return a.status
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (Rule 22)
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ agreement }: { agreement: AgreementWithDetails }) {
  const cfg = TENANT_STATUS_CONFIG[getEffectiveStatus(agreement)] ?? TENANT_STATUS_CONFIG.DRAFT
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
        <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${signed ? "bg-green-500" : "bg-orange-400"}`} />
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
  waived?: boolean
}

function FinancialRow({ label, amount, isTotal, highlight, waived }: FinancialRowProps) {
  if (amount == null) return null
  return (
    <div className={`flex items-center justify-between py-3 ${
      isTotal ? "border-t-2 border-slate-300 mt-1 pt-4" : "border-b border-slate-100"
    }`}>
      <span className={`text-sm ${isTotal ? "font-bold text-slate-900" : highlight ? "font-semibold text-slate-800" : "text-slate-600"}`}>
        {label}
      </span>
      <span className={`font-semibold ${isTotal ? "text-lg text-orange-600" : highlight ? "text-slate-900" : waived ? "text-green-600" : "text-slate-700"}`}>
        {waived && amount === 0 ? "₦0 — Waived" : formatNGN(amount)}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function TenantAgreementDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { invalidateTenantCache } = useTenantDashboard()
  const agreementId = (params?.id as string) || ""

  const [agreement, setAgreement] = useState<AgreementWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [existingPayments, setExistingPayments] = useState<AgreementPaymentRow[]>([])
  const [checkingPayments, setCheckingPayments] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isGeneratingNuban, setIsGeneratingNuban] = useState(false)
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  // Checkbox must be checked before signing — per handoff spec
  const [termsAccepted, setTermsAccepted] = useState(false)

  // ── Check for existing payments ─────────────────────────────────────────────
  
  const checkExistingPayments = useCallback(async () => {
    if (!agreementId || !user?.id) return
    
    try {
      setCheckingPayments(true)
      const response = await paymentsAPI.getMyPayments()
      
      if (response.success && response.payments) {
        // Filter payments for this specific agreement
        const agreementPayments = response.payments.filter((payment: AgreementPaymentRow) => 
          payment.agreement_id === agreementId
        )
        setExistingPayments(agreementPayments)
      }
    } catch (error) {
      console.error("[AgreementDetail] check payments error:", error)
      // Don't show error for this check, just log it
    } finally {
      setCheckingPayments(false)
    }
  }, [agreementId, user?.id])

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAgreement = useCallback(async () => {
    try {
      setIsLoading(true)
      // FIX: getById() returns { success, agreement } — not the agreement directly.
      // Backend already enriches with tenant, landlord, property — no extra fetches needed.
      const response = await agreementsAPI.getById(agreementId)

      if (response.success && response.agreement) {
        setAgreement(response.agreement)
      } else {
        toast.error(response.error ?? "Failed to load agreement")
        router.push("/tenant/agreements")
      }
    } catch (error) {
      console.error("[TenantAgreementDetail] fetch error:", error)
      toast.error("Failed to load agreement")
      router.push("/tenant/agreements")
    } finally {
      setIsLoading(false)
    }
  }, [agreementId, router])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    if (agreementId) {
      fetchAgreement()
      checkExistingPayments()
    }
  }, [user, agreementId, fetchAgreement, checkExistingPayments, router])

  // ── Sign ───────────────────────────────────────────────────────────────────

  const handleSignAgreement = async () => {
    if (!agreement || !termsAccepted) return
    setIsSigning(true)
    try {
      // FIX: IP fetch in its own try/catch — non-fatal if it fails
      let clientIP: string | undefined
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json")
        const ipData = await ipRes.json()
        clientIP = ipData.ip
      } catch {
        console.warn("[TenantAgreementDetail] Could not fetch client IP")
      }

      // FIX: check response.success && response.agreement — not response.id
      // FIX: use response.agreement directly — no need to re-fetch
      const response = await agreementsAPI.sign(agreementId, { ip_address: clientIP })

      if (response.success && response.agreement) {
        toast.success("Agreement signed successfully!")
        setAgreement(response.agreement)
        setTermsAccepted(false)
        // Drop the 5-min frontend dashboard cache so the Agreements stat
        // card reflects the new signature state immediately, otherwise it
        // keeps showing the pre-sign counts (e.g. "0 agreements") until
        // the cache expires.
        invalidateTenantCache?.()
      } else {
        toast.error(response.error ?? "Failed to sign agreement")
      }
    } catch (error) {
      console.error("[TenantAgreementDetail] sign error:", error)
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
        await fetchAgreement()
      } else {
        toast.error(response.error ?? "Failed to generate PDF")
      }
    } catch (error) {
      console.error("[TenantAgreementDetail] generatePdf error:", error)
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // ── Provision NUBAN (inline on the agreement page — the agreement detail
  //    page is the single source of truth for the pay flow. The backend
  //    POST /api/v1/agreements/{id}/provision-nomba is idempotent.
  const handleProvisionNuban = async () => {
    if (!agreementId || isGeneratingNuban) return
    setIsGeneratingNuban(true)
    try {
      await paymentsAPI.provisionNomba(agreementId)
      toast.success("NUBAN generated — copy it and pay from any bank app.")
      await fetchAgreement()
    } catch (error: any) {
      console.error("[TenantAgreementDetail] provision NUBAN error:", error)
      const detail = error?.response?.data?.detail ?? error?.message
      toast.error(detail ? `Could not generate NUBAN: ${detail}` : "Could not generate NUBAN. Please try again.")
    } finally {
      setIsGeneratingNuban(false)
    }
  }

  // ── Simulate Payment (demo only): triggers a simulated payment to the NUBAN
  const handleSimulatePayment = async () => {
    if (!agreementId || isSimulatingPayment) return
    setIsSimulatingPayment(true)
    try {
      const result = await paymentsAPI.simulatePayment(agreementId)
      toast.success(`Payment of ${formatNGN(result.amount)} simulated successfully!`)
      // Invalidate cache and refresh the page
      await fetchAgreement()
      await checkExistingPayments()
      invalidateTenantCache?.()
    } catch (error: any) {
      console.error("[TenantAgreementDetail] simulate payment error:", error)
      const detail = error?.response?.data?.detail ?? error?.message
      toast.error(detail ? `Could not simulate payment: ${detail}` : "Could not simulate payment. Please try again.")
    } finally {
      setIsSimulatingPayment(false)
    }
  }

  // ── Copy to clipboard helper ───────────────────────────────────────────────
  const copyField = useCallback((value: string, field: string) => {
    if (!value) return
    navigator.clipboard.writeText(value).then(
      () => {
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 1500)
      },
      () => toast.error("Could not copy to clipboard")
    )
  }, [])

  // ── Derived state ──────────────────────────────────────────────────────────

  const effectiveStatus = agreement ? getEffectiveStatus(agreement) : null

  // Tenant signs first — canSign when it's their turn and they haven't signed yet
  const canSign =
    effectiveStatus === "PENDING_TENANT" &&
    !agreement?.tenant_signed_at

  const breakdown = calculateAgreementBreakdown(agreement || {})
  const { monthlyRent, annualRent, cautionFee, platformFee, serviceCharge, totalDue, periodRent, periodLabel, paymentFrequency } = breakdown
  const frequencyMultiplier = getPaymentFrequencyMultiplier(paymentFrequency)
  const signaturesCount =
    (agreement?.tenant_signed_at ? 1 : 0) + (agreement?.landlord_signed_at ? 1 : 0)

  // Derived payment state — used by the "Payment In Progress" branch below.
  // (The old `existingPayments.length > 0` check was meaningless because
  //  `getMyPayments` returns agreement rows, not payment transactions, so
  //  the filter-by-agreement-id was always returning 1 row.)
  const totalReceived = Number(agreement?.total_received_amount ?? 0)
  const expectedAmount =
    Number(agreement?.expected_payment_amount ?? 0) ||
    Number(agreement?.rent_amount ?? 0) * frequencyMultiplier
  const recon = agreement?.reconciliation_status ?? null
  const isPartiallyPaid =
    totalReceived > 0 &&
    (recon === "UNDERPAYMENT" || recon === "OVERPAYMENT" || recon === null)

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
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
          <Link href="/tenant/agreements">
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
          <Link href="/tenant/agreements">
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

                  {/* Tenant (you) */}
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Tenant (You)</p>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={agreement.tenant?.avatar_url ?? `${DEFAULT_AVATAR}${agreement.tenant_id}`} />
                        <AvatarFallback className="bg-orange-200 text-orange-800 font-bold">
                          {agreement.tenant?.full_name?.[0] ?? "T"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-slate-900 text-sm">
                        {agreement.tenant?.full_name ?? "—"}
                      </p>
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

                  {/* Landlord */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Landlord</p>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={agreement.landlord?.avatar_url ?? `${DEFAULT_AVATAR}${agreement.landlord_id}`} />
                        <AvatarFallback className="bg-slate-200 text-slate-700 font-bold">
                          {agreement.landlord?.full_name?.[0] ?? "L"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-slate-900 text-sm">
                        {agreement.landlord?.full_name ?? "—"}
                      </p>
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
                <div className="bg-blue-50 rounded-xl p-3 mb-3">
                  <p className="text-blue-600 font-semibold text-sm mb-2">Move-in Cost Breakdown</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Monthly Rent:</span>
                      <span className="font-semibold">{formatNGN(monthlyRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{periodLabel}:</span>
                      <span className="font-semibold">{formatNGN(periodRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Deposit (2 months):</span>
                      <span className={`font-semibold ${cautionFee === 0 ? "text-green-600" : "text-blue-700"}`}>                        {cautionFee === 0 ? "₦0 — Waived" : formatNGN(cautionFee)}
                      </span>
                    </div>
                    {platformFee > 0 ? (
                      <div className="flex justify-between">
                        <span>Platform Fee:</span>
                        <span className="font-semibold">{formatNGN(platformFee)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Platform Fee:</span>
                        <span className="font-semibold text-green-600">₦0 — Waived</span>
                      </div>
                    )}
                    {serviceCharge > 0 && (
                      <div className="flex justify-between">
                        <span>Service Charge:</span>
                        <span className="font-semibold">{formatNGN(serviceCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-300 font-bold">
                      <span>Total Due:</span>
                      <span className="text-orange-700">{formatNGN(totalDue)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  * Rent is payable in advance per the property's payment frequency ({paymentFrequency}, ×{frequencyMultiplier} months).
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
                <AIBadge agreement={agreement} variant="badge" />
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
                {/* Tenant signs first — isYou on tenant row */}
                <SignatureRow
                  label="Your Signature"
                  signedAt={agreement.tenant_signed_at}
                  ip={agreement.tenant_signature_ip}
                  isYou
                />
                <SignatureRow
                  label="Landlord Signature"
                  signedAt={agreement.landlord_signed_at}
                  ip={agreement.landlord_signature_ip}
                />
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
                Tenant signs first.
                Uses effectiveStatus so stale DB status never hides this block.
                Checkbox must be checked before Sign button is enabled.
            ─────────────────────────────────────────────────────────────────── */}
            {canSign && (
              <Card className="border-orange-200 bg-orange-50/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-800">
                    <PenLine className="h-4 w-4" />
                    Your Signature Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-orange-700">
                    Please read all terms carefully. You sign first — the landlord countersigns after you.
                  </p>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                    <Checkbox
                      id="terms-accept"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
                      className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <label
                      htmlFor="terms-accept"
                      className="text-xs text-slate-700 cursor-pointer leading-relaxed"
                    >
                      I have read and agree to all terms and conditions in this rental agreement
                    </label>
                  </div>

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

            {/* ── Contextual status info cards ──────────────────────────────
                All use effectiveStatus — stale DB status never shows wrong message.
            ─────────────────────────────────────────────────────────────────── */}

            {/* You've signed — waiting for landlord to countersign */}
            {effectiveStatus === "PENDING_LANDLORD" && (
              <Card className="border-amber-200 bg-amber-50/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <Clock className="h-4 w-4" />
                    Your Signature Received
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">Awaiting Landlord Signature</p>
                      <p className="text-xs text-amber-600 mt-2">
                        You've completed your part. The landlord has been notified and will countersign shortly.
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick action to message landlord about signing */}
                  <Link href={`/tenant/messages?property=${agreement.property_id}&landlord=${agreement.landlord_id}&context=agreement_signing`} className="block">
                    <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 text-sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Follow Up About Signing
                    </Button>
                  </Link>
                  
                  {/* Fallback: Direct contact info if messaging fails */}
                  <div className="text-center">
                    <p className="text-xs text-amber-600 mb-2">If messaging doesn't work, you can:</p>
                    <div className="flex items-center justify-center gap-4 text-xs text-amber-700">
                      {agreement.landlord?.phone_number && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{agreement.landlord.phone_number}</span>
                        </div>
                      )}
                      {agreement.landlord?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{agreement.landlord.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Both signed — payment CTA */}
            {(effectiveStatus === "SIGNED" || effectiveStatus === "ACTIVE") && (
              <Card className="border-green-200 bg-green-50/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-5 pb-5 space-y-4">
                  {/* Check for existing payments */}
                  {checkingPayments ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-orange-500" />
                      <p className="text-slate-600">Checking payment status...</p>
                    </div>
                  ) : (agreement.reconciliation_status === "FULL_PAYMENT" || 
                    (agreement.total_received_amount && agreement.total_received_amount >= (agreement.expected_payment_amount || 0))) ? (
                    /* Payment is complete */
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Completed</h3>
                      <p className="text-slate-600 mb-4">
                        Your payment has been received and confirmed. Your tenancy is now active.
                      </p>
                      <Link href="/tenant/payments">
                        <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                          <Eye className="mr-2 h-4 w-4" />
                          View Payment History
                        </Button>
                      </Link>
                    </div>
                  ) : isPartiallyPaid ? (
                    /* Payment in progress — money has arrived but not the full
                       expected amount yet. PENDING with 0 received = NUBAN
                       generated but no transfer yet → falls through to the
                       NUBAN/Generate CTA below. */
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-800 text-sm">Agreement Fully Signed</p>
                          <p className="text-xs text-green-600 mt-0.5">
                            Both parties have signed. Your tenancy can now proceed to payment.
                          </p>
                        </div>
                      </div>
                      <div className="text-center py-4">
                        <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-orange-800 mb-2">Payment In Progress</h3>
                        <p className="text-slate-600 mb-4">
                          We received <span className="font-semibold text-orange-700">{formatNGN(totalReceived)}</span> of{" "}
                          <span className="font-semibold text-slate-900">{formatNGN(expectedAmount)}</span>.
                          Awaiting the remaining balance to fully reconcile.
                        </p>
                        <Link href="/tenant/payments">
                          <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                            <Eye className="mr-2 h-4 w-4" />
                            Check Payment Status
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* No existing payments - inline NUBAN flow on this page */
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-800 text-sm">Agreement Fully Signed</p>
                          <p className="text-xs text-green-600 mt-0.5">
                            Both parties have signed. Your tenancy can now proceed to payment.
                          </p>
                        </div>
                      </div>

                      {/* State A: No NUBAN yet → show "Generate NUBAN" */}
                      {!agreement.virtual_account_number && (
                        <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/60 p-5 text-center">
                          <Sparkles className="w-7 h-7 text-orange-500 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-900 mb-1">
                            Generate your dedicated NUBAN
                          </p>
                          <p className="text-xs text-slate-600 mb-4">
                            One click — we'll create a unique 10-digit account number for this lease.
                          </p>
                          <Button
                            onClick={handleProvisionNuban}
                            disabled={isGeneratingNuban}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            {isGeneratingNuban ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating NUBAN…
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate NUBAN
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* State B: NUBAN exists → show it inline with copy buttons */}
                      {agreement.virtual_account_number && (
                        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-5 space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <p className="text-sm font-semibold text-emerald-900">
                              Pay into your dedicated NUBAN
                            </p>
                          </div>
                          <p className="text-xs text-slate-600">
                            Transfer the exact amount below from any Nigerian bank app — we auto-confirm within seconds.
                          </p>

                          {/* NUBAN */}
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                              Account number
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-lg font-mono font-semibold text-slate-900">
                                {agreement.virtual_account_number}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyField(agreement.virtual_account_number!, "nuban")}
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              >
                                {copiedField === "nuban" ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Account name */}
                          {agreement.virtual_account_name && (
                            <div>
                              <label className="text-xs font-semibold text-slate-500 uppercase">
                                Account name
                              </label>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700">
                                  {agreement.virtual_account_name}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyField(agreement.virtual_account_name!, "name")}
                                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                >
                                  {copiedField === "name" ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Amount */}
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">
                              Amount to pay
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-lg font-mono font-semibold text-orange-600">
                                {formatNGN(
                                  agreement.expected_payment_amount
                                    && agreement.expected_payment_amount > 0
                                    ? agreement.expected_payment_amount
                                    : Number(agreement.rent_amount || 0) *
                                        getPaymentFrequencyMultiplier(paymentFrequency)
                                )}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const amt = agreement.expected_payment_amount
                                    && agreement.expected_payment_amount > 0
                                    ? agreement.expected_payment_amount
                                    : Number(agreement.rent_amount || 0) *
                                        getPaymentFrequencyMultiplier(paymentFrequency)
                                  copyField(String(amt), "amount")
                                }}
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              >
                                {copiedField === "amount" ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Simulate Payment Button (Demo Only) */}
                          <div className="pt-3 border-t border-emerald-200">
                            <Button
                              onClick={handleSimulatePayment}
                              disabled={isSimulatingPayment}
                              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                            >
                              {isSimulatingPayment ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Simulating Payment…
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Simulate Payment (Demo)
                                </>
                              )}
                            </Button>
                            <p className="text-xs text-slate-500 pt-2">
                              After paying, this page will auto-refresh and show your payment as{" "}
                              <span className="font-semibold text-green-700">Completed</span>.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* PDF actions — gated on both parties having signed */}
            {(effectiveStatus === "SIGNED" || effectiveStatus === "ACTIVE") && (
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700">Agreement Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Check if URL is real (Supabase CDN + correct bucket) vs old/broken URL.
                      Older rows in the agreements table may still carry URLs from the
                      'property-images' bucket, which AGMT-08 marks as 404. Force a
                      regenerate in that case so the tenant can download a fresh PDF
                      from the correct 'ownership-docs' bucket. */}
                  {agreement.document_url && agreement.document_url.includes("supabase.co") && agreement.document_url.includes("/ownership-docs/") ? (
                    <a href={agreement.document_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                        <Download className="mr-2 h-4 w-4" />
                        Download Signed PDF
                      </Button>
                    </a>
                  ) : (
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
                          Generate PDF
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-50 border-b border-orange-100">
                <CardTitle className="text-orange-900 text-base">Quick Actions</CardTitle>
              </CardHeader>              

              <CardContent className="pt-5 space-y-2">
                <Link href={`/tenant/applications/${agreement.application_id}`} className="block">
                  <Button variant="outline" className="w-full text-slate-700 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-colors">
                    <Eye className="mr-2 h-4 w-4" />
                    View Application
                  </Button>
                </Link>
                <Link href={`/tenant/messages?property=${agreement.property_id}&landlord=${agreement.landlord_id}`} className="block">
                  <Button variant="ghost" className="w-full text-slate-600 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                    <Mail className="mr-2 h-4 w-4" />
                    Message Landlord
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