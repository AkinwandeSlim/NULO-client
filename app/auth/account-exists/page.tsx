'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowRight, LogIn, UserPlus } from 'lucide-react'
import Link from 'next/link'

/**
 * Account Exists page
 *
 * Handles TWO scenarios that both end up here:
 *   1. role_conflict — user tried to register as a different role than their
 *      existing account (e.g. existing tenant trying to sign up as a landlord).
 *      Message: "You can't have both a tenant and landlord account with the
 *      same email — please sign in to your existing <role> account instead."
 *
 *   2. duplicate — user tried to sign up with an email that already exists
 *      with the SAME role (e.g. existing tenant trying to sign up as tenant
 *      via Google OAuth). Message: "You already have an account — please
 *      sign in instead."
 *
 * The scenario is passed via the `?scenario=` query parameter. If it's
 * missing, we default to "duplicate" since that's the most common case
 * (Google OAuth sign-in attempt on an already-registered email).
 */
export default function AccountExistsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const email = searchParams?.get('email') || 'your email'
  const existingType = searchParams?.get('existing_type') || 'tenant'
  const requestedType = searchParams?.get('requested_type') || 'tenant'
  // Default to "duplicate" — that's the most common case (same email, same role,
  // user just tried to sign up again). Role-conflict callers must explicitly
  // pass ?scenario=role_conflict so they get the role-aware messaging.
  const scenario = searchParams?.get('scenario') || 'duplicate'

  const typeLabels: Record<string, string> = {
    tenant: 'Tenant (Property Renter)',
    landlord: 'Landlord (Property Owner)',
    admin: 'Administrator',
    signin: 'Sign In',
  }

  const existingLabel = typeLabels[existingType] || existingType
  const requestedLabel = typeLabels[requestedType] || requestedType

  const isRoleConflict = scenario === 'role_conflict'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            ⚠️ Account Already Exists
          </h1>
          <p className="text-slate-600">
            {isRoleConflict
              ? 'This email is already registered with a different account type'
              : 'You already have an account with this email'}
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-orange-200 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-orange-600">
              {isRoleConflict ? 'Email Already Registered' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isRoleConflict
                ? 'This email belongs to a different account type'
                : 'Please sign in to continue with your existing account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alert */}
            <Alert className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <p className="font-semibold mb-2">
                  Email: <span className="break-all">{email}</span>
                </p>
                {isRoleConflict ? (
                  <p className="text-sm">
                    This email is registered as a{' '}
                    <strong className="text-orange-700">{existingLabel}</strong>{' '}
                    account. You cannot create a separate{' '}
                    <strong className="text-orange-700">{requestedLabel}</strong>{' '}
                    account with the same email.
                  </p>
                ) : (
                  <p className="text-sm">
                    We found an existing{' '}
                    <strong className="text-orange-700">{existingLabel}</strong>{' '}
                    account with this email. To keep your account secure, please
                    sign in instead of creating a new one.
                  </p>
                )}
              </AlertDescription>
            </Alert>

            {/* Explanation */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">
                What does this mean?
              </h3>
              {isRoleConflict ? (
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>Each email can only have ONE account type</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>
                      You cannot be both a tenant and landlord with the same email
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>
                      If you need both account types, use a different email address
                    </span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>
                      You already have an account with this email address
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>
                      Signing in keeps all your data, applications, and notifications
                      in one place
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>
                      Forgot your password? You can reset it from the sign-in page
                    </span>
                  </li>
                </ul>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Option 1: Sign In */}
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  ✅ Option 1: Sign in to your existing account
                </p>
                <Link href={`/signin?email=${encodeURIComponent(email)}`}>
                  <Button
                    variant="default"
                    className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In to {existingLabel} Account
                  </Button>
                </Link>
              </div>

              {/* Option 2: Different Email */}
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  {isRoleConflict
                    ? '📧 Option 2: Create a new account with a different email'
                    : '📧 Option 2: Use a different email to create a new account'}
                </p>
                <Button
                  variant="outline"
                  className="w-full border-orange-300 hover:bg-orange-50 gap-2"
                  onClick={() =>
                    router.push(`/signup/${requestedType === 'signin' ? 'tenant' : requestedType}`)
                  }
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up with Different Email
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Option 3: Contact Support */}
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  💬 Option 3: Contact Support
                </p>
                <p className="text-sm text-slate-600">
                  {isRoleConflict
                    ? 'If you need to migrate your account to a different type, please '
                    : 'If you need help accessing your account, please '}
                  <Link
                    href="/support"
                    className="text-orange-600 hover:underline font-semibold"
                  >
                    contact our support team
                  </Link>
                </p>
              </div>
            </div>

            {/* Back Link */}
            <div className="pt-4 border-t border-slate-200">
              <Link href="/">
                <Button variant="ghost" className="w-full text-slate-600 hover:text-slate-900">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>
            Have questions? Check our{' '}
            <Link href="/faq" className="text-orange-600 hover:underline">
              FAQ
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-orange-600 hover:underline">
              contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}