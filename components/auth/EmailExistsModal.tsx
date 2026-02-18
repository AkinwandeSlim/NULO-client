/**
 * Modal shown when user tries to sign up with an email that already exists
 * Follows Airbnb/Spleet pattern: offer to sign in with existing account
 * Design matches system theme: orange primary, slate text, warm ivory background
 */

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, ArrowRight } from 'lucide-react'

interface EmailExistsModalProps {
  isOpen: boolean
  email: string
  existingUserType: 'landlord' | 'tenant' | 'admin'
  onSignIn: () => Promise<void>
  onTryDifferent: () => void
  isLoading?: boolean
}

export function EmailExistsModal({
  isOpen,
  email,
  existingUserType,
  onSignIn,
  onTryDifferent,
  isLoading = false,
}: EmailExistsModalProps) {
  const [signingIn, setSigningIn] = useState(false)

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await onSignIn()
    } finally {
      setSigningIn(false)
    }
  }

  const userTypeLabel = existingUserType === 'landlord' ? 'Property Manager' : existingUserType === 'admin' ? 'Admin' : 'Renter'
  const roleDescription = existingUserType === 'landlord' 
    ? 'Manage properties, view inquiries, set rental rates, and connect with tenants.'
    : existingUserType === 'admin'
    ? 'Administer the platform, manage verifications, and oversee all operations.'
    : 'Browse properties, save favorites, request viewings, and find your perfect home.'

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[520px] bg-white border-slate-200 rounded-2xl shadow-lg">
        <DialogHeader className="space-y-4 text-center">
          {/* Icon with gradient background */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 mx-auto ring-1 ring-orange-200">
            <CheckCircle className="h-7 w-7 text-orange-600" />
          </div>
          
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Account Found!
            </DialogTitle>
            <DialogDescription className="text-base text-slate-600">
              This email is already registered on Nulo
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-6">
          {/* Email Display Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100">
              <Mail className="h-5 w-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{email}</p>
            </div>
          </div>

          {/* Existing Account Info Card */}
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border-2 border-orange-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500 flex-shrink-0 mt-0.5">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {userTypeLabel} Account
                </p>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                  {roleDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleSignIn}
              disabled={signingIn || isLoading}
              className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl inline-flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              {signingIn ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button
              onClick={onTryDifferent}
              disabled={signingIn || isLoading}
              variant="outline"
              className="w-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-semibold transition-all"
            >
              Try Different Email
            </Button>
          </div>

          {/* Support Help Text */}
          <p className="text-xs text-slate-500 text-center pt-2">
            Lost access to this email?{' '}
            <a href="/support" className="text-orange-600 hover:text-orange-700 font-semibold hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
