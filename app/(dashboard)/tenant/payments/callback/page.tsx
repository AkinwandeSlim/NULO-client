"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Loader2, Home, FileText, Banknote, Eye
} from "lucide-react"
import Link from "next/link"
import { paymentsAPI, type Transaction } from "@/lib/api/payments"
import { toast } from "sonner"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_POLLS = 10

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
  borderColor: string
  icon: React.ReactNode
  description: string
} => {
  switch (status) {
    case "released":
      return {
        label: "Payment Successful",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        description: "Your payment has been confirmed and your tenancy is now active.",
      }
    case "pending":
    case "held":
      return {
        label: "Processing Payment",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: <Clock className="h-5 w-5 text-amber-600" />,
        description: "Your payment is being processed. This usually takes a few moments.",
      }
    case "failed":
      return {
        label: "Payment Failed",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        description: "Your payment could not be processed. Please try again or contact support.",
      }
    default:
      return {
        label: "Unknown Status",
        color: "text-slate-700",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        icon: <AlertCircle className="h-5 w-5 text-slate-600" />,
        description: "Unable to determine payment status. Please contact support.",
      }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function TenantPaymentCallbackPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user }     = useAuth()
  const reference    = searchParams?.get("reference")

  const [transaction,   setTransaction]   = useState<Transaction | null>(null)
  const [isLoading,     setIsLoading]     = useState(true)
  const [isRetrying,    setIsRetrying]    = useState(false)
  const [timedOut,      setTimedOut]      = useState(false)
  // Fix 6: derive display state from transaction.status — single source of truth.
  // Exception: "timeout" is a local UI concept (we gave up polling) that has no
  // corresponding backend status, so it lives in a separate boolean flag.
  const paymentStatus = useMemo((): PaymentStatus => {
    if (timedOut) return "timeout"
    if (!transaction) return "processing"
    switch (transaction.status) {
      case "released":  return "success"
      case "failed":    return "failed"
      case "pending":
      case "held":      return "processing"
      default:          return "processing"
    }
  }, [transaction, timedOut])

  // ─── Refs so the polling loop never goes stale, and never double-starts ────
  const isMounted      = useRef(true)
  const hasStarted     = useRef(false)        // guards against React StrictMode double-mount
  const pollCountRef   = useRef(0)            // mutable counter — NOT state (no re-renders)
  const timeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Single poll attempt ──────────────────────────────────────────────────

  const doPoll = useCallback(async (): Promise<boolean /* shouldStop */> => {
    if (!reference || !isMounted.current) return true

    try {
      const response = await paymentsAPI.getStatusByReference(reference)

      if (!isMounted.current) return true

      if (response.success && response.payment) {
        setTransaction(response.payment)
        console.log(`[CALLBACK] Poll ${pollCountRef.current}: status=${response.payment.status}`)

        const stopPolling = () => {
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
        }

        switch (response.payment.status) {
          case "released":
            console.log("✅ [CALLBACK] Payment confirmed!")
            setIsLoading(false)
            toast.success("Payment confirmed! Your tenancy is now active.")
            stopPolling()
            return true

          case "failed":
            console.log("❌ [CALLBACK] Payment failed")
            setIsLoading(false)
            stopPolling()
            return true

          case "pending":
          case "held":
            // Show the processing UI as soon as we have the first real response
            // so the user isn't staring at a blank page if the spinner goes away.
            setIsLoading(false)
            if (pollCountRef.current >= MAX_POLLS) {
              console.log(`⏱️ [CALLBACK] Timeout after ${MAX_POLLS} polls`)
              setTimedOut(true)
              stopPolling()
              return true
            }
            return false // keep polling

          default:
            // Unknown status from backend — treat as transient, keep polling
            console.log("❓ [CALLBACK] Unknown status:", response.payment.status)
            if (pollCountRef.current >= MAX_POLLS) {
              setTimedOut(true)
              setIsLoading(false)
              stopPolling()
              return true
            }
            return false
        }
      } else {
        // Fix 3: response.success===false is a server-side hiccup (not proof the
        // payment failed). Keep polling until MAX_POLLS before giving up.
        console.warn("[CALLBACK] Poll returned success=false:", response)
        if (pollCountRef.current >= MAX_POLLS) {
          setTimedOut(true)
          setIsLoading(false)
          return true
        }
        return false // retry
      }
    } catch (error: any) {
      // Fix 2: a network error on the very first poll must NOT leave a blank page.
      // We only flip isLoading=false here if we already have a transaction to show,
      // or if we've hit the max and are about to show "timeout".
      console.error("[CALLBACK] Poll error:", error)
      if (!isMounted.current) return true

      const is404 = error?.response?.status === 404 || error?.status === 404
      // 404 on the first couple of polls is expected — the transaction row may not
      // be visible yet due to DB propagation latency. Keep polling silently.
      if (is404 && pollCountRef.current < 3) return false

      if (pollCountRef.current >= MAX_POLLS) {
        console.log("⏱️ [CALLBACK] Timeout — network errors exhausted retries")
        setTimedOut(true)
        setIsLoading(false)
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
        return true
      }
      return false // network hiccup — try again
    }
  }, [reference])

  // ─── Recursive polling chain (setTimeout, NOT setInterval) ───────────────
  // Using setTimeout means only ONE request is ever in-flight at a time.
  // setInterval can stack up requests if the server is slow.

  const scheduleNextPoll = useCallback(() => {
    if (!isMounted.current) return

    timeoutRef.current = setTimeout(async () => {
      pollCountRef.current += 1
      const shouldStop = await doPoll()
      if (!shouldStop && isMounted.current) {
        scheduleNextPoll()
      }
    }, 3000)
  }, [doPoll])

  // ─── Start polling once on mount ─────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true

    if (!user) { router.push("/signin"); return }
    if (!reference) {
      toast.error("No payment reference found")
      router.push("/tenant/payments")
      return
    }

    // StrictMode in dev mounts twice — this guard stops two parallel chains
    if (hasStarted.current) return
    hasStarted.current = true

    const run = async () => {
      timeoutRef.current = setTimeout(async () => {
        // Fix 5: increment BEFORE the first doPoll call — same as scheduleNextPoll does —
        // so the timeout check in doPoll sees a consistent count from poll 1 onwards.
        pollCountRef.current += 1
        const shouldStop = await doPoll()
        if (!shouldStop && isMounted.current) {
          scheduleNextPoll()
        }
      }, 1500)
    }

    run()

    return () => {
      isMounted.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — we only want this to run once on mount

  // ─── Manual "Check Again" ─────────────────────────────────────────────────

  const handleManualRefresh = async () => {
    if (!reference || isRetrying) return
    setIsRetrying(true)
    try {
      console.log("[CALLBACK] Manual refresh clicked")
      const response = await paymentsAPI.getStatusByReference(reference)
      if (response.success && response.payment) {
        console.log("[CALLBACK] Refresh response status:", response.payment.status)
        setTransaction(response.payment)
        setIsLoading(false) // Clear loading state after fetching status
        if (response.payment.status === "released") {
          // derived from transaction.status
          toast.success("Payment confirmed!")
          // Clear any pending polling timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        } else if (response.payment.status === "failed") {
          // derived from transaction.status
        } else {
          toast.info("Payment is still processing. Please wait a moment.")
        }
      }
    } catch (error) {
      console.error("[CALLBACK] Refresh error:", error)
      toast.error("Could not check status. Please try again.")
      setIsLoading(false) // Clear loading even on error
    } finally {
      setIsRetrying(false)
    }
  }

  // ─── Retry payment (navigate back to /new) ────────────────────────────────

  const handleRetryPayment = () => {
    // Navigate to agreements so the tenant selects the right agreement to retry from.
    // We cannot use transaction.application_id here — that is the APPLICATION id,
    // not the AGREEMENT id — the two are different records and passing the wrong one
    // to /payments/new would cause a 404 on the backend.
    router.push("/tenant/agreements")
  }

  const handleViewDetails = () => {
    if (transaction?.id) router.push(`/tenant/payments/${transaction.id}`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Confirming Payment</h3>
            <p className="text-slate-500 text-sm">Please wait while we check with Paystack…</p>

            {/* DEV ONLY — manual trigger for local testing (no ngrok needed) */}
            {process.env.NODE_ENV === "development" && reference && (
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl max-w-sm mx-auto text-left">
                <p className="text-xs font-semibold text-yellow-800 mb-1">Dev mode</p>
                <p className="text-xs text-yellow-700 mb-3">
                  Paystack webhooks can't reach localhost. Use this button to simulate a successful webhook.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 w-full"
                  onClick={async () => {
                    try {
                      const response = await paymentsAPI.confirmWebhookManually(reference)
                      if (response.success) {
                        toast.success("Dev: payment confirmed!")
                        handleManualRefresh()
                      } else {
                        toast.error("Dev confirm failed: " + (response.detail ?? response.message ?? "unknown error"))
                      }
                    } catch (error) {
                      console.error("Dev confirm error:", error)
                      toast.error("Dev confirm request failed")
                    }
                  }}
                >
                  Simulate Paystack Webhook (Dev)
                </Button>
              </div>
            )}
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
            <h1
              className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Payment Status
            </h1>
            {reference && (
              <p className="text-slate-500 font-mono text-sm">
                Ref: {reference}
              </p>
            )}
          </div>
        </div>

        {/* ── Status Card ── */}
        {statusConfig && (
          <Card className={`border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} bg-white/80 backdrop-blur-sm mb-8 shadow-sm hover:shadow-lg transition-all duration-300`}>
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

                {transaction && (transaction.status === "released" || transaction.status === "pending") && (
                  <div className="mb-6">
                    <p className="text-sm text-slate-500 mb-1">Amount</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {formatNGN(transaction.amount)}
                    </p>
                  </div>
                )}

                {/* ── CTA buttons per status ── */}
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
                        onClick={handleManualRefresh}
                        disabled={isRetrying}
                        variant="outline"
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        {isRetrying
                          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          : <RefreshCw className="mr-2 h-4 w-4" />
                        }
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

                  {paymentStatus === "processing" && (
                    <>
                      <Button disabled className="bg-slate-100 text-slate-400 cursor-not-allowed">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking Status…
                      </Button>
                      {/* Fix 4: dev simulate button is also here in the main render so it
                          doesn't vanish after the first poll clears isLoading */}
                      {process.env.NODE_ENV === "development" && reference && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                          onClick={async () => {
                            try {
                              const response = await paymentsAPI.confirmWebhookManually(reference)
                              if (response.success) {
                                toast.success("Dev: payment confirmed!")
                                handleManualRefresh()
                              } else {
                                toast.error("Dev confirm failed: " + (response.detail ?? response.message ?? "unknown error"))
                              }
                            } catch (error) {
                              console.error("Dev confirm error:", error)
                              toast.error("Dev confirm request failed")
                            }
                          }}
                        >
                          Simulate Paystack Webhook (Dev)
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Transaction Details ── */}
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
                  <p className="font-mono text-sm text-slate-900 break-all">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Payment Gateway</p>
                  <p className="text-sm text-slate-900">{transaction.payment_gateway}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Reference</p>
                  <p className="font-mono text-sm text-slate-900 break-all">{transaction.paystack_ref}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Date</p>
                  <p className="text-sm text-slate-900">
                    {new Date(transaction.created_at).toLocaleDateString("en-NG", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
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