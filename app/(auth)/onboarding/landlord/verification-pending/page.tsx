"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Mail, Phone, RefreshCw, Home, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { getOnboardingStatus } from "@/lib/api/onboarding"

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: This page intentionally does NOT use useOnboarding.
//
// useOnboarding's auth guard redirects to /landlord/overview when
// user.onboarding_completed is true — which is exactly the state this page
// is supposed to show. Using it here would cause an immediate redirect away
// from verification-pending right after step 5 submits.
//
// This page only needs a simple auth check (signed in + landlord), which
// it handles itself via useAuth.
// ─────────────────────────────────────────────────────────────────────────────

export default function VerificationPending() {
  const router = useRouter()
  const { user, loading, refreshUserData } = useAuth()

  const [isChecking, setIsChecking] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'in_review' | 'approved' | 'rejected'>('pending')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // Simple auth guard — just needs sign-in + landlord type.
  // Does NOT check email_verified or onboarding_completed.
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/signin')
      return
    }
    if (user.user_type !== 'landlord') {
      router.push('/properties')
      return
    }
  }, [user, loading, router])

  const checkVerificationStatus = async () => {
    if (!user) return

    setIsChecking(true)

    try {
      const status = await getOnboardingStatus(user.id)

      if (status.admin_review_status) {
        setVerificationStatus(status.admin_review_status.toLowerCase() as any)
        setLastChecked(new Date())

        if (status.admin_review_status === 'approved') {
          toast.success('🎉 Congratulations! Your verification has been approved!')
          setTimeout(() => router.push('/landlord/overview'), 2000)
        } else if (status.admin_review_status === 'rejected') {
          toast.error('❌ Your verification was rejected. Please check your email for details.')
        } else if (status.admin_review_status === 'in_review') {
          toast.info('📋 Your application is currently being reviewed.')
        } else {
          toast.info('⏳ Your verification is still pending.')
        }
      } else {
        // Fallback: check local user status
        if (user.verification_status === 'approved') {
          setVerificationStatus('approved')
          toast.success('🎉 Congratulations! Your verification has been approved!')
          setTimeout(() => router.push('/landlord/overview'), 2000)
        } else {
          setVerificationStatus('pending')
          toast.info('⏳ Your verification is still pending.')
        }
        setLastChecked(new Date())
      }
    } catch (error: any) {
      console.error('❌ [VERIFICATION] Error checking status:', error)
      if (user?.verification_status === 'approved') {
        setVerificationStatus('approved')
        toast.success('🎉 Your verification has been approved!')
        setTimeout(() => router.push('/landlord/overview'), 2000)
      } else {
        setVerificationStatus('pending')
        toast.info('⏳ Still pending. Please try again later.')
      }
      setLastChecked(new Date())
    } finally {
      setIsChecking(false)
    }
  }

  // ── Navigate to dashboard with fresh user data ──
  const navigateToDashboard = async () => {
    console.log('🔄 [VERIFICATION] Refreshing user data before navigation...')
    try {
      // Refresh user data to get latest verification_status from database
      await refreshUserData()
      console.log('✅ [VERIFICATION] User data refreshed, navigating to dashboard')
    } catch (error) {
      console.warn('⚠️ [VERIFICATION] Failed to refresh user data, navigating anyway:', error)
    }
    router.push('/landlord/overview')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-50">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
      </div>

      {/* Back Button */}
      <Link href="/onboarding/landlord/step-5" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back</span>
      </Link>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            verificationStatus === 'approved' ? 'bg-green-100' :
            verificationStatus === 'in_review' ? 'bg-blue-100' :
            verificationStatus === 'rejected' ? 'bg-red-100' :
            'bg-orange-100'
          }`}>
            {verificationStatus === 'approved' ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : verificationStatus === 'in_review' ? (
              <FileText className="h-8 w-8 text-blue-600" />
            ) : verificationStatus === 'rejected' ? (
              <AlertCircle className="h-8 w-8 text-red-600" />
            ) : (
              <Clock className="h-8 w-8 text-orange-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {verificationStatus === 'approved' ? 'Verification Approved!' :
             verificationStatus === 'in_review' ? 'Application In Review' :
             verificationStatus === 'rejected' ? 'Verification Rejected' :
             'Verification Pending'}
          </h1>
          <p className="text-slate-600">
            {verificationStatus === 'approved' ? 'Congratulations! You can now access all landlord features.' :
             verificationStatus === 'in_review' ? 'Your application is currently being reviewed by our admin team.' :
             verificationStatus === 'rejected' ? 'Your application was not approved. Please check your email.' :
             'Your onboarding is under review'}
          </p>
        </div>

        <Card className="shadow-lg border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              {verificationStatus === 'approved' ? (
                <><CheckCircle className="h-6 w-6 text-green-600" /> Verification Complete</>
              ) : verificationStatus === 'in_review' ? (
                <><FileText className="h-6 w-6 text-blue-600" /> Application In Review</>
              ) : verificationStatus === 'rejected' ? (
                <><AlertCircle className="h-6 w-6 text-red-600" /> Verification Rejected</>
              ) : (
                <><AlertCircle className="h-6 w-6 text-orange-600" /> Awaiting Admin Verification</>
              )}
            </CardTitle>
            <CardDescription>
              {verificationStatus === 'approved'
                ? 'Your verification has been completed successfully. You now have full access to landlord features.'
                : verificationStatus === 'in_review'
                ? 'Your application is currently being reviewed by our admin team.'
                : verificationStatus === 'rejected'
                ? 'Your application was not approved. Please check your email for details.'
                : 'Your onboarding application has been submitted and is currently being reviewed by our admin team.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Status Banner */}
            <div className={`border rounded-lg p-4 ${
              verificationStatus === 'approved' ? 'bg-green-50 border-green-200' :
              verificationStatus === 'in_review' ? 'bg-blue-50 border-blue-200' :
              verificationStatus === 'rejected' ? 'bg-red-50 border-red-200' :
              'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-3">
                {verificationStatus === 'approved' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : verificationStatus === 'in_review' ? (
                  <FileText className="h-5 w-5 text-blue-600" />
                ) : verificationStatus === 'rejected' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-600" />
                )}
                <div>
                  <h3 className={`font-semibold ${
                    verificationStatus === 'approved' ? 'text-green-900' :
                    verificationStatus === 'in_review' ? 'text-blue-900' :
                    verificationStatus === 'rejected' ? 'text-red-900' :
                    'text-orange-900'
                  }`}>
                    Status: {verificationStatus === 'approved' ? 'Approved' :
                            verificationStatus === 'in_review' ? 'In Review' :
                            verificationStatus === 'rejected' ? 'Rejected' :
                            'Pending Verification'}
                  </h3>
                  <p className={`text-sm ${
                    verificationStatus === 'approved' ? 'text-green-700' :
                    verificationStatus === 'in_review' ? 'text-blue-700' :
                    verificationStatus === 'rejected' ? 'text-red-700' :
                    'text-orange-700'
                  }`}>
                    Submitted on {new Date().toLocaleDateString()}
                    {lastChecked && (
                      <span className="block mt-1">Last checked: {lastChecked.toLocaleTimeString()}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-orange-600 text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Admin Review</h4>
                    <p className="text-slate-600 text-sm">Our team will review your submitted documents and information</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-orange-600 text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Verification Decision</h4>
                    <p className="text-slate-600 text-sm">You'll be notified via email once verification is complete</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-orange-600 text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Access Granted</h4>
                    <p className="text-slate-600 text-sm">Once approved, you'll have full access to property management features</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Need help?</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">support@nuloafrica.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">+234 800 000 0000</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {verificationStatus === 'approved' ? (
                <>
                  <Button onClick={() => router.push('/landlord/overview')} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()} className="flex-1 border-green-300 text-green-700 hover:border-green-500 hover:bg-green-50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </>
              ) : verificationStatus === 'rejected' ? (
                <>
                  <Button onClick={() => router.push('/onboarding/landlord/step-1')} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    Reapply
                  </Button>
                  <Button variant="outline" onClick={navigateToDashboard} className="flex-1 border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-50">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={checkVerificationStatus} disabled={isChecking} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                    {isChecking ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Checking...</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" />Check Status</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={navigateToDashboard} className="flex-1 border-orange-300 text-orange-700 hover:border-orange-500 hover:bg-orange-50">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </>
              )}
            </div>

            {/* Note */}
            <div className="text-center text-sm text-slate-500">
              <p>You'll receive an email notification as soon as your verification is complete.</p>
              <p className="mt-1">Typical verification time: 1-3 business days</p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}