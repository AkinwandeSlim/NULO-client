"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LandlordPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new landlord overview page
    router.replace('/landlord/overview')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
