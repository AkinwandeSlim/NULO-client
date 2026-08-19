"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useDashboard } from "@/contexts/DashboardContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft, Download, FileText, Loader2, CheckCircle,
  AlertCircle, Calendar, MapPin, Users, Building2,
  Eye, Shield, Clock, Mail, Phone, FilePlus2,
  PenLine, Banknote, CheckCircle2, ArrowDownToLine, RefreshCw
} from "lucide-react"
import Link from "next/link"
import { agreementsAPI, type AgreementWithDetails } from "@/lib/api/agreements"
import { propflowStatus } from "@/lib/api/propflow"
import {
  paymentsAPI,
  type TransferHistoryEntry,
} from "@/lib/api/payments"
import { toast } from "sonner"
import { formatNGN, calculateAgreementBreakdown, getPaymentFrequencyMultiplier } from "@/lib/utils/rentalCalculations"
import { formatBriefingMarkdown } from "@/lib/utils/format"
import { AIBadge } from "@/components/ui/ai-badge"
import { Markdown } from "@/components/ui/markdown"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed="

// ─────────────────────────────────────────────────────────────────────────────
// Rule 22: All helpers and sub-components defined at module level
// ─────────────────────────────────────────────────────────────────────────────

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
  waived?: boolean
}

function FinancialRow({ label, amount, isTotal, highlight, waived }: FinancialRowProps) {
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
        isTotal ? "text-lg text-orange-600" : highlight ? "text-slate-900" : waived ? "text-green-600" : "text-slate-700"
      }`}>
        {waived && amount === 0 ? "₦0 — Waived" : formatNGN(amount)}
      </span>
    </div>
  )
}

// Map a transfer reconciliation result to the NuloAfrica brand-style pill.
const getTransferReconciliationPill = (result: TransferHistoryEntry["reconciliation_result"]) => {
  switch (result) {
    case "FULL_PAYMENT":
      return { label: "Full",  bg: "bg-green-100",  text: "text-green-700" }
    case "UNDERPAYMENT":
      return { label: "Partial", bg: "bg-amber-100",  text: "text-amber-700" }
    case "OVERPAYMENT":
      return { label: "Over",  bg: "bg-blue-100",   text: "text-blue-700" }
    default:
      return { label: "Pending", bg: "bg-slate-100", text: "text-slate-700" }
  }
}

// Compact transfer-history table. Renders a brand-consistent orange-bordered
// card. Empty-state and loading-state are handled inside the parent.
function TransferHistoryTable({ entries }: { entries: TransferHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 text-center">
        <ArrowDownToLine className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-600">No inbound transfers yet.</p>
        <p className="text-xs text-slate-400 mt-1">
          Tenant payments into the agreement NUBAN will appear here.
        </p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-orange-50/60 text-orange-800">
          <tr>
            <th className="text-left font-semibold px-4 py-2.5">Date</th>
            <th className="text-left font-semibold px-4 py-2.5">Sender</th>
            <th className="text-left font-semibold px-4 py-2.5">Bank</th>
            <th className="text-right font-semibold px-4 py-2.5">Amount</th>
            <th className="text-left  font-semibold px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {entries.map((t) => {
            const pill = getTransferReconciliationPill(t.reconciliation_result)
            return (
              <tr key={t.id} className="hover:bg-orange-50/30 transition-colors">
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                  {formatDateTime(t.created_at) ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-800 font-medium">
                  {t.sender_name ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {t.sender_bank ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                  {formatNGN(t.amount_received)}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${pill.bg} ${pill.text}`}>
                    {pill.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
  const { invalidateLandlordCache } = useDashboard()
  const agreementId = (params?.id as string) || ""

  const [agreement, setAgreement] = useState<AgreementWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  // Checkbox must be checked before signing — per handoff spec
  const [termsAccepted, setTermsAccepted] = useState(false)
  // Read-before-sign gate (same as tenant page): the landlord must scroll
  // through the full terms before the "I have read" checkbox unlocks.
  // Prevents blind signing.
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const termsScrollRef = useRef<HTMLDivElement | null>(null)
  // Transfer history (Stage 3 polish) -- shown after Signature History
  const [transfers, setTransfers] = useState<TransferHistoryEntry[]>([])
  const [isTransfersLoading, setIsTransfersLoading] = useState(false)
  // ── Regenerate terms (fix stale pricing from pre-payment-integration agreements) ──
  const [isRegenerating, setIsRegenerating] = useState(false)
  // ── PropFlow AI briefing (same pattern as landlord application detail page) ──
  const [propflowBriefing, setPropflowBriefing] = useState<string | null>(null)
  const [isBriefingLoading, setIsBriefingLoading] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAgreement = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    try {
      if (!silent) setIsLoading(true)
      // FIX: API returns { success, agreement } — not the agreement directly.
      // The backend already enriches with tenant, landlord, property — no extra fetches needed.
      const response = await agreementsAPI.getById(agreementId)

      if (response.success && response.agreement) {
        setAgreement(response.agreement)
      } else if (!silent) {
        toast.error(response.error ?? "Failed to load agreement")
        router.push("/landlord/agreements")
      }
    } catch (error) {
      // Silent polls must never toast or navigate the landlord away mid-read.
      if (!silent) {
        console.error("[AgreementDetail] fetch error:", error)
        toast.error("Failed to load agreement")
        router.push("/landlord/agreements")
      }
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [agreementId, router])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    if (agreementId) fetchAgreement()
  }, [user, agreementId, fetchAgreement, router])

  // ── Live polling (signatures + payment) ────────────────────────────────────
  // While signatures are still pending, silently refetch every 15s so the page
  // reacts in real time when the tenant signs — the "tenant has signed" banner
  // and the signing block appear without a manual refresh.
  //
  // After BOTH parties have signed, keep polling: this page is the landlord's
  // home base for the rest of the journey. When the tenant's payment lands in
  // the NUBAN, the webhook flips `reconciliation_status` to FULL_PAYMENT and
  // the Quick Actions card below flips from "Awaiting Payment" to the
  // "Review & Release Funds" CTA without a refresh. Polling stops once funds
  // are released (or the disbursement is already pending) — there is nothing
  // left to react to. Skips hidden tabs to avoid wasted requests.
  const isFundsReleased = agreement?.disbursement_status === "released"
  const isFundsReleasing = agreement?.disbursement_status === "pending"
  const isFullyPaid = agreement?.reconciliation_status === "FULL_PAYMENT"
  useEffect(() => {
    if (!agreementId) return
    const bothSigned = Boolean(agreement?.tenant_signed_at && agreement?.landlord_signed_at)
    // Nothing more to watch for once the money is moving / released.
    if (bothSigned && (isFundsReleased || isFundsReleasing)) return
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return
      fetchAgreement({ silent: true })
    }, 15000)
    return () => clearInterval(id)
  }, [agreementId, agreement?.tenant_signed_at, agreement?.landlord_signed_at, isFundsReleased, isFundsReleasing, fetchAgreement])

  // Toast once when polling detects the tenant just signed while the landlord
  // is already on this page (prev === false → now true, landlord not yet signed).
  const prevTenantSignedRef = useRef<boolean | null>(null)
  useEffect(() => {
    const tenantSigned = Boolean(agreement?.tenant_signed_at)
    if (prevTenantSignedRef.current === false && tenantSigned && !agreement?.landlord_signed_at) {
      toast.success(
        `${agreement?.tenant?.full_name ?? "The tenant"} has signed the agreement — your signature is now required.`
      )
    }
    prevTenantSignedRef.current = tenantSigned
  }, [agreement?.tenant_signed_at, agreement?.landlord_signed_at, agreement?.tenant?.full_name])

  // Toast once when polling detects the tenant's payment just landed while the
  // landlord is on this page (prev === false → now FULL_PAYMENT). Mirrors the
  // tenant-signed toast above — same "page reacts live" pattern.
  const prevFullyPaidRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (prevFullyPaidRef.current === false && isFullyPaid) {
      toast.success(
        `${agreement?.tenant?.full_name ?? "The tenant"} has paid in full — you can now review and release the funds.`
      )
    }
    prevFullyPaidRef.current = isFullyPaid
  }, [isFullyPaid, agreement?.tenant?.full_name])

  // ── PropFlow AI briefing ───────────────────────────────────────────────────
  // Same pattern as the landlord application detail page: fetch the workflow
  // status via propflow_thread_id and surface the AI-generated landlord
  // briefing in the sidebar — AI value without opening the chat widget.
  useEffect(() => {
    const threadId = agreement?.propflow_thread_id
    if (!threadId) return
    let cancelled = false
    setIsBriefingLoading(true)
    propflowStatus(threadId)
      .then((status) => {
        if (cancelled) return
        if (status?.success && status.landlord_briefing) {
          setPropflowBriefing(status.landlord_briefing)
        }
      })
      .catch(() => { /* briefing is optional — the page works without it */ })
      .finally(() => { if (!cancelled) setIsBriefingLoading(false) })
    return () => { cancelled = true }
  }, [agreement?.propflow_thread_id])

  // ── Transfer history fetch ─────────────────────────────────────────────────
  // Pulls inbound NUBAN transfers from /nomba/payment_status. Only runs when
  // the agreement has a nomba_account_ref (i.e. a NUBAN was provisioned). On
  // failure we silently fall back to an empty list so the page still renders.
  const fetchTransfers = useCallback(async (accountRef: string) => {
    if (!accountRef) {
      setTransfers([])
      return
    }
    setIsTransfersLoading(true)
    try {
      const entries = await paymentsAPI.getTransferHistory(accountRef)
      setTransfers(entries)
    } catch (error) {
      console.warn("[AgreementDetail] transfer history fetch failed (non-fatal):", error)
      setTransfers([])
    } finally {
      setIsTransfersLoading(false)
    }
  }, [])

  // Trigger transfer fetch once the agreement's NUBAN is known. The
  // `nomba_account_ref` is not on the AgreementWithDetails type today, so we
  // cast through unknown defensively. If it's absent, transfers stays [].
  // We pass the AGREEMENT ID (not the raw account_ref) to getTransferHistory —
  // the backend /agreements/{id}/payment-status route takes the agreement id
  // in the path and looks up the (suffixed) account_ref server-side.
  useEffect(() => {
    const ref = (agreement as unknown as { nomba_account_ref?: string | null } | null)
      ?.nomba_account_ref
    if (ref && agreementId) {
      fetchTransfers(agreementId)
    } else {
      setTransfers([])
    }
  }, [agreement, agreementId, fetchTransfers])

  // ── Scroll-to-read tracking ───────────────────────────────────────────────
  // The landlord must scroll through the full terms before the "I have read"
  // checkbox unlocks. If the terms fit without scrolling, reading is
  // considered done immediately.
  const handleTermsScroll = useCallback(() => {
    const el = termsScrollRef.current
    if (!el || hasReadTerms) return
    // Within 24px of the bottom counts as "read to the end".
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
    if (atBottom) {
      setHasReadTerms(true)
    }
  }, [hasReadTerms])

  useEffect(() => {
    // Short terms that don't overflow the container need no scrolling.
    const el = termsScrollRef.current
    if (el && agreement?.terms && !hasReadTerms) {
      if (el.scrollHeight <= el.clientHeight + 24) {
        setHasReadTerms(true)
      }
    }
  }, [agreement?.terms, hasReadTerms])

  // ── Sign ───────────────────────────────────────────────────────────────────

  const handleSignAgreement = async () => {
    // Explicit read-before-sign: both the scroll-to-read gate AND the checkbox
    // must be satisfied before a signature is accepted.
    if (!agreement || !termsAccepted || !hasReadTerms) return
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
        // Drop the frontend dashboard cache so the Agreements stat card
        // reflects the new signature state immediately instead of waiting
        // for the 5-min cache to expire.
        invalidateLandlordCache?.()
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

  // ── Regenerate terms (fix stale pricing) ──────────────────────────────────
  // Regenerates the agreement text using the CURRENT pricing model (property
  // payment_frequency, waived deposit/fees). Only available while unsigned.
  const handleRegenerate = async () => {
    if (!agreement) return
    setIsRegenerating(true)
    try {
      const response = await agreementsAPI.regenerate(agreementId)
      if (response.success && response.agreement) {
        toast.success("Agreement updated with current pricing.")
        setAgreement(response.agreement)
        // Terms changed — require the landlord to re-read and re-accept
        // before signing.
        setHasReadTerms(false)
        setTermsAccepted(false)
      } else {
        toast.error(response.error ?? "Failed to regenerate agreement")
      }
    } catch (error) {
      console.error("[AgreementDetail] regenerate error:", error)
      toast.error("Failed to regenerate agreement. Please try again.")
    } finally {
      setIsRegenerating(false)
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
  const breakdown = calculateAgreementBreakdown(agreement || {})
  const { monthlyRent, annualRent, cautionFee, platformFee, serviceCharge, totalDue, periodRent, periodLabel, paymentFrequency } = breakdown
  const frequencyMultiplier = getPaymentFrequencyMultiplier(paymentFrequency)

  // ── Payment / release state (drives the live Quick Actions card) ──────────
  // Source of truth: reconciliation_status + total_received_amount come from
  // the agreement row (flipped by the Nomba webhook); disbursement_status is
  // derived server-side from the latest nomba_disbursement transaction row.
  const totalReceived = Number(agreement?.total_received_amount ?? 0)
  const isPartiallyPaid =
    !isFullyPaid && totalReceived > 0
  // Release is available once the tenant has paid in full and no disbursement
  // is already in flight or done. Same gate as /landlord/payments/[id].
  const canRelease =
    isFullyPaid &&
    agreement?.disbursement_status !== "released" &&
    agreement?.disbursement_status !== "pending"
  // Payout amount the landlord will receive (received minus platform fee).
  const payoutAmount = Math.max(totalReceived - Number(agreement?.platform_fee ?? 0), 0)

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

        {/* ── Tenant-signed banner ────────────────────────────────────────────
            Shown when the tenant has signed but the landlord hasn't yet.
            The 15s silent poller keeps this live: if the tenant signs while
            the landlord is already on this page, the banner appears without
            a refresh. "Sign Now" scrolls to the signing block in the sidebar. */}
        {canSign && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <PenLine className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {agreement.tenant?.full_name ?? "The tenant"} has signed this agreement
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your signature is required to complete the lease. Review the terms below and sign when ready.
                </p>
              </div>
            </div>
            <Button
              onClick={() => document.getElementById("sign-agreement-card")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-10 px-5 rounded-xl font-semibold shadow-md flex-shrink-0"
            >
              <PenLine className="h-4 w-4 mr-2" />
              Sign Now
            </Button>
          </div>
        )}

        {/* ── Payment received banner ─────────────────────────────────────────
            Shown once the tenant's full payment has landed in the NUBAN and
            the landlord has not yet released the funds. Mirrors the overview
            page's "Payments Ready for Release" banner so the landlord sees the
            same call-to-action here on the agreement page — the natural place
            they return to after signing. The 15s poller keeps this live. */}
        {canRelease && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Payment received — {formatNGN(totalReceived)} from {agreement.tenant?.full_name ?? "the tenant"}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Funds are held in escrow. Review your bank details and release {formatNGN(payoutAmount)} to your account.
                </p>
              </div>
            </div>
            <Link href={`/landlord/payments/${agreement.id}`} className="flex-shrink-0">
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white h-10 px-5 rounded-xl font-semibold shadow-md">
                <Banknote className="h-4 w-4 mr-2" />
                Review &amp; Release Funds
              </Button>
            </Link>
          </div>
        )}

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
                <div className="bg-blue-50 rounded-xl p-3 mb-3">
                  <p className="text-blue-600 font-semibold text-sm mb-2">Move-in Cost Breakdown</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Monthly Rent:</span>
                      <span className="font-semibold">{formatNGN(agreement.rent_amount)}</span>
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
                    {agreement.service_charge != null && (
                      <div className="flex justify-between">
                        <span>Service Charge:</span>
                        <span className="font-semibold">{formatNGN(agreement.service_charge)}</span>
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
                <div
                  ref={termsScrollRef}
                  onScroll={handleTermsScroll}
                  className="bg-slate-50 rounded-xl border border-slate-100 p-5 max-h-96 overflow-y-auto"
                >
                  {agreement.terms ? (
                    <Markdown className="text-sm text-slate-700">{agreement.terms}</Markdown>
                  ) : (
                    <p className="text-sm text-slate-500">Agreement terms will appear here.</p>
                  )}
                </div>
                {/* Read-progress hint — only while it's the landlord's turn to sign */}
                {canSign && !hasReadTerms && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-orange-600">
                    <Eye className="h-3.5 w-3.5" />
                    Scroll to the bottom of the terms to unlock signing.
                  </p>
                )}
                {canSign && hasReadTerms && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    You&apos;ve reviewed the full agreement.
                  </p>
                )}
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

            {/* Transfer History (Stage 3 polish)
                - Reads inbound NUBAN transfers from /nomba/payment_status
                - Brand-consistent orange-tinted table; empty-state handled in
                  TransferHistoryTable. Renders a refresh button so the landlord
                  can re-query after a recent tenant payment. */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <ArrowDownToLine className="h-4 w-4 text-orange-500" />
                    Transfer History
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isTransfersLoading}
                    onClick={() => {
                      const ref = (agreement as unknown as { nomba_account_ref?: string | null } | null)
                        ?.nomba_account_ref
                      if (ref) fetchTransfers(ref)
                    }}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isTransfersLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Inbound payments from the tenant into the agreement NUBAN.
                </p>
              </CardHeader>
              <CardContent>
                {isTransfersLoading ? (
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 text-center">
                    <Loader2 className="h-6 w-6 text-orange-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Loading transfers...</p>
                  </div>
                ) : (
                  <TransferHistoryTable entries={transfers} />
                )}
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

            {/* ── PropFlow AI Briefing ────────────────────────────────────────
                Same indigo card pattern as the landlord application detail
                page. Fetched via propflow_thread_id → propflowStatus() →
                landlord_briefing. Gives the landlord the AI-generated tenant
                summary right where they sign — no chat widget needed. */}
            {propflowBriefing && (
              <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm">
                <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50/30">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      AI Tenant Briefing
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] ml-1">
                        Auto-generated
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Markdown className="text-slate-700">{formatBriefingMarkdown(propflowBriefing)}</Markdown>
                </CardContent>
              </Card>
            )}
            {isBriefingLoading && !propflowBriefing && (
              <Card className="border-indigo-100 bg-indigo-50/40 shadow-sm">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                  <p className="text-xs text-indigo-600">Loading AI briefing…</p>
                </CardContent>
              </Card>
            )}

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

                  {/* Checkbox — locked until the landlord has read the full terms */}
                  <div className={cn(
                    "flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200",
                    !hasReadTerms && "opacity-60"
                  )}>
                    <Checkbox
                      id="terms-accept"
                      checked={termsAccepted}
                      disabled={!hasReadTerms}
                      onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
                      className="mt-0.5 border-amber-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <label
                      htmlFor="terms-accept"
                      className={cn(
                        "text-xs text-slate-700 leading-relaxed",
                        hasReadTerms ? "cursor-pointer" : "cursor-not-allowed"
                      )}
                    >
                      I have read and agree to all terms and conditions in this rental agreement
                    </label>
                  </div>
                  {!hasReadTerms && (
                    <p className="text-xs text-orange-600 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Read the full agreement above to enable signing.
                    </p>
                  )}

                  {/* Sign button — disabled until read + checkbox checked */}
                  <Button
                    onClick={handleSignAgreement}
                    disabled={isSigning || !termsAccepted || !hasReadTerms}
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
                  {/* Regenerate terms — fixes stale pricing from agreements
                      generated before the payment-integration pricing model.
                      Only shown while unsigned (server also enforces this). */}
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 text-xs"
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Updating agreement…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Refresh Pricing Terms
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-slate-400 text-center">
                    If the rent or deposit figures look wrong, use this to regenerate the
                    agreement with the current pricing.
                  </p>
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
                        {isFundsReleased
                          ? "Payment complete — funds released to your bank."
                          : isFundsReleasing
                          ? "Both parties have signed. Your funds release is in progress."
                          : isFullyPaid
                          ? "Both parties have signed. Tenant payment received."
                          : "Both parties have signed. Awaiting tenant payment."}
                      </p>
                    </div>
                  </div>
                  {/* Live payment status — flips automatically as the Nomba
                      webhook reconciles the tenant's transfer (15s poller). */}
                  {isFundsReleased ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-emerald-800">Funds Released</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {formatNGN(Number(agreement.disbursement_amount ?? payoutAmount))} sent to your bank
                        </p>
                      </div>
                    </div>
                  ) : isFundsReleasing ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-200">
                      <Loader2 className="h-4 w-4 text-amber-500 flex-shrink-0 animate-spin" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-amber-800">Releasing Funds…</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {formatNGN(payoutAmount)} is on the way to your bank
                        </p>
                      </div>
                    </div>
                  ) : canRelease ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <Banknote className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-emerald-800">Payment Received — Ready for Release</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {formatNGN(totalReceived)} received · {formatNGN(payoutAmount)} payout after fees
                        </p>
                      </div>
                    </div>
                  ) : isPartiallyPaid ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-200">
                      <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-amber-800">Partially Paid</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {formatNGN(totalReceived)} received · {formatNGN(Math.max(totalDue - totalReceived, 0))} still due
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg border border-green-200">
                      <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-700">Awaiting Payment</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatNGN(totalDue)} due from tenant
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Release CTA — appears the moment the tenant's full payment
                      lands. Links to the payment detail page where the landlord
                      reviews bank details and confirms the release (same target
                      as the overview banner's "Review & Release"). */}
                  {canRelease && (
                    <Link href={`/landlord/payments/${agreement.id}`} className="block">
                      <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-sm shadow-md">
                        <Banknote className="mr-2 h-4 w-4" />
                        Review &amp; Release Funds
                      </Button>
                    </Link>
                  )}
                  {isFundsReleased && (
                    <Link href={`/landlord/payments/${agreement.id}`} className="block">
                      <Button variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Payment Details
                      </Button>
                    </Link>
                  )}
                  {/* Message tenant about payment — only useful while money is
                      still owed (hidden once paid / releasing / released). */}
                  {!isFullyPaid && !isFundsReleasing && !isFundsReleased && (
                    <Link href={`/landlord/messages?property=${agreement.property_id}&tenant=${agreement.tenant_id}&context=agreement_payment`} className="block">
                      <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50 text-sm">
                        <Mail className="mr-2 h-4 w-4" />
                        Message About Payment
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── PDF Actions ───────────────────────────────────────────────
                FIX: Correctly gate PDF actions on status === 'SIGNED' and document_url.
                Show "Generate PDF" first, then "Download PDF" once URL exists.
                ALSO: Detect old fake URLs (from https://storage.nuloafrica.com) or URLs
                that were written to the old 'property-images' bucket (AGMT-08) and force
                regeneration against the correct 'ownership-docs' bucket.
            ─────────────────────────────────────────────────────────────────── */}
            {(effectiveStatus === "SIGNED" || effectiveStatus === "ACTIVE") && (
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700">Signed Agreement Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Check if URL is real (Supabase CDN + correct bucket) vs old/broken URL */}
                  {agreement.document_url && agreement.document_url.includes("supabase.co") && agreement.document_url.includes("/ownership-docs/") ? (
                    // Real Supabase URL pointing at the correct bucket — show download link
                    <a href={agreement.document_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                        <Download className="mr-2 h-4 w-4" />
                        Download Signed PDF
                      </Button>
                    </a>
                  ) : (
                    // Old fake URL, missing URL, or pointing at wrong bucket — show generate button
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