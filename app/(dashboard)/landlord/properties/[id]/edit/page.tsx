"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
]

const AMENITIES_OPTIONS = [
  'WiFi',
  'Parking',
  'Gym',
  '24/7 Security',
  'Air Conditioning',
  'Cable TV',
  'Full Kitchen',
  'Pet Friendly',
  'Swimming Pool',
  'Generator',
  'Balcony',
  'Elevator',
]

// Must stay in sync with DB CHECK constraint in
// docs/sql/migrations/001_add_payment_frequency_to_properties.sql:
//   ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL')
const PAYMENT_FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly', hint: 'Every month' },
  { value: 'QUARTERLY', label: 'Quarterly', hint: 'Every 3 months' },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual', hint: 'Every 6 months' },
  { value: 'ANNUAL', label: 'Annual', hint: 'Once a year' },
] as const

export default function EditPropertyPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasInitialLoadRef] = useState({ current: false })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: '',
    location: '',
    address: '',
    rent_amount: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    amenities: [] as string[],
    status: 'vacant',
    availability_start: '',
    payment_frequency: 'MONTHLY',
  })

  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const { user } = useAuth()
  const propertyId =  (params?.id as string) || ""

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setLoading(false)
      return
    }

    try {
      console.log('🔍 [EDIT PROPERTY] Starting fetch for:', propertyId)
      const data = await propertiesAPI.getById(propertyId)
      console.log('✅ [EDIT PROPERTY] Property data received:', data)
      
      // Handle date formatting for availability_start (YYYY-MM-DD)
      let formattedDate = ''
      if (data.available_from) {
        const dateObj = new Date(data.available_from)
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0]
        }
      }
      
      setFormData({
        title: data.title || '',
        description: data.description || '',
        property_type: data.property_type || '',
        location: data.location || '',
        address: data.full_address || data.address || data.location || '',
        rent_amount: (data.price || 0).toString(),
        bedrooms: (data.beds || 0).toString(),
        bathrooms: (data.baths || 0).toString(),
        square_feet: (data.sqft || 0).toString(),
        amenities: data.amenities || [],
        status: data.status || 'vacant',
        availability_start: formattedDate,
        payment_frequency: data.payment_frequency || 'MONTHLY',
      })
    } catch (error: any) {
      console.error('❌ [EDIT PROPERTY] Failed to fetch property:', error)
      toast.error(error.message || 'Failed to load property')
    } finally {
      console.log('✅ [EDIT PROPERTY] Fetch completed, setting loading to false')
      setLoading(false)
      hasInitialLoadRef.current = true
    }
  }, [propertyId])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.property_type || !formData.location || !formData.rent_amount) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)

      // Send as JSON (backend now accepts JSON body, not FormData)
      const updateData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        location: formData.location,
        address: formData.address,
        price: parseInt(formData.rent_amount) || 0,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        sqft: formData.square_feet ? parseInt(formData.square_feet) : undefined,
        amenities: formData.amenities,
        status: formData.status,
        available_from: formData.availability_start || undefined,
        payment_frequency: formData.payment_frequency,
      }

      //region debug-point H1-formdata-sent
      // Debug: Log JSON being sent
      console.log('🔍 [EDIT-PAGE] JSON being sent:', updateData)

      // Report to debug server
      fetch('http://127.0.0.1:7778/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesisId: 'H1',
          stage: 'frontend-submit',
          propertyId,
          updateData,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {})
      //endregion debug-point H1-formdata-sent

      await propertiesAPI.update(propertyId, updateData)

      //region debug-point H3-cache-invalidated
      // Debug: Verify cache invalidation happens
      fetch('http://127.0.0.1:7778/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesisId: 'H3',
          stage: 'after-api-call',
          propertyId,
          message: 'API call completed, cache should be invalidated',
          timestamp: new Date().toISOString()
        })
      }).catch(() => {})
      //endregion debug-point H3-cache-invalidated

      toast.success('Property updated successfully!')
      router.push(`/landlord/properties/${propertyId}`)
    } catch (error: any) {
      console.error('❌ Failed to update property:', error)

      //region debug-point H2-backend-error
      // Debug: Log error details
      fetch('http://127.0.0.1:7778/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesisId: 'H2',
          stage: 'update-failed',
          propertyId,
          error: error.message,
          status: error.response?.status,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {})
      //endregion debug-point H2-backend-error

      toast.error(error.message || 'Failed to update property')
    } finally {
      setSaving(false)
    }
  }

  // Handle number input formatting (remove leading zeros, no scroll)
  const handleNumberChange = (field: keyof typeof formData, value: string) => {
    // Remove all non-digit characters except for an optional single decimal point
    const cleanedValue = value.replace(/[^\d]/g, '')
    
    // Remove leading zeros
    let formattedValue = cleanedValue.replace(/^0+(?!$)/, '')
    
    // If empty, allow it
    if (formattedValue === '') {
      setFormData({ ...formData, [field]: '' })
      return
    }
    
    setFormData({ ...formData, [field]: formattedValue })
  }

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  // Show loading state while fetching property data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading property...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      {/* Hide number input scrollbars */}
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header — matches viewings and application detail page pattern */}
        <div className="mb-8">
          <Link href={`/landlord/properties/${propertyId}`}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Property
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                Edit Property
              </h1>
              <p className="text-slate-600">
                Update your property details and settings
              </p>
            </div>
            {/* Save button also lives here as the primary action */}
            <Button
              type="submit"
              form="edit-property-form"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Form — add id so the header Save button can submit it */}
        <form id="edit-property-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Modern 2BR Apartment in Victoria Island"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your property..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant — Available for rent</SelectItem>
                    <SelectItem value="occupied">Occupied — Currently rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance — Temporarily unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Victoria Island, Lagos"
                required
              />
            </div>

            <div>
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rent_amount">Rent Amount (₦) *</Label>
                <Input
                  id="rent_amount"
                  type="number"
                  value={formData.rent_amount}
                  onChange={(e) => handleNumberChange('rent_amount', e.target.value)}
                  placeholder="50000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="availability_start">Available From</Label>
                <Input
                  id="availability_start"
                  type="date"
                  value={formData.availability_start}
                  onChange={(e) => setFormData({ ...formData, availability_start: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 font-medium">Payment Frequency</Label>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                How often do you collect rent? Tenants will see this and the FULL_PAYMENT threshold updates automatically.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PAYMENT_FREQUENCY_OPTIONS.map((opt) => {
                  const isSelected = formData.payment_frequency === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_frequency: opt.value })}
                      className={
                        'p-3 rounded-xl border-2 text-left transition ' +
                        (isSelected
                          ? 'border-orange-500 shadow-lg bg-gradient-to-br from-orange-50 to-white'
                          : 'border-slate-200 hover:border-orange-300 bg-white')
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className={'text-sm font-semibold ' + (isSelected ? 'text-orange-700' : 'text-slate-700')}>
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span className="text-orange-500 text-xs">✓</span>
                        )}
                      </div>
                      <p className={'text-xs mt-1 ' + (isSelected ? 'text-orange-600' : 'text-slate-400')}>
                        {opt.hint}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleNumberChange('bedrooms', e.target.value)}
                  placeholder="2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleNumberChange('bathrooms', e.target.value)}
                  placeholder="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="square_feet">Square Feet</Label>
                <Input
                  id="square_feet"
                  type="number"
                  value={formData.square_feet}
                  onChange={(e) => handleNumberChange('square_feet', e.target.value)}
                  placeholder="1200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {AMENITIES_OPTIONS.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityToggle(amenity)}
                  />
                  <label
                    htmlFor={amenity}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom actions row — keep Cancel and Save for convenience */}
        <div className="flex items-center justify-between">
          <Link href={`/landlord/properties/${propertyId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
        </form>

      </div>
    </div>
  )
}
