"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Loader2, Home, FileText, Banknote, Eye
} from "lucide-react"
import Link from "next/link"
import { paymentsAPI, type Transaction } from "@/lib/api/payments"
import { toast } from "sonner"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PaymentStatus = "processing" | "success" | "failed" | "timeout"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatNGN = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG")}`

const getStatusConfig = (status: Transaction["status"]): {
  label: string
  color: string
  bgColor: string
  icon: React.ReactNode
  description: string
} => {
  switch (status) {
    case "released":
      return {
        label: "Payment Successful",
        color: "text-green-700",
        bgColor: "bg-green-100",
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        description: "Your payment has been confirmed and your tenancy is now active."
      }
    case "pending":
    case "held":
      return {
        label: "Processing Payment",
        color: "text-amber-700",
        bgColor: "bg-amber-100",
        icon: <Clock className="h-5 w-5 text-amber-600" />,
        description: "Your payment is being processed. This usually takes a few moments."
      }
    case "failed":
      return {
        label: "Payment Failed",
        color: "text-red-700",
        bgColor: "bg-red-100",
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        description: "Your payment could not be processed. Please try again or contact support."
      }
    default:
      return {
        label: "Unknown Status",
        color: "text-slate-700",
        bgColor: "bg-slate-100",
        icon: <AlertCircle className="h-5 w-5 text-slate-600" />,
        description: "Unable to determine payment status. Please contact support."
      }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function TenantPaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const reference = searchParams.get("reference")

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("processing")

  // ── Poll payment status ─────────────────────────────────────────────────────

  const pollPaymentStatus = useCallback(async () => {
    if (!reference) return

    try {
      const response = await paymentsAPI.getStatusByReference(reference)
      
      if (response.success && response.payment) {
        setTransaction(response.payment)
        
        // Determine final status
        switch (response.payment.status) {
          case "released":
            setPaymentStatus("success")
            toast.success("Payment confirmed! Your tenancy is now active.")
            return true // Stop polling
          case "failed":
            setPaymentStatus("failed")
            return true // Stop polling
          case "pending":
          case "held":
            if (pollCount >= 10) { // Max 10 attempts (~30 seconds)
              setPaymentStatus("timeout")
              return true // Stop polling
            }
            return false // Continue polling
          default:
            setPaymentStatus("failed")
            return true // Stop polling
        }
      } else {
        toast.error(response.error ?? "Failed to check payment status")
        setPaymentStatus("failed")
        return true // Stop polling on error
      }
    } catch (error) {
      console.error("[PaymentCallback] poll error:", error)
      if (pollCount >= 10) {
        setPaymentStatus("timeout")
        return true // Stop polling after max attempts
      }
      return false // Continue polling
    }
  }, [reference, pollCount])

  // ── Initial fetch and polling ─────────────────────────────────────────────

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    if (!reference) {
      toast.error("No payment reference found")
      router.push("/tenant/payments")
      return
    }

    const startPolling = async () => {
      setIsLoading(true)
      const shouldStop = await pollPaymentStatus()
      setIsLoading(false)

      if (!shouldStop) {
        // Continue polling every 3 seconds
        const interval = setInterval(async () => {
          const newCount = pollCount + 1
          setPollCount(newCount)
          const stopPolling = await pollPaymentStatus()
          if (stopPolling) {
            clearInterval(interval)
          }
        }, 3000)

        // Cleanup interval on unmount
        return () => clearInterval(interval)
      }
    }

    startPolling()
  }, [user, reference, router, pollPaymentStatus, pollCount])

  // ── Retry payment ─────────────────────────────────────────────────────────

  const handleRetryPayment = () => {
    // Navigate back to the payment page with the same agreement
    if (transaction?.application_id) {
      router.push(`/tenant/payments/new?agreement_id=${transaction.application_id}`)
    } else {
      router.push("/tenant/payments")
    }
  }

  // ── View payment details ───────────────────────────────────────────────────

  const handleViewDetails = () => {
    if (transaction?.id) {
      router.push(`/tenant/payments/${transaction.id}`)
    }
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
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Processing Payment</h3>
            <p className="text-slate-600">Please wait while we confirm your payment...</p>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  const statusConfig = transaction ? getStatusConfig(transaction.status) : null

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
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
              Payment Status
            </h1>
            <p className="text-slate-600">
              Reference: {reference}
            </p>
          </div>
        </div>

        {/* ── Status Card ── */}
        {statusConfig && (
          <Card className={`border-2 ${statusConfig.bgColor} bg-white/80 backdrop-blur-sm mb-8 shadow-sm hover:shadow-lg transition-all duration-300`}>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-white shadow-sm">
                  {statusConfig.icon}
                </div>
                <h2 className={`text-2xl font-bold mb-3 ${statusConfig.color}`}>
                  {statusConfig.label}
                </h2>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  {statusConfig.description}
                </p>

                {/* Payment amount if successful */}
                {transaction && (transaction.status === "released" || transaction.status === "pending") && (
                  <div className="mb-6">
                    <p className="text-sm text-slate-500 mb-1">Amount Paid</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {formatNGN(transaction.amount)}
                    </p>
                  </div>
                )}

                {/* Action buttons based on status */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {paymentStatus === "success" && (
                    <>
                      <Button
                        onClick={handleViewDetails}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Receipt
                      </Button>
                      <Link href="/tenant">
                        <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                          <Home className="mr-2 h-4 w-4" />
                          Go to Dashboard
                        </Button>
                      </Link>
                    </>
                  )}

                  {paymentStatus === "failed" && (
                    <>
                      <Button
                        onClick={handleRetryPayment}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                      <Link href="/tenant/payments">
                        <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                          <Banknote className="mr-2 h-4 w-4" />
                          View Payment History
                        </Button>
                      </Link>
                    </>
                  )}

                  {paymentStatus === "timeout" && (
                    <>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Check Again
                      </Button>
                      <Link href="/tenant/payments">
                        <Button variant="ghost" className="text-slate-600 hover:bg-slate-50">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Payments
                        </Button>
                      </Link>
                    </>
                  )}

                  {(paymentStatus === "processing" || isRetrying) && (
                    <Button disabled className="bg-slate-200 text-slate-400">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Status...
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Transaction Details (if available) ── */}
        {transaction && (
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <FileText className="h-5 w-5 text-orange-500" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm text-slate-900">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Payment Gateway</p>
                  <p className="text-sm text-slate-900">{transaction.payment_gateway}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Reference</p>
                  <p className="font-mono text-sm text-slate-900">{transaction.paystack_ref}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Date</p>
                  <p className="text-sm text-slate-900">
                    {new Date(transaction.created_at).toLocaleDateString("en-NG", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
