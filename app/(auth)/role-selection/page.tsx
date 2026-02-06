"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthRoleSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedRole = searchParams?.get('role') as 'tenant' | 'landlord' | null
  
  // Role-selection page deprecated — forward to signup so onboarding handles role.
  useEffect(() => {
    const roleQuery = preselectedRole ? `?role=${preselectedRole}` : ''
    router.replace(`/signup${roleQuery}`)
  }, [preselectedRole, router])

  // Render minimal UI while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-600">Redirecting to sign up...</p>
    </div>
  )
}