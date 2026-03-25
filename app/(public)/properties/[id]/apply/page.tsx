"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft, ArrowRight, Check, Upload, FileText, User, Briefcase,
  Users, Home, ChevronRight, MapPin, Bed, Bath, Square, Shield,
  Clock, CheckCircle2, Lock, Search, AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { applicationsAPI, CreateApplicationData } from "@/lib/api/applications"
import { getErrorMessage } from "@/lib/api/client"
import { formatNGN, calculateRentalBreakdown } from "@/lib/utils/rentalCalculations"

// Import step components
import PersonalInfoStep from "@/components/application/PersonalInfoStep"
import EmploymentStep from "@/components/application/EmploymentStep"
import ReferencesStep from "@/components/application/ReferencesStep"
import DocumentsStep from "@/components/application/DocumentsStep"
import ReviewStep from "@/components/application/ReviewStep"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  nationality: string
  maritalStatus: string
  dependents: string
  employmentStatus: string
  employer_name: string
  jobTitle: string
  monthly_income: string
  employmentDuration: string
  previousEmployer: string
  reference1Name: string
  reference1Phone: string
  reference1Relationship: string
  reference2Name: string
  reference2Phone: string
  reference2Relationship: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  idDocument: File | null
  proofOfIncome: File | null
  bankStatement: File | null
  employmentLetter: File | null
  moveInDate: string
  leaseDuration: string
  number_of_occupants: string
  has_pets: boolean
  pet_details: string
  message: string
  agreeToTerms: boolean
}

// ─── Step config ──────────────────────────────────────────────────────────────

const steps = [
  { number: 1, title: "Personal Info",   icon: User,     description: "Your basic information" },
  { number: 2, title: "Employment",      icon: Briefcase, description: "Work & income details" },
  { number: 3, title: "References",      icon: Users,    description: "Contact references" },
  { number: 4, title: "Documents",       icon: Upload,   description: "Upload required docs" },
  { number: 5, title: "Review",          icon: FileText, description: "Review & submit" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApplicationPage() {
  const router       = useRouter()
  const params       = useParams()
  const searchParams = useSearchParams()
  const { user, userProfile, loading } = useAuth()

  const propertyId = params?.id as string
  // Optional: tenant can arrive here with ?viewing_id=xxx if they applied after a scheduled viewing
  const viewingIdFromUrl = searchParams?.get("viewing_id") || null

  const [currentStep,      setCurrentStep]      = useState(1)
  const [isSubmitting,     setIsSubmitting]      = useState(false)
  const [duplicateError,   setDuplicateError]    = useState(false)
  const [property,         setProperty]          = useState<any>(null)
  const [loadingProperty,  setLoadingProperty]   = useState(true)
  const [errors,           setErrors]            = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ApplicationData>({
    // Pre-populate with user profile data (only fields that exist in TenantProfile)
    firstName:                   user?.full_name?.split(" ")[0] || "",
    lastName:                    user?.full_name?.split(" ")[1] || "",
    email:                       user?.email || "",
    phone:                       user?.phone_number || "",
    dateOfBirth:                 "",
    nationality:                 "",
    maritalStatus:               "",
    dependents:                  "0",
    employmentStatus:            "",
    employer_name:               "",
    jobTitle:                    "",
    monthly_income:              "",
    employmentDuration:          "",
    previousEmployer:            "",
    reference1Name:              "",
    reference1Phone:             "",
    reference1Relationship:      "",
    reference2Name:              "",
    reference2Phone:             "",
    reference2Relationship:      "",
    emergencyContactName:        "",
    emergencyContactPhone:       "",
    emergencyContactRelationship:"",
    idDocument:                  null,
    proofOfIncome:               null,
    bankStatement:               null,
    employmentLetter:            null,
    moveInDate:                  "",
    leaseDuration:               "12",
    number_of_occupants:         "1",
    has_pets:                    false,
    pet_details:                 "",
    message:                     "",
    agreeToTerms:                false,
  })

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/signin?callbackUrl=/properties/${propertyId}/apply`)
    }
  }, [user, loading, router, propertyId])

  // ── Fetch property ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", propertyId)
          .single()

        setProperty(error ? { id: propertyId, title: "Property Application", location: "Nigeria", price: 0 } : data)
      } catch {
        setProperty({ id: propertyId, title: "Property Application", location: "Nigeria", price: 0 })
      } finally {
        setLoadingProperty(false)
      }
    }
    fetchProperty()
  }, [propertyId])

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: val }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const handleFileChange = (name: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [name]: file }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }))
  }

  // ── Validation (unchanged from original) ──────────────────────────────────
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.firstName.trim())    newErrors.firstName    = "First name is required"
      if (!formData.lastName.trim())     newErrors.lastName     = "Last name is required"
      if (!formData.email.trim())        newErrors.email        = "Email is required"
      if (!formData.phone.trim())        newErrors.phone        = "Phone is required"
      if (!formData.dateOfBirth)         newErrors.dateOfBirth  = "Date of birth is required"
      if (!formData.nationality.trim())  newErrors.nationality  = "Nationality is required"
    }

    if (step === 2) {
      if (!formData.employmentStatus)    newErrors.employmentStatus = "Employment status is required"
      
      // Only require monthly_income for employed or self-employed
      if ((formData.employmentStatus === 'employed' || formData.employmentStatus === 'self-employed') && !formData.monthly_income) {
        newErrors.monthly_income = "Monthly income is required"
      }
      
      // Only require employer_name and jobTitle for employed, self-employed, or student
      if ((formData.employmentStatus === 'employed' || formData.employmentStatus === 'self-employed' || formData.employmentStatus === 'student') && !formData.employer_name?.trim()) {
        newErrors.employer_name = formData.employmentStatus === 'student' ? "Institution name is required" : "Employer name is required"
      }
      
      if ((formData.employmentStatus === 'employed' || formData.employmentStatus === 'self-employed' || formData.employmentStatus === 'student') && !formData.jobTitle?.trim()) {
        newErrors.jobTitle = formData.employmentStatus === 'student' ? "Course of study is required" : "Job title is required"
      }
    }

    if (step === 3) {
      if (!formData.reference1Name.trim())  newErrors.reference1Name  = "Reference name is required"
      if (!formData.reference1Phone.trim()) newErrors.reference1Phone = "Reference phone is required"
      if (!formData.emergencyContactName.trim())  newErrors.emergencyContactName  = "Emergency contact is required"
      if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = "Emergency contact phone is required"
    }

    if (step === 4) {
      // TODO: Re-enable document validation after bucket is created
      // if (!formData.idDocument)      newErrors.idDocument      = "ID document is required"
      // if (!formData.proofOfIncome)   newErrors.proofOfIncome   = "Proof of income is required"
    }

    if (step === 5) {
      if (!formData.moveInDate)      newErrors.moveInDate      = "Move-in date is required"
      if (!formData.agreeToTerms)    newErrors.agreeToTerms    = "You must agree to the terms"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(5)) return
    setIsSubmitting(true)

    try {
      // MVP: Use hardcoded placeholder document URLs
      const documentUrls: string[] = [
        "https://placeholder-documents.com/id-document.pdf",
        "https://placeholder-documents.com/proof-of-income.pdf",
        "https://placeholder-documents.com/bank-statement.pdf",
        "https://placeholder-documents.com/employment-letter.pdf"
      ].filter((_, index) => {
        // Only include URLs for documents that were actually uploaded
        const fields = ["idDocument", "proofOfIncome", "bankStatement", "employmentLetter"] as const
        return formData[fields[index]] !== null
      })

      // Build references as JSONB object (database schema: references jsonb)
      const referencesData: Record<string, any> = {
        reference1: {
          name: formData.reference1Name,
          phone: formData.reference1Phone,
          relationship: formData.reference1Relationship,
        },
      }
      
      // Add reference2 if provided
      if (formData.reference2Name) {
        referencesData.reference2 = {
          name: formData.reference2Name,
          phone: formData.reference2Phone,
          relationship: formData.reference2Relationship,
        }
      }

      console.log('✅ [APP] References Data:', referencesData)
      console.log('✅ [APP] References Type:', typeof referencesData)
      console.log('✅ [APP] Is Array?', Array.isArray(referencesData))

      const applicationData: CreateApplicationData = {
        property_id:          propertyId,
        viewing_id:           viewingIdFromUrl || undefined,
        message:              formData.message || "",
        employment_status:    formData.employmentStatus || "",
        employer_name:        formData.employer_name || "",
        monthly_income:       parseInt(formData.monthly_income) || 0,
        move_in_date:         formData.moveInDate || "",
        lease_duration:       formData.leaseDuration || "12",
        number_of_occupants:  parseInt(formData.number_of_occupants) || 1,
        has_pets:             formData.has_pets || false,
        pet_details:          formData.pet_details || "",
        references:           referencesData,
        documents:            documentUrls,
        emergency_contact_name:  formData.emergencyContactName || "",
        emergency_contact_phone: formData.emergencyContactPhone || "",
      }

      console.log('Application Data:', applicationData)

      await applicationsAPI.create(applicationData)

      toast.success("Application Submitted!", {
        description: "Your application has been sent to the landlord. You will be notified of their response.",
        duration: 5000,
      })

      // ✅ Fixed: correct route
      setTimeout(() => router.push("/tenant/applications"), 2000)

    } catch (error: any) {
      console.error("Error submitting application:", error)
      
      // ✅ Better UX for duplicate applications
      const isDuplicate = error.response?.status === 400 && 
                         error.response?.data?.detail?.includes("already applied")
      
      if (isDuplicate) {
        setDuplicateError(true)
        toast.error("Already Applied", {
          description: "You've already applied for this property.",
          duration: 5000,
        })
      } else {
        toast.error("Failed to submit application", { description: getErrorMessage(error) })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || loadingProperty) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        {/* Breadcrumb skeleton */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <Skeleton className="h-4 w-16" />
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <Skeleton className="h-4 w-20" />
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
        </div>

        {/* Page header skeleton */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-2">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
        </div>

        {/* Stepper skeleton */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="relative mb-2">
            <Skeleton className="h-[2px] w-full" />
            <div className="relative z-10 flex justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex flex-col items-center gap-1.5">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form area */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation skeleton */}
              <div className="flex justify-between">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-4">
                {/* Property card skeleton */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-11 w-11 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-32" />
                      </div>

                      <div className="flex items-center gap-3">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-12" />
                      </div>

                      <Skeleton className="h-16 w-full rounded-xl" />

                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Breadcrumb — matches property detail page exactly ─────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-3">
          <nav className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm overflow-x-auto scrollbar-hide">
            <Link href="/" className="text-slate-600 hover:text-orange-600 transition-colors font-medium whitespace-nowrap">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
            <Link href="/properties" className="text-slate-600 hover:text-orange-600 transition-colors font-medium whitespace-nowrap">
              Properties
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
            <Link
              href={`/properties/${propertyId}`}
              className="text-slate-600 hover:text-orange-600 transition-colors font-medium whitespace-nowrap truncate max-w-[120px] md:max-w-[240px]"
            >
              {property?.title || "Property"}
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
            <span className="text-orange-600 font-semibold whitespace-nowrap">Apply</span>
          </nav>
        </div>
      </div>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-2">
        <Link
          href={`/properties/${propertyId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-600 transition-colors mb-4 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to property
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">Rental Application</h1>
            {property && (
              <p className="text-slate-500 text-sm mt-1">
                Applying for <span className="font-semibold text-slate-700">{property.title}</span>
              </p>
            )}
          </div>

          {/* Secure badge */}
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full self-start sm:self-auto">
            <Lock className="h-3.5 w-3.5" />
            Secure & Encrypted
          </div>
        </div>
      </div>

      {/* ── Stepper ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        {/* Progress track */}
        <div className="relative mb-2">
          <div className="absolute top-5 left-0 right-0 h-[2px] bg-slate-200 z-0" />
          <div
            className="absolute top-5 left-0 h-[2px] bg-orange-500 z-0 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          />

          <div className="relative z-10 flex justify-between">
            {steps.map((step) => {
              const Icon      = step.icon
              const isActive    = currentStep === step.number
              const isCompleted = currentStep >  step.number

              return (
                <div key={step.number} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${isCompleted
                        ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-100"
                        : isActive
                          ? "bg-white border-orange-500 text-orange-600 shadow-md shadow-orange-100"
                          : "bg-white border-slate-200 text-slate-400"
                      }
                    `}
                  >
                    {isCompleted
                      ? <Check className="h-4.5 w-4.5" />
                      : <Icon className="h-4 w-4" />
                    }
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className={`text-xs font-semibold leading-tight ${isActive ? "text-orange-600" : isCompleted ? "text-slate-700" : "text-slate-400"}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step label — mobile only */}
        <p className="sm:hidden text-center text-xs text-slate-500 mt-3">
          Step {currentStep} of 5 — <span className="font-semibold text-slate-700">{steps[currentStep - 1].title}</span>
        </p>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

          {/* ── MAIN FORM — 2/3 width ──────────────────────────────────── */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              {/* Step header bar */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    {(() => { const Icon = steps[currentStep - 1].icon; return <Icon className="h-5 w-5 text-white" /> })()}
                  </div>
                  <div>
                    <p className="text-orange-100 text-xs font-medium uppercase tracking-wider">
                      Step {currentStep} of 5
                    </p>
                    <h2 className="text-white font-bold text-lg leading-tight">
                      {steps[currentStep - 1].description}
                    </h2>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 md:p-8">
                {/* Step content */}
                {currentStep === 1 && (
                  <PersonalInfoStep formData={formData} errors={errors} onChange={handleInputChange} />
                )}
                {currentStep === 2 && (
                  <EmploymentStep formData={formData} errors={errors} onChange={handleInputChange} />
                )}
                {currentStep === 3 && (
                  <ReferencesStep formData={formData} errors={errors} onChange={handleInputChange} />
                )}
                {currentStep === 4 && (
                  <DocumentsStep formData={formData} errors={errors} onFileChange={handleFileChange} />
                )}
                {currentStep === 5 && (
                  <ReviewStep formData={formData} errors={errors} onChange={handleInputChange} property={property} />
                )}

                {/* ── Navigation ─────────────────────────────────────── */}
                <div className={`flex mt-8 pt-6 border-t border-slate-100 ${currentStep > 1 ? "justify-between" : "justify-end"}`}>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      onClick={handlePrevious}
                      variant="outline"
                      className="h-12 px-6 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 rounded-xl font-medium"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}

                  {currentStep < 5 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-sm shadow-orange-200 transition-all hover:shadow-md hover:shadow-orange-200"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-sm shadow-green-200 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Support footnote */}
            <p className="text-center text-xs text-slate-400 mt-4">
              Need help?{" "}
              <a href="mailto:support@nuloafrica.com" className="text-orange-500 hover:underline">
                support@nuloafrica.com
              </a>
            </p>
          </div>

          {/* ── SIDEBAR — 1/3 width — sticky on desktop ────────────── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-32 space-y-4">

              {/* Property summary card */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                {/* Property image */}
                {property?.images?.[0] ? (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified Listing
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                    <Home className="h-10 w-10 text-orange-300" />
                  </div>
                )}

                <CardContent className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1">
                    {property?.title || "Property"}
                  </h3>
                  {property?.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {property.location}
                    </p>
                  )}

                  {/* Specs row */}
                  {(property?.bedrooms || property?.bathrooms || property?.square_feet) && (
                    <div className="flex items-center gap-3 text-xs text-slate-600 mb-3 pb-3 border-b border-slate-100">
                      {property.bedrooms && (
                        <span className="flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5 text-slate-400" />
                          {property.bedrooms} beds
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5 text-slate-400" />
                          {property.bathrooms} baths
                        </span>
                      )}
                      {property.square_feet && (
                        <span className="flex items-center gap-1">
                          <Square className="h-3.5 w-3.5 text-slate-400" />
                          {property.square_feet} sqft
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  {property?.price > 0 && (
                    <div className="bg-orange-50 rounded-xl p-3 mb-3 text-center">
                      <p className="text-orange-600 font-bold text-xl leading-none">
                        {formatNGN(property.price)}
                      </p>
                      <p className="text-orange-400 text-xs mt-0.5">/month</p>
                    </div>
                  )}

                  {/* Rental breakdown */}
                  {property?.price > 0 && (
                    <div className="bg-blue-50 rounded-xl p-3 mb-3">
                      <p className="text-blue-600 font-semibold text-sm mb-2">Move-in Cost Breakdown</p>
                      {(() => {
                        const breakdown = calculateRentalBreakdown(property)
                        const { monthlyRent, annualRent, cautionFee, platformFee, serviceCharge, totalDue } = breakdown
                        return (
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Monthly Rent:</span>
                              <span className="font-semibold">{formatNGN(monthlyRent)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Annual Rent (12 months):</span>
                              <span className="font-semibold">{formatNGN(annualRent)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Security Deposit (2 months):</span>
                              <span className="font-semibold text-blue-700">{formatNGN(cautionFee)}</span>
                            </div>
                            {platformFee > 0 && (
                              <div className="flex justify-between">
                                <span>Platform Fee:</span>
                                <span className="font-semibold">{formatNGN(platformFee)}</span>
                              </div>
                            )}
                            {serviceCharge > 0 && (
                              <div className="flex justify-between">
                                <span>Service Charge:</span>
                                <span className="font-semibold">{formatNGN(serviceCharge)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t border-slate-300 font-bold">
                              <span>Total Due:</span>
                              <span className="text-orange-700">{formatNGN(totalDue)}</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Trust items */}
                  <div className="space-y-1.5">
                    {[
                      "Zero agency fee",
                      "Verified property",
                      "Secure application",
                      "Escrow-protected payment",
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-slate-600">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Application tips card */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Tips for a Strong Application
                  </h4>
                  <div className="space-y-2">
                    {[
                      { icon: Clock, text: "Complete all 5 steps — incomplete applications are not reviewed" },
                      { icon: Upload, text: "Upload clear, legible documents — blurry uploads will be rejected" },
                      { icon: Users, text: "Provide real references — landlords do contact them" },
                      { icon: CheckCircle2, text: "Income should be 3× the monthly rent for best approval odds" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-start gap-2">
                        <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-500 leading-snug">{text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Step progress summary — only on desktop */}
              <Card className="border border-slate-200 shadow-sm rounded-2xl hidden lg:block">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-slate-800 text-sm mb-3">Progress</h4>
                  <div className="space-y-2">
                    {steps.map((step) => {
                      const isCompleted = currentStep > step.number
                      const isActive    = currentStep === step.number
                      const Icon        = step.icon
                      return (
                        <div
                          key={step.number}
                          className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                            isActive    ? "bg-orange-50" :
                            isCompleted ? "bg-green-50"  : ""
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? "bg-green-500"  :
                            isActive    ? "bg-orange-500" : "bg-slate-200"
                          }`}>
                            {isCompleted
                              ? <Check className="h-3 w-3 text-white" />
                              : <Icon className="h-3 w-3 text-white" />
                            }
                          </div>
                          <span className={`text-xs font-medium ${
                            isActive    ? "text-orange-700" :
                            isCompleted ? "text-green-700"  : "text-slate-400"
                          }`}>
                            {step.title}
                          </span>
                          {isCompleted && (
                            <span className="ml-auto text-xs text-green-600 font-medium">Done</span>
                          )}
                          {isActive && (
                            <span className="ml-auto text-xs text-orange-600 font-medium">In progress</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
          {/* ── end sidebar ───────────────────────────────────────────────── */}

        </div>
      </div>

      {/* ─── Duplicate Application Modal ─────────────────────────────────── */}
      {duplicateError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md border-orange-200 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Already Applied
                  </h3>
                  <p className="text-sm text-slate-600">
                    You've already submitted an application for this property. You can only have one active application per property.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 font-medium mb-2">What happens next?</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>The landlord will review your existing application</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>You'll notified when they respond</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>You can withdraw if needed and reapply</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Link href="/tenant/applications" className="flex-1">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    View My Applications
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setDuplicateError(false)}
                  className="flex-1"
                >
                  Back to Property
                </Button>
              </div>

              <Link href="/properties" className="block mt-3">
                <Button variant="ghost" className="w-full text-slate-600 hover:text-orange-600">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Other Properties
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}