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
// SIMPLIFIED LIVE CALLBACK - Works like dev version with auto-confirm fallback
// ─────────────────────────────────────────────────────────────────────────────

type PaymentState = "checking" | "success" | "failed" | "needs_manual_confirm"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatNGN = (amount: number) => {
  return `₦${Number(amount).toLocaleString("en-NG")}`
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page - SIMPLIFIED: Check status once, then show confirm button or result
// ─────────────────────────────────────────────────────────────────────────────

export default function TenantPaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const reference = searchParams?.get("reference")

  const [state, setState] = useState<PaymentState>("checking")
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // ── Check payment status on mount ──────────────────────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        router.push("/signin")
        return
      }

      if (!reference) {
        toast.error("No payment reference found")
        router.push("/tenant/payments")
        return
      }

      try {
        console.log(`[CALLBACK] Checking status for ref: ${reference}`)
        const response = await paymentsAPI.getStatusByReference(reference)

        if (response.success && response.payment) {
          console.log(`[CALLBACK] Current status: ${response.payment.status}`)
          setTransaction(response.payment)

          // If already released, show success
          if (response.payment.status === "released") {
            setState("success")
            toast.success("Payment confirmed! Your tenancy is now active.")
            setTimeout(() => router.push("/tenant"), 2000)
            return
          }

          // If failed, show error
          if (response.payment.status === "failed") {
            setState("failed")
            toast.error("Payment failed. Please try again.")
            return
          }

          // If pending, show manual confirm button (like dev version)
          if (response.payment.status === "pending" || response.payment.status === "held") {
            setState("needs_manual_confirm")
            return
          }
        } else {
          console.error("[CALLBACK] Status check failed:", response)
          setState("needs_manual_confirm")
        }
      } catch (error) {
        console.error("[CALLBACK] Error checking status:", error)
        setState("needs_manual_confirm")
      }
    }

    checkStatus()
  }, [reference, user, router])

  // ── Manual confirm (like dev version button) ──────────────────────────────
  const handleConfirmPayment = async () => {
    if (!reference) return

    try {
      setIsConfirming(true)
      console.log("[CALLBACK] Confirming payment manually:", reference)

      const response = await paymentsAPI.confirmPaymentImmediately(reference)

      if (response.success) {
        console.log("[CALLBACK] ✅ Payment confirmed!")
        setTransaction(response.payment || transaction)
        setState("success")
        toast.success("Payment confirmed! Your tenancy is now active.")
        setTimeout(() => router.push("/tenant"), 2000)
      } else {
        console.error("[CALLBACK] Confirm failed:", response)
        toast.error(response.error || "Failed to confirm payment")
      }
    } catch (error: any) {
      console.error("[CALLBACK] Confirm error:", error)
      toast.error(error?.message || "Failed to confirm payment")
    } finally {
      setIsConfirming(false)
    }
  }

  // ─── Render: Checking status ───────────────────────────────────────────────
  if (state === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-orange-200 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
            </div>
            <CardTitle className="text-xl text-slate-900">Checking Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-600">
            <p>Please wait while we verify your payment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render: Success ───────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Payment Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-center text-green-700 font-medium">
                Your payment has been successfully confirmed.
              </p>
              <p className="text-center text-sm text-green-600 mt-2">
                Your tenancy is now active!
              </p>
            </div>

            {transaction && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-semibold">{formatNGN(transaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date:</span>
                  <span className="font-semibold">{formatDate(transaction.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Reference:</span>
                  <span className="font-mono text-xs">{transaction.paystack_ref}</span>
                </div>
              </div>
            )}

            <Link href="/tenant" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>

            <p className="text-xs text-slate-500 text-center">
              Redirecting in 2 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render: Failed ────────────────────────────────────────────────────────
  if (state === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-center text-red-700 font-medium text-sm">
                Your payment could not be processed.
              </p>
            </div>

            {transaction && (
              <div className="bg-slate-50 p-4 rounded-lg text-sm">
                <p className="text-slate-600">Reference:</p>
                <p className="font-mono text-xs text-slate-900">{transaction.paystack_ref}</p>
              </div>
            )}

            <div className="space-y-3">
              <Link href="/tenant/payments/new">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  <Banknote className="mr-2 h-4 w-4" />
                  Try Another Payment
                </Button>
              </Link>

              <Link href="/tenant">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <p className="text-xs text-slate-500 text-center border-t pt-4">
              Contact support if this persists
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render: Needs manual confirm (like dev version) ───────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-amber-200 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-12 w-12 text-amber-600 animate-spin" />
          </div>
          <CardTitle className="text-xl text-slate-900">Confirming Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-center text-amber-700 font-medium text-sm">
              Your payment is being processed. Click the button below to confirm it.
            </p>
          </div>

          {transaction && (
            <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Amount:</span>
                <span className="font-semibold">{formatNGN(transaction.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className="font-semibold capitalize">{transaction.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Reference:</span>
                <span className="font-mono text-xs">{transaction.paystack_ref}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleConfirmPayment}
            disabled={isConfirming}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Payment
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/tenant/payments")}
            className="w-full"
          >
            <Banknote className="mr-2 h-4 w-4" />
            View All Payments
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Payment will be confirmed automatically if webhook processes it
          </p>
        </CardContent>
      </Card>
    </div>
  )
}