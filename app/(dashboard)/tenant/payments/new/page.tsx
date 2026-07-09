"use client"

/**
 * Tenant: "Make payment" landing page
 * ====================================
 * The agreement detail page is the single source of truth for the
 * NUBAN generation and payment flow. This page is kept as a thin
 * redirect shim so any deep links (e.g. bookmarked URLs) still
 * take the user to the right place.
 */

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, ArrowRight, Loader2 } from "lucide-react"

export default function NewPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agreementId = searchParams?.get("agreement_id") || ""

  useEffect(() => {
    if (!agreementId) {
      // No specific agreement → just take them to the agreement list
      router.replace("/tenant/agreements")
      return
    }
    // With an agreement_id, send the user to that agreement's detail page
    // (which is where NUBAN generation + payment now live).
    router.replace(`/tenant/agreements/${agreementId}`)
  }, [agreementId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-orange-600" />
        </div>
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-700 mb-4">
          Taking you to your agreement…
        </p>
        <p className="text-xs text-slate-500 mb-6">
          NUBAN generation and payment now live on the agreement detail page.
        </p>
        {agreementId && (
          <Link href={`/tenant/agreements/${agreementId}`}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Go now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
