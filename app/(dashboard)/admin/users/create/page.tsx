"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  ArrowLeft, User, Building2, Mail, Phone, MapPin, Calendar,
  RefreshCw, Loader2, Plus, CheckCircle, AlertCircle
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FormData {
  user_type: 'tenant' | 'landlord'
  email: string
  full_name: string
  phone_number: string
  location: string
  // Landlord specific
  account_type?: 'individual' | 'company'
  company_name?: string
  company_address?: string
  // Tenant specific
  occupation?: string
  income_range?: string
}

export default function CreateUser() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState<'tenant' | 'landlord'>('tenant')
  const [hasInitialLoadRef] = useState({ current: false })
  const [formData, setFormData] = useState<FormData>({
    user_type: 'tenant',
    email: '',
    full_name: '',
    phone_number: '',
    location: '',
    account_type: 'individual',
    company_name: '',
    company_address: '',
    occupation: '',
    income_range: ''
  })

  useEffect(() => {
    setMounted(true)
    hasInitialLoadRef.current = false
  }, [])

  useEffect(() => {
    if (!authLoading && mounted) {
      hasInitialLoadRef.current = true
      if (!user) {
        router.push('/signin')
        return
      }
      
      if (user.user_type !== 'admin') {
        router.push('/admin')
        return
      }
    }
  }, [user, authLoading, mounted, router])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      user_type: userType
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.email || !formData.full_name || !formData.phone_number || !formData.location) {
      toast.error('Please fill in all required fields')
      return
    }

    if (userType === 'landlord' && formData.account_type === 'company' && !formData.company_name) {
      toast.error('Company name is required for company accounts')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`${API_URL}/api/v1/users/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          user_type: userType
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`${userType === 'landlord' ? 'Landlord' : 'Tenant'} created successfully!`)
        
        // Redirect to the appropriate management page
        if (userType === 'landlord') {
          router.push('/admin/users/landlords')
        } else {
          router.push('/admin/users/tenants')
        }
      } else {
        const error = await response.json()
        toast.error(error.message || `Failed to create ${userType}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(`Failed to create ${userType}`)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || (authLoading && !hasInitialLoadRef.current)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                Create New User
              </h1>
              <p className="text-gray-600">Add a new tenant or landlord to the platform</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Type Selection */}
          <div className="lg:col-span-1">
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-orange-800">User Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={userType === 'tenant' ? 'default' : 'outline'}
                      onClick={() => setUserType('tenant')}
                      className={`flex flex-col items-center gap-2 p-4 h-auto ${
                        userType === 'tenant' 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                          : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                      }`}
                    >
                      <User className="h-8 w-8" />
                      <span className="font-medium">Tenant</span>
                    </Button>
                    <Button
                      variant={userType === 'landlord' ? 'default' : 'outline'}
                      onClick={() => setUserType('landlord')}
                      className={`flex flex-col items-center gap-2 p-4 h-auto ${
                        userType === 'landlord' 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                          : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                      }`}
                    >
                      <Building2 className="h-8 w-8" />
                      <span className="font-medium">Landlord</span>
                    </Button>
                  </div>
                  
                  <div className="bg-orange-50/50 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-800 mb-2">
                      {userType === 'tenant' ? 'Tenant Information' : 'Landlord Information'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {userType === 'tenant' 
                        ? 'Tenants can search for properties, save favorites, and apply for rentals.'
                        : 'Landlords can list properties, manage applications, and communicate with tenants.'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-orange-100">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  {userType === 'tenant' ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                  Create {userType === 'tenant' ? 'Tenant' : 'Landlord'} Account
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name" className="text-orange-700">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="Enter full name"
                          className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-orange-700">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter email address"
                          className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone_number" className="text-orange-700">Phone Number *</Label>
                        <Input
                          id="phone_number"
                          value={formData.phone_number}
                          onChange={(e) => handleInputChange('phone_number', e.target.value)}
                          placeholder="Enter phone number"
                          className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="location" className="text-orange-700">Location *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="City, State"
                          className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Landlord Specific Fields */}
                  {userType === 'landlord' && (
                    <div>
                      <h3 className="text-lg font-semibold text-orange-800 mb-4">Account Details</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="account_type" className="text-orange-700">Account Type</Label>
                          <Select 
                            value={formData.account_type} 
                            onValueChange={(value: 'individual' | 'company') => handleInputChange('account_type', value)}
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-400 focus:ring-orange-400">
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="company">Company</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {formData.account_type === 'company' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="company_name" className="text-orange-700">Company Name *</Label>
                              <Input
                                id="company_name"
                                value={formData.company_name}
                                onChange={(e) => handleInputChange('company_name', e.target.value)}
                                placeholder="Enter company name"
                                className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                                required={formData.account_type === 'company'}
                              />
                            </div>
                            <div>
                              <Label htmlFor="company_address" className="text-orange-700">Company Address</Label>
                              <Textarea
                                id="company_address"
                                value={formData.company_address}
                                onChange={(e) => handleInputChange('company_address', e.target.value)}
                                placeholder="Enter company address"
                                className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                                rows={3}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tenant Specific Fields */}
                  {userType === 'tenant' && (
                    <div>
                      <h3 className="text-lg font-semibold text-orange-800 mb-4">Additional Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="occupation" className="text-orange-700">Occupation</Label>
                          <Input
                            id="occupation"
                            value={formData.occupation}
                            onChange={(e) => handleInputChange('occupation', e.target.value)}
                            placeholder="Enter occupation"
                            className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="income_range" className="text-orange-700">Income Range</Label>
                          <Select 
                            value={formData.income_range} 
                            onValueChange={(value) => handleInputChange('income_range', value)}
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-400 focus:ring-orange-400">
                              <SelectValue placeholder="Select income range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-50k">₦0 - ₦50,000</SelectItem>
                              <SelectItem value="50k-100k">₦50,000 - ₦100,000</SelectItem>
                              <SelectItem value="100k-200k">₦100,000 - ₦200,000</SelectItem>
                              <SelectItem value="200k-500k">₦200,000 - ₦500,000</SelectItem>
                              <SelectItem value="500k+">₦500,000+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-4 pt-6 border-t border-orange-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/admin')}
                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create {userType === 'tenant' ? 'Tenant' : 'Landlord'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
