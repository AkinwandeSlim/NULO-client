"use client"

import { useState, useEffect } from 'react'
import { FileText, Upload, User, Phone, Mail, Briefcase, DollarSign, Calendar, CheckCircle2, AlertCircle, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { applicationsAPI } from '@/lib/api/applications'
import { formatPrice } from '@/lib/utils/format'

interface ApplicationFormProps {
  property: any
  viewingRequest?: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: (application: any) => void
  user?: any
}

interface FormData {
  // Personal Information
  full_name: string
  email: string
  phone_number: string
  current_address: string
  
  // Employment Information
  employment_status: 'employed' | 'self_employed' | 'business_owner' | 'student' | 'unemployed' | 'retired'
  company_name: string
  job_title: string
  monthly_income: string
  employment_duration: string
  
  // Rental History
  current_rent: string
  reason_for_moving: string
  previous_landlord_contact: string
  
  // References
  reference_name: string
  reference_phone: string
  reference_relationship: string
  
  // Additional Information
  move_in_date: string
  lease_duration: string
  pets: boolean
  pet_details: string
  special_requests: string
  
  // Documents
  id_document: File | null
  proof_of_income: File | null
  reference_letter: File | null
}

const EMPLOYMENT_STATUSES = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'student', label: 'Student' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' }
]

const LEASE_DURATIONS = [
  { value: '6', label: '6 months' },
  { value: '12', label: '1 year' },
  { value: '18', label: '1.5 years' },
  { value: '24', label: '2 years' }
]

export default function ApplicationForm({
  property,
  viewingRequest,
  isOpen,
  onClose,
  onSuccess,
  user
}: ApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({})
  
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    current_address: '',
    
    // Employment Information
    employment_status: 'employed',
    company_name: '',
    job_title: '',
    monthly_income: '',
    employment_duration: '',
    
    // Rental History
    current_rent: '',
    reason_for_moving: '',
    previous_landlord_contact: '',
    
    // References
    reference_name: '',
    reference_phone: '',
    reference_relationship: '',
    
    // Additional Information
    move_in_date: '',
    lease_duration: '12',
    pets: false,
    pet_details: '',
    special_requests: '',
    
    // Documents
    id_document: null,
    proof_of_income: null,
    reference_letter: null
  })

  const totalSteps = 5
  const progressPercentage = (currentStep / totalSteps) * 100

  const handleInputChange = (field: keyof FormData, value: string | boolean | File) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (field: keyof FormData, file: File) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and PDF files are allowed')
      return
    }

    setUploadedFiles(prev => ({ ...prev, [field]: file }))
    setFormData(prev => ({ ...prev, [field]: file }))
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Personal Information
        return !!(formData.full_name.trim() && 
                 formData.email.trim() && 
                 formData.phone_number.trim() && 
                 formData.current_address.trim())
      
      case 2: // Employment Information
        if (formData.employment_status === 'student' || formData.employment_status === 'unemployed') {
          return true // Skip employment validation for students/unemployed
        }
        return !!(formData.company_name.trim() && 
                 formData.job_title.trim() && 
                 formData.monthly_income.trim())
      
      case 3: // Rental History
        return !!(formData.current_rent.trim() && 
                 formData.reason_for_moving.trim())
      
      case 4: // References
        return !!(formData.reference_name.trim() && 
                 formData.reference_phone.trim() && 
                 formData.reference_relationship.trim())
      
      case 5: // Documents & Final
        return !!(formData.move_in_date && 
                 formData.lease_duration)
      
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      toast.error('Please fill in all required fields')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateCurrentStep()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare application data
      const applicationData = {
        property_id: property.id,
        personal_info: {
          firstName: formData.full_name.split(' ')[0] || '',
          lastName: formData.full_name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone_number,
          dateOfBirth: '',
          nationality: '',
          maritalStatus: '',
          dependents: ''
        },
        employment_info: {
          employmentStatus: formData.employment_status,
          employer: formData.company_name,
          jobTitle: formData.job_title,
          monthlyIncome: formData.monthly_income,
          employmentDuration: formData.employment_duration,
          previousEmployer: ''
        },
        references: {
          reference1: {
            name: formData.reference_name,
            phone: formData.reference_phone,
            relationship: formData.reference_relationship
          },
          emergencyContact: {
            name: formData.reference_name,
            phone: formData.reference_phone,
            relationship: formData.reference_relationship
          }
        },
        additional_info: {
          moveInDate: formData.move_in_date,
          leaseDuration: formData.lease_duration,
          pets: formData.pets ? 'yes' : 'no',
          smoking: 'no',
          additionalInfo: formData.special_requests
        }
      }

      // Submit application
      const response = await applicationsAPI.create(applicationData, {
        idDocument: uploadedFiles.id_document!,
        proofOfIncome: uploadedFiles.proof_of_income!,
        bankStatement: uploadedFiles.bank_statement || undefined,
        employmentLetter: uploadedFiles.reference_letter || undefined,
      })
      
      if (response) {
        // Upload documents if any
        const documentUploads = []
        
        if (uploadedFiles.id_document) {
          documentUploads.push(
            uploadDocument(response.id, 'id_document', uploadedFiles.id_document)
          )
        }
        
        if (uploadedFiles.proof_of_income) {
          documentUploads.push(
            uploadDocument(response.id, 'proof_of_income', uploadedFiles.proof_of_income)
          )
        }
        
        if (uploadedFiles.reference_letter) {
          documentUploads.push(
            uploadDocument(response.id, 'reference_letter', uploadedFiles.reference_letter)
          )
        }

        // Wait for all document uploads to complete
        await Promise.allSettled(documentUploads)

        toast.success('Application submitted successfully!')
        onSuccess?.(response)
        onClose()
        
        // Reset form
        setCurrentStep(1)
        setUploadedFiles({})
      } else {
        toast.error('Failed to submit application')
      }
    } catch (error: any) {
      console.error('Application submission error:', error)
      toast.error(error.message || 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const uploadDocument = async (applicationId: string, documentType: string, file: File) => {
    try {
      // TODO: Implement document upload API
      console.log(`Uploading ${documentType} for application ${applicationId}:`, file.name)
    } catch (error) {
      console.error(`Failed to upload ${documentType}:`, error)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="08012345678"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_address">Current Address *</Label>
                <Textarea
                  id="current_address"
                  value={formData.current_address}
                  onChange={(e) => handleInputChange('current_address', e.target.value)}
                  placeholder="Enter your current residential address"
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Employment Status *</Label>
                <RadioGroup
                  value={formData.employment_status}
                  onValueChange={(value) => handleInputChange('employment_status', value)}
                >
                  {EMPLOYMENT_STATUSES.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={status.value} id={status.value} />
                      <Label htmlFor={status.value} className="cursor-pointer">
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {formData.employment_status !== 'student' && formData.employment_status !== 'unemployed' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name" className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Company Name *
                      </Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        placeholder="Your company name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title *</Label>
                      <Input
                        id="job_title"
                        value={formData.job_title}
                        onChange={(e) => handleInputChange('job_title', e.target.value)}
                        placeholder="Your job title"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly_income" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Monthly Income *
                      </Label>
                      <Input
                        id="monthly_income"
                        value={formData.monthly_income}
                        onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                        placeholder="₦0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employment_duration">Employment Duration</Label>
                      <Input
                        id="employment_duration"
                        value={formData.employment_duration}
                        onChange={(e) => handleInputChange('employment_duration', e.target.value)}
                        placeholder="e.g., 2 years, 6 months"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_rent" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Current Monthly Rent *
                </Label>
                <Input
                  id="current_rent"
                  value={formData.current_rent}
                  onChange={(e) => handleInputChange('current_rent', e.target.value)}
                  placeholder="₦0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason_for_moving">Reason for Moving *</Label>
                <Textarea
                  id="reason_for_moving"
                  value={formData.reason_for_moving}
                  onChange={(e) => handleInputChange('reason_for_moving', e.target.value)}
                  placeholder="Please explain why you're looking for a new place"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_landlord_contact">Previous Landlord Contact (Optional)</Label>
                <Input
                  id="previous_landlord_contact"
                  value={formData.previous_landlord_contact}
                  onChange={(e) => handleInputChange('previous_landlord_contact', e.target.value)}
                  placeholder="Name and phone number"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reference_name">Reference Name *</Label>
                <Input
                  id="reference_name"
                  value={formData.reference_name}
                  onChange={(e) => handleInputChange('reference_name', e.target.value)}
                  placeholder="Full name of your reference"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_phone">Reference Phone Number *</Label>
                <Input
                  id="reference_phone"
                  type="tel"
                  value={formData.reference_phone}
                  onChange={(e) => handleInputChange('reference_phone', e.target.value)}
                  placeholder="08012345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_relationship">Relationship *</Label>
                <Input
                  id="reference_relationship"
                  value={formData.reference_relationship}
                  onChange={(e) => handleInputChange('reference_relationship', e.target.value)}
                  placeholder="e.g., Employer, Colleague, Family Friend"
                  required
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="move_in_date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Preferred Move-in Date *
                  </Label>
                  <Input
                    id="move_in_date"
                    type="date"
                    value={formData.move_in_date}
                    onChange={(e) => handleInputChange('move_in_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lease Duration *</Label>
                  <Select value={formData.lease_duration} onValueChange={(value) => handleInputChange('lease_duration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lease duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEASE_DURATIONS.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pets"
                    checked={formData.pets}
                    onChange={(e) => handleInputChange('pets', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="pets">Do you have pets?</Label>
                </div>
                
                {formData.pets && (
                  <div className="space-y-2">
                    <Label htmlFor="pet_details">Pet Details</Label>
                    <Textarea
                      id="pet_details"
                      value={formData.pet_details}
                      onChange={(e) => handleInputChange('pet_details', e.target.value)}
                      placeholder="Please describe your pets (type, size, number)"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_requests">Special Requests (Optional)</Label>
                <Textarea
                  id="special_requests"
                  value={formData.special_requests}
                  onChange={(e) => handleInputChange('special_requests', e.target.value)}
                  placeholder="Any special requirements or requests for the property"
                  rows={3}
                />
              </div>

              {/* Document Uploads */}
              <div className="space-y-4">
                <h3 className="font-medium">Supporting Documents (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="id_document" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      ID Document
                    </Label>
                    <Input
                      id="id_document"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('id_document', e.target.files[0])}
                      className="file:mr-2 file:py-1 file:px-2"
                    />
                    {uploadedFiles.id_document && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {uploadedFiles.id_document.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proof_of_income">Proof of Income</Label>
                    <Input
                      id="proof_of_income"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('proof_of_income', e.target.files[0])}
                      className="file:mr-2 file:py-1 file:px-2"
                    />
                    {uploadedFiles.proof_of_income && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {uploadedFiles.proof_of_income.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference_letter">Reference Letter</Label>
                    <Input
                      id="reference_letter"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('reference_letter', e.target.files[0])}
                      className="file:mr-2 file:py-1 file:px-2"
                    />
                    {uploadedFiles.reference_letter && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {uploadedFiles.reference_letter.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    const titles = [
      'Personal Information',
      'Employment Information',
      'Rental History',
      'References',
      'Documents & Final Details'
    ]
    return titles[currentStep - 1]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Rental Application - {property.title}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-gray-600">{getStepTitle()}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Property Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
              {property.images?.[0] && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{property.title}</h3>
              <p className="text-sm text-gray-600">{property.location}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="font-semibold text-orange-600">
                  {formatPrice(property.price)}/month
                </span>
                <span className="text-gray-600">
                  {property.beds} bed{property.beds !== 1 ? 's' : ''}
                </span>
                {viewingRequest && (
                  <Badge variant="outline" className="text-green-600">
                    Viewing Scheduled
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex-1"
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting Application...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Application Information:</p>
              <ul className="space-y-1 text-xs">
                <li>• All information will be verified by the landlord</li>
                <li>• You can track your application status in your dashboard</li>
                <li>• Documents are securely stored and only shared with the landlord</li>
                <li>• This application does not guarantee the property</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
