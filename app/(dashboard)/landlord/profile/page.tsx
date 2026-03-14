"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  User, Mail, Phone, MapPin, Calendar, Building2,
  ArrowLeft, Edit, Save, X,
  Shield, CheckCircle, AlertCircle, Home, Eye, Heart, MessageSquare, Star
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed='

export default function LandlordProfilePage() {
  const { user, userProfile, updateUserProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    location: '',
    company_name: ''
  })

  useEffect(() => {
    if (user) {
      // user has basic info, userProfile has landlord-specific info
      const landlordProfile = userProfile as any
      setFormData({
        full_name:     user.full_name     || '',
        phone_number:  user.phone_number  || '',
        location:      user.location      || '',
        company_name:  landlordProfile?.company_name || ''
      })
    }
  }, [user, userProfile])

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateUserProfile(formData)
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    const landlordProfile = userProfile as any
    setFormData({
      full_name:     user?.full_name     || '',
      phone_number:  user?.phone_number  || '',
      location:      user?.location      || '',
      company_name:  landlordProfile?.company_name || ''
    })
    setEditing(false)
  }

  const getMemberSince = () => {
    if (!user?.created_at) return 'Recently'
    const date = new Date(user.created_at)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/landlord/overview">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                My Profile
              </h1>
              <p className="text-slate-600">
                Manage your landlord account and property portfolio
              </p>
            </div>
            {!editing && (
              <Button
                onClick={() => setEditing(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <img
                  src={user?.avatar_url || DEFAULT_AVATAR + user?.id}
                  alt={user?.full_name || 'User'}
                  className="h-32 w-32 rounded-full object-cover border-4 border-orange-100"
                />
              </div>

              {/* Name & Email */}
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {user?.full_name || 'Landlord'}
              </h2>
              <p className="text-slate-600 mb-4">{user?.email}</p>

              {/* Verification Status */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {user?.email_verified ? (
                  <Badge className="bg-green-100 text-green-700 border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Email Verified
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700 border-0">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Email Not Verified
                  </Badge>
                )}
              </div>

              {/* Member Since */}
              <div className="flex items-center justify-center text-sm text-slate-600 mb-6">
                <Calendar className="h-4 w-4 mr-1" />
                Member since {getMemberSince()}
              </div>

              {/* Stats - TODO: Integrate with dashboard data service */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                {[
                  { value: 0, label: 'Properties' },
                  { value: 0, label: 'Viewings'  },
                  { value: 0, label: 'Messages'  },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-600">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Verification Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 mt-6">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Complete verification to build trust with tenants
              </p>
              <Link href="/landlord/verification">
                <Button variant="outline" className="w-full border-purple-500 text-purple-600 hover:bg-purple-50">
                  Start Verification
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2">
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
              <CardTitle className="text-slate-900">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Lagos, Nigeria"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., NuloAfrica Properties"
                    />
                  </div>


                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={saving}
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Full Name */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <User className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">Full Name</p>
                      <p className="font-semibold text-slate-900">
                        {user?.full_name || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-semibold text-slate-900">{user?.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">Phone Number</p>
                      <p className="font-semibold text-slate-900">
                        {user?.phone_number || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">Location</p>
                      <p className="font-semibold text-slate-900">
                        {user?.location || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">Company Name</p>
                      <p className="font-semibold text-slate-900">
                        {((userProfile as any)?.company_name) || 'Not set'}
                      </p>
                    </div>
                  </div>


                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm mt-6">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
              <CardTitle className="text-slate-900">Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Change Password */}
                <Link href="/landlord/settings/password">
                  <Button variant="outline" className="w-full justify-start border-slate-200 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50">
                    Change Password
                  </Button>
                </Link>

                {/* Notification Preferences */}
                <Link href="/landlord/settings/notifications">
                  <Button variant="outline" className="w-full justify-start border-slate-200 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50">
                    Notification Preferences
                  </Button>
                </Link>

                {/* Property Settings */}
                <Link href="/landlord/settings/properties">
                  <Button variant="outline" className="w-full justify-start border-slate-200 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50">
                    Property Settings
                  </Button>
                </Link>

                {/* Delete Account */}
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                      toast.error('Account deletion requires admin support. Please contact support@nuloafrica.com')
                    }
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
  )
}
