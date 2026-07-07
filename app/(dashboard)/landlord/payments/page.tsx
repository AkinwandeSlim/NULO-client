"use client"

/**
 * Landlord received payments -- Nomba flow
 * ========================================
 * Each row is an agreement with a NUBAN. Tenants pay into it; landlord
 * releases funds to their bank via a confirmation dialog (same flow as
 * the payment detail page).
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft, Home, Banknote, Building2, Loader2, RefreshCw,
  CheckCircle2, Clock, AlertCircle, Eye, FileText, Send,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  paymentsAPI,
  type AgreementPaymentRow,
  type DisburseResponse,
} from "@/lib/api/payments"

const formatNGN = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG")}`

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

const getReconciliationBadge = (row: AgreementPaymentRow) => {
  if (row.reconciliation_status === "FULL_PAYMENT") {
    if (row.disbursement_status === "released") {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Released
        </Badge>
      )
    }
    if (row.disbursement_status === "pending") {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Disbursing
        </Badge>
      )
    }
    if (row.disbursement_status === "failed") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Disbursement Failed
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Ready to Release
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
  return (
    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </Badge>
  )
}

export default function LandlordPaymentsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [rows, setRows] = useState<AgreementPaymentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Confirmation dialog state
  const [selectedRow, setSelectedRow] = useState<AgreementPaymentRow | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)

  const fetchReceived = useCallback(async () => {
    try {
      const response = await paymentsAPI.getReceived()
      if (response.success) setRows(response.payments)
    } catch (error) {
      console.error("[LandlordPayments] fetch error:", error)
      toast.error("Failed to load received payments")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    fetchReceived()
  }, [user, fetchReceived, router])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchReceived()
    setIsRefreshing(false)
  }

  // Step 1: open dialog — do NOT call the API yet
  const handleReleaseClick = (row: AgreementPaymentRow) => {
    setSelectedRow(row)
    setShowConfirm(true)
  }

  // Step 2: user confirmed — fetch transfer history to get the correct
  // source_transfer_id (same logic as the detail page)
  const handleReleaseConfirm = async () => {
    if (!selectedRow) return
    try {
      setIsReleasing(true)

      // Fetch the full detail to find the FULL_PAYMENT transfer entry
      const detail = await paymentsAPI.getAgreementDetail(selectedRow.agreement_id)
      const fullPayment = detail.transfer_history.find(
        (e: any) => e.reconciliation_result === "FULL_PAYMENT"
      )
      if (!fullPayment) {
        toast.error("No FULL_PAYMENT transfer found — cannot release")
        setIsReleasing(false)
        return
      }

      const resp: DisburseResponse = await paymentsAPI.releaseFunds(
        selectedRow.agreement_id,
        { source_transfer_id: fullPayment.id },
      )

      setShowConfirm(false)
      toast.success(
        resp.status === "released"
          ? `Funds released — ${formatNGN(resp.amount_ngn)} on the way to your bank.`
          : `Release ${resp.status} — ref ${resp.merchant_tx_ref}`,
      )
      await fetchReceived()
    } catch (error: any) {
      setShowConfirm(false)
      toast.error(error?.response?.data?.detail ?? "Release failed")
    } finally {
      setIsReleasing(false)
    }
  }

  const handleView = (id: string) => {
    router.push(`/landlord/payments/${id}`)
  }

  const stats = {
    escrowBalance: rows.reduce((s, r) => {
      if (r.reconciliation_status === "FULL_PAYMENT" && r.disbursement_status !== "released") {
        return s + Number(r.total_received_amount ?? 0)
      }
      return s
    }, 0),
    withdrawn: rows.reduce((s, r) => {
      if (r.disbursement_status === "released") {
        return s + Number(r.disbursement_amount ?? 0)
      }
      return s
    }, 0),
    active: rows.filter(r => r.status === "ACTIVE" || r.status === "SIGNED").length,
    totalReceived: rows.reduce((s, r) => s + Number(r.total_received_amount ?? 0), 0),
  }

  // Derived amounts for the confirm dialog
  const selectedPlatformFee = Number((selectedRow as any)?.platform_fee ?? 0)
  const selectedReceived = Number(selectedRow?.total_received_amount ?? 0)
  const selectedPayout = Math.max(selectedReceived - selectedPlatformFee, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/landlord/overview">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                Received Payments
              </h1>
              <p className="text-slate-600">
                Each agreement has a NUBAN. Tenants pay into it; you release funds to your bank.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Escrow Balance</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatNGN(stats.escrowBalance)}</p>
              <p className="text-xs text-orange-600 mt-1">Available to release</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Withdrawn</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatNGN(stats.withdrawn)}</p>
              <p className="text-xs text-green-600 mt-1">Released to bank</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Leases</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.active}</p>
              <p className="text-xs text-slate-500 mt-1">Signed &amp; active</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Received</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatNGN(stats.totalReceived)}</p>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {rows.length === 0 ? (
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No agreements yet</h3>
              <p className="text-slate-600">
                Once a tenant signs your agreement, a NUBAN is provisioned automatically.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-orange-200 bg-white/90 backdrop-blur-sm shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">NUBAN</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Received</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Disbursement</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const rowReleasing = isReleasing && selectedRow?.agreement_id === row.agreement_id
                      const canRelease =
                        row.reconciliation_status === "FULL_PAYMENT" &&
                        row.disbursement_status !== "released" &&
                        row.disbursement_status !== "pending"
                      return (
                        <tr key={row.agreement_id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{row.property_title}</p>
                              <p className="text-xs text-slate-500">
                                {row.property_city}{row.property_state && `, ${row.property_state}`}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-slate-600">{row.tenant_name}</p>
                          </td>
                          <td className="py-4 px-4">
                            {row.virtual_account_number ? (
                              <code className="text-xs font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded">
                                {row.virtual_account_number}
                              </code>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {getReconciliationBadge(row)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{formatNGN(row.total_received_amount)}</p>
                              {row.disbursement_amount != null && row.disbursement_status === "released" && (
                                <p className="text-xs text-green-600">Released {formatNGN(row.disbursement_amount)}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {row.disbursement_status === "released" ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Released
                              </Badge>
                            ) : row.disbursement_status === "pending" ? (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Pending
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(row.agreement_id)}
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Details
                              </Button>
                              {canRelease && (
                                <Button
                                  size="sm"
                                  onClick={() => handleReleaseClick(row)}
                                  disabled={rowReleasing}
                                  className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
                                >
                                  {rowReleasing ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Banknote className="w-3 h-3" />
                                  )}
                                  Release
                                </Button>
                              )}
                            </div>
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
      </div>

      {/* ── Confirmation Dialog (mirrors detail page) ── */}
      <Dialog open={showConfirm} onOpenChange={(open) => {
        if (isReleasing) return // prevent closing while API is in flight
        setShowConfirm(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Confirm Fund Release</DialogTitle>
            <DialogDescription className="text-slate-600">
              Verify your bank details below. The disbursement only starts once you click Confirm.
            </DialogDescription>
          </DialogHeader>

          {selectedRow && (
            <div className="py-4 space-y-4">
              {/* Property / tenant context */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <Building2 className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedRow.property_title}</p>
                  <p className="text-xs text-slate-500">Tenant: {selectedRow.tenant_name}</p>
                </div>
              </div>

              {/* Amount breakdown */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Received from tenant</span>
                  <span className="text-sm font-semibold text-slate-900">{formatNGN(selectedReceived)}</span>
                </div>
                {selectedPlatformFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Platform fee</span>
                    <span className="text-sm text-slate-700">− {formatNGN(selectedPlatformFee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">You will receive</span>
                  <span className="text-xl font-bold text-orange-600">{formatNGN(selectedPayout)}</span>
                </div>

                {/* Bank details */}
                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Bank</span>
                    <span className="text-sm font-medium text-slate-900">
                      {(selectedRow as any).landlord_bank_name || "Your Bank"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Account Number</span>
                    <span className="text-sm font-mono font-medium text-slate-900">
                      {(selectedRow as any).landlord_bank_account_number || "••••••••"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Account Name</span>
                    <span className="text-sm font-medium text-slate-900">
                      {(selectedRow as any).landlord_account_name || "Your Account Name"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  Ensure the account details are correct. Transfers to wrong accounts may be irreversible.
                </p>
              </div>

              {/* Processing indicator */}
              {isReleasing && (
                <div className="flex items-center gap-2 justify-center py-2 text-sm text-orange-700 bg-orange-50 rounded-lg border border-orange-200">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Processing — please wait, do not close this window…</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isReleasing}
              className="border-slate-300 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReleaseConfirm}
              disabled={isReleasing}
              className="bg-orange-500 hover:bg-orange-600 text-white min-w-[160px]"
            >
              {isReleasing
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Releasing…</>
                : <><Banknote className="w-4 h-4 mr-2" />Confirm &amp; Release</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
