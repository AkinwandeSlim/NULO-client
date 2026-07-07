"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Banknote, Calendar, Home, Shield,
  Loader2, AlertCircle, FileText, CheckCircle2, Eye
} from "lucide-react"
import Link from "next/link"
import { paymentsAPI, type Transaction } from "@/lib/api/payments"
import { agreementsAPI, type AgreementWithDetails } from "@/lib/api/agreements"
import { toast } from "sonner"
import { formatNGN, calculateAgreementBreakdown } from "@/lib/utils/rentalCalculations"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function TenantPaymentNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const agreementId = searchParams?.get("agreement_id")

  // Track WHY we failed so we can show a useful error screen instead of an
  // infinite spinner. Possible values: 'missing_id' | 'unauthorized' |
  // 'not_signed' | 'not_found' | 'fetch_error'
  const [loadError, setLoadError] = useState<
    | { kind: 'missing_id' }
    | { kind: 'unauthorized' }
    | { kind: 'not_signed'; status: string }
    | { kind: 'not_found' }
    | { kind: 'fetch_error'; message: string }
    | null
  >(null)

  const [agreement, setAgreement] = useState<AgreementWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitiating, setIsInitiating] = useState(false)
  const [existingPayments, setExistingPayments] = useState<Transaction[]>([])
  const [checkingPayments, setCheckingPayments] = useState(false)

  // ── Check for existing payments ─────────────────────────────────────────────
  
  const checkExistingPayments = useCallback(async () => {
    if (!agreementId || !user?.id) return
    
    try {
      setCheckingPayments(true)
      const response = await paymentsAPI.getMyPayments()
      
      if (response.success && response.payments) {
        // Filter payments for this specific agreement
        const agreementPayments = response.payments.filter((payment: Transaction) => 
          payment.agreement_id === agreementId
        )
        setExistingPayments(agreementPayments)
      }
    } catch (error) {
      console.error("[PaymentNew] check payments error:", error)
      // Don't show error for this check, just log it
    } finally {
      setCheckingPayments(false)
    }
  }, [agreementId, user?.id])

  // ── Fetch agreement ────────────────────────────────────────────────────────

  const fetchAgreement = useCallback(async () => {
    if (!agreementId) {
      // PAY-11 fix: this used to be a silent early-return leaving the page
      // stuck on the loading spinner forever when the URL was missing the
      // `agreement_id` param. Now we set both `isLoading=false` AND a
      // structured error so the user sees a real screen.
      console.warn("[PaymentNew] No agreement_id in URL — cannot load")
      setLoadError({ kind: 'missing_id' })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setLoadError(null)
      const response = await agreementsAPI.getById(agreementId)

      if (response.success && response.agreement) {
        // Verify agreement is signed/active and belongs to current user
        if (!response.agreement.tenant_id) {
          console.warn("[PaymentNew] Agreement missing tenant_id field", response.agreement);
        }
        if (response.agreement.tenant_id !== user?.id) {
          console.warn("[PaymentNew] tenant_id mismatch:", {
            agreementTenantId: response.agreement.tenant_id,
            userId: user?.id,
          });
          // PAY-11 fix: show inline error screen instead of a toast + redirect
          // (toast + redirect previously left the page spinning if the user
          // clicked back, or could lose context on slow navigations).
          setLoadError({ kind: 'unauthorized' })
          setIsLoading(false)
          return
        }

        const effectiveStatus = response.agreement.tenant_signed_at && response.agreement.landlord_signed_at
          ? "SIGNED"
          : response.agreement.status

        if (effectiveStatus !== "SIGNED" && effectiveStatus !== "ACTIVE") {
          // PAY-11 fix: show inline "not signed" screen with a clear CTA back
          // to the agreement page so the user can fix it (sign agreement)
          // instead of staring at an infinite spinner.
          console.warn("[PaymentNew] Agreement not signed:", { status: response.agreement.status })
          setLoadError({ kind: 'not_signed', status: effectiveStatus })
          setIsLoading(false)
          return
        }

        setAgreement(response.agreement)
        setLoadError(null)
      } else {
        // Backend returned a structured error
        const errMsg = response.error ?? "Failed to load agreement"
        setLoadError({ kind: 'fetch_error', message: errMsg })
      }
    } catch (error: any) {
      // PAY-11 fix: catch network/parse errors and surface them to the user
      // instead of silently swallowing and leaving the spinner up.
      console.error("[PaymentNew] fetch error:", error)
      const msg = error?.response?.data?.detail || error?.message || "Failed to load agreement"
      setLoadError({ kind: 'fetch_error', message: msg })
    } finally {
      // PAY-11 fix: ALWAYS clear the loading state, no matter which path we
      // took above. Previously this was missing on early-return paths.
      setIsLoading(false)
    }
  }, [agreementId, user?.id, router])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    // PAY-11 fix: ALWAYS call fetchAgreement, even when agreementId is null,
    // so it can set the `missing_id` error state and clear the spinner.
    // Previously the useEffect skipped fetchAgreement when agreementId was
    // missing, leaving the loading spinner stuck on forever.
    fetchAgreement()
    if (agreementId) {
      checkExistingPayments()
    }
  }, [user, agreementId, fetchAgreement, checkExistingPayments])

  // ── Calculate payment breakdown ─────────────────────────────────────────────

  const breakdown = calculateAgreementBreakdown(agreement || {}) ?? {}
  const monthlyRent = breakdown.monthlyRent ?? 0
  const annualRent = breakdown.annualRent ?? 0
  const cautionFee = breakdown.cautionFee ?? 0
  const platformFee = breakdown.platformFee ?? 0
  const serviceCharge = breakdown.serviceCharge ?? 0
  const totalDue = breakdown.totalDue ?? 0

  // ── Initiate payment ────────────────────────────────────────────────────────

  const handleInitiatePayment = async () => {
    if (!agreement) return

    // Check if there's already a successful payment for this agreement
    const hasSuccessfulPayment = existingPayments.some(payment => 
      payment.agreement_id === agreement.id && 
      (payment.status === 'released' || payment.status === 'held')
    )

    if (hasSuccessfulPayment) {
      toast.error("Payment already completed for this agreement")
      router.push("/tenant/payments")
      return
    }

    // Check if there's a pending payment
    const hasPendingPayment = existingPayments.some(payment => 
      payment.agreement_id === agreement.id && 
      (payment.status === 'pending' || payment.status === 'held')
    )

    if (hasPendingPayment) {
      toast.error("Payment already in progress for this agreement")
      router.push("/tenant/payments")
      return
    }

    setIsInitiating(true)
    try {
      const response = await paymentsAPI.initiate(agreement.id)
      
      if (response.success) {
        toast.success("Redirecting to payment gateway...")
        // Redirect to Paystack
        window.location.href = response.authorization_url
      } else {
        toast.error(response.error ?? "Failed to initiate payment")
      }
    } catch (error) {
      console.error("[PaymentNew] initiate error:", error)
      toast.error("Failed to initiate payment. Please try again.")
    } finally {
      setIsInitiating(false)
    }
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
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Payment Details</h3>
            <p className="text-slate-600">Fetching agreement information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!agreement || !agreementId) {
    // PAY-11 fix: Show specific error screens per `loadError.kind` so the
    // user gets a useful, actionable message instead of an infinite spinner
    // OR a generic "Agreement Not Found".

    // ── Error: missing_id ──────────────────────────────────────────────────
    if (loadError?.kind === 'missing_id') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
          <div className="max-w-2xl mx-auto py-20">
            <Card className="border-orange-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  No Agreement Selected
                </h3>
                <p className="text-slate-600 mb-6">
                  We couldn't find an agreement ID in the link you followed.
                  This usually happens when an old payment link is opened or
                  the link was copied incorrectly.
                </p>
                <Link href="/tenant/agreements">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go to My Agreements
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // ── Error: unauthorized ────────────────────────────────────────────────
    if (loadError?.kind === 'unauthorized') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
          <div className="max-w-2xl mx-auto py-20">
            <Card className="border-red-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Access Denied
                </h3>
                <p className="text-slate-600 mb-6">
                  This payment link belongs to a different tenant account.
                  You can only pay for agreements on your own account.
                </p>
                <Link href="/tenant/agreements">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Agreements
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // ── Error: not_signed (the original PAY-11 bug!) ───────────────────────
    if (loadError?.kind === 'not_signed') {
      const status = (loadError as { kind: 'not_signed'; status: string }).status
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
          <div className="max-w-2xl mx-auto py-20">
            <Card className="border-orange-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Agreement Not Signed Yet
                </h3>
                <p className="text-slate-600 mb-2">
                  Payment cannot be initiated until both you and the landlord
                  have signed the rental agreement.
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  Current status: <span className="font-mono font-semibold">{status}</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {agreementId && (
                    <Link href={`/tenant/agreements/${agreementId}`}>
                      <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                        <FileText className="mr-2 h-4 w-4" /> Review &amp; Sign Agreement
                      </Button>
                    </Link>
                  )}
                  <Link href="/tenant/agreements">
                    <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Agreements
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // ── Error: fetch_error (network / 5xx) ─────────────────────────────────
    if (loadError?.kind === 'fetch_error') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
          <div className="max-w-2xl mx-auto py-20">
            <Card className="border-red-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Could Not Load Agreement
                </h3>
                <p className="text-slate-600 mb-2">
                  {(loadError as { kind: 'fetch_error'; message: string }).message}
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  This is usually a temporary network issue. Please try again
                  in a moment.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => fetchAgreement()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Try Again
                  </Button>
                  <Link href="/tenant/agreements">
                    <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Agreements
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // ── Fallback: generic "Agreement Not Found" (existing UI preserved) ───
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <AlertCircle className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Agreement Not Found</h3>
          <p className="text-slate-500 mb-6">This agreement may have been removed or you don't have access.</p>
          <Link href="/tenant/agreements">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
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
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <Link href={`/tenant/agreements/${agreementId}`}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agreement
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
              Complete Your Payment
            </h1>
            <p className="text-slate-600">
              Secure your rental property with our trusted payment system
            </p>
          </div>
        </div>

        {/* ── Property Card ── */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm mb-8 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="relative h-48">
            <img
              src={agreement.property?.images?.[0] ?? DEFAULT_PROPERTY_IMAGE}
              alt={agreement.property?.title ?? "Property"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-xl font-bold mb-1">
                {agreement.property?.title ?? "Property"}
              </h2>
              <div className="flex items-center gap-4 text-sm text-white/90">
                <span className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  {agreement.property?.city ?? agreement.property?.location ?? "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Banknote className="h-4 w-4" />
                  {formatNGN(agreement.rent_amount)}/mo
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Payment Breakdown ── */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm mb-8 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Banknote className="h-5 w-5 text-orange-500" />
              Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Monthly Rent</span>
                <span className="font-semibold text-slate-900">{formatNGN(monthlyRent)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Annual Rent (12 × Monthly)</span>
                <span className="font-semibold text-slate-900">{formatNGN(annualRent)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Security Deposit</span>
                <span className="font-semibold text-slate-900">{formatNGN(cautionFee)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Platform Fee</span>
                <span className="font-semibold text-slate-900">{formatNGN(platformFee)}</span>
              </div>
              {serviceCharge > 0 && (
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600">Service Charge</span>
                  <span className="font-semibold text-slate-900">{formatNGN(serviceCharge)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-4 border-t-2 border-slate-300">
                <span className="text-lg font-bold text-slate-900">Total Due</span>
                <span className="text-xl font-bold text-orange-600">{formatNGN(totalDue)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              * Rent is payable annually in advance per Nigerian tenancy convention.
              No agency fee — NuloAfrica charges only the platform fee above.
            </p>
          </CardContent>
        </Card>

        {/* ── Security Badge ── */}
        <Card className="border-green-200 bg-green-50/80 backdrop-blur-sm mb-8 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800">Secure Payment Processing</h3>
                <p className="text-sm text-green-600 mt-1">
                  Your payment is processed securely through Paystack, Nigeria's leading payment gateway.
                  Funds are held in escrow until your move-in date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Payment Status & Actions ── */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            {/* Check for existing payments */}
            {checkingPayments ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-orange-500" />
                <p className="text-slate-600">Checking payment status...</p>
              </div>
            ) : existingPayments.length > 0 ? (
              <div className="space-y-4">
                {/* Show existing payment status */}
                {existingPayments.some(payment => 
                  payment.agreement_id === agreement.id && 
                  (payment.status === 'released' || payment.status === 'held')
                ) ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Completed</h3>
                    <p className="text-slate-600 mb-4">
                      This agreement has already been paid for. You can view your payment history for more details.
                    </p>
                    <Link href="/tenant/payments">
                      <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                        <Eye className="mr-2 h-4 w-4" />
                        View Payment History
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-orange-800 mb-2">Payment In Progress</h3>
                    <p className="text-slate-600 mb-4">
                      A payment for this agreement is currently being processed. Please check your payment history for status updates.
                    </p>
                    <Link href="/tenant/payments">
                      <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                        <Eye className="mr-2 h-4 w-4" />
                        Check Payment Status
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              /* No existing payments - show payment button */
              <Button
                onClick={handleInitiatePayment}
                disabled={isInitiating}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 text-lg shadow-sm transition-all duration-300"
              >
                {isInitiating ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Initiating Payment...
                  </>
                ) : (
                  <>
                    <Banknote className="mr-3 h-5 w-5" />
                    Pay {formatNGN(totalDue)} Now
                  </>
                )}
              </Button>
            )}
            
            <p className="text-xs text-slate-500 text-center mt-3">
              {!checkingPayments && existingPayments.length === 0 && 
                "You will be redirected to a secure payment page to complete your transaction."
              }
              {existingPayments.length > 0 && 
                "Check your payment history for details and status updates."
              }
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
