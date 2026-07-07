"use client"

/**
 * Tenant: "Initiate a new payment" -- Nomba flow
 * =============================================
 * The Paystack flow had a multi-step "select agreement, choose method,
 * redirect to Paystack" wizard. The Nomba flow has no wizard -- the
 * NUBAN is per-agreement and lives on the agreement card on
 * /tenant/payments. This page simply redirects there with a toast
 * explaining where to find the NUBAN.
 *
 * The legacy Paystack wizard is preserved at page-backup.tsx for
 * reference. The route is still mounted so any old links degrade
 * gracefully.
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewPaymentPage() {
  const router = useRouter()

  useEffect(() => {
    toast.info(
      "Pay into your NUBAN — no checkout flow needed.",
      { description: "Your dedicated NUBAN is on each agreement below." }
    )
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-orange-200 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Pay by bank transfer
            </h1>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Nulo Africa uses dedicated NUBANs — no checkout, no card details.
              Your NUBAN is on the agreement row on the Payments page.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-8">
              {[
                "Copy your NUBAN from the agreement card",
                "Transfer the exact amount from any bank app",
                "We auto-confirm within seconds",
              ].map((step, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-orange-200 bg-orange-50/60 p-3"
                >
                  <div className="text-xs font-semibold text-orange-700 mb-1">
                    Step {i + 1}
                  </div>
                  <p className="text-sm text-slate-700">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push("/tenant/payments")}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Go to My NUBANs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link href="/tenant/agreements">
                <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                  View Agreements
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
