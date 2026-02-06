"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Building, Plus, Check, CheckCircle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { useOnboarding } from "@/hooks/useOnboarding"

export default function LandlordOnboardingStep3() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { saveStep3, isProcessing, step3Data } = useOnboarding()

  const [properties, setProperties] = useState([
    {
      address: '',
      type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      rent_amount: 0,
      description: '',
      images: [] as string[],
      ownership_document: '',
    }
  ])

  // ✅ LOAD SAVED DATA ON MOUNT
  useEffect(() => {
    console.log('📂 [STEP 3] Loading saved property data...')
    
    // Try to load from hook first
    if (step3Data) {
      console.log('✅ [STEP 3] Loading from hook:', step3Data)
      setProperties([{
        address: step3Data.property_address || '',
        type: step3Data.property_type || 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        rent_amount: 0,
        description: '',
        images: step3Data.property_images || [],
        ownership_document: step3Data.property_ownership_proof || '',
      }])
    } else {
      // Fallback to localStorage
      const savedDraft = localStorage.getItem('onboarding_step3_draft')
      if (savedDraft) {
        try {
          const data = JSON.parse(savedDraft)
          console.log('✅ [STEP 3] Loading from localStorage:', data)
          setProperties(data)
        } catch (error) {
          console.error('❌ [STEP 3] Error loading saved data:', error)
        }
      }
    }
  }, [step3Data])

  // ✅ AUTO-SAVE: Save form data on every change
  useEffect(() => {
    if (properties.length > 0 && (properties[0].address || properties[0].type)) {
      localStorage.setItem('onboarding_step3_autosave', JSON.stringify(properties))
    }
  }, [properties])

  // ✅ RESTORE: Load auto-saved data on mount
  useEffect(() => {
    const autoSaved = localStorage.getItem('onboarding_step3_autosave')
    if (autoSaved && !step3Data) {
      try {
        const data = JSON.parse(autoSaved)
        console.log('📂 [STEP 3] Restoring auto-saved data:', data)
        setProperties(data)
        console.log('✅ [STEP 3] Auto-saved data restored')
      } catch (error) {
        console.error('❌ [STEP 3] Error restoring auto-saved data:', error)
      }
    }
  }, [step3Data])

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
      
      // Check if email is verified
      if (!user.email_verified) {
        toast.error('Please verify your email first')
        router.push('/signup/landlord/confirmation')
        return
      }
      
      // Check if onboarding is already completed
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
              console.log('✅ [STEP 3] Onboarding actually completed, redirecting to overview')
              router.push('/landlord/overview')
              return
            } else {
              console.log('🔄 [STEP 3] Onboarding flag is stale, resetting and continuing...')
              // Reset flag in users table since it's stale
              await supabase
                .from('users')
                .update({ onboarding_completed: false })
                .eq('id', user.id)
            }
          } catch (error) {
            console.error('❌ [STEP 3] Error checking onboarding:', error)
          }
        }
        
        checkOnboardingCompletion()
        return
      }
    }
  }, [user, loading, router])

  const updateProperty = (index: number, field: string, value: any) => {
    setProperties(prev => prev.map((prop: any, i: number) => 
      i === index ? { ...prop, [field]: value } : prop
    ))
    
    // Auto-save to localStorage for better UX
    const updatedProperties = properties.map((prop: any, i: number) => 
      i === index ? { ...prop, [field]: value } : prop
    )
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_step3_draft', JSON.stringify(updatedProperties))
    }
  }

  const addProperty = () => {
    const newProperty = {
      address: '',
      type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      rent_amount: 0,
      description: '',
      images: [] as string[],
      ownership_document: '',
    }
    setProperties(prev => [...prev, newProperty])
    
    // Auto-save to localStorage
    if (typeof window !== 'undefined') {
      const updatedProperties = [...properties, newProperty]
      localStorage.setItem('onboarding_step3_draft', JSON.stringify(updatedProperties))
    }
  }

  const removeProperty = (index: number) => {
    if (properties.length > 1) {
      const updatedProperties = properties.filter((_: any, i: number) => i !== index)
      setProperties(updatedProperties)
      
      // Auto-save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_step3_draft', JSON.stringify(updatedProperties))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('📤 [STEP 3] Submitting property data...')

    // ✅ VALIDATION: Check if at least one property has address
    const hasValidProperty = properties.some(prop => prop.address.trim() !== '')
    if (!hasValidProperty) {
      toast.error('Please add at least one property with an address')
      return
    }

    try {
      // 🚀 SAVE: Use first property for MVP (simplify for now)
      const mainProperty = properties.find(prop => prop.address.trim() !== '') || properties[0]
      
      const success = await saveStep3({
        property_address: mainProperty.address,
        property_type: mainProperty.type,
        property_images: mainProperty.images,
        property_ownership_proof: mainProperty.ownership_document,
      })

      if (success) {
        console.log('✅ [STEP 3] Property data saved successfully')
        toast.success('Property information saved!')
        
        // Navigate to next step
        router.push('/onboarding/landlord/step-4')
      } else {
        console.error('❌ [STEP 3] Failed to save property data')
      }
    } catch (error: any) {
      console.error('❌ [STEP 3] Error:', error)
      toast.error(error.message || 'Failed to save property information')
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
      <Link href="/onboarding/landlord/step-2" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 rounded-lg hover:bg-slate-100 cursor-pointer">
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back</span>
      </Link>

      <div className="w-full max-w-4xl relative z-10">
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
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                <Check className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Documents</span>
            </div>
            <div className="flex-1 h-1 bg-orange-600 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-orange-600">Properties</span>
            </div>
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <span className="ml-2 text-sm font-medium text-slate-500">Bank Details</span>
            </div>
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
            <Building className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Landlord Onboarding</h1>
          <p className="text-slate-600">Step 3: Property Information</p>
        </div>

        <Card className="shadow-lg border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">Add Your Properties</CardTitle>
            <CardDescription>
              Tell us about the properties you want to list on NuloAfrica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Properties List */}
              <div className="space-y-6">
                {properties.map((property, index) => (
                  <Card key={index} className="border border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Home className="h-5 w-5 text-orange-600" />
                        Property {index + 1}
                      </CardTitle>
                      {properties.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeProperty(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`address-${index}`}>Property Address *</Label>
                          <Input
                            id={`address-${index}`}
                            value={property.address}
                            onChange={(e) => updateProperty(index, 'address', e.target.value)}
                            placeholder="Enter property address"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`type-${index}`}>Property Type *</Label>
                          <select
                            id={`type-${index}`}
                            value={property.type}
                            onChange={(e) => updateProperty(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="apartment">Apartment</option>
                            <option value="house">House</option>
                            <option value="studio">Studio</option>
                            <option value="duplex">Duplex</option>
                            <option value="penthouse">Penthouse</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`bedrooms-${index}`}>Bedrooms</Label>
                          <Input
                            id={`bedrooms-${index}`}
                            type="number"
                            min="0"
                            max="20"
                            value={property.bedrooms}
                            onChange={(e) => updateProperty(index, 'bedrooms', parseInt(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`bathrooms-${index}`}>Bathrooms</Label>
                          <Input
                            id={`bathrooms-${index}`}
                            type="number"
                            min="0"
                            max="20"
                            value={property.bathrooms}
                            onChange={(e) => updateProperty(index, 'bathrooms', parseInt(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`rent-${index}`}>Monthly Rent (₦)</Label>
                          <Input
                            id={`rent-${index}`}
                            type="number"
                            min="0"
                            value={property.rent_amount}
                            onChange={(e) => updateProperty(index, 'rent_amount', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`}>Property Description</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={property.description}
                          onChange={(e) => updateProperty(index, 'description', e.target.value)}
                          placeholder="Describe your property (amenities, location benefits, etc.)"
                          className="w-full"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Add Property Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProperty}
                  className="w-full border-dashed border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Property
                </Button>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Continue to Bank Details
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
