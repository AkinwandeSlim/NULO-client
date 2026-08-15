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
import { dialogStyles as s } from '@/lib/utils/dialogStyles'

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
      <DialogContent className={`${s.card} sm:max-w-[520px]`}>
        <DialogHeader className={`${s.header} text-center sm:text-center`}>
          {/* Icon with gradient background */}
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-200 dark:from-orange-500/20 dark:to-orange-500/5 dark:ring-orange-500/30">
            <CheckCircle className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          </div>

          <div className="space-y-2">
            <DialogTitle className={s.title}>
              Account Found!
            </DialogTitle>
            <DialogDescription className={`${s.description} text-center`}>
              This email is already registered on Nulo
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          {/* Email Display Card */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/15">
              <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</p>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{email}</p>
            </div>
          </div>

          {/* Existing Account Info Card */}
          <div className="space-y-3 rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 dark:border-orange-500/30 dark:from-orange-500/10 dark:to-slate-900">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500 dark:bg-orange-500">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {userTypeLabel} Account
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
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
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 font-semibold text-white transition-all hover:scale-[1.02] hover:bg-orange-700 active:scale-[0.98] dark:bg-orange-500 dark:hover:bg-orange-400"
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
              className="h-11 w-full rounded-xl border-slate-200 font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
            >
              Try Different Email
            </Button>
          </div>

          {/* Support Help Text */}
          <p className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Lost access to this email?{' '}
            <a href="/support" className="font-semibold text-orange-600 underline-offset-2 hover:text-orange-700 hover:underline dark:text-orange-400 dark:hover:text-orange-300">
              Contact support
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
