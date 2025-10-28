"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, Mail, Phone, MapPin, Calendar, 
  Shield, Edit, Save, X, Camera, Check 
} from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    bio: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        email: user?.email || '',
        bio: profile.bio || ''
      })
    }
  }, [profile, user])

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateProfile(formData)
      setEditing(false)
      toast.success('✅ Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      email: user?.email || '',
      bio: profile?.bio || ''
    })
    setEditing(false)
  }

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0].toUpperCase() || 'U'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Profile Settings
        </h1>
        <p className="text-slate-600">Manage your account information</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-orange-500 text-white text-3xl font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-slate-600 mb-4">{user?.email}</p>

              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge className="bg-green-100 text-green-700 border-0">
                  <Check className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {profile?.user_type || 'Tenant'}
                </Badge>
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-slate-900 font-medium">{user?.email}</p>
                  </div>
                </div>

                {profile?.phone_number && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Phone className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="text-slate-900 font-medium">{profile.phone_number}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Member Since</p>
                    <p className="text-slate-900 font-medium">
                      {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                    </p>
                  </div>
                </div>

                {profile?.trust_score !== undefined && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Shield className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Trust Score</p>
                      <p className="text-slate-900 font-medium">{profile.trust_score}/100</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-white/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900">Personal Information</CardTitle>
              {!editing ? (
                <Button
                  onClick={() => setEditing(true)}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!editing}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  disabled={!editing}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editing}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Type
              </label>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 capitalize">
                      {profile?.user_type || 'Tenant'} Account
                    </p>
                    <p className="text-sm text-slate-600">
                      {profile?.user_type === 'tenant' 
                        ? 'You can search and rent properties'
                        : 'You can list and manage properties'
                      }
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {profile?.user_type || 'Tenant'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Section */}
      <Card className="mt-6 bg-white/90 backdrop-blur-sm border-white/50">
        <CardHeader>
          <CardTitle className="text-slate-900">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-semibold text-slate-900">Password</h4>
              <p className="text-sm text-slate-600">Last changed 3 months ago</p>
            </div>
            <Button variant="outline">
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-semibold text-slate-900">Two-Factor Authentication</h4>
              <p className="text-sm text-slate-600">Add an extra layer of security</p>
            </div>
            <Button variant="outline">
              Enable
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50">
            <div>
              <h4 className="font-semibold text-red-900">Delete Account</h4>
              <p className="text-sm text-red-600">Permanently delete your account and data</p>
            </div>
            <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-100">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
