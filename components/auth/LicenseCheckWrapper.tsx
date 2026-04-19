'use client'

import React, { useEffect, useState } from 'react'
import { useCheckLicense } from '@/hooks/useCheckLicense'
import { LicenseExpiredPage } from './LicenseExpired'
import { AlertCircle } from 'lucide-react'

interface LicenseCheckWrapperProps {
  children: React.ReactNode
}

export default function LicenseCheckWrapper({ children }: LicenseCheckWrapperProps) {
  const { isLicenseExpired, licenseError, isLoading } = useCheckLicense()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  // Show license expired page if license is expired (full block)
  if (isLicenseExpired && !isLoading && licenseError) {
    return <LicenseExpiredPage error={licenseError} />
  }

  // Show warning banner if license expired but still loading
  // (this shows on public pages while interceptor is catching errors)
  if (isLicenseExpired && licenseError) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        {/* Full Width Alert Banner */}
        <div className="w-full bg-gradient-to-r from-red-600 via-red-600 to-orange-600 text-white py-6 px-4 sticky top-0 z-50 shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <AlertCircle className="h-8 w-8 flex-shrink-0 mt-1 animate-pulse" />
                <div className="flex-1">
                  <h2 className="text-2xl font-black mb-2">
                    🔒 APPLICATION LICENSE EXPIRED
                  </h2>
                  <p className="text-base font-semibold opacity-95">
                    {licenseError.detail || 'The application license has expired. Please contact support to renew your license.'}
                  </p>
                  <p className="text-sm opacity-90 mt-2">
                    📧 Email: <a href={`mailto:${licenseError.support}`} className="underline font-semibold hover:opacity-75">{licenseError.support}</a>
                  </p>
                </div>
              </div>
              <a 
                href={`mailto:${licenseError.support}`}
                className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition whitespace-nowrap flex-shrink-0"
              >
                Renew License
              </a>
            </div>
          </div>
        </div>
        {/* Blurred content below */}
        <div className="flex-1 opacity-40 blur-sm pointer-events-none select-none">
          {children}
        </div>
      </div>
    )
  }

  // Show children if license is valid or still loading
  return <>{children}</>
}
