"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Banknote, Calendar, Home, FileText, Download,
  Loader2, AlertCircle, CheckCircle2, Clock, RefreshCw,
  MapPin, User, Mail, Phone
} from "lucide-react"
import Link from "next/link"
import { paymentsAPI, type Transaction } from "@/lib/api/payments"
import { toast } from "sonner"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed="

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

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
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
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function TenantPaymentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const transactionId = (params?.id as string) || ""

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ── Fetch transaction ─────────────────────────────────────────────────────

  const fetchTransaction = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await paymentsAPI.getById(transactionId)
      
      setTransaction(response)
    } catch (error) {
      console.error("[PaymentDetail] fetch error:", error)
      toast.error("Failed to load payment details")
      router.push("/tenant/payments")
    } finally {
      setIsLoading(false)
    }
  }, [transactionId, router])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    if (transactionId) fetchTransaction()
  }, [user, transactionId, fetchTransaction])

  // ── Download receipt ───────────────────────────────────────────────────────

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download functionality
    toast.info("Receipt download will be available soon")
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Payment Details</h3>
            <p className="text-slate-600">Fetching transaction information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertCircle className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Transaction Not Found</h3>
          <p className="text-slate-500 mb-6">This transaction may have been removed or you don't have access.</p>
          <Link href="/tenant/payments">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payments
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
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <Link href="/tenant/payments">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                Payment Receipt
              </h1>
              <p className="text-slate-600">
                Transaction ID: <span className="font-mono">{transaction.id}</span>
              </p>
            </div>
            {getStatusBadge(transaction.status)}
          </div>
        </div>

        {/* ── Property Card ── */}
        {transaction.property && (
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm mb-8 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="relative h-48">
              <img
                src={transaction.property.images?.[0] ?? DEFAULT_PROPERTY_IMAGE}
                alt={transaction.property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-xl font-bold mb-1">
                  {transaction.property.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {transaction.property.city}
                    {transaction.property.state && `, ${transaction.property.state}`}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── Payment Summary ── */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm mb-8 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Banknote className="h-5 w-5 text-orange-500" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Amount Paid</span>
                <span className="text-2xl font-bold text-slate-900">{formatNGN(transaction.amount)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Payment Type</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {transaction.transaction_type.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Payment Method</span>
                <span className="font-semibold text-slate-900">{transaction.payment_gateway}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Reference</span>
                <span className="font-mono text-sm text-slate-900">{transaction.paystack_ref}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-600">Payment Date</span>
                <span className="font-semibold text-slate-900">{formatDateTime(transaction.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Transaction Timeline ── */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm mb-8 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Calendar className="h-5 w-5 text-orange-500" />
              Transaction Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Payment Initiated</p>
                  <p className="text-sm text-slate-600">{formatDateTime(transaction.created_at)}</p>
                </div>
              </div>
              
              {transaction.held_at && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Payment Held</p>
                    <p className="text-sm text-slate-600">{formatDateTime(transaction.held_at)}</p>
                  </div>
                </div>
              )}
              
              {transaction.released_at && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Payment Released</p>
                    <p className="text-sm text-slate-600">{formatDateTime(transaction.released_at)}</p>
                  </div>
                </div>
              )}
              
              {transaction.refunded_at && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-slate-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Payment Refunded</p>
                    <p className="text-sm text-slate-600">{formatDateTime(transaction.refunded_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {transaction.status === "released" && (
                <Button
                  onClick={handleDownloadReceipt}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
              )}
              <Link href="/tenant/payments">
                <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Payment History
                </Button>
              </Link>
              <Link href="/tenant">
                <Button variant="ghost" className="text-slate-600 hover:bg-slate-50">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
