"use client"

/**
 * Tenant Payments (Nomba-backed)
 * ===============================
 * Replaces the Paystack-driven list. Each row is now an AGREEMENT
 * with a NUBAN (dedicated virtual account) attached, NOT a
 * Paystack transaction.
 *
 * User flow:
 *   1. Tenant signs the agreement
 *   2. The backend auto-provisions a NUBAN for that agreement
 *   3. The tenant copies the NUBAN and pays into it from any bank
 *   4. Nomba notifies us, the row turns green, and the landlord
 *      gets a release button on their side
 *
 * The legacy Paystack implementation is preserved at page-backup.tsx
 * for reference but is no longer routed.
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Copy, Banknote, Calendar, Home, FileText, Eye,
  Loader2, AlertCircle, CheckCircle2, Clock, RefreshCw, Building2,
} from "lucide-react"
import Link from "next/link"
import { paymentsAPI, type AgreementPaymentRow } from "@/lib/api/payments"
import { toast } from "sonner"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatNGN = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG")}`

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

const getStatusBadge = (row: AgreementPaymentRow) => {
  // Show PAID once the agreement is reconciled to FULL_PAYMENT, even before
  // the landlord has triggered disbursement.
  if (row.reconciliation_status === "FULL_PAYMENT") {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Paid
      </Badge>
    )
  }
  if (row.reconciliation_status === "UNDERPAYMENT") {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Partial
      </Badge>
    )
  }
  if (row.reconciliation_status === "OVERPAYMENT") {
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Overpaid
      </Badge>
    )
  }
  if (row.virtual_account_number) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        <Clock className="w-3 h-3 mr-1" />
        Awaiting Payment
      </Badge>
    )
  }
  return (
    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
      <Clock className="w-3 h-3 mr-1" />
      Generating NUBAN…
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Row component
// ─────────────────────────────────────────────────────────────────────────────

interface RowProps {
  row: AgreementPaymentRow
  onViewDetails: (id: string) => void
  onProvisionNuban: (id: string) => Promise<void>
}

function PaymentRow({ row, onViewDetails, onProvisionNuban }: RowProps) {
  const [isProvisioning, setIsProvisioning] = useState(false)
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("NUBAN copied to clipboard")
  }

  const isProvisioned = Boolean(row.virtual_account_number)
  const expected = Number(row.expected_payment_amount ?? row.rent_amount ?? 0)
  const received = Number(row.total_received_amount ?? 0)
  const balance = Math.max(expected - received, 0)

  return (
    <Card className="tenant-payment-row border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(row)}
              <span className="text-xs text-slate-500">
                Created {formatDate(row.created_at)}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">
              {row.property_title || "Property"}
            </h3>
            {row.property_city && (
              <p className="text-sm text-slate-600">
                {row.property_city}
                {row.property_state && `, ${row.property_state}`}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Due</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatNGN(expected)}</p>
            {received > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {formatNGN(received)} received
              </p>
            )}
          </div>
        </div>

        {/* Payment status block */}
        <div className="payment-status-panel mt-4 p-4 rounded-lg border border-dashed border-orange-300 bg-orange-50/50">
          {isProvisioned && (row.reconciliation_status === "FULL_PAYMENT" || row.reconciliation_status === "RECONCILED") ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                  Payment Received
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Amount received</p>
                  <p className="text-2xl font-bold text-green-600">{formatNGN(received)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge className="bg-green-100 text-green-700 border-green-200 mt-1">
                    Paid
                  </Badge>
                </div>
              </div>
              {row.total_received_amount > row.expected_payment_amount && (
                <p className="text-xs text-amber-600 mt-2">
                  Overpayment: {formatNGN(row.total_received_amount - row.expected_payment_amount)}
                </p>
              )}
            </>
          ) : isProvisioned ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
                  Pay to this NUBAN
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-lg font-mono font-semibold text-slate-900">
                  {row.virtual_account_number}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(row.virtual_account_number!)}
                  className="text-orange-700 hover:bg-orange-100"
                  aria-label="Copy NUBAN"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {row.virtual_account_name && (
                <p className="text-xs text-slate-600 mt-1">
                  Account name: <span className="font-medium">{row.virtual_account_name}</span>
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-2">
                Transfer exactly <span className="font-semibold">{formatNGN(balance || expected)}</span> from any Nigerian bank.
                Your account is auto-reconciled within seconds.
              </p>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-slate-600">
                No dedicated NUBAN yet. Generate one to get a virtual account
                number you can pay into from any Nigerian bank.
              </p>
              <Button
                onClick={async () => {
                  setIsProvisioning(true)
                  try {
                    await onProvisionNuban(row.agreement_id)
                  } finally {
                    setIsProvisioning(false)
                  }
                }}
                disabled={isProvisioning}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm whitespace-nowrap"
              >
                {isProvisioning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Generate NUBAN
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(row.agreement_id)}
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <Eye className="w-3 h-3 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function TenantPaymentsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [rows, setRows] = useState<AgreementPaymentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchPayments = useCallback(async () => {
    try {
      const response = await paymentsAPI.getMyPayments()
      if (response.success) {
        setRows(response.payments)
      } else {
        toast.error("Failed to load payment history")
      }
    } catch (error) {
      console.error("[TenantPayments] fetch error:", error)
      toast.error("Failed to load payment history")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    fetchPayments()
  }, [user, fetchPayments, router])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchPayments()
    setIsRefreshing(false)
    toast.success("Payment list refreshed")
  }

  const handleViewDetails = (agreementId: string) => {
    router.push(`/tenant/payments/${agreementId}`)
  }

  // Provision a Nomba NUBAN for an agreement that doesn't have one yet.
  // The backend POST /api/v1/agreements/{id}/provision-nomba is idempotent and
  // requires the agreement to be SIGNED. On success we refresh the list so the
  // new NUBAN appears in the row.
  const handleProvisionNuban = async (agreementId: string): Promise<void> => {
    try {
      await paymentsAPI.provisionNomba(agreementId)
      toast.success("Your dedicated NUBAN has been generated. Refreshing…")
      await fetchPayments()
    } catch (error: any) {
      console.error("[TenantPayments] provision NUBAN error:", error)
      const detail = error?.response?.data?.detail ?? error?.message
      toast.error(detail ? `Could not generate NUBAN: ${detail}` : "Could not generate NUBAN. Please try again.")
    }
  }

  const stats = {
    total: rows.length,
    paid: rows.filter(r => r.reconciliation_status === "FULL_PAYMENT" || r.reconciliation_status === "RECONCILED").length,
    awaiting: rows.filter(r => 
      r.virtual_account_number && 
      r.reconciliation_status !== "FULL_PAYMENT" && 
      r.reconciliation_status !== "RECONCILED"
    ).length,
    unpaid: rows.filter(r => !r.virtual_account_number).length,
    totalDue: rows.reduce((s, r) => s + Number(r.expected_payment_amount ?? r.rent_amount ?? 0), 0),
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Payment History</h3>
            <p className="text-slate-600">Fetching your NUBAN payment details…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tenant-payments min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <Link href="/tenant">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                Payments
              </h1>
              <p className="text-slate-600">
                Transfer to your dedicated NUBAN from any Nigerian bank. We auto-reconcile within seconds.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agreements</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.paid}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Awaiting</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.awaiting}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Due</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{formatNGN(stats.totalDue)}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Empty state ── */}
        {rows.length === 0 && (
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-12 pb-12 text-center">
              <Banknote className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No payments yet</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Once you sign a lease agreement, we'll provision a dedicated NUBAN for you to pay into.
              </p>
              <Link href="/tenant/agreements">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  View My Agreements
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* ── Rows ── */}
        {rows.length > 0 && (
          <div className="space-y-4">
            {rows.map((row) => (
              <PaymentRow
                key={row.agreement_id}
                row={row}
                onViewDetails={handleViewDetails}
                onProvisionNuban={handleProvisionNuban}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
