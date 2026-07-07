"use client"

/**
 * Tenant: Paystack callback stub -- Nomba flow has no callback.
 * ============================================================
 * Paystack redirected the user to /tenant/payments/callback?reference=...
 * after a successful charge. The Nomba flow reconciles server-side
 * via the inbound webhook, so the user never lands on a callback page.
 *
 * This page exists so any stale link (or old bookmark) still resolves
 * gracefully. It redirects the user to the agreement detail page
 * with a toast explaining the new flow.
 */

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agreementId = searchParams?.get("agreement_id")
  const reference = searchParams?.get("reference")

  useEffect(() => {
    if (reference === "pending") {
      // The tenant hit this page via the old in-app notification link.
      // Send them to their payments list with a hint.
      toast.message("NUBAN flow", {
        description: "Pay into your NUBAN from any bank app. We auto-confirm.",
      })
    } else if (agreementId) {
      // Could be a stale Paystack callback -- send them to the agreement.
      router.replace(`/tenant/payments/${agreementId}`)
    } else {
      router.replace("/tenant/payments")
    }
  }, [agreementId, reference, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
      <div className="max-w-xl mx-auto py-16">
        <Card className="border-orange-200 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              No callback needed
            </h1>
            <p className="text-slate-600 mb-6">
              Nulo Africa's NUBAN flow reconciles payments server-side.
              You'll see the status update on your Payments page within seconds of the transfer.
            </p>
            <Button
              onClick={() => router.push("/tenant/payments")}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Loader2 className="w-4 h-4 mr-2" />
              Go to Payments
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
