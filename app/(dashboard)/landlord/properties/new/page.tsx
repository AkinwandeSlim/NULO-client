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
import { LocationSelector } from "@/components/forms/LocationSelector"
import { 
  ArrowLeft, ArrowRight, Upload, X, MapPin, 
  Home, Building2, DollarSign, Bed, Bath, Square,
  Wifi, Car, Dumbbell, Shield, Wind, Tv, Coffee,
  Dog, Waves, Zap, Check, CheckCircle
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
  city: string  // City name (from LocationSelector)
  state: string // State code
  country: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  amenities: string[]
  images: File[]
  available_from: string
}

export default function AddPropertyPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    property_type: '',
    city: '',
    state: '',
    country: 'Nigeria',
    address: '',
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 0,
    amenities: [],
    images: [],
    available_from: ''
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
        return !!(formData.city && formData.state && formData.address)
      case 3:
        return formData.price > 0
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
      submitData.append('city', formData.city)
      submitData.append('state', formData.state)
      submitData.append('country', formData.country)
      submitData.append('address', formData.address)
      submitData.append('price', String(formData.price))
      submitData.append('beds', String(formData.bedrooms))
      submitData.append('baths', String(formData.bathrooms))
      
      // Add optional fields
      if (formData.sqft) {
        submitData.append('sqft', String(formData.sqft))
      }
      
      if (formData.available_from) {
        submitData.append('available_from', formData.available_from)
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
                  <Label htmlFor="title" className="text-slate-700 font-medium">Property Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Modern 2BR Apartment in Victoria Island"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className="mt-2 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700 font-medium">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your property in detail..."
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={4}
                    className="mt-2 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium">Property Type *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {PROPERTY_TYPES.map((type) => {
                      const Icon = type.icon
                      const isSelected = formData.property_type === type.id
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => updateFormData('property_type', type.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                            isSelected
                              ? 'border-2 border-orange-500 shadow-2xl bg-gradient-to-br from-orange-50 to-white'
                              : 'border-2 border-slate-200 hover:border-orange-300 bg-white'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-orange-700' : 'text-slate-700'
                          }`}>{type.label}</span>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-orange-500 ml-auto" />
                          )}
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
                {/* Location Selector Component */}
                <LocationSelector
                  selectedState={formData.state}
                  selectedCity={formData.city}
                  onStateChange={(state) => updateFormData('state', state)}
                  onCityChange={(city) => updateFormData('city', city)}
                  onCityNameChange={(cityName) => {
                    // Update city field with the actual city name
                    if (cityName) {
                      updateFormData('city', cityName)
                    }
                  }}
                  required={true}
                />

                <div>
                  <Label htmlFor="address" className="text-slate-700 font-medium">Full Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter the complete address..."
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    rows={3}
                    className="mt-2 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
                  />
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-3 text-orange-700">
                    <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Location will be shown on map after submission</span>
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
                  <Label htmlFor="price" className="text-slate-700 font-medium">Monthly Rent (₦) *</Label>
                  <div className="relative mt-2">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">₦</span>
                      </div>
                    </div>
                    <Input
                      id="price"
                      type="number"
                      placeholder="e.g., 500000"
                      value={formData.price || ''}
                      onChange={(e) => updateFormData('price', parseInt(e.target.value) || 0)}
                      className="pl-12 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="available_from" className="text-slate-700 font-medium">Available From</Label>
                  <Input
                    id="available_from"
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => updateFormData('available_from', e.target.value)}
                    className="mt-2 border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
                  />
                </div>

                {formData.price > 0 && (
                  <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-orange-800">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Monthly Rent: ₦{formData.price.toLocaleString()}</p>
                        <p className="text-sm text-orange-600 mt-1">
                          Annual: ₦{(formData.price * 12).toLocaleString()}
                        </p>
                      </div>
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
                  <Label className="text-slate-700 font-medium">Basic Features *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="bedrooms" className="text-sm text-slate-600 font-medium">Bedrooms</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Bed className="h-4 w-4 text-orange-500" />
                        </div>
                        <Input
                          id="bedrooms"
                          type="number"
                          min="0"
                          value={formData.bedrooms}
                          onChange={(e) => updateFormData('bedrooms', parseInt(e.target.value) || 0)}
                          className="border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bathrooms" className="text-sm text-slate-600 font-medium">Bathrooms</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Bath className="h-4 w-4 text-orange-500" />
                        </div>
                        <Input
                          id="bathrooms"
                          type="number"
                          min="0"
                          value={formData.bathrooms}
                          onChange={(e) => updateFormData('bathrooms', parseInt(e.target.value) || 0)}
                          className="border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="sqft" className="text-sm text-slate-600 font-medium">Square Feet</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Square className="h-4 w-4 text-orange-500" />
                        </div>
                        <Input
                          id="sqft"
                          type="number"
                          min="0"
                          placeholder="Optional"
                          value={formData.sqft || ''}
                          onChange={(e) => updateFormData('sqft', parseInt(e.target.value) || 0)}
                          className="border-2 border-slate-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <Label className="text-slate-700 font-medium">Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                    {AMENITIES.map((amenity) => {
                      const Icon = amenity.icon
                      const isSelected = formData.amenities.includes(amenity.id)
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                            isSelected
                              ? 'border-2 border-orange-500 shadow-2xl bg-gradient-to-br from-orange-50 to-white'
                              : 'border-2 border-slate-200 hover:border-orange-300 bg-white'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-orange-700' : 'text-slate-700'
                          }`}>{amenity.label}</span>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-orange-500 ml-auto" />
                          )}
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
                <div className="border-2 border-dashed border-orange-300 rounded-2xl p-8 text-center bg-gradient-to-br from-orange-50 to-white">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-orange-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Upload Property Photos</h4>
                  <p className="text-slate-600 mb-4">Showcase your property with high-quality images</p>
                  <p className="text-sm text-slate-500 mb-6">Maximum 10 images, JPG or PNG format</p>
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
                    className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div>
                    <Label className="text-slate-700 font-medium">Uploaded Images ({formData.images.length}/10)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-3">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-200">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Property ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2">
                              <Badge className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-lg">
                                Cover Photo
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 p-4 rounded-2xl mt-4">
                      <div className="flex items-center gap-3 text-orange-700">
                        <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">The first image will be used as the cover photo</span>
                      </div>
                    </div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/landlord/properties">
            <Button variant="ghost" size="sm" className="text-slate-700 hover:text-orange-600 hover:bg-orange-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Add New Property</h1>
            <p className="text-slate-700 mt-1">List your property for rent with our premium platform</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-orange-600">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-2 border-slate-200 rounded-2xl shadow-lg bg-white">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-2 border-slate-300 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < totalSteps ? (
              <Button 
                onClick={nextStep}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !validateStep(currentStep)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Property
                    <Building2 className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
