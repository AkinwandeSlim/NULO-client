"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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

export default function EditPropertyPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
  })

  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const propertyId = params.id as string

  useEffect(() => {
    fetchProperty()
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const data = await propertiesAPI.getById(propertyId)
      
      setFormData({
        title: data.title || '',
        description: data.description || '',
        property_type: data.property_type || '',
        location: data.location || '',
        address: data.address || '',
        rent_amount: data.rent_amount?.toString() || data.price?.toString() || '',
        bedrooms: data.bedrooms?.toString() || data.beds?.toString() || '',
        bathrooms: data.bathrooms?.toString() || data.baths?.toString() || '',
        square_feet: data.square_feet?.toString() || data.sqft?.toString() || '',
        amenities: data.amenities || [],
        status: data.status || 'vacant',
        availability_start: data.availability_start || '',
      })
    } catch (error: any) {
      console.error('Failed to fetch property:', error)
      toast.error(error.message || 'Failed to load property')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.property_type || !formData.location || !formData.rent_amount) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)

      const updateData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        location: formData.location,
        address: formData.address,
        price: parseInt(formData.rent_amount),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
        amenities: formData.amenities,
        status: formData.status,
        availability_start: formData.availability_start || undefined,
      }

      await propertiesAPI.update(propertyId, updateData)

      toast.success('Property updated successfully!')
      router.push(`/landlord/properties/${propertyId}`)
    } catch (error: any) {
      console.error('Failed to update property:', error)
      toast.error(error.message || 'Failed to update property')
    } finally {
      setSaving(false)
    }
  }

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading property...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/landlord/properties/${propertyId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Property</h1>
          <p className="text-slate-600">Update your property details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
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
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
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
        <Card>
          <CardHeader>
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
                  onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
                  placeholder="1200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
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

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href={`/landlord/properties/${propertyId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="bg-orange-500 hover:bg-orange-600"
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
  )
}
