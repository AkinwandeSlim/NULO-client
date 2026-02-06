"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Upload, FileText, Check, AlertCircle, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useOnboarding } from "@/hooks/useOnboarding"
import { generateMockDocumentUrl, generateMockSelfieUrl, simulateUploadDelay } from '@/lib/utils/mock-upload'

export default function LandlordOnboardingStep2() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { saveStep2, isProcessing, currentStep, step1Data, step2Data } = useOnboarding()
  
  const [documents, setDocuments] = useState({
    id_document: null as File | null,
    proof_of_address: null as File | null,
    cac_certificate: null as File | null,
  })

  const [selfie, setSelfie] = useState<File | null>(null)

  // ✅ NEW: Track which files were uploaded (for persistence)
  const [uploadedFiles, setUploadedFiles] = useState({
    id_document: false,
    proof_of_address: false,
    cac_certificate: false,
    selfie: false,
  })

  // ✅ AUTO-SAVE: Save form data on every change
  useEffect(() => {
    const autoSaveData = {
      id_document: documents.id_document?.name || '',
      proof_of_address: documents.proof_of_address?.name || '',
      cac_certificate: documents.cac_certificate?.name || '',
      selfie: selfie?.name || '',
      uploadedFiles: uploadedFiles
    }
    localStorage.setItem('onboarding_step2_autosave', JSON.stringify(autoSaveData))
  }, [documents, selfie, uploadedFiles])

  // ✅ RESTORE: Load auto-saved data on mount
  useEffect(() => {
    const autoSaved = localStorage.getItem('onboarding_step2_autosave')
    if (autoSaved) {
      try {
        const data = JSON.parse(autoSaved)
        console.log('📂 [STEP 2] Restoring auto-saved data:', data)
        
        // Restore uploaded files status
        setUploadedFiles(data.uploadedFiles || {
          id_document: !!data.id_document,
          proof_of_address: !!data.proof_of_address,
          cac_certificate: !!data.cac_certificate,
          selfie: !!data.selfie,
        })
        
        console.log('✅ [STEP 2] Auto-saved data restored')
      } catch (error) {
        console.error('❌ [STEP 2] Error restoring auto-saved data:', error)
      }
    }
  }, [])

  // ✅ LOAD SAVED STATE ON MOUNT
  useEffect(() => {
    // Load previously uploaded file status from localStorage
    const savedStep2 = localStorage.getItem('nulo_onboarding_step2')
    if (savedStep2) {
      try {
        const data = JSON.parse(savedStep2)
        console.log('📂 [STEP 2] Loading saved file status:', data)
        
        // Restore the "uploaded" status (we can't restore actual File objects)
        setUploadedFiles({
          id_document: !!data.id_document,
          proof_of_address: !!data.proof_of_address,
          cac_certificate: !!data.cac_certificate,
          selfie: data.uploaded || false,
        })
        
        console.log('✅ [STEP 2] Previous uploads restored')
      } catch (error) {
        console.error('❌ [STEP 2] Error loading saved state:', error)
      }
    }
  }, [])

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
      
      if (!user.email_verified) {
        toast.error('Please verify your email first')
        router.push('/signup/landlord/confirmation')
        return
      }
      
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
              console.log('✅ [STEP 2] Onboarding actually completed, redirecting to overview')
              router.push('/landlord/overview')
              return
            } else {
              console.log('🔄 [STEP 2] Onboarding flag is stale, resetting and continuing...')
              // Reset flag in users table since it's stale
              await supabase
                .from('users')
                .update({ onboarding_completed: false })
                .eq('id', user.id)
            }
          } catch (error) {
            console.error('❌ [STEP 2] Error checking onboarding:', error)
          }
        }
        
        checkOnboardingCompletion()
        return
      }
    }
  }, [user, loading, router])

  // Handle document file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: 'id_document' | 'proof_of_address' | 'cac_certificate') => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed')
        return
      }

      // ✅ Update both File object AND upload status
      setDocuments(prev => ({ ...prev, [docType]: file }))
      setUploadedFiles(prev => ({ ...prev, [docType]: true }))
      
      toast.success(`${file.name} selected`)
      console.log(`✅ [STEP 2] ${docType} selected:`, file.name)
    }
  }

  // Handle selfie selection
  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB for selfie)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Selfie file size must be less than 5MB')
        return
      }

      // Validate it's an image
      if (!file.type.startsWith('image/')) {
        toast.error('Selfie must be an image file')
        return
      }

      // ✅ Update both File object AND upload status
      setSelfie(file)
      setUploadedFiles(prev => ({ ...prev, selfie: true }))
      
      toast.success('Selfie captured!')
      console.log('✅ [STEP 2] Selfie selected:', file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('📤 [STEP 2] Submitting documents...')

    // ✅ CHECK: Skip if documents already uploaded
    if (step2Data && step2Data.id_document && step2Data.selfie) {
      console.log('✅ [STEP 2] Documents already submitted, skipping...')
      toast.success('Documents already submitted!')
      router.push('/onboarding/landlord/step-3')
      return
    }

    // ✅ VALIDATION: Check if files were uploaded
    if (!documents.id_document) {
      toast.error('Please upload your ID document')
      return
    }
    
    if (!documents.proof_of_address) {
      toast.error('Please upload proof of address')
      return
    }

    if (!selfie) {
      toast.error('Please upload a selfie for verification')
      return
    }

    // ✅ Check company documents if landlord is a company
    if (step1Data?.landlord_type === 'company' && !documents.cac_certificate) {
      toast.error('Please upload company registration document')
      return
    }

    try {
      // 🚀 MOCK UPLOAD: Generate fake URLs for MVP
      console.log('📤 [STEP 2] Generating mock URLs for documents...')
      
      // Simulate upload delay for realistic UX
      await simulateUploadDelay(1500)
      
      // Generate mock URLs
      const mockUrls = {
        id_document: generateMockDocumentUrl(documents.id_document!.name, user!.id),
        proof_of_address: generateMockDocumentUrl(documents.proof_of_address!.name, user!.id),
        selfie: generateMockSelfieUrl(user!.id),
        cac_certificate: step1Data?.landlord_type === 'company' && documents.cac_certificate 
          ? generateMockDocumentUrl(documents.cac_certificate.name, user!.id)
          : '',
      }

      console.log('✅ [STEP 2] Mock URLs generated successfully')

      // ✅ SAVE: Pass mock URLs to hook
      const success = await saveStep2({
        id_document: mockUrls.id_document,
        proof_of_address: mockUrls.proof_of_address,
        cac_certificate: mockUrls.cac_certificate,
        selfie: mockUrls.selfie,
      })

      if (success) {
        console.log('✅ [STEP 2] Documents saved successfully')
        toast.success('Documents uploaded and saved!')
        
        // Navigate to next step
        router.push('/onboarding/landlord/step-3')
      } else {
        console.error('❌ [STEP 2] Failed to save documents')
      }
    } catch (error: any) {
      console.error('❌ [STEP 2] Error:', error)
      toast.error(error.message || 'Failed to upload documents')
    }
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
      <Link href="/onboarding/landlord/step-1" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
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
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-orange-600">Documents</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-slate-500">Properties</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <span className="ml-2 text-sm font-medium text-slate-500">Bank Details</span>
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
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Landlord Onboarding</h1>
          <p className="text-slate-600">Step 2: Document Verification</p>
        </div>

        <Card className="shadow-lg border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">Upload Required Documents</CardTitle>
            <CardDescription>
              Please upload the following documents to verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document Upload Areas */}
              <div className="space-y-6">
                
                {/* ID Document */}
                <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  uploadedFiles.id_document || documents.id_document 
                    ? 'border-green-400 bg-green-50/30' 
                    : 'border-slate-300 hover:border-orange-400'
                }`}>
                  <div className="text-center">
                    {uploadedFiles.id_document || documents.id_document ? (
                      <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    ) : (
                      <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    )}
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">ID Document *</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Upload a valid government-issued ID (National ID, Driver's License, or Passport)
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'id_document')}
                      className="hidden"
                      id="id_document"
                    />
                    <label 
                      htmlFor="id_document"
                      className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadedFiles.id_document ? 'Change File' : 'Choose File'}
                    </label>
                    {(documents.id_document || uploadedFiles.id_document) && (
                      <div className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        {documents.id_document?.name || 'Previously uploaded'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Proof of Address */}
                <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  uploadedFiles.proof_of_address || documents.proof_of_address 
                    ? 'border-green-400 bg-green-50/30' 
                    : 'border-slate-300 hover:border-orange-400'
                }`}>
                  <div className="text-center">
                    {uploadedFiles.proof_of_address || documents.proof_of_address ? (
                      <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    ) : (
                      <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    )}
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Proof of Address *</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Upload a recent utility bill, bank statement, or tenancy agreement
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'proof_of_address')}
                      className="hidden"
                      id="proof_of_address"
                    />
                    <label 
                      htmlFor="proof_of_address"
                      className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadedFiles.proof_of_address ? 'Change File' : 'Choose File'}
                    </label>
                    {(documents.proof_of_address || uploadedFiles.proof_of_address) && (
                      <div className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        {documents.proof_of_address?.name || 'Previously uploaded'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selfie - Liveness Check */}
                <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  uploadedFiles.selfie || selfie 
                    ? 'border-green-400 bg-green-50/30' 
                    : 'border-orange-300 bg-orange-50/30 hover:border-orange-400'
                }`}>
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                      uploadedFiles.selfie || selfie ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {uploadedFiles.selfie || selfie ? (
                        <Check className="h-6 w-6 text-green-600" />
                      ) : (
                        <Camera className="h-6 w-6 text-orange-600" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Selfie Verification *</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Take a clear selfie for identity verification
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieChange}
                      className="hidden"
                      id="selfie"
                    />
                    <label 
                      htmlFor="selfie"
                      className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer transition-colors"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {uploadedFiles.selfie ? 'Retake Selfie' : 'Take/Upload Selfie'}
                    </label>
                    {(selfie || uploadedFiles.selfie) && (
                      <div className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        {selfie?.name || 'Previously uploaded'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Registration (Conditional) */}
                {step1Data?.landlord_type === 'company' && (
                  <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                    uploadedFiles.cac_certificate || documents.cac_certificate 
                      ? 'border-green-400 bg-green-50/30' 
                      : 'border-slate-300 hover:border-orange-400'
                  }`}>
                    <div className="text-center">
                      {uploadedFiles.cac_certificate || documents.cac_certificate ? (
                        <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      ) : (
                        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      )}
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Company Registration *</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Upload your CAC certificate or business registration document
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'cac_certificate')}
                        className="hidden"
                        id="cac_certificate"
                      />
                      <label 
                        htmlFor="cac_certificate"
                        className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 cursor-pointer transition-colors"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadedFiles.cac_certificate ? 'Change File' : 'Choose File'}
                      </label>
                      {(documents.cac_certificate || uploadedFiles.cac_certificate) && (
                        <div className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
                          <Check className="h-4 w-4" />
                          {documents.cac_certificate?.name || 'Previously uploaded'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Important Information:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>All documents must be clear and readable</li>
                      <li>Maximum file size: 10MB for documents, 5MB for selfie</li>
                      <li>Accepted formats: JPG, PNG, PDF</li>
                      <li>You can navigate back - your uploads are saved</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving...' : 'Continue to Step 3'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}