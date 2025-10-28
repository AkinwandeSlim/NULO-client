"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, ArrowRight, Upload, X, MapPin, 
  Home, Building2, DollarSign, Bed, Bath, Square,
  Wifi, Car, Dumbbell, Shield, Wind, Tv, Coffee,
  Dog, Waves, Zap, Check
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"

// Property types
const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: Building2 },
  { id: 'house', label: 'House', icon: Home },
  { id: 'condo', label: 'Condo', icon: Building2 },
  { id: 'townhouse', label: 'Townhouse', icon: Home },
  { id: 'studio', label: 'Studio', icon: Building2 },
  { id: 'duplex', label: 'Duplex', icon: Home }
]

// Amenities
const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'security', label: '24/7 Security', icon: Shield },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'tv', label: 'Cable TV', icon: Tv },
  { id: 'kitchen', label: 'Full Kitchen', icon: Coffee },
  { id: 'pets', label: 'Pet Friendly', icon: Dog },
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'generator', label: 'Generator', icon: Zap }
]

interface PropertyFormData {
  title: string
  description: string
  property_type: string
  location: string
  address: string
  rent_amount: number
  bedrooms: number
  bathrooms: number
  square_feet: number
  amenities: string[]
  images: File[]
  availability_start: string
}

export default function AddPropertyPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    property_type: '',
    location: '',
    address: '',
    rent_amount: 0,
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 0,
    amenities: [],
    images: [],
    availability_start: ''
  })

  const totalSteps = 5

  // Update form data
  const updateFormData = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle amenity toggle
  const toggleAmenity = (amenityId: string) => {
    const amenities = formData.amenities.includes(amenityId)
      ? formData.amenities.filter(id => id !== amenityId)
      : [...formData.amenities, amenityId]
    updateFormData('amenities', amenities)
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.images.length > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }
    updateFormData('images', [...formData.images, ...files])
  }

  // Remove image
  const removeImage = (index: number) => {
    const images = formData.images.filter((_, i) => i !== index)
    updateFormData('images', images)
  }

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.property_type)
      case 2:
        return !!(formData.location && formData.address)
      case 3:
        return formData.rent_amount > 0
      case 4:
        return formData.bedrooms > 0 && formData.bathrooms > 0
      case 5:
        return formData.images.length > 0
      default:
        return true
    }
  }

  // Go to next step
  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields')
      return
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Go to previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add required fields (matching backend Form parameters)
      submitData.append('title', formData.title)
      submitData.append('description', formData.description)
      submitData.append('property_type', formData.property_type)
      submitData.append('location', formData.location)
      submitData.append('address', formData.address)
      submitData.append('rent_amount', String(formData.rent_amount))
      submitData.append('bedrooms', String(formData.bedrooms))
      submitData.append('bathrooms', String(formData.bathrooms))
      
      // Add optional fields
      if (formData.square_feet) {
        submitData.append('square_feet', String(formData.square_feet))
      }
      
      if (formData.availability_start) {
        submitData.append('availability_start', formData.availability_start)
      }
      
      // Add amenities as JSON string
      submitData.append('amenities', JSON.stringify(formData.amenities))
      
      // Add images
      formData.images.forEach((image) => {
        submitData.append('images', image)
      })

      // Debug: Log what we're sending
      console.log('📤 Submitting property data:')
      for (let [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File: ${value.name}]`)
        } else {
          console.log(`  ${key}: ${value}`)
        }
      }

      // Submit to API
      await propertiesAPI.create(submitData)
      
      toast.success('🎉 Property listed successfully!')
      router.push('/landlord/properties')
      
    } catch (error: any) {
      console.error('Failed to create property:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create property'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Modern 2BR Apartment in Victoria Island"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your property in detail..."
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Property Type *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {PROPERTY_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => updateFormData('property_type', type.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            formData.property_type === type.id
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-slate-200 hover:border-orange-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Location</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">City/Area *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Lagos, Victoria Island"
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Full Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter the complete address..."
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Location will be shown on map after submission</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Pricing</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rent_amount">Monthly Rent (₦) *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="rent_amount"
                      type="number"
                      placeholder="0"
                      value={formData.rent_amount || ''}
                      onChange={(e) => updateFormData('rent_amount', parseInt(e.target.value) || 0)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="availability_start">Available From</Label>
                  <Input
                    id="availability_start"
                    type="date"
                    value={formData.availability_start}
                    onChange={(e) => updateFormData('availability_start', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {formData.rent_amount > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-green-800">
                      <p className="font-medium">Monthly Rent: ₦{formData.rent_amount.toLocaleString()}</p>
                      <p className="text-sm text-green-600 mt-1">
                        Annual: ₦{(formData.rent_amount * 12).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Features & Amenities</h3>
              
              <div className="space-y-6">
                {/* Basic Features */}
                <div>
                  <Label>Basic Features *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="bedrooms" className="text-sm">Bedrooms</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Bed className="h-4 w-4 text-slate-500" />
                        <Input
                          id="bedrooms"
                          type="number"
                          min="0"
                          value={formData.bedrooms}
                          onChange={(e) => updateFormData('bedrooms', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bathrooms" className="text-sm">Bathrooms</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Bath className="h-4 w-4 text-slate-500" />
                        <Input
                          id="bathrooms"
                          type="number"
                          min="0"
                          value={formData.bathrooms}
                          onChange={(e) => updateFormData('bathrooms', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="square_feet" className="text-sm">Square Feet</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Square className="h-4 w-4 text-slate-500" />
                        <Input
                          id="square_feet"
                          type="number"
                          min="0"
                          placeholder="Optional"
                          value={formData.square_feet || ''}
                          onChange={(e) => updateFormData('square_feet', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <Label>Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                    {AMENITIES.map((amenity) => {
                      const Icon = amenity.icon
                      const isSelected = formData.amenities.includes(amenity.id)
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-slate-200 hover:border-orange-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{amenity.label}</span>
                          {isSelected && <Check className="h-3 w-3 ml-auto" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Property Photos</h3>
              
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 mb-2">Upload property photos</p>
                  <p className="text-sm text-slate-500 mb-4">Maximum 10 images, JPG or PNG format</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    Choose Files
                  </Button>
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div>
                    <Label>Uploaded Images ({formData.images.length}/10)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Property ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {index === 0 && (
                            <Badge className="absolute bottom-1 left-1 text-xs bg-orange-500">
                              Cover
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      The first image will be used as the cover photo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/landlord/properties">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add New Property</h1>
            <p className="text-slate-600">List your property for rent</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-slate-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !validateStep(currentStep)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading ? 'Creating...' : 'Create Property'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
