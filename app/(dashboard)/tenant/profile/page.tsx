"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  User, Mail, Phone, MapPin, Calendar,
  ArrowLeft, Edit, Save, X, Camera,
  Shield, CheckCircle, AlertCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed='

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    location: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        location: profile.location || ''
      })
    }
  }, [profile])

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateProfile(formData)
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
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      location: profile?.location || ''
    })
    setEditing(false)
  }

  const getMemberSince = () => {
    if (!user?.created_at) return 'Recently'
    const date = new Date(user.created_at)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/tenant">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              My Profile
            </h1>
            <p className="text-slate-600">
              Manage your account information
            </p>
          </div>
          {!editing && (
            <Button 
              onClick={() => setEditing(true)}
              className="bg-orange-500 hover:bg-orange-600"
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
          <Card className="bg-white/90 backdrop-blur-sm border-white/50">
            <CardContent className="p-6 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <img
                  src={profile?.avatar_url || DEFAULT_AVATAR + user?.id}
                  alt={profile?.full_name || 'User'}
                  className="h-32 w-32 rounded-full object-cover border-4 border-orange-100"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Name & Email */}
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {profile?.full_name || 'User'}
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
                  <Badge className="bg-amber-100 text-amber-700 border-0">
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                <div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-xs text-slate-600">Favorites</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-xs text-slate-600">Viewings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-xs text-slate-600">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mt-6">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Verify your identity to build trust with landlords
              </p>
              <Button variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50">
                Start Verification
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border-white/50">
            <CardHeader>
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
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                      placeholder="City, State"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Tell us about yourself..."
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
                        {profile?.full_name || 'Not set'}
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
                        {profile?.phone || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">Location</p>
                      <p className="font-semibold text-slate-900">
                        {profile?.location || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile?.bio && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-2">Bio</p>
                      <p className="text-slate-900">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/50 mt-6">
            <CardHeader>
              <CardTitle className="text-slate-900">Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Notification Preferences
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Privacy Settings
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
