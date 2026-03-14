"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Building, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useOnboarding } from "@/hooks/useOnboarding"
import { useVerifiedToast } from "@/hooks/useVerifiedToast"
import { useSearchParams } from "next/navigation"

interface OnboardingStep1Data {
  full_name: string
  phone: string
  company_name: string
  company_address: string
  landlord_type: 'individual' | 'company'
  date_of_birth: string
  nin: string
  bvn: string
}

export default function LandlordOnboardingStep1() {

  // ── Hooks ────────────────────────────────────────────────────────────────────
  useVerifiedToast("landlord")

  const router = useRouter()
  const { user } = useAuth()
  const { isReady, saveStep1, isProcessing, step1Data } = useOnboarding()
  // NOTE: useOnboarding already handles ALL auth/redirect guards internally:
  //   - not signed in → /signin
  //   - wrong user type → /properties
  //   - email not verified (non-OAuth) → /signup/landlord/confirmation
  //   - onboarding already completed → /landlord/overview
  // DO NOT duplicate that logic here.

  const searchParams = useSearchParams()

  // ── State ────────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<OnboardingStep1Data>({
    full_name: '',
    phone: '',
    company_name: '',
    company_address: '',
    landlord_type: 'individual',
    date_of_birth: '',
    nin: '',
    bvn: '',
  })

  const [backUrl, setBackUrl] = useState('/signin')
  const [isInitialized, setIsInitialized] = useState(false)

  // ── Load saved / pre-populate form data ─────────────────────────────────────
  useEffect(() => {
    if (!isReady) return  // wait for auth guard to resolve first

    // Priority 1: hook state (from nulo_onboarding_step1 localStorage key)
    if (step1Data) {
      setFormData({
        full_name: step1Data.full_name || '',
        phone: step1Data.phone || '',
        company_name: step1Data.company_name || '',
        company_address: step1Data.company_address || '',
        landlord_type: step1Data.landlord_type || 'individual',
        date_of_birth: step1Data.date_of_birth || '',
        nin: step1Data.nin || '',
        bvn: step1Data.bvn || '',
      })
      setIsInitialized(true)
      return
    }

    // Priority 2: autosave draft
    const autoSaved = localStorage.getItem('onboarding_step1_autosave')
    if (autoSaved) {
      try {
        setFormData(JSON.parse(autoSaved))
      } catch { /* ignore parse errors */ }
    }
    // Priority 3: pre-populate from user profile
    else if (user) {
      const fullName = user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.full_name || ''
      setFormData(prev => ({
        ...prev,
        full_name: fullName,
        phone: user.phone_number || prev.phone,
      }))
    }

    setIsInitialized(true)
  }, [isReady, step1Data, user])

  // ── Autosave on every keystroke ──────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem('onboarding_step1_autosave', JSON.stringify(formData))
  }, [formData, isInitialized])

  // ── Smart back button ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchParams) return
    
    const from = searchParams.get('from')
    const isOAuthUser = searchParams.get('oauth') === '1' || user?.auth_provider === 'google'

    if (from) {
      setBackUrl(from)
    } else if (user?.onboarding_completed) {
      setBackUrl('/landlord/overview')
    } else if (isOAuthUser) {
      setBackUrl('/signin')
    } else {
      setBackUrl('/signup/landlord/confirmation')
    }
  }, [searchParams, user])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLandlordTypeChange = (type: 'individual' | 'company') => {
    setFormData(prev => ({ ...prev, landlord_type: type }))
  }

  const validateForm = (): boolean => {
    if (!formData.full_name?.trim()) { toast.error('Full name is required'); return false }
    if (!formData.phone?.trim()) { toast.error('Phone number is required'); return false }
    if (!formData.date_of_birth) { toast.error('Date of birth is required'); return false }
    if (!formData.nin?.trim()) { toast.error('NIN is required'); return false }
    if (!formData.bvn?.trim()) { toast.error('BVN is required'); return false }
    if (!/^\d{11}$/.test(formData.nin)) { toast.error('NIN must be 11 digits'); return false }
    if (!/^\d{11}$/.test(formData.bvn)) { toast.error('BVN must be 11 digits'); return false }
    if (formData.landlord_type === 'company') {
      if (!formData.company_name?.trim()) { toast.error('Company name is required'); return false }
      if (!formData.company_address?.trim()) { toast.error('Company address is required'); return false }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      localStorage.removeItem('onboarding_step1_autosave')
      await saveStep1(formData)
      toast.success('Step 1 completed!')
      router.push('/onboarding/landlord/step-2')
    } catch (error) {
      console.error('Error submitting step 1:', error)
      toast.error('Failed to save step. Please try again.')
    }
  }

  // ── Loading gate: wait for both hook auth guard AND local data init ──────────
  if (!isReady || !isInitialized) {
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
      <Link href={backUrl} className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back</span>
      </Link>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <span className="ml-2 text-sm font-medium text-orange-600">Basic Info</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <span className="ml-2 text-sm font-medium text-slate-500">Documents</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <span className="ml-2 text-sm font-medium text-slate-500">Properties</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
              <span className="ml-2 text-sm font-medium text-slate-500">Bank Details</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold">5</div>
              <span className="ml-2 text-sm font-medium text-slate-500">Review</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Landlord Onboarding</h1>
          <p className="text-slate-600">Step 1: Basic Information</p>
        </div>

        <Card className="shadow-lg border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">Personal & Company Details</CardTitle>
            <CardDescription>
              Please provide your basic information to get started with your landlord account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Landlord Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Building className="h-5 w-5 text-orange-600" />
                  Landlord Type *
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.landlord_type === 'individual'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleLandlordTypeChange('individual')}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-6 w-6 text-orange-600" />
                      <div>
                        <h4 className="font-semibold text-slate-800">Individual</h4>
                        <p className="text-sm text-slate-600">I'm renting as an individual property owner</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.landlord_type === 'company'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleLandlordTypeChange('company')}
                  >
                    <div className="flex items-center gap-3">
                      <Building className="h-6 w-6 text-orange-600" />
                      <div>
                        <h4 className="font-semibold text-slate-800">Company</h4>
                        <p className="text-sm text-slate-600">I'm renting as a registered company</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" name="full_name" type="text" value={formData.full_name} onChange={handleInputChange} placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+234 800 000 0000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nin">National Identification Number (NIN) *</Label>
                    <Input id="nin" name="nin" type="text" value={formData.nin} onChange={handleInputChange} placeholder="12345678901" maxLength={11} pattern="[0-9]{11}" required />
                    <p className="text-xs text-slate-500">11-digit NIN number</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bvn">Bank Verification Number (BVN) *</Label>
                    <Input id="bvn" name="bvn" type="text" value={formData.bvn} onChange={handleInputChange} placeholder="12345678901" maxLength={11} pattern="[0-9]{11}" required />
                    <p className="text-xs text-slate-500">11-digit BVN number</p>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              {formData.landlord_type === 'company' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Building className="h-5 w-5 text-orange-600" />
                    Company Information
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input id="company_name" name="company_name" type="text" value={formData.company_name} onChange={handleInputChange} placeholder="Ralph Wellness Properties" required={formData.landlord_type === 'company'} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_address">Company Address *</Label>
                      <Input id="company_address" name="company_address" type="text" value={formData.company_address} onChange={handleInputChange} placeholder="123 Lagos Street, Ikeja, Lagos" required={formData.landlord_type === 'company'} />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving...' : 'Continue to Step 2'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}