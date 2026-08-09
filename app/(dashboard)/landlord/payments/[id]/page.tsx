"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft, Building2, Loader2, AlertCircle, CheckCircle2,
  Clock, RefreshCw, Banknote, Calendar, Hash, User, Download,
  TrendingUp, Wallet, ArrowRightLeft, Info, ChevronLeft, ChevronRight,
  Activity,
} from "lucide-react"
import { toast } from "sonner"
import {
  paymentsAPI,
  type AgreementPaymentRow,
  type TransferHistoryEntry,
  type DisburseResponse,
} from "@/lib/api/payments"
import { agreementsAPI } from "@/lib/api/agreements"

const formatNGN = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`

const formatDate = (d: string | null) => {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const formatShortDate = (d: string | null) => {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

const TransferBadge = ({ entry }: { entry: TransferHistoryEntry }) => {
  if (entry.reconciliation_result === "FULL_PAYMENT")
    return <Badge className="bg-green-100 text-green-700 border-green-200">Full Payment</Badge>
  if (entry.reconciliation_result === "UNDERPAYMENT")
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Partial</Badge>
  if (entry.reconciliation_result === "OVERPAYMENT")
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Overpaid</Badge>
  return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Pending</Badge>
}

export default function LandlordPaymentDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { user } = useAuth()
  const agreementId = params?.id

  const [agreement, setAgreement] = useState<AgreementPaymentRow | null>(null)
  const [history, setHistory] = useState<TransferHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false)
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const HISTORY_PAGE_SIZE = 5

  const fetchDetail = useCallback(async () => {
    if (!agreementId) return
    try {
      const detail = await paymentsAPI.getAgreementDetail(agreementId)
      setAgreement(detail.agreement)
      setHistory(detail.transfer_history)
      setHistoryPage(1) // reset to first page on fresh load
    } catch (error) {
      console.error("[LandlordPaymentDetail] fetch error:", error)
      toast.error("Failed to load payment details")
    } finally {
      setIsLoading(false)
    }
  }, [agreementId])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    fetchDetail()
  }, [user, fetchDetail, router])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDetail()
    setIsRefreshing(false)
  }

  const handleDownloadReceipt = async () => {
    if (!agreementId) return
    setIsDownloadingReceipt(true)
    setReceiptUrl(null)
    try {
      const response = await agreementsAPI.generateReceipt(agreementId)
      if (response.success && response.document_url) {
        const url = response.document_url
        setReceiptUrl(url)
        const a = document.createElement("a")
        a.href = url
        a.target = "_blank"
        a.rel = "noopener noreferrer"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.success("Receipt ready — opening now")
      } else {
        toast.error(response.error || "Failed to generate receipt")
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to generate receipt")
    } finally {
      setIsDownloadingReceipt(false)
    }
  }

  const handleReleaseClick = () => {
    if (!agreement) return
    const fullPayment = history.find(e => e.reconciliation_result === "FULL_PAYMENT")
    if (!fullPayment) { toast.error("No FULL_PAYMENT transfer found"); return }
    setShowReleaseConfirm(true)
  }

  const handleReleaseConfirm = async () => {
    if (!agreement) return
    const fullPayment = history.find(e => e.reconciliation_result === "FULL_PAYMENT")
    if (!fullPayment) { toast.error("No FULL_PAYMENT transfer found"); return }
    try {
      setIsReleasing(true)
      // Keep dialog open while the API call is in flight so the spinner
      // stays visible — only close once we have a definitive result
      const resp: DisburseResponse = await paymentsAPI.releaseFunds(
        agreement.agreement_id,
        { source_transfer_id: fullPayment.id },
      )
      setShowReleaseConfirm(false)
      toast.success(
        resp.status === "released"
          ? `Funds released — ${formatNGN(resp.amount_ngn)} on the way to your bank.`
          : `Release ${resp.status} — ref ${resp.merchant_tx_ref}`,
      )
      await fetchDetail()
    } catch (error: any) {
      setShowReleaseConfirm(false)
      toast.error(error?.response?.data?.detail ?? "Release failed")
    } finally {
      setIsReleasing(false)
    }
  }

  if (isLoading || !agreement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    )
  }

  const expected = Number(agreement.expected_payment_amount ?? agreement.rent_amount ?? 0)
  const received = Number(agreement.total_received_amount ?? 0)
  const platformFee = Number((agreement as any).platform_fee ?? 0)
  const balance = Math.max(expected - received, 0)
  const payout = Math.max(received - platformFee, 0)
  const canRelease =
    agreement.reconciliation_status === "FULL_PAYMENT" &&
    agreement.disbursement_status !== "released" &&
    agreement.disbursement_status !== "pending"

  const paymentStatus = (() => {
    if (agreement.disbursement_status === "released")
      return { label: "Funds Released", cls: "bg-green-100 text-green-700 border-green-200" }
    if (agreement.disbursement_status === "pending")
      return { label: "Releasing Funds", cls: "bg-amber-100 text-amber-700 border-amber-200" }
    // Don't show "Ready to Release" until user actually clicks — keep it as "Fully Paid"
    if (agreement.reconciliation_status === "FULL_PAYMENT")
      return { label: "Fully Paid", cls: "bg-green-100 text-green-700 border-green-200" }
    if (received > 0)
      return { label: "Partially Paid", cls: "bg-amber-100 text-amber-700 border-amber-200" }
    return { label: "Awaiting Payment", cls: "bg-slate-100 text-slate-700 border-slate-200" }
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Page header ── */}
        <div className="mb-8">
          <Link href="/landlord/payments">
            <Button variant="ghost" size="sm" className="mb-4 text-slateate-600 hover:text-slate-900 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Received Payments
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                Payment Management
              </h1>
              <p className="text-slate-600">Track payments and manage fund disbursement</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}
              className="text-orange-700 border-orange-200 hover:bg-orange-50">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Summary metrics ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-orange-200 bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected</p>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNGN(expected)}</p>
              <p className="text-xs text-slate-500 mt-1">Total rent due</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Received</p>
                <Wallet className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">{formatNGN(received)}</p>
              <p className="text-xs text-slate-500 mt-1">From tenant</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Fee</p>
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatNGN(platformFee)}</p>
              <p className="text-xs text-slate-500 mt-1">{platformFee > 0 ? `${((platformFee / received) * 100).toFixed(1)}% of received` : 'No fees'}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Payout</p>
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNGN(payout)}</p>
              {platformFee > 0 && (
                <p className="text-xs text-slate-500 mt-1">After {formatNGN(platformFee)} fee</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
                <Activity className="w-4 h-4 text-slate-500" />
              </div>
              <Badge className={paymentStatus.cls}>{paymentStatus.label}</Badge>
              {balance > 0 && (
                <p className="text-xs text-slate-500 mt-2">{formatNGN(balance)} remaining</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Property & Tenant ── */}
        <Card className="border-orange-200 bg-white/90 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              Property &amp; Tenant Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Property</p>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{agreement.property_title}</h3>
                <p className="text-sm text-slate-600 mb-3">
                  {agreement.property_city}{agreement.property_state && `, ${agreement.property_state}`}
                </p>
                {agreement.virtual_account_number && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <Hash className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-xs text-slate-500">NUBAN</p>
                      <code className="text-sm font-mono font-bold text-slate-900">
                        {agreement.virtual_account_number}
                      </code>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tenant</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{agreement.tenant_name || "Tenant"}</h3>
                    <p className="text-sm text-slate-500">Paying tenant</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      Lease: {formatShortDate(agreement.lease_start_date)} – {formatShortDate(agreement.lease_end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">{agreement.status}</Badge>
                    <span className="text-xs text-slate-500">Updated {formatShortDate(agreement.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Main grid: history + disbursement ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Payment History */}
          <div className="lg:col-span-2">
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-orange-600" />
                      Payment History
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {history.length === 0
                        ? `No transfers yet for this agreement`
                        : `${history.length} transfer${history.length !== 1 ? "s" : ""} from ${agreement.tenant_name || "tenant"}`}
                    </CardDescription>
                  </div>
                  {history.length > 0 && (
                    <span className="text-xs text-slate-400 pt-1 shrink-0">
                      {history.length} record{history.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {history.length === 0 ? (
                  <div className="py-14 text-center px-6">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700 mb-1">No payments yet</p>
                    <p className="text-xs text-slate-400">
                      Waiting for tenant to transfer to NUBAN {agreement.virtual_account_number}
                    </p>
                  </div>
                ) : (() => {
                  const totalPages = Math.ceil(history.length / HISTORY_PAGE_SIZE)
                  const pageItems = history.slice(
                    (historyPage - 1) * HISTORY_PAGE_SIZE,
                    historyPage * HISTORY_PAGE_SIZE,
                  )
                  const totalReceived = history.reduce((sum, e) => sum + Number(e.amount_received), 0)

                  return (
                    <>
                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                From
                              </th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                                Reference
                              </th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Disbursed
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pageItems.map((entry) => (
                              <tr key={entry.id} className="hover:bg-orange-50/40 transition-colors group">
                                {/* Date */}
                                <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                                  {formatDate(entry.created_at)}
                                </td>
                                {/* Amount */}
                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-900">
                                    {formatNGN(entry.amount_received)}
                                  </span>
                                </td>
                                {/* Transfer status badge */}
                                <td className="py-3 px-4">
                                  <TransferBadge entry={entry} />
                                </td>
                                {/* From (tenant name + optional sender info) */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="font-medium text-slate-900 text-xs">
                                      {agreement.tenant_name || "Tenant"}
                                    </span>
                                  </div>
                                  {entry.sender_name && entry.sender_name !== agreement.tenant_name && (
                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                                      <Info className="w-2.5 h-2.5" />
                                      <span className="truncate max-w-[120px]">
                                        via {entry.sender_name}
                                        {entry.sender_bank && ` · ${entry.sender_bank}`}
                                      </span>
                                    </div>
                                  )}
                                  {entry.sender_bank && (!entry.sender_name || entry.sender_name === agreement.tenant_name) && (
                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                                      <Building2 className="w-2.5 h-2.5" />
                                      <span>{entry.sender_bank}</span>
                                    </div>
                                  )}
                                </td>
                                {/* Reference */}
                                <td className="py-3 px-4 hidden md:table-cell">
                                  {entry.nomba_request_id ? (
                                    <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                                      <Hash className="w-3 h-3 shrink-0" />
                                      <span>{entry.nomba_request_id.slice(0, 14)}…</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-xs">—</span>
                                  )}
                                </td>
                                {/* Disbursed indicator */}
                                <td className="py-3 px-4">
                                  {entry.reconciliation_result === "FULL_PAYMENT" && agreement.disbursement_status === "released" ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />Released
                                    </Badge>
                                  ) : entry.reconciliation_result === "FULL_PAYMENT" && agreement.disbursement_status === "pending" ? (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />Pending
                                    </Badge>
                                  ) : (
                                    <span className="text-slate-300 text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          {/* Totals footer row */}
                          <tfoot>
                            <tr className="border-t-2 border-orange-200 bg-orange-50/60">
                              <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                                Total ({history.length})
                              </td>
                              <td className="py-3 px-4 font-bold text-orange-700">
                                {formatNGN(totalReceived)}
                              </td>
                              <td colSpan={4} className="py-3 px-4 text-xs text-slate-400">
                                {received >= expected
                                  ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Fully paid</span>
                                  : <span>{formatNGN(balance)} outstanding</span>
                                }
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Pagination controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white">
                          <p className="text-xs text-slate-500">
                            Showing {(historyPage - 1) * HISTORY_PAGE_SIZE + 1}–{Math.min(historyPage * HISTORY_PAGE_SIZE, history.length)} of {history.length}
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline" size="sm"
                              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                              disabled={historyPage === 1}
                              className="h-7 w-7 p-0 border-slate-200">
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                              <Button
                                key={pg}
                                variant={pg === historyPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setHistoryPage(pg)}
                                className={`h-7 w-7 p-0 text-xs ${pg === historyPage
                                  ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                                  : "border-slate-200 text-slate-600 hover:bg-orange-50"}`}>
                                {pg}
                              </Button>
                            ))}
                            <Button
                              variant="outline" size="sm"
                              onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                              disabled={historyPage === totalPages}
                              className="h-7 w-7 p-0 border-slate-200">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Disbursement Panel */}
          <div>
            <Card className="border-orange-200 bg-white/90 shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Banknote className="w-5 h-5 text-orange-600" />
                  Fund Disbursement
                </CardTitle>
                <CardDescription>Release funds to your bank</CardDescription>
              </CardHeader>
              <CardContent>
                {agreement.disbursement_status === "released" && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-green-900 mb-1">Funds Released Successfully</p>
                          <p className="text-sm text-green-700">
                            {formatNGN(agreement.disbursement_amount ?? payout)} sent to your bank account
                          </p>
                          {agreement.disbursement_merchant_tx_ref && (
                            <p className="text-xs text-green-600 font-mono mt-2">
                              Ref: {agreement.disbursement_merchant_tx_ref}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <Button onClick={handleDownloadReceipt} disabled={isDownloadingReceipt}
                      variant="outline" size="sm" className="w-full text-orange-700 border-orange-300 hover:bg-orange-50">
                      {isDownloadingReceipt
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                        : <><Download className="w-4 h-4 mr-2" />Download Receipt</>}
                    </Button>
                    {receiptUrl && (
                      <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-xs text-orange-600 underline underline-offset-2 hover:text-orange-800">
                        <Download className="w-3 h-3" />Receipt not opening? Click here
                      </a>
                    )}
                  </div>
                )}
                {agreement.disbursement_status === "pending" && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <Loader2 className="w-5 h-5 text-amber-600 animate-spin mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900 mb-1">Disbursement in Progress</p>
                        <p className="text-xs text-amber-700">Funds are being transferred to your bank account.</p>
                      </div>
                    </div>
                  </div>
                )}
                {agreement.disbursement_status !== "released" && agreement.disbursement_status !== "pending" && canRelease && (
                  <div className="space-y-4">
                    {/* Informational — neutral, not success green */}
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
                      <Banknote className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Ready to Disburse
                        </p>
                        <p className="text-xs text-blue-700">
                          {agreement.tenant_name || "Tenant"} has paid in full.
                          Click the button below to transfer your share to your bank.
                        </p>
                      </div>
                    </div>

                    {/* Payout breakdown */}
                    <div className="space-y-2 px-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Received from tenant</span>
                        <span className="font-semibold text-slate-900">{formatNGN(received)}</span>
                      </div>
                      {platformFee > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Platform fee</span>
                          <span className="text-slate-700">− {formatNGN(platformFee)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">You will receive</span>
                        <span className="text-xl font-bold text-orange-600">{formatNGN(payout)}</span>
                      </div>
                    </div>

                    {/* Primary CTA — the only thing that triggers disbursement */}
                    <Button
                      onClick={handleReleaseClick}
                      disabled={isReleasing}
                      className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white w-full shadow-sm"
                      size="lg"
                    >
                      {isReleasing
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Releasing…</>
                        : <><Banknote className="w-4 h-4 mr-2" />Release {formatNGN(payout)} to My Bank</>}
                    </Button>
                    <p className="text-xs text-center text-slate-400">
                      You will review your bank details before funds are sent
                    </p>
                  </div>
                )}
                {agreement.disbursement_status !== "released" && agreement.disbursement_status !== "pending" && !canRelease && (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700 mb-1">Awaiting Payment</p>
                    <p className="text-xs text-slate-500">
                      Release available once {agreement.tenant_name || "the tenant"} pays in full.
                    </p>
                    {balance > 0 && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">{formatNGN(balance)} remaining</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Release Confirmation Dialog */}
      <Dialog open={showReleaseConfirm} onOpenChange={(open) => {
        // Prevent closing the dialog while the release is processing
        if (isReleasing) return
        setShowReleaseConfirm(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Confirm Fund Release</DialogTitle>
            <DialogDescription className="text-slate-600">
              Verify your bank details below. The disbursement only starts once you click Confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Amount to be sent</span>
                <span className="text-lg font-bold text-orange-600">{formatNGN(payout)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Bank</span>
                  <span className="text-sm font-medium text-slate-900">
                    {agreement.landlord_bank_name || "Your Bank"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Account Number</span>
                  <span className="text-sm font-mono font-medium text-slate-900">
                    {agreement.landlord_bank_account_number || "••••••••"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Account Name</span>
                  <span className="text-sm font-medium text-slate-900">
                    {agreement.landlord_account_name || "Your Account Name"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs">
                Ensure the account details are correct. Transfers to wrong accounts may be irreversible.
              </p>
            </div>
            {/* Processing indicator — visible while API call is in flight */}
            {isReleasing && (
              <div className="flex items-center gap-2 justify-center py-2 text-sm text-orange-700 bg-orange-50 rounded-lg border border-orange-200">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Processing — please wait, do not close this window…</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReleaseConfirm(false)}
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
