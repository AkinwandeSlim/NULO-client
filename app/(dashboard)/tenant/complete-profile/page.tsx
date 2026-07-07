"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Upload, 
  FileText,
  Home,
  DollarSign,
  MapPin,
  Bed,
  Calendar,
  Shield
} from "lucide-react"
import { toast } from "sonner"
import { TrustScoreDisplay } from "@/components/profile/TrustScoreDisplay"

export default function CompleteProfilePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Preferences
    budget: "",
    preferredLocation: "",
    bedrooms: "",
    moveInDate: "",
    
    // Step 2: Documents
    idDocument: null as File | null,
    proofOfIncome: null as File | null,
    reference1Email: "",
    reference2Email: "",
    
    // Step 3: Rent Credit
    joinRentCredit: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleFileChange = (name: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [name]: file }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.budget) {
      newErrors.budget = "Budget is required"
    } else if (isNaN(Number(formData.budget)) || Number(formData.budget) <= 0) {
      newErrors.budget = "Please enter a valid budget"
    }
    
    if (!formData.preferredLocation) {
      newErrors.preferredLocation = "Preferred location is required"
    }
    
    if (!formData.bedrooms) {
      newErrors.bedrooms = "Number of bedrooms is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.idDocument) {
      newErrors.idDocument = "Valid ID is required"
    }
    
    if (!formData.proofOfIncome) {
      newErrors.proofOfIncome = "Proof of income is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return
    
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // TODO: Submit to backend API
      // const response = await tenantsAPI.completeProfile(formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Profile Complete!", {
        description: "Your trust score has been updated to 70/100"
      })
      
      // Redirect to success page or back to property
      router.push("/tenant")
      
    } catch (error) {
      console.error("Error completing profile:", error)
      toast.error("Failed to complete profile", {
        description: "Please try again"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 99

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-slate-600">
            Just 3 quick steps to unlock all features
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep} of 3
            </span>
            <span className="text-sm text-slate-500">
              {progress}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${currentStep > step ? 'bg-green-500 text-white' :
                  currentStep === step ? 'bg-orange-600 text-white' :
                  'bg-slate-200 text-slate-500'}
              `}>
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`
                  w-20 h-1 mx-2
                  ${currentStep > step ? 'bg-green-500' : 'bg-slate-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Preferences */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Tell Us What You're Looking For
                  </h2>
                  <p className="text-slate-600 text-sm">
                    This helps us show you the most relevant properties
                  </p>
                </div>

                <div>
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Monthly Budget *
                  </Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    placeholder="e.g., 500000"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className={errors.budget ? "border-red-500" : ""}
                  />
                  {errors.budget && (
                    <p className="text-sm text-red-500 mt-1">{errors.budget}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    💡 Helps us show properties within your budget
                  </p>
                </div>

                <div>
                  <Label htmlFor="preferredLocation" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Preferred Location *
                  </Label>
                  <Input
                    id="preferredLocation"
                    name="preferredLocation"
                    placeholder="e.g., Lekki Phase 1, Lagos"
                    value={formData.preferredLocation}
                    onChange={handleInputChange}
                    className={errors.preferredLocation ? "border-red-500" : ""}
                  />
                  {errors.preferredLocation && (
                    <p className="text-sm text-red-500 mt-1">{errors.preferredLocation}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bedrooms" className="flex items-center gap-2">
                    <Bed className="w-4 h-4" />
                    How many bedrooms? *
                  </Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, bedrooms: num.toString() }))}
                        className={`
                          flex-1 py-3 rounded-lg border-2 font-medium transition-all
                          ${formData.bedrooms === num.toString()
                            ? 'border-orange-600 bg-orange-50 text-orange-600'
                            : 'border-slate-200 hover:border-orange-300'}
                        `}
                      >
                        {num === 4 ? '4+' : num}
                      </button>
                    ))}
                  </div>
                  {errors.bedrooms && (
                    <p className="text-sm text-red-500 mt-1">{errors.bedrooms}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="moveInDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Move-in Date (Optional)
                  </Label>
                  <Input
                    id="moveInDate"
                    name="moveInDate"
                    type="date"
                    value={formData.moveInDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Documents */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Quick Verification
                  </h2>
                  <p className="text-slate-600 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Your documents are encrypted and secure
                  </p>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    1️⃣ Valid ID (Required) *
                  </Label>
                  <div className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    hover:border-orange-400 hover:bg-orange-50 transition-all
                    ${formData.idDocument ? 'border-green-500 bg-green-50' : 'border-slate-300'}
                    ${errors.idDocument ? 'border-red-500' : ''}
                  `}>
                    <input
                      type="file"
                      id="idDocument"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                    />
                    <label htmlFor="idDocument" className="cursor-pointer">
                      {formData.idDocument ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">{formData.idDocument.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                          <p className="font-medium text-slate-700">Click to upload or drag & drop</p>
                          <p className="text-sm text-slate-500 mt-1">
                            NIN, Driver's License, or Passport
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            PDF, JPG, PNG (Max 10MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                  {errors.idDocument && (
                    <p className="text-sm text-red-500 mt-1">{errors.idDocument}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    2️⃣ Proof of Income (Required) *
                  </Label>
                  <div className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    hover:border-orange-400 hover:bg-orange-50 transition-all
                    ${formData.proofOfIncome ? 'border-green-500 bg-green-50' : 'border-slate-300'}
                    ${errors.proofOfIncome ? 'border-red-500' : ''}
                  `}>
                    <input
                      type="file"
                      id="proofOfIncome"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange('proofOfIncome', e.target.files?.[0] || null)}
                    />
                    <label htmlFor="proofOfIncome" className="cursor-pointer">
                      {formData.proofOfIncome ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">{formData.proofOfIncome.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                          <p className="font-medium text-slate-700">Click to upload or drag & drop</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Employment letter or recent pay slip
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                  {errors.proofOfIncome && (
                    <p className="text-sm text-red-500 mt-1">{errors.proofOfIncome}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    3️⃣ References (Optional)
                  </Label>
                  <div className="space-y-3">
                    <Input
                      name="reference1Email"
                      type="email"
                      placeholder="Reference 1 email"
                      value={formData.reference1Email}
                      onChange={handleInputChange}
                    />
                    <Input
                      name="reference2Email"
                      type="email"
                      placeholder="Reference 2 email"
                      value={formData.reference2Email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Review Your Profile
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Confirm your details before completing
                  </p>
                </div>

                {/* Preferences Summary */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">✏️ Your Preferences</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Budget:</span>
                      <span className="font-medium">₦{Number(formData.budget).toLocaleString()}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Location:</span>
                      <span className="font-medium">{formData.preferredLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bedrooms:</span>
                      <span className="font-medium">{formData.bedrooms}</span>
                    </div>
                    {formData.moveInDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Move-in:</span>
                        <span className="font-medium">{new Date(formData.moveInDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents Summary */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">📄 Your Documents</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(2)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Valid ID uploaded</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Proof of Income uploaded</span>
                    </div>
                    {(formData.reference1Email || formData.reference2Email) && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          {[formData.reference1Email, formData.reference2Email].filter(Boolean).length} Reference(s) provided
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust Score Preview */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">⭐ Trust Score Preview</h3>
                  <TrustScoreDisplay
                    score={70}
                    size="lg"
                    showDetails={true}
                    breakdown={{
                      base: 50,
                      profile_completion: 20
                    }}
                  />
                </div>

                {/* Rent Credit Program */}
                <div className="border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="joinRentCredit"
                      checked={formData.joinRentCredit}
                      onChange={(e) => setFormData(prev => ({ ...prev, joinRentCredit: e.target.checked }))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="joinRentCredit" className="font-semibold text-slate-900 cursor-pointer">
                        💎 BONUS: Join Nulo Credit Program
                      </Label>
                      <p className="text-sm text-slate-600 mt-1">
                        Build credit history with every rent payment. Get better loans, lower rates. (+10 trust score)
                      </p>
                      <Button variant="link" className="p-0 h-auto text-orange-600 text-sm mt-1">
                        Learn More →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    "Completing..."
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Profile
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
