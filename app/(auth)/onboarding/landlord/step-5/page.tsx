"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle, Edit, User, FileText, Home, Shield, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useOnboarding } from "@/hooks/useOnboarding"

export default function LandlordOnboardingStep5() {
  const router = useRouter()
  const { user } = useAuth()
  // useOnboarding handles ALL auth/redirect guards internally, including the
  // OAuth fix. isReady is true only after those checks pass.
  // DO NOT add a separate auth guard useEffect here.
  const {
    isReady,
    submitCompleteOnboarding,
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    isProcessing,
  } = useOnboarding()

  const navigateToStep = (step: number) => {
    router.push(`/onboarding/landlord/step-${step}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Guard: all 4 steps must have data before submitting
    if (!step1Data || !step2Data || !step3Data || !step4Data) {
      toast.error('❌ Please complete all previous steps first')
      router.push('/onboarding/landlord/step-1')
      return
    }

    // user is guaranteed non-null here because isReady already confirmed auth
    try {
      console.log('🔍 [STEP 5] Validating locally and submitting onboarding...')

      // Submit complete onboarding using data collected in localStorage (hook)
      const ok = await submitCompleteOnboarding(user!.id, user!.email || '')
      if (!ok) {
        throw new Error('Failed to submit onboarding. Please try again.')
      }
      toast.success('🎉 Onboarding submitted for review!')
      setTimeout(() => {
        router.push('/onboarding/landlord/verification-pending')
      }, 2000)
    } catch (error: any) {
      console.error('❌ [STEP 5] Error submitting onboarding:', error)
      toast.error(error.message || 'Failed to submit onboarding')
    }
  }

  // ── Loading gate: wait for hook's auth checks to resolve ────────────────────
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-50">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
      </div>

      {/* Back Button */}
      <Link href="/onboarding/landlord/step-4" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back</span>
      </Link>

      <div className="w-full max-w-5xl relative z-10">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                <Check className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Basic Info</span>
            </div>
            <div className="flex-1 h-1 bg-green-600 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                <Check className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Documents</span>
            </div>
            <div className="flex-1 h-1 bg-green-600 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                <Check className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Properties</span>
            </div>
            <div className="flex-1 h-1 bg-green-600 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                <Check className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Bank Details</span>
            </div>
            <div className="flex-1 h-1 bg-green-600 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">5</div>
              <span className="ml-2 text-sm font-medium text-orange-600">Review</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Review Your Information</h1>
          <p className="text-slate-600">Step 5: Review all details and submit for verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal Information Summary */}
          <Card className="shadow-lg border-2 border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-600" />
                  Personal Information
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => navigateToStep(1)} className="text-orange-600 border-orange-200 hover:border-orange-500">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Full Name:</span>
                  <p className="text-slate-900">{step1Data?.full_name || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Phone:</span>
                  <p className="text-slate-900">{step1Data?.phone || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Date of Birth:</span>
                  <p className="text-slate-900">{step1Data?.date_of_birth || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Landlord Type:</span>
                  <p className="text-slate-900 capitalize">{step1Data?.landlord_type || 'Not provided'}</p>
                </div>
                {step1Data?.landlord_type === 'company' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-700">Company Name:</span>
                      <p className="text-slate-900">{step1Data?.company_name || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-700">Company Address:</span>
                      <p className="text-slate-900">{step1Data?.company_address || 'Not provided'}</p>
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">NIN:</span>
                  <p className="text-slate-900">{step1Data?.nin || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">BVN:</span>
                  <p className="text-slate-900">{step1Data?.bvn || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Summary */}
          <Card className="shadow-lg border-2 border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Documents
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => navigateToStep(2)} className="text-orange-600 border-orange-200 hover:border-orange-500">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">ID Document:</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Uploaded</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Proof of Address:</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Uploaded</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Selfie:</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Uploaded</span>
                  </div>
                </div>
                {step1Data?.landlord_type === 'company' && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">Company Registration:</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Uploaded</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Summary */}
          <Card className="shadow-lg border-2 border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Home className="h-5 w-5 text-orange-600" />
                  Property Details
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => navigateToStep(3)} className="text-orange-600 border-orange-200 hover:border-orange-500">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Property Address:</span>
                  <p className="text-slate-900">{step3Data?.property_address || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Property Type:</span>
                  <p className="text-slate-900 capitalize">{step3Data?.property_type || 'Not provided'}</p>
                </div>
                {/* <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Property Images:</span>
                  <p className="text-slate-900">{step3Data?.property_images?.length || 0} images uploaded</p>
                </div> */}
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Ownership Proof:</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Uploaded</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details Summary */}
          <Card className="shadow-lg border-2 border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Bank Information
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => navigateToStep(4)} className="text-orange-600 border-orange-200 hover:border-orange-500">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Bank Name:</span>
                  <p className="text-slate-900">{step4Data?.bank_name || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Account Number:</span>
                  <p className="text-slate-900">****{step4Data?.bank_account_number?.slice(-4) || '****'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Account Name:</span>
                  <p className="text-slate-900">{step4Data?.bank_account_name || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">BVN:</span>
                  <p className="text-slate-900">{step4Data?.bank_verification_number || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="shadow-lg border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-orange-800">
                <p>• Your information will be reviewed by our verification team</p>
                <p>• This process typically takes 24-48 hours</p>
                <p>• You'll receive an email once verification is complete</p>
                <p>• You can edit any information before submission</p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}