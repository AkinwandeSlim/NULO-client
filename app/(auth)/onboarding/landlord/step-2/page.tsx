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
  const { user } = useAuth()
  // useOnboarding handles all auth/redirect guards — including the OAuth fix.
  // isReady is true only after those checks pass. No need for a separate guard here.
  const { isReady, saveStep2, isProcessing, step1Data, step2Data } = useOnboarding()

  const [documents, setDocuments] = useState({
    id_document: null as File | null,
    proof_of_address: null as File | null,
    cac_certificate: null as File | null,
  })

  const [selfie, setSelfie] = useState<File | null>(null)

  const [uploadedFiles, setUploadedFiles] = useState({
    id_document: false,
    proof_of_address: false,
    cac_certificate: false,
    selfie: false,
  })

  // ── Restore previously uploaded file status on mount ────────────────────────
  useEffect(() => {
    // Check autosave first
    const autoSaved = localStorage.getItem('onboarding_step2_autosave')
    if (autoSaved) {
      try {
        const data = JSON.parse(autoSaved)
        setUploadedFiles(data.uploadedFiles || {
          id_document: !!data.id_document,
          proof_of_address: !!data.proof_of_address,
          cac_certificate: !!data.cac_certificate,
          selfie: !!data.selfie,
        })
        return
      } catch { /* ignore */ }
    }
    // Fallback: check hook storage key
    const savedStep2 = localStorage.getItem('nulo_onboarding_step2')
    if (savedStep2) {
      try {
        const data = JSON.parse(savedStep2)
        setUploadedFiles({
          id_document: !!data.id_document,
          proof_of_address: !!data.proof_of_address,
          cac_certificate: !!data.cac_certificate,
          selfie: data.uploaded || false,
        })
      } catch { /* ignore */ }
    }
  }, [])

  // ── Autosave upload status on every change ───────────────────────────────────
  useEffect(() => {
    const autoSaveData = {
      id_document: documents.id_document?.name || '',
      proof_of_address: documents.proof_of_address?.name || '',
      cac_certificate: documents.cac_certificate?.name || '',
      selfie: selfie?.name || '',
      uploadedFiles,
    }
    localStorage.setItem('onboarding_step2_autosave', JSON.stringify(autoSaveData))
  }, [documents, selfie, uploadedFiles])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: 'id_document' | 'proof_of_address' | 'cac_certificate') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) { toast.error('File size must be less than 10MB'); return }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) { toast.error('Only JPG, PNG, and PDF files are allowed'); return }

    setDocuments(prev => ({ ...prev, [docType]: file }))
    setUploadedFiles(prev => ({ ...prev, [docType]: true }))
    toast.success(`${file.name} selected`)
  }

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { toast.error('Selfie file size must be less than 5MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('Selfie must be an image file'); return }

    setSelfie(file)
    setUploadedFiles(prev => ({ ...prev, selfie: true }))
    toast.success('Selfie captured!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Skip if already submitted
    if (step2Data?.id_document && step2Data?.selfie) {
      toast.success('Documents already submitted!')
      router.push('/onboarding/landlord/step-3')
      return
    }

    if (!documents.id_document) { toast.error('Please upload your ID document'); return }
    if (!documents.proof_of_address) { toast.error('Please upload proof of address'); return }
    if (!selfie) { toast.error('Please upload a selfie for verification'); return }
    if (step1Data?.landlord_type === 'company' && !documents.cac_certificate) {
      toast.error('Please upload company registration document'); return
    }

    try {
      await simulateUploadDelay(1500)

      const mockUrls = {
        id_document: generateMockDocumentUrl(documents.id_document!.name, user!.id),
        proof_of_address: generateMockDocumentUrl(documents.proof_of_address!.name, user!.id),
        selfie: generateMockSelfieUrl(user!.id),
        cac_certificate: step1Data?.landlord_type === 'company' && documents.cac_certificate
          ? generateMockDocumentUrl(documents.cac_certificate.name, user!.id)
          : '',
      }

      const success = await saveStep2({
        id_document: mockUrls.id_document,
        proof_of_address: mockUrls.proof_of_address,
        cac_certificate: mockUrls.cac_certificate,
        selfie: mockUrls.selfie,
      })

      if (success) {
        toast.success('Step 2 completed!')
        router.push('/onboarding/landlord/step-3')
      }
    } catch (error: any) {
      console.error('❌ [STEP 2] Error:', error)
      toast.error(error.message || 'Failed to upload documents')
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
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <span className="ml-2 text-sm font-medium text-orange-600">Documents</span>
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
              <div className="space-y-6">

                {/* ID Document */}
                <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  uploadedFiles.id_document || documents.id_document
                    ? 'border-green-400 bg-green-50/30'
                    : 'border-slate-300 hover:border-orange-400'
                }`}>
                  <div className="text-center">
                    {uploadedFiles.id_document || documents.id_document
                      ? <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      : <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    }
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">ID Document *</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Upload a valid government-issued ID (National ID, Driver's License, or Passport)
                    </p>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'id_document')} className="hidden" id="id_document" />
                    <label htmlFor="id_document" className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 cursor-pointer transition-colors">
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
                    {uploadedFiles.proof_of_address || documents.proof_of_address
                      ? <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      : <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    }
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Proof of Address *</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Upload a recent utility bill, bank statement, or tenancy agreement
                    </p>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'proof_of_address')} className="hidden" id="proof_of_address" />
                    <label htmlFor="proof_of_address" className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 cursor-pointer transition-colors">
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

                {/* Selfie */}
                <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  uploadedFiles.selfie || selfie
                    ? 'border-green-400 bg-green-50/30'
                    : 'border-orange-300 bg-orange-50/30 hover:border-orange-400'
                }`}>
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                      uploadedFiles.selfie || selfie ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {uploadedFiles.selfie || selfie
                        ? <Check className="h-6 w-6 text-green-600" />
                        : <Camera className="h-6 w-6 text-orange-600" />
                      }
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Selfie Verification *</h3>
                    <p className="text-sm text-slate-600 mb-4">Take a clear selfie for identity verification</p>
                    <input type="file" accept="image/*" capture="user" onChange={handleSelfieChange} className="hidden" id="selfie" />
                    <label htmlFor="selfie" className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer transition-colors">
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

                {/* Company Registration (conditional) */}
                {step1Data?.landlord_type === 'company' && (
                  <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                    uploadedFiles.cac_certificate || documents.cac_certificate
                      ? 'border-green-400 bg-green-50/30'
                      : 'border-slate-300 hover:border-orange-400'
                  }`}>
                    <div className="text-center">
                      {uploadedFiles.cac_certificate || documents.cac_certificate
                        ? <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        : <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      }
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Company Registration *</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Upload your CAC certificate or business registration document
                      </p>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'cac_certificate')} className="hidden" id="cac_certificate" />
                      <label htmlFor="cac_certificate" className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 cursor-pointer transition-colors">
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
                      <li>You can navigate back — your uploads are saved</li>
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