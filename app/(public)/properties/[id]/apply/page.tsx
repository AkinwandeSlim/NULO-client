"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Check, Upload, FileText, User, Briefcase, Users, Home } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

// Import step components
import PersonalInfoStep from "@/components/application/PersonalInfoStep"
import EmploymentStep from "@/components/application/EmploymentStep"
import ReferencesStep from "@/components/application/ReferencesStep"
import DocumentsStep from "@/components/application/DocumentsStep"
import ReviewStep from "@/components/application/ReviewStep"

interface ApplicationData {
  // Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  nationality: string
  maritalStatus: string
  dependents: string
  
  // Employment
  employmentStatus: string
  employer: string
  jobTitle: string
  monthlyIncome: string
  employmentDuration: string
  previousEmployer: string
  
  // References
  reference1Name: string
  reference1Phone: string
  reference1Relationship: string
  reference2Name: string
  reference2Phone: string
  reference2Relationship: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  
  // Documents
  idDocument: File | null
  proofOfIncome: File | null
  bankStatement: File | null
  employmentLetter: File | null
  
  // Additional
  moveInDate: string
  leaseDuration: string
  pets: string
  smoking: string
  additionalInfo: string
  agreeToTerms: boolean
}

const steps = [
  { number: 1, title: "Personal Info", icon: User, description: "Basic information" },
  { number: 2, title: "Employment", icon: Briefcase, description: "Work & income details" },
  { number: 3, title: "References", icon: Users, description: "Contact references" },
  { number: 4, title: "Documents", icon: Upload, description: "Upload documents" },
  { number: 5, title: "Review", icon: FileText, description: "Review & submit" },
]

export default function ApplicationPage() {
  const router = useRouter()
  const params = useParams()
  const { user, userProfile, loading } = useAuth()
  const propertyId = params?.id as string
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [property, setProperty] = useState<any>(null)
  const [loadingProperty, setLoadingProperty] = useState(true)
  
  const [formData, setFormData] = useState<ApplicationData>({
    firstName: user?.full_name?.split(' ')[0] || '',
    lastName: user?.full_name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: user?.phone_number || '',
    dateOfBirth: '',
    nationality: '',
    maritalStatus: '',
    dependents: '0',
    employmentStatus: '',
    employer: '',
    jobTitle: '',
    monthlyIncome: '',
    employmentDuration: '',
    previousEmployer: '',
    reference1Name: '',
    reference1Phone: '',
    reference1Relationship: '',
    reference2Name: '',
    reference2Phone: '',
    reference2Relationship: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    idDocument: null,
    proofOfIncome: null,
    bankStatement: null,
    employmentLetter: null,
    moveInDate: '',
    leaseDuration: '12',
    pets: 'no',
    smoking: 'no',
    additionalInfo: '',
    agreeToTerms: false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/signin?callbackUrl=/properties/${propertyId}/apply`)
    }
  }, [user, loading, router, propertyId])

  // Fetch property details
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return
      
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single()
        
        if (error) {
          // If property not found in database, use mock data for now
          console.log('Property not in database, using mock data')
          setProperty({
            id: propertyId,
            title: 'Luxury Property',
            location: 'Lagos, Nigeria',
            price: 2800000,
          })
        } else {
          setProperty(data)
        }
      } catch (error) {
        console.error('Error fetching property:', error)
        // Use fallback data instead of showing error
        setProperty({
          id: propertyId,
          title: 'Property Application',
          location: 'Nigeria',
          price: 0,
        })
      } finally {
        setLoadingProperty(false)
      }
    }
    
    fetchProperty()
  }, [propertyId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (name: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [name]: file }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1: // Personal Info
        if (!formData.firstName) newErrors.firstName = 'First name is required'
        if (!formData.lastName) newErrors.lastName = 'Last name is required'
        if (!formData.email) newErrors.email = 'Email is required'
        if (!formData.phone) newErrors.phone = 'Phone is required'
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
        if (!formData.nationality) newErrors.nationality = 'Nationality is required'
        break
        
      case 2: // Employment
        if (!formData.employmentStatus) newErrors.employmentStatus = 'Employment status is required'
        if (formData.employmentStatus === 'employed') {
          if (!formData.employer) newErrors.employer = 'Employer is required'
          if (!formData.jobTitle) newErrors.jobTitle = 'Job title is required'
          if (!formData.monthlyIncome) newErrors.monthlyIncome = 'Monthly income is required'
        }
        break
        
      case 3: // References
        if (!formData.reference1Name) newErrors.reference1Name = 'Reference 1 name is required'
        if (!formData.reference1Phone) newErrors.reference1Phone = 'Reference 1 phone is required'
        if (!formData.emergencyContactName) newErrors.emergencyContactName = 'Emergency contact name is required'
        if (!formData.emergencyContactPhone) newErrors.emergencyContactPhone = 'Emergency contact phone is required'
        break
        
      case 4: // Documents
        if (!formData.idDocument) newErrors.idDocument = 'ID document is required'
        if (!formData.proofOfIncome) newErrors.proofOfIncome = 'Proof of income is required'
        break
        
      case 5: // Review
        if (!formData.moveInDate) newErrors.moveInDate = 'Move-in date is required'
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!validateStep(5)) return
    
    setIsSubmitting(true)
    
    try {
      // Upload documents to Supabase Storage
      const documentUrls: Record<string, string> = {}
      
      const documentsToUpload = [
        { key: 'idDocument', file: formData.idDocument },
        { key: 'proofOfIncome', file: formData.proofOfIncome },
        { key: 'bankStatement', file: formData.bankStatement },
        { key: 'employmentLetter', file: formData.employmentLetter },
      ]
      
      for (const doc of documentsToUpload) {
        if (doc.file) {
          const fileName = `${user?.id}/${Date.now()}_${doc.file.name}`
          const { data, error } = await supabase.storage
            .from('application-documents')
            .upload(fileName, doc.file)
          
          if (error) throw error
          
          const { data: { publicUrl } } = supabase.storage
            .from('application-documents')
            .getPublicUrl(fileName)
          
          documentUrls[doc.key] = publicUrl
        }
      }
      
      // Create application record
      const { data, error } = await supabase
        .from('applications')
        .insert({
          property_id: propertyId,
          tenant_id: user?.id,
          status: 'pending',
          personal_info: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            nationality: formData.nationality,
            maritalStatus: formData.maritalStatus,
            dependents: formData.dependents,
          },
          employment_info: {
            employmentStatus: formData.employmentStatus,
            employer: formData.employer,
            jobTitle: formData.jobTitle,
            monthlyIncome: formData.monthlyIncome,
            employmentDuration: formData.employmentDuration,
            previousEmployer: formData.previousEmployer,
          },
          references: {
            reference1: {
              name: formData.reference1Name,
              phone: formData.reference1Phone,
              relationship: formData.reference1Relationship,
            },
            reference2: {
              name: formData.reference2Name,
              phone: formData.reference2Phone,
              relationship: formData.reference2Relationship,
            },
            emergencyContact: {
              name: formData.emergencyContactName,
              phone: formData.emergencyContactPhone,
              relationship: formData.emergencyContactRelationship,
            },
          },
          documents: documentUrls,
          additional_info: {
            moveInDate: formData.moveInDate,
            leaseDuration: formData.leaseDuration,
            pets: formData.pets,
            smoking: formData.smoking,
            additionalInfo: formData.additionalInfo,
          },
        })
        .select()
        .single()
      
      if (error) throw error
      
      toast.success('Application Submitted!', {
        description: 'Your application has been sent to the landlord. You will be notified of their response.',
        duration: 5000,
      })
      
      // Redirect to applications page
      setTimeout(() => {
        router.push('/dashboard/applications')
      }, 2000)
      
    } catch (error: any) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application', {
        description: error.message || 'Please try again later',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || loadingProperty) {
    return (
      <div className="min-h-screen bg-warm-ivory-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading application form...</p>
        </div>
      </div>
    )
  }

  const progress = (currentStep / 5) * 100

  return (
    <div className="min-h-screen bg-warm-ivory-gradient py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/properties/${propertyId}`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Property
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Rental Application</h1>
              {property && (
                <p className="text-slate-600">
                  Applying for: <span className="font-semibold text-slate-900">{property.title}</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Step {currentStep} of 5</p>
              <p className="text-lg font-bold text-orange-600">{steps[currentStep - 1].title}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                    ${isCompleted ? 'bg-green-600 text-white' : 
                      isActive ? 'bg-orange-600 text-white' : 
                      'bg-slate-200 text-slate-400'}
                  `}>
                    {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <p className={`text-xs font-medium hidden sm:block ${
                    isActive ? 'text-orange-600' : 'text-slate-600'
                  }`}>
                    {step.title}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Steps */}
        <Card className="border-0 luxury-shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[currentStep - 1].description}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <PersonalInfoStep
                formData={formData}
                errors={errors}
                onChange={handleInputChange}
              />
            )}
            
            {currentStep === 2 && (
              <EmploymentStep
                formData={formData}
                errors={errors}
                onChange={handleInputChange}
              />
            )}
            
            {currentStep === 3 && (
              <ReferencesStep
                formData={formData}
                errors={errors}
                onChange={handleInputChange}
              />
            )}
            
            {currentStep === 4 && (
              <DocumentsStep
                formData={formData}
                errors={errors}
                onFileChange={handleFileChange}
              />
            )}
            
            {currentStep === 5 && (
              <ReviewStep
                formData={formData}
                errors={errors}
                onChange={handleInputChange}
                property={property}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  variant="outline"
                  className="px-8 py-3 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              ) : (
                <div></div>
              )}

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 luxury-gradient-button text-white rounded-xl font-semibold"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 luxury-gradient-button text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
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

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>Need help? Contact our support team at <a href="mailto:support@nuloafrica.com" className="text-orange-600 hover:underline">support@nuloafrica.com</a></p>
        </div>
      </div>
    </div>
  )
}
