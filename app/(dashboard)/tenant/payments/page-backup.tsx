"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Banknote, Calendar, Home, FileText, Eye,
  Loader2, AlertCircle, CheckCircle2, Clock, RefreshCw
} from "lucide-react"
import Link from "next/link"
import { paymentsAPI, type Transaction } from "@/lib/api/payments"
import { toast } from "sonner"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatNGN = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG")}`

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

const getStatusBadge = (status: Transaction["status"]) => {
  switch (status) {
    case "released":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      )
    case "pending":
    case "held":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Clock className="w-3 h-3 mr-1" />
          Processing
        </Badge>
      )
    case "initiated":
      // BUG-028 fix: distinguish "initiated but never completed" from the
      // generic pending/held processing state so the user knows they can
      // resume the payment.
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Awaiting Payment
        </Badge>
      )
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      )
    case "refunded":
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          <RefreshCw className="w-3 h-3 mr-1" />
          Refunded
        </Badge>
      )
    default:
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          Unknown
        </Badge>
      )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TransactionCard Component (Rule 22)
// ─────────────────────────────────────────────────────────────────────────────

interface TransactionCardProps {
  transaction: Transaction
  onViewDetails: (id: string) => void
  onResumePayment: (id: string) => Promise<void>
  resumingId: string | null
}

function TransactionCard({
  transaction,
  onViewDetails,
  onResumePayment,
  resumingId,
}: TransactionCardProps) {
  const router = useRouter()
  const isResumable =
    transaction.status === "initiated" || transaction.status === "failed"
  const isResuming = resumingId === transaction.id

  // BUG-028 fix: surface a clear, action-oriented CTA on any transaction
  // that never reached a terminal "released" state. This prevents the
  // tenant from being stuck on a "Processing" badge with no way to retry.
  const handleResume = async () => {
    if (isResuming) return
    if (transaction.status === "failed") {
      // For failed transactions, fall back to the existing "New Payment"
      // path so the user can pick a fresh agreement / retry from scratch.
      router.push("/tenant/payments/new")
      return
    }
    await onResumePayment(transaction.id)
  }

  return (
    <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(transaction.status)}
              <span className="text-xs text-slate-500">
                {formatDate(transaction.created_at)}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">
              {transaction.property?.title || "Property Payment"}
            </h3>
            {transaction.property?.city && (
              <p className="text-sm text-slate-600 mb-2">
                {transaction.property.city}
                {transaction.property.state && `, ${transaction.property.state}`}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-slate-900">
              {formatNGN(transaction.amount)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {transaction.transaction_type.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-3 h-3" />
            <span className="font-mono">{transaction.paystack_ref}</span>
          </div>
          <div className="flex items-center gap-2">
            {isResumable && (
              <Button
                variant="default"
                size="sm"
                onClick={handleResume}
                disabled={isResuming}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isResuming ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Resuming…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {transaction.status === "failed"
                      ? "Retry Payment"
                      : "Continue Payment"}
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(transaction.id)}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
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

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [resumingId, setResumingId] = useState<string | null>(null)

  // ── Fetch payments ─────────────────────────────────────────────────────────

  const fetchPayments = useCallback(async () => {
    try {
      const response = await paymentsAPI.getMyPayments()
      
      if (response.success && response.payments) {
        setTransactions(response.payments)
        setIsLoading(false)
      } else {
        toast.error(response.error ?? "Failed to load payment history")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("[TenantPayments] fetch error:", error)
      toast.error("Failed to load payment history")
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    fetchPayments()
  }, [user, fetchPayments, router])

  // ── Refresh payments ───────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchPayments()
    setIsRefreshing(false)
  }

  // ── View transaction details ───────────────────────────────────────────────

  const handleViewDetails = (transactionId: string) => {
    router.push(`/tenant/payments/${transactionId}`)
  }

  // ── BUG-028 fix: resume a previously-initiated payment ─────────────────────

  const handleResumePayment = async (transactionId: string) => {
    try {
      setResumingId(transactionId)
      const response = await paymentsAPI.resume(transactionId)

      const authUrl = (response as any).authorization_url || (response as any).payment_url

      if (!response.success || !authUrl) {
        toast.error((response as any).error ?? "Could not resume payment")
        return
      }

      toast.success("Payment resumed — opening Paystack…")

      // Update local row so the badge reflects the new state immediately
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                status: "initiated",
                paystack_ref:
                  (response as any).reference || t.paystack_ref,
              }
            : t,
        ),
      )

      // Redirect to Paystack inline (same pattern as the initiate flow)
      window.location.href = authUrl
    } catch (error: any) {
      console.error("[TenantPayments] resume error:", error)
      toast.error(
        error?.response?.data?.detail ||
          error?.message ||
          "Could not resume payment. Please try again.",
      )
    } finally {
      setResumingId(null)
    }
  }

  // ── Calculate stats ─────────────────────────────────────────────────────────

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === "released").length,
    processing: transactions.filter(t => t.status === "pending" || t.status === "held").length,
    failed: transactions.filter(t => t.status === "failed").length,
    awaitingPayment: transactions.filter(t => t.status === "initiated").length,
    totalAmount: transactions
      .filter(t => t.status === "released")
      .reduce((sum, t) => sum + t.amount, 0)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Payment History</h3>
            <p className="text-slate-600">Fetching your payment records...</p>
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              Payment History
            </h1>
            <div className="flex items-center gap-3">
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
              <Link href="/tenant">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-slate-600">
            Track all your rental payments and view transaction details
          </p>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Payments</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processing</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{stats.processing}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Paid</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{formatNGN(stats.totalAmount)}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Transactions List ── */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <FileText className="h-5 w-5 text-orange-500" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Banknote className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Payment History</h3>
                <p className="text-slate-500 mb-6">
                  You haven't made any rental payments yet. Once you complete a payment, it will appear here.
                </p>
                <Link href="/tenant/agreements">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <FileText className="mr-2 h-4 w-4" />
                    View Agreements
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onViewDetails={handleViewDetails}
                    onResumePayment={handleResumePayment}
                    resumingId={resumingId}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
