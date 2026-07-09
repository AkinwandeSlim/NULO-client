"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Copy, ArrowLeft, Building2, Loader2, AlertCircle, CheckCircle2,
  Clock, RefreshCw, Banknote, Calendar, Hash, Download, FileText,
  TrendingUp, Wallet, Activity, User, ChevronLeft, ChevronRight, Info,
  CalendarClock, CreditCard, AlertTriangle, Eye, CheckCircle, ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import {
  paymentsAPI,
  type AgreementPaymentRow,
  type TransferHistoryEntry,
} from "@/lib/api/payments"
import { agreementsAPI } from "@/lib/api/agreements"
import { trackEngagement } from "@/lib/api/engagement"

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

const formatCompactDate = (d: Date) => {
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
}

export default function TenantPaymentDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { user } = useAuth()
  const agreementId = params?.id

  const [agreement, setAgreement] = useState<AgreementPaymentRow | null>(null)
  const [history, setHistory] = useState<TransferHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const HISTORY_PAGE_SIZE = 5

  const fetchDetail = useCallback(async () => {
    if (!agreementId || agreementId === "undefined") { setIsLoading(false); return }
    try {
      const detail = await paymentsAPI.getAgreementDetail(agreementId)
      
      // Track payment activity when new payments are detected
      const newPaymentCount = detail.transfer_history.length
      const oldPaymentCount = history.length
      if (newPaymentCount > oldPaymentCount && user?.id) {
        await trackEngagement(user.id, 'payment_made', {
          agreement_id: agreementId,
          amount: detail.agreement.total_received_amount,
          payment_count: newPaymentCount,
        })
      }
      
      setAgreement(detail.agreement)
      setHistory(detail.transfer_history)
      setHistoryPage(1)
    } catch (error) {
      console.error("[TenantPaymentDetail] fetch error:", error)
      toast.error("Failed to load payment details")
    } finally {
      setIsLoading(false)
    }
  }, [agreementId, history.length, user?.id])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    
    // Track that tenant viewed payment details
    if (user?.id && agreementId) {
      trackEngagement(user.id, 'payment_details_viewed', {
        agreement_id: agreementId,
      }).catch(() => {}) // Non-blocking
    }
    
    fetchDetail()
  }, [user, fetchDetail, router, agreementId])

  // Auto-refresh every 15s until fully paid
  useEffect(() => {
    if (!agreement || agreement.reconciliation_status === "FULL_PAYMENT") return
    const t = setInterval(fetchDetail, 15000)
    return () => clearInterval(t)
  }, [agreement, fetchDetail])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDetail()
    setIsRefreshing(false)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
    
    // Track NUBAN copy as engagement
    if (user?.id && agreementId) {
      trackEngagement(user.id, 'nuban_copied', {
        agreement_id: agreementId,
      }).catch(() => {})
    }
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
        a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        toast.success("Receipt ready — opening now")
        
        // Track receipt download
        if (user?.id) {
          trackEngagement(user.id, 'receipt_downloaded', {
            agreement_id: agreementId,
          }).catch(() => {})
        }
      } else {
        toast.error(response.error || "Failed to generate receipt")
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to generate receipt")
    } finally {
      setIsDownloadingReceipt(false)
    }
  }

  // Calculate expected total as monthly rent × lease duration in months
  const calculateExpected = () => {
    if (!agreement?.lease_start_date || !agreement?.lease_end_date) return Number(agreement?.expected_payment_amount ?? agreement?.rent_amount ?? 0)
    const leaseStart = new Date(agreement.lease_start_date)
    const leaseEnd = new Date(agreement.lease_end_date)
    const totalMonths = (leaseEnd.getFullYear() - leaseStart.getFullYear()) * 12 + 
      (leaseEnd.getMonth() - leaseStart.getMonth())
    return Number(agreement.rent_amount ?? 0) * totalMonths
  }
  const expected = calculateExpected()
  const received = Number(agreement?.total_received_amount ?? 0)
  const balance = Math.max(expected - received, 0)
  const paymentPct = expected > 0 ? Math.min(100, Math.round((received / expected) * 100)) : 0

  // ─── Payment Schedule Calculation ─────────────────────────────────────────────
  const paymentSchedule = useMemo(() => {
    if (!agreement?.lease_start_date || !agreement?.lease_end_date) return null

    const freqMeta: Record<string, { label: string; monthsPerPeriod: number }> = {
      MONTHLY: { label: "Monthly", monthsPerPeriod: 1 },
      QUARTERLY: { label: "Quarterly", monthsPerPeriod: 3 },
      SEMI_ANNUAL: { label: "Semi-annual", monthsPerPeriod: 6 },
      ANNUAL: { label: "Annual", monthsPerPeriod: 12 },
    }

    const freq = agreement.payment_frequency ?? "ANNUAL"
    const meta = freqMeta[freq] ?? freqMeta.ANNUAL
    const totalRent = calculateExpected()
    
    // Calculate lease duration in months
    const leaseStart = new Date(agreement.lease_start_date)
    const leaseEnd = new Date(agreement.lease_end_date)
    const totalMonths = (leaseEnd.getFullYear() - leaseStart.getFullYear()) * 12 + 
      (leaseEnd.getMonth() - leaseStart.getMonth())
    const numPeriods = Math.ceil(totalMonths / meta.monthsPerPeriod)
    
    // Rent amount is per month, so multiply by months per period
    const perPaymentAmount = Math.round(Number(agreement.rent_amount ?? 0) * meta.monthsPerPeriod)
    
    const today = new Date()
    const totalReceived = Number(agreement.total_received_amount ?? 0)

    const periods = []

    for (let i = 0; i < numPeriods; i++) {
      const periodStart = new Date(leaseStart)
      periodStart.setMonth(leaseStart.getMonth() + i * meta.monthsPerPeriod)
      
      const periodEnd = new Date(periodStart)
      periodEnd.setMonth(periodStart.getMonth() + meta.monthsPerPeriod)
      periodEnd.setDate(periodEnd.getDate() - 1)

      const daysUntilDue = Math.ceil((periodStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const isCurrent = daysUntilDue >= -30 && daysUntilDue <= 30
      const isPast = daysUntilDue < -30
      
      // Simplified: if total received >= amount for this period, mark as paid
      const amountNeededForThisPeriod = perPaymentAmount * (i + 1)
      const isPaid = totalReceived >= amountNeededForThisPeriod

      periods.push({
        index: i + 1,
        startDate: periodStart,
        endDate: periodEnd,
        dueDate: periodStart,
        amount: perPaymentAmount,
        isPaid,
        isCurrent,
        isPast,
        daysUntilDue,
      })
    }

    const paidPeriods = periods.filter(p => p.isPaid).length

    return {
      frequency: meta.label,
      periods,
      perPaymentAmount,
      totalRent,
      numPeriods,
      paidPeriods,
    }
  }, [agreement])

  if (isLoading || !agreement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading payment details…</p>
        </div>
      </div>
    )
  }

  const paymentStatus = (() => {
    if (agreement.reconciliation_status === "FULL_PAYMENT" || (balance === 0 && received >= expected))
      return { label: "Fully Paid", cls: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 }
    if (agreement.reconciliation_status === "UNDERPAYMENT" || (received > 0 && received < expected))
      return { label: "Partially Paid", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock }
    if (agreement.reconciliation_status === "OVERPAYMENT")
      return { label: "Overpaid", cls: "bg-purple-100 text-purple-700 border-purple-200", icon: TrendingUp }
    return { label: "Awaiting Payment", cls: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle }
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Page header ── */}
        <div className="mb-6">
          <Link href="/tenant/payments">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-1">
                Payment Details
              </h1>
              <p className="text-slate-600 text-sm">{agreement.property_title || "Your Property"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}
              className="text-orange-700 border-orange-200 hover:bg-orange-50">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Summary metrics ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-orange-200 bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Due</p>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNGN(expected)}</p>
              <p className="text-xs text-slate-500 mt-1">Full rent amount</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount Paid</p>
                <Wallet className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">{formatNGN(received)}</p>
              <p className="text-xs text-slate-500 mt-1">{paymentPct}% of total</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding</p>
                <Banknote className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatNGN(balance)}</p>
              <p className="text-xs text-slate-500 mt-1">{balance === 0 ? "Nothing left" : "Still to pay"}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/90">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Periods</p>
                <Activity className="w-4 h-4 text-slate-500" />
              </div>
              {paymentSchedule && (
                <p className="text-2xl font-bold text-slate-900">
                  {paymentSchedule.paidPeriods} / {paymentSchedule.numPeriods}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">{paymentSchedule?.frequency} periods paid</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Payment Progress Bar ── */}
        <Card className="border-orange-200 bg-white/90 shadow-sm mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900">Payment Progress</h3>
              <div className="flex items-center gap-4">
                {paymentSchedule && (
                  <span className="text-sm font-bold text-orange-600">
                    {paymentSchedule.paidPeriods}/{paymentSchedule.numPeriods} periods
                  </span>
                )}
                <span className="text-sm font-bold text-orange-600">{paymentPct}%</span>
              </div>
            </div>
            <Progress value={paymentPct} className="h-3 mb-2" />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{formatNGN(received)} paid</span>
              <span>{formatNGN(balance)} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Main grid: history (2/3) + Sidebar (1/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Payment History */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Property & Lease Info */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-600" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Property</p>
                    <h3 className="text-lg font-bold text-slate-900">{agreement.property_title}</h3>
                    <p className="text-sm text-slate-600">
                      {agreement.property_city}{agreement.property_state && `, ${agreement.property_state}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Lease Start</p>
                      <p className="text-sm font-medium text-slate-900">{formatShortDate(agreement.lease_start_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Lease End</p>
                      <p className="text-sm font-medium text-slate-900">{formatShortDate(agreement.lease_end_date)}</p>
                    </div>
                  </div>
                  {agreement.landlord_name && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Landlord</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-orange-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{agreement.landlord_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-orange-600" />
                      Your Payments
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {history.length === 0
                        ? "No payments recorded yet"
                        : `${history.length} payment${history.length !== 1 ? "s" : ""} received · ${formatNGN(history.reduce((s, e) => s + Number(e.amount_received), 0))} total`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {history.length === 0 ? (
                  <div className="py-14 text-center px-6">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700 mb-1">No payments yet</p>
                    <p className="text-xs text-slate-400">
                      Transfer to your NUBAN from any Nigerian bank.
                    </p>
                  </div>
                ) : (() => {
                  const totalPages = Math.ceil(history.length / HISTORY_PAGE_SIZE)
                  const pageItems = history.slice(
                    (historyPage - 1) * HISTORY_PAGE_SIZE,
                    historyPage * HISTORY_PAGE_SIZE,
                  )

                  return (
                    <>
                      <div className="divide-y divide-slate-100">
                        {pageItems.map((entry) => (
                          <div key={entry.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-lg font-bold text-slate-900">{formatNGN(entry.amount_received)}</p>
                                  <p className="text-xs text-slate-500">{formatDate(entry.created_at)}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                {entry.reconciliation_result === "FULL_PAYMENT" && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Full Payment</Badge>
                                )}
                                {entry.reconciliation_result === "UNDERPAYMENT" && (
                                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Partial</Badge>
                                )}
                                {entry.reconciliation_result === "OVERPAYMENT" && (
                                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Overpayment</Badge>
                                )}
                                <Button variant="ghost" size="sm"
                                  onClick={handleDownloadReceipt} disabled={isDownloadingReceipt}
                                  className="h-7 text-xs text-orange-700 hover:bg-orange-50 shrink-0 px-2">
                                  {isDownloadingReceipt
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <><Download className="w-3 h-3 mr-1" />Receipt</>}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pl-13">
                              {entry.sender_name && (
                                <div>
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Sender</p>
                                  <p className="text-xs text-slate-700">{entry.sender_name}</p>
                                </div>
                              )}
                              {entry.sender_bank && (
                                <div>
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bank</p>
                                  <p className="text-xs text-slate-700">{entry.sender_bank}</p>
                                </div>
                              )}
                              {entry.nomba_transaction_id && (
                                <div className="col-span-2">
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Transaction ID</p>
                                  <p className="text-xs text-slate-500 font-mono truncate">{entry.nomba_transaction_id}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white">
                          <p className="text-xs text-slate-500">
                            Page {historyPage} of {totalPages}
                          </p>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm"
                              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                              disabled={historyPage === 1} className="h-7 w-7 p-0 border-slate-200">
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="outline" size="sm"
                              onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                              disabled={historyPage === totalPages} className="h-7 w-7 p-0 border-slate-200">
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

          {/* Sidebar */}
          <div className="space-y-5">
            {agreement.virtual_account_number ? (
              <Card className="border-orange-300 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <CreditCard className="w-5 h-5" />
                    Your NUBAN
                  </CardTitle>
                  <CardDescription>Transfer from any Nigerian bank</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* NUBAN number + copy */}
                  <div className="p-4 rounded-lg bg-orange-50 border-2 border-orange-200 mb-4">
                    <p className="text-xs text-slate-500 mb-1">Account Number</p>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <code className="text-xl font-mono font-bold text-slate-900">
                        {agreement.virtual_account_number}
                      </code>
                      <Button size="sm" onClick={() => handleCopy(agreement.virtual_account_number!)}
                        className="bg-orange-500 hover:bg-orange-600 text-white shrink-0 h-8">
                        <Copy className="w-3.5 h-3.5 mr-1.5" />Copy
                      </Button>
                    </div>
                    {agreement.virtual_account_name && (
                      <p className="text-xs text-slate-500">
                        Name: <span className="font-medium text-slate-700">{agreement.virtual_account_name}</span>
                      </p>
                    )}
                  </div>

                  {/* Check if both parties have signed */}
                  {!agreement.tenant_signed_at || !agreement.landlord_signed_at ? (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900 mb-0.5">
                            Agreement not fully signed
                          </p>
                          <p className="text-xs text-amber-700">
                            Please wait for both parties to sign the agreement before making payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Payment status */}
                  {balance > 0 ? (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900 mb-0.5">
                            {formatNGN(balance)} outstanding
                          </p>
                          <p className="text-xs text-amber-700">
                            Transfer the exact amount — payments are auto-confirmed within seconds.
                          </p>
                        </div>
                      </div>
                      <Separator className="my-3 bg-amber-200" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-700">Expected</span>
                          <span className="font-bold text-amber-900">{formatNGN(expected)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-700">Paid so far</span>
                          <span className="font-bold text-green-700">{formatNGN(received)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-200">
                          <span className="text-amber-700 font-semibold">Still to pay</span>
                          <span className="font-bold text-amber-900">{formatNGN(balance)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-green-900 mb-0.5">
                            Payment complete!
                          </p>
                          <p className="text-xs text-green-700">
                            You've paid {formatNGN(received)}. Your tenancy is active.
                          </p>
                        </div>
                      </div>
                      <Separator className="mb-4" />
                      <Button onClick={handleDownloadReceipt} disabled={isDownloadingReceipt}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                        {isDownloadingReceipt
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                          : <><Download className="w-4 h-4 mr-2" />Download Receipt</>}
                      </Button>
                      {receiptUrl && (
                        <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 text-xs text-orange-600 underline underline-offset-2 hover:text-orange-800 mt-2">
                          <Eye className="w-3 h-3" />Open Receipt
                        </a>
                      )}
                    </>
                  )}

                  {/* Payment Instructions */}
                  <div className="mt-4 pt-4 border-t border-orange-200">
                    <p className="text-xs font-semibold text-slate-700 mb-2">How to pay:</p>
                    <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                      <li>Copy the NUBAN above</li>
                      <li>Open your bank app or visit any branch</li>
                      <li>Transfer the exact amount</li>
                      <li>Payment auto-confirms in seconds</li>
                    </ol>
                  </div>

                  {/* Card payment coming soon */}
                  <div className="mt-4 pt-4 border-t border-orange-200">
                    <p className="text-xs text-slate-400 mb-2">Other payment methods</p>
                    <Button variant="outline" size="sm" className="w-full text-slate-500 border-slate-200" disabled>
                      <CreditCard className="w-4 h-4 mr-2" />Card Payment (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-orange-200 bg-white/90 shadow-sm">
                <CardContent className="pt-12 pb-12 text-center">
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No NUBAN yet</h3>
                  <p className="text-slate-600 mb-6 text-sm">
                    Generate a dedicated account number to pay from any Nigerian bank.
                  </p>
                  {/* Check if both parties have signed */}
                  {!agreement.tenant_signed_at || !agreement.landlord_signed_at ? (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900 mb-0.5">
                            Agreement not fully signed
                          </p>
                          <p className="text-xs text-amber-700">
                            Please wait for both parties to sign the agreement before generating a NUBAN or making payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={async () => {
                      if (!agreementId) return
                      try {
                        await paymentsAPI.provisionNomba(agreementId)
                        toast.success("NUBAN generated successfully")
                        fetchDetail()
                      } catch { toast.error("Failed to generate NUBAN") }
                    }} className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Building2 className="w-4 h-4 mr-2" />Generate NUBAN
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Payment Schedule Timeline ── */}
            {paymentSchedule && (
              <Card className="border-orange-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <CalendarClock className="w-4 h-4 text-orange-600" />
                        Payment Schedule
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        {paymentSchedule.frequency} payments · {formatNGN(paymentSchedule.perPaymentAmount)} per period
                      </CardDescription>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                      {paymentSchedule.frequency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {paymentSchedule.periods.map((period) => (
                      <div
                        key={period.index}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          period.isPaid
                            ? "bg-green-50 border-green-200"
                            : period.isCurrent
                            ? "bg-orange-50 border-orange-300 shadow-sm"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                              period.isPaid
                                ? "bg-green-500"
                                : period.isCurrent
                                ? "bg-orange-500 animate-pulse"
                                : "bg-slate-300"
                            }`}
                          >
                            {period.isPaid ? (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            ) : period.isCurrent ? (
                              <Clock className="h-4 w-4 text-white" />
                            ) : (
                              <span className="text-xs font-bold text-slate-600">{period.index}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${
                              period.isPaid ? "text-green-900" : period.isCurrent ? "text-orange-900" : "text-slate-600"
                            }`}>
                              {formatCompactDate(period.startDate)}
                            </p>
                            <p className="text-[10px] text-slate-500">{formatNGN(period.amount)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {period.isPaid ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                              Paid
                            </Badge>
                          ) : period.daysUntilDue !== null && period.daysUntilDue >= -30 && period.daysUntilDue <= 30 ? (
                            <Badge className={`text-[10px] ${
                              period.daysUntilDue <= 0
                                ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
                                : period.daysUntilDue <= 7
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                            }`}>
                              {period.daysUntilDue <= 0 ? "Overdue" : `${period.daysUntilDue}d left`}
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[10px]">
                              {period.isPast ? "Overdue" : "Upcoming"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-orange-200 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/tenant/payments">
                  <Button variant="outline" size="sm" className="w-full justify-start border-slate-200 text-slate-700 hover:bg-orange-50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    All Payments
                  </Button>
                </Link>
                <Link href="/tenant/agreements">
                  <Button variant="outline" size="sm" className="w-full justify-start border-slate-200 text-slate-700 hover:bg-orange-50">
                    <FileText className="w-4 h-4 mr-2" />
                    View Agreement
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
