"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle, Check, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOnboarding } from "@/hooks/useOnboarding"

export default function LandlordOnboardingStep4() {
  const router = useRouter()
  // useOnboarding handles ALL auth/redirect guards internally, including the
  // OAuth fix. isReady is true only after those checks pass.
  // DO NOT add a separate auth guard useEffect here.
  const { isReady, saveStep4, isProcessing } = useOnboarding()

  const [formData, setFormData] = useState({
    bank_account_number: '',
    bank_name: '',
    account_name: '',
    payment_reference: '',
    bank_statement_url: '',
  })

  // ── Restore draft on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const draft = localStorage.getItem('onboarding_step4_draft')
    if (draft) {
      try {
        setFormData(JSON.parse(draft))
      } catch { /* ignore */ }
    }
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      localStorage.setItem('onboarding_step4_draft', JSON.stringify(updated))
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bank_account_number?.trim()) { toast.error('Bank account number is required'); return }
    if (!formData.bank_name?.trim()) { toast.error('Bank name is required'); return }
    if (!formData.account_name?.trim()) { toast.error('Account name is required'); return }

    const success = await saveStep4({
      bank_name: formData.bank_name,
      bank_account_number: formData.bank_account_number,
      bank_account_name: formData.account_name,
      bank_verification_number: formData.payment_reference || '',
      bank_statement_url: formData.bank_statement_url || '',
    })

    if (success) {
      localStorage.removeItem('onboarding_step4_draft')
      toast.success('Step 4 completed!')
      router.push('/onboarding/landlord/step-5')
    }
  }

  // ── Loading gate ─────────────────────────────────────────────────────────────
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
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
              <span className="ml-2 text-sm font-medium text-orange-600">Bank Details</span>
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
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bank Account Details</h1>
          <p className="text-slate-600">Step 4: Provide your bank information for payments</p>
        </div>

        {/* Form wraps BOTH the card inputs AND the submit button */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-lg border-2 border-slate-200">
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