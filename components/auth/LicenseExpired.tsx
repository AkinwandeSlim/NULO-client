/**
 * License Expiry Error Component
 * Shows when application license has expired
 * Professional error page with support contact info
 */

'use client'

import React from 'react'
import { AlertCircle, Lock, Mail, Phone, AlertTriangle } from 'lucide-react'

interface LicenseError {
  error: string
  message: string
  detail: string
  support: string
}

const SUPPORT_CONFIG = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@nuloafrica.com',
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+234 (701) 886 6263',
}

export function LicenseExpiredPage({ error }: { error: LicenseError }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            License Expired
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {error.detail || "The application license has expired. Please contact support to renew your subscription."}
          </p>

          {/* Warning Box */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">No Access</p>
                <p>All application features are currently disabled.</p>
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Contact Support
            </p>
            <div className="space-y-2">
              <a
                href={`mailto:${SUPPORT_CONFIG.email}`}
                className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                <Mail className="h-4 w-4" />
                {SUPPORT_CONFIG.email}
              </a>
              <a
                href={`tel:${SUPPORT_CONFIG.phone.replace(/\\s/g, '')}`}
                className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                <Phone className="h-4 w-4" />
                {SUPPORT_CONFIG.phone}
              </a>
            </div>
          </div>

          {/* Error Code */}
          <p className="text-xs text-gray-400 mt-8">
            Error: {error.error}
          </p>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-600 mt-6">
          NuloAfrica © 2026
        </p>
      </div>
    </div>
  )
}

/**
 * License Warning Component
 * Shows when license is expiring soon (optional)
 */
export function LicenseWarningBanner({ message }: { message: string }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">{message}</p>
          <p className="text-xs text-amber-700 mt-1">
            Please contact support to renew your license before expiry.
          </p>
        </div>
      </div>
    </div>
  )
}
