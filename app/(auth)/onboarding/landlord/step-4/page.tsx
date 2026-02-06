"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle, Building, User, FileText, Home, Star, Shield, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useOnboarding } from "@/hooks/useOnboarding"

export default function LandlordOnboardingStep4() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { submitCompleteOnboarding: submitCompleteOnboardingData, saveStep4, isProcessing, currentStep, step3Data } = useOnboarding()

  // Redirect if not authenticated or not a landlord
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Please sign in first')
        router.push('/signin')
        return
      }
      
      if (user.user_type !== 'landlord') {
        toast.error('This page is only for landlords')
        router.push('/properties')
        return
      }
      
      // Check if email is verified
      if (!user.email_verified) {
        toast.error('Please verify your email first')
        router.push('/signup/landlord/confirmation')
        return
      }
      
      // Check if step 3 is completed using hook
      
      // Check if onboarding is already completed
      if (user.onboarding_completed) {
        // Check if user actually completed onboarding by checking landlord_onboarding table
        const checkOnboardingCompletion = async () => {
          try {
            const { createClient } = await import("@/utils/supabase/client")
            const supabase = createClient()
            
            const { data: onboardingData } = await supabase
              .from('landlord_onboarding')
              .select('all_steps_completed, submitted_for_review')
              .eq('landlord_id', user.id)
              .single()
            
            // Only redirect if onboarding is actually completed
            if (onboardingData?.all_steps_completed && onboardingData?.submitted_for_review) {
              console.log('✅ [STEP 4] Onboarding actually completed, redirecting to overview')
              router.push('/landlord/overview')
              return
            } else {
              console.log('🔄 [STEP 4] Onboarding flag is stale, resetting and continuing...')
              // Reset flag in users table since it's stale
              await supabase
                .from('users')
                .update({ onboarding_completed: false })
                .eq('id', user.id)
            }
          } catch (error) {
            console.error('❌ [STEP 4] Error checking onboarding:', error)
          }
        }
        
        checkOnboardingCompletion()
        return
      }
    }
  }, [user, loading, router, currentStep, step3Data])

  const [formData, setFormData] = useState({
    bank_account_number: '',
    bank_name: '',
    account_name: '',
    payment_reference: '',
    bank_statement_url: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto-save to localStorage for better UX
    const updatedData = { ...formData, [name]: value }
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_step4_draft', JSON.stringify(updatedData))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 [STEP-4] Submit button clicked!')
    console.log('📝 [STEP-4] Form data:', formData)
    
    // Enhanced validation
    if (!formData.bank_account_number?.trim()) {
      toast.error('Bank account number is required')
      return
    }
    
    if (!formData.bank_name?.trim()) {
      toast.error('Bank name is required')
      return
    }
    
    if (!formData.account_name?.trim()) {
      toast.error('Account name is required')
      return
    }

    console.log('🚀 [STEP-4] Validation passed, saving step 4...')

    // Clear draft data on successful submission
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding_step4_draft')
    }

    // Save step 4 data first
    await saveStep4({
      bank_name: formData.bank_name,
      bank_account_number: formData.bank_account_number,
      bank_account_name: formData.account_name,
      bank_verification_number: formData.payment_reference || '',
      bank_statement_url: formData.bank_statement_url || '',
    })

    console.log('✅ [STEP-4] Bank details saved successfully!')
    toast.success('Bank details saved!')
    
    // Navigate to review page
    router.push('/onboarding/landlord/step-5')
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
      <Link href="/onboarding/landlord/step-3" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back</span>
      </Link>

      <div className="w-full max-w-2xl relative z-10">
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
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <span className="ml-2 text-sm font-medium text-orange-600">Bank Details</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold">
                5
              </div>
              <span className="ml-2 text-sm font-medium text-slate-500">Review</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bank Account Details</h1>
          <p className="text-slate-600">Step 4: Provide your bank information for payments</p>
        </div>

        {/* Bank Details Form */}
        <Card className="shadow-lg border-2 border-slate-200 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Bank Account Details
            </CardTitle>
            <CardDescription>
              Please provide your bank account information for payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Bank Account Number *</Label>
              <Input
                id="bank_account_number"
                name="bank_account_number"
                type="text"
                value={formData.bank_account_number}
                onChange={handleInputChange}
                placeholder="Enter your bank account number"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                name="bank_name"
                type="text"
                value={formData.bank_name}
                onChange={handleInputChange}
                placeholder="e.g., GTBank, Access Bank, First Bank"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name *</Label>
              <Input
                id="account_name"
                name="account_name"
                type="text"
                value={formData.account_name}
                onChange={handleInputChange}
                placeholder="Name on the bank account"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_reference">Payment Reference (Optional)</Label>
              <Input
                id="payment_reference"
                name="payment_reference"
                type="text"
                value={formData.payment_reference}
                onChange={handleInputChange}
                placeholder="Reference for payment identification"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <form onSubmit={handleSubmit}>
          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Continue to Review
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
