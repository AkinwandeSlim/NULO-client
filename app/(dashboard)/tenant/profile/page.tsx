"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  User, Mail, Phone, MapPin, Calendar,
  ArrowLeft, Edit, Save, X,
  Shield, CheckCircle, AlertCircle, Lock, Bell, Eye
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed='

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, updatePassword, isGoogleOAuthUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    location: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        full_name:    user.full_name    || '',
        phone_number: user.phone_number || '',
        location:     user.location     || ''
      })
    }
  }, [user])

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
    setFormData({
      full_name:    user?.full_name    || '',
      phone_number: user?.phone_number || '',
      location:     user?.location     || ''
    })
    setEditing(false)
  }

  const handleOpenPasswordModal = async () => {
    try {
      // Detect if user is a Google OAuth user
      const googleStatus = await isGoogleOAuthUser()
      console.log('🔐 [TENANT PROFILE] Google user status:', googleStatus)
      console.log('🔐 [TENANT PROFILE] User auth_provider:', (user as any)?.auth_provider)
      setIsGoogleUser(googleStatus)
      setShowPasswordModal(true)
    } catch (error) {
      console.error('❌ [TENANT PROFILE] Error opening password modal:', error)
      // Default to manual user (show current password field)
      setIsGoogleUser(false)
      setShowPasswordModal(true)
    }
  }

  const handleChangePassword = async () => {
    // For non-Google users, current password is required
    if (!isGoogleUser && !passwordData.currentPassword) {
      toast.error('Please enter your current password')
      return
    }

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    try {
      setChangingPassword(true)
      // For Google users, pass empty string as current password (it will be ignored)
      const { error } = await updatePassword(
        isGoogleUser ? '' : passwordData.currentPassword,
        passwordData.newPassword
      )
      
      if (!error) {
        setShowPasswordModal(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (error: any) {
      console.error('Failed to change password:', error)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false)
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const getMemberSince = () => {
    if (!user?.created_at) return 'Recently'
    const date = new Date(user.created_at)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-slate-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-orange-100/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}} />
      </div>
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tenant">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-orange-600 transition-all duration-300">
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
                Manage your personal information and account settings
              </p>
            </div>
            {!editing && (
              <Button
                onClick={() => setEditing(true)}
                className="luxury-gradient-button text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
          <Card className="border-0 luxury-shadow-lg rounded-2xl luxury-glass-strong">
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
                {user?.full_name || 'User'}
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                {[
                  { value: 0, label: 'Favorites' },
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
              <Button
                variant="outline"
                onClick={() => toast.info('Verification feature coming soon!')}
                className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                Start Verification
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2">
          <Card className="border-0 luxury-shadow-lg rounded-2xl luxury-glass-strong">
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
                      className="w-full h-12 px-4 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300"
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
                      className="w-full h-12 px-4 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300"
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
                      className="w-full h-12 px-4 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300"
                      placeholder="e.g., Lagos, Nigeria"
                    />
                  </div>


                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 luxury-gradient-button text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                      className="flex-1 border-slate-300 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300"
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


                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="border-0 luxury-shadow-lg rounded-2xl luxury-glass-strong mt-6">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
              <CardTitle className="text-slate-900">Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Change Password — opens modal */}
                <Button
                  variant="outline"
                  onClick={handleOpenPasswordModal}
                  className="w-full justify-start border-slate-300 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50 transition-all duration-300"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>

                {/* Notification Preferences — opens modal */}
                <Button
                  variant="outline"
                  onClick={() => toast.info('Notification preferences coming soon!')}
                  className="w-full justify-start border-slate-300 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50 transition-all duration-300"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notification Preferences
                </Button>

                {/* Privacy Settings — opens modal */}
                <Button
                  variant="outline"
                  onClick={() => toast.info('Privacy settings coming soon!')}
                  className="w-full justify-start border-slate-300 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50 transition-all duration-300"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Privacy Settings
                </Button>

                {/* Delete Account — keep red styling, add confirmation */}
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
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

    {/* Change Password Modal */}
    {showPasswordModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
        <Card className="border-0 luxury-shadow-lg rounded-2xl luxury-glass-strong w-full max-w-md">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                {isGoogleUser ? 'Set Password' : 'Change Password'}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClosePasswordModal}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Info banner for Google users */}
              {isGoogleUser && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  You signed up with Google. Set a password to enable email/password login.
                </div>
              )}

              {/* Current Password - only show for non-Google users */}
              {!isGoogleUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full h-12 px-4 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300"
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                  />
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full h-12 px-4 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300"
                  placeholder="Enter a new password (min 8 characters)"
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full h-12 px-4 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300"
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 luxury-gradient-button text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {changingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      {isGoogleUser ? 'Set Password' : 'Update Password'}
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleClosePasswordModal}
                  variant="outline"
                  disabled={changingPassword}
                  className="flex-1 border-slate-300 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  </div>
  )
}
