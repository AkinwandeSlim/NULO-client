"use client"

import { useState } from 'react'
import {
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Bed,
  Bath,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { viewingRequestsAPI } from '@/lib/api/viewingRequestsTenant'
import { formatPrice, formatLocation } from '@/lib/utils/format'
import { useTheme } from '@/contexts/ThemeContext'

interface ViewingRequestModalProps {
  property: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: (viewingRequest: any) => void
  user?: any
  viewingType?: 'PHYSICAL' | 'VIRTUAL' | 'LIVE_VIDEO'
  landlordResponseTime?: string
}

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning', time: '9AM - 12PM', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon', time: '12PM - 4PM', icon: '☀️' },
  { value: 'evening', label: 'Evening', time: '4PM - 7PM', icon: '🌆' }
]

export default function ViewingRequestModal({
  property,
  isOpen,
  onClose,
  onSuccess,
  user,
  viewingType = 'PHYSICAL' as 'PHYSICAL' | 'VIRTUAL' | 'LIVE_VIDEO',
  landlordResponseTime = "within 2 hours"
}: ViewingRequestModalProps) {
  const { theme } = useTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  
  const getInitialTenantName = () => {
    if (user?.full_name && user.full_name.trim()) return user.full_name.trim();
    const first = user?.first_name?.trim() || '';
    const last = user?.last_name?.trim() || '';
    return `${first} ${last}`.trim();
  };

  const [formData, setFormData] = useState({
    preferred_date: '',
    time_slot: 'afternoon' as 'morning' | 'afternoon' | 'evening',
    contact_number: '', // Do not prefill, let user enter
    message: '',
    tenant_name: getInitialTenantName()
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-NG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3) // 3 months ahead
    return maxDate.toISOString().split('T')[0]
  }

  const selectedTimeSlot = TIME_SLOTS.find(slot => slot.value === formData.time_slot)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.tenant_name.trim()) {
      newErrors.tenant_name = "Please enter your name"
    }

    if (!formData.preferred_date) {
      newErrors.preferred_date = "Please select a viewing date"
    } else {
      const selectedDate = new Date(formData.preferred_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.preferred_date = "Please select a date in the future"
      }
    }

    if (!formData.time_slot) {
      newErrors.time_slot = "Please select a time slot"
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = "Please enter your contact number"
    } else if (!/^[\d\s\+\-\(\)]{9,}$/.test(formData.contact_number.replace(/\s/g, ''))) {
      newErrors.contact_number = "Please enter a valid phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly")
      return
    }

    setIsSubmitting(true)

    try {
      const requestData = {
        property_id: property.id,
        preferred_date: formData.preferred_date,
        time_slot: formData.time_slot as 'morning' | 'afternoon' | 'evening',
        contact_number: formData.contact_number,
        message: formData.message,
        tenant_name: formData.tenant_name,
        viewing_type: viewingType
      }

      const response = await viewingRequestsAPI.create(requestData)

      if (response.success) {
        // Show success screen with all viewing details from form + API response
        // Explicitly preserve form data to ensure details are displayed correctly
        setSuccessData({
          ...response.data,
          // Explicitly set form data - these take priority
          preferred_date: formData.preferred_date,
          time_slot: formData.time_slot,
          contact_number: formData.contact_number,
          tenant_name: formData.tenant_name,
          message: formData.message
        })
        setShowSuccess(true)
        toast.success('✅ Viewing request sent successfully!')
        // Don't call onSuccess yet - let user choose their next action first
        // onSuccess will be called when they click an action button
      } else {
        toast.error(response.error || 'Failed to submit viewing request')
      }
    } catch (error: any) {
      console.error('Viewing request error:', error)
      toast.error(error.message || 'Failed to submit viewing request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Don't close modal if success screen is showing - prevent accidental dismissal
    if (showSuccess && successData) return
    
    // Reset states only when closing from form view
    setShowSuccess(false)
    setSuccessData(null)
    setFormData({
      preferred_date: '',
      time_slot: 'afternoon' as 'morning' | 'afternoon' | 'evening',
      contact_number: '',
      message: '',
      tenant_name: getInitialTenantName()
    })
    setErrors({})
    onClose()
  }

  const handleDialogOpenChange = (open: boolean) => {
    // Allow closing from success screen with proper button click
    // Don't close via backdrop click if success screen is showing
    if (!open && showSuccess && successData) {
      // Check if close was triggered by X button (with data in context)
      // Allow close button to work properly
    }
    // Allow successful completion flow to close
    if (!open) {
      handleClose()
    }
  }

  const handleResetAndClose = () => {
    // Call onSuccess callback before closing
    onSuccess?.(successData)
    
    // Used by action buttons to reset and close
    setShowSuccess(false)
    setSuccessData(null)
    setFormData({
      preferred_date: '',
      time_slot: 'afternoon' as 'morning' | 'afternoon' | 'evening',
      contact_number: '',
      message: '',
      tenant_name: getInitialTenantName()
    })
    setErrors({})
    onClose()
  }

  const handleNavigateToDashboard = () => {
    handleResetAndClose()
    window.location.href = '/tenant/viewings'
  }

  const handleBrowseMore = () => {
    handleResetAndClose()
    window.location.href = '/properties'
  }

  const handleApplyNow = () => {
    handleResetAndClose()
    // Navigate to application form for this property
    window.location.href = `/properties/${property.id}/apply`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={`sm:max-w-2xl max-h-[90vh] overflow-y-auto ${theme === "dark" ? "bg-black border-white/10" : ""}`}>
        <DialogHeader className={`space-y-3 pb-4 border-b ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
          {showSuccess && successData ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <DialogTitle className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  Viewing Request Sent!
                </DialogTitle>
                <DialogDescription className={`text-sm mt-1 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                  Your viewing request for "{property.title}" has been submitted successfully
                </DialogDescription>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-orange-900/20" : "bg-orange-100"}`}>
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  Schedule Property Viewing
                </DialogTitle>
                <DialogDescription className={`text-sm mt-1 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                  Request a viewing for <strong className={theme === "dark" ? "text-white" : "text-slate-900"}>"{property.title}"</strong>
                </DialogDescription>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 py-6">
          {showSuccess && successData ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className={`mb-4 text-center max-w-md ${theme === "dark" ? "text-white/80" : "text-slate-700"}`}>
                Your request for <strong className={theme === "dark" ? "text-white" : ""}>{property.title}</strong> was submitted successfully.<br />
                Your request is awaiting landlord confirmation. The landlord will respond {landlordResponseTime}.<br />
                We will update you in Nulo, by email, and by SMS when available.
              </p>
              <div className={`rounded-xl p-4 mb-6 w-full max-w-md ${theme === "dark" ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} border`}>
              <h4 className={`font-medium mb-3 flex items-center gap-2 ${theme === "dark" ? "text-blue-400" : "text-blue-900"}`}>
                <Calendar className="w-4 h-4" />
                Viewing Details
              </h4>
              <div className={`text-sm space-y-2 ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>
                <div className="flex items-center justify-between">
                  <span><strong>📅 Date:</strong></span>
                  <span>{formatDate(successData.preferred_date) || successData.preferred_date || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span><strong>🕐 Time:</strong></span>
                  <span className="capitalize">
                    {successData.time_slot ? `${TIME_SLOTS.find(s => s.value === successData.time_slot)?.label} (${TIME_SLOTS.find(s => s.value === successData.time_slot)?.time})` : 'TBD'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span><strong>📍 Property:</strong></span>
                  <span className="text-right">{property.title || 'Property Details'}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span><strong>📞 Contact:</strong></span>
                  <span>{successData.contact_number || 'Provided'}</span>
                </div>
              </div>
            </div>
              <div className="flex flex-col gap-2 w-full max-w-md">
                {/* <div className="relative group">
                  <Button 
                    disabled
                    className="w-full h-12 bg-gradient-to-r from-orange-300 to-orange-400 text-white font-bold opacity-60 cursor-not-allowed rounded-lg"
                    title="Available after landlord confirms your viewing request"
                  >
                    Apply Now
                  </Button>
                  <div className="absolute bottom-full left-0 right-0 mb-2 hidden group-hover:block">
                    <div className="bg-slate-900 text-white text-xs rounded p-3 whitespace-normal">
                      💡 The "Apply Now" button will be enabled once the landlord confirms your viewing request. Check your dashboard for updates.
                    </div>
                  </div>
                </div> */}


                <Button 
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg shadow-md"
                  onClick={handleApplyNow}
                >
                  Apply Now →
                </Button>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button 
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" 
                    onClick={handleNavigateToDashboard}
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    className={`flex-1 h-12 border-2 text-slate-700 font-semibold rounded-lg ${theme === "dark" ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" : "bg-white border-slate-300 hover:bg-slate-50"}`} 
                    onClick={handleBrowseMore}
                  >
                    Browse More
                  </Button>
                </div>
                <Button
                  className={`w-full h-10 font-medium rounded-lg text-sm ${theme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-700"}`}
                  onClick={handleResetAndClose}
                >
                  Close (Stay on Property)
                </Button>
                <div className={`mt-2 p-3 rounded-lg ${theme === "dark" ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} border`}>
                  <p className={`text-xs ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>
                    {/* <strong>📋 Next Step:</strong> The landlord will review your viewing request. Once confirmed, you'll be able to apply directly from your dashboard. */}
                    <strong>📋 Next Step:</strong> Your request is pending. You can apply now, or wait until the landlord confirms the exact appointment time.
                  </p>
                </div>
              </div>
            </div>
          ) : (
          // ...existing code for the form and property summary...
          <>
            {/* Property Summary Card - Enhanced */}
            <div className={`rounded-lg p-4 border ${theme === "dark" ? "bg-gradient-to-r from-slate-900/50 to-orange-900/20 border-orange-500/30" : "bg-gradient-to-r from-slate-50 to-orange-50 border-orange-100"}`}>
              <div className="flex gap-4">
                {/* Property Image */}
                <div className={`w-24 h-24 rounded-lg flex-shrink-0 overflow-hidden ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`}>
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${theme === "dark" ? "bg-white/10" : "bg-slate-300"}`}>
                      <MapPin className={`h-8 w-8 ${theme === "dark" ? "text-white/40" : "text-slate-600"}`} />
                    </div>
                  )}
                </div>
                {/* Property Details */}
                <div className="flex-1">
                  <h3 className={`font-semibold text-base ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{property.title}</h3>
                  <p className={`text-sm flex items-center gap-1 mt-1 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                    <MapPin className="h-3.5 w-3.5" />
                    {formatLocation(property.location || property.address || 'Location TBD')}
                  </p>
                  {/* Price and Details */}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-orange-600">
                        {formatPrice(property.price)}/month
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bed className={`h-4 w-4 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`} />
                      <span>{property.beds || 0} bed{property.beds !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className={`h-4 w-4 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`} />
                      <span>{property.baths || 0} bath{property.baths !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="tenant_name" className={`text-sm font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <User className="h-4 w-4 text-orange-500" />
                  Your Full Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenant_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.tenant_name}
                  onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                  className={`h-12 text-base ${errors.tenant_name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'} ${theme === "dark" ? "bg-black border-white/10 text-white" : ""}`}
                />
                {errors.tenant_name && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tenant_name}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <Label htmlFor="contact_number" className={`text-sm font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <Phone className="h-4 w-4 text-orange-500" />
                  Your Contact Number
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_number"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.contact_number}
                  onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  className={`h-12 text-base ${errors.contact_number ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'} ${theme === "dark" ? "bg-black border-white/10 text-white" : ""}`}
                  autoComplete="tel"
                />
                {errors.contact_number && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.contact_number}
                  </p>
                )}
              </div>

              {/* Date Picker */}
              <div className="space-y-2">
                <Label htmlFor="preferred_date" className={`text-sm font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Preferred Viewing Date
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="preferred_date"
                  type="date"
                  min={getMinDate()}
                  max={getMaxDate()}
                  value={formData.preferred_date}
                  onChange={(e) => handleInputChange('preferred_date', e.target.value)}
                  className={`h-12 text-base ${errors.preferred_date ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'} ${theme === "dark" ? "bg-black border-white/10 text-white" : ""}`}
                />
                {formData.preferred_date && !errors.preferred_date && (
                  <div className={`p-2 rounded-md ${theme === "dark" ? "bg-green-900/20 border-green-500/30" : "bg-green-50 border-green-200"} border`}>
                    <p className={`text-xs flex items-center gap-1 font-medium ${theme === "dark" ? "text-green-400" : "text-green-700"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {formatDate(formData.preferred_date)}
                    </p>
                  </div>
                )}
                {errors.preferred_date && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.preferred_date}
                  </p>
                )}
              </div>

              {/* Time Slot Selector */}
              <div className="space-y-3">
                <Label className={`text-sm font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <Clock className="h-4 w-4 text-orange-500" />
                  Preferred Time Slot
                  <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => handleInputChange('time_slot', slot.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.time_slot === slot.value
                          ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
                          : theme === "dark" ? 'border-white/10 hover:border-orange-500/50 hover:bg-white/5' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-3xl mb-2">{slot.icon}</span>
                      <p className={`font-semibold text-sm ${
                        formData.time_slot === slot.value ? 'text-orange-700' : theme === "dark" ? 'text-white/70' : 'text-slate-700'
                      }`}>
                        {slot.label}
                      </p>
                      <p className={`text-xs mt-1 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{slot.time}</p>
                      {formData.time_slot === slot.value && (
                        <CheckCircle2 className="h-5 w-5 text-orange-500 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
                {errors.time_slot && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.time_slot}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className={`text-sm font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  Additional Message
                  <span className={`text-xs font-normal ml-1 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>(Optional)</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Hi, I'm interested in viewing this property. Looking forward to hearing from you!"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  maxLength={500}
                  rows={4}
                  className={`resize-none text-base focus:ring-orange-500 ${theme === "dark" ? "bg-black border-white/10 text-white" : ""}`}
                />
                <p className={`text-xs text-right ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                  {formData.message.length}/500 characters
                </p>
              </div>

              {/* Viewing Summary */}
              {formData.preferred_date && selectedTimeSlot && (
                <div className={`rounded-xl p-4 ${theme === "dark" ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} border`}>
                  <h4 className={`font-medium mb-3 flex items-center gap-2 ${theme === "dark" ? "text-blue-400" : "text-blue-900"}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    Viewing Summary
                  </h4>
                  <div className={`text-sm space-y-2 ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>
                    <p><strong>📅 Date:</strong> {formatDate(formData.preferred_date)}</p>
                    <p><strong>🕐 Time:</strong> {selectedTimeSlot.time}</p>
                    <p><strong>📍 Property:</strong> {property.title}</p>
                    <p><strong>☎️ Contact:</strong> {formData.contact_number}</p>
                  </div>
                </div>
              )}

              {/* Info Banners */}
              <div className="space-y-3 pt-2">
                <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"} border`}>
                  <p className={`text-sm text-center ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>
                    <strong>⚡ Quick Response:</strong> Landlord typically responds {landlordResponseTime}.
                    You'll receive confirmation via SMS and email.
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-green-900/20 border-green-500/30" : "bg-green-50 border-green-200"} border`}>
                  <p className={`text-sm text-center ${theme === "dark" ? "text-green-300" : "text-green-800"}`}>
                    🛡️ <strong>Protected by Nulo:</strong> All viewing requests are logged and monitored for your safety.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  disabled={isSubmitting}
                  className={`flex-1 h-13 border-2 font-semibold text-base ${theme === "dark" ? "border-white/10 hover:bg-white/10 text-white" : "border-slate-300 hover:bg-slate-50 text-slate-700"}`}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-13 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5 mr-2" />
                      Request Viewing
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
















// "use client"

// import { useState } from 'react'
// import {
//   Calendar,
//   Clock,
//   User,
//   Phone,
//   MessageSquare,
//   CheckCircle2,
//   AlertCircle,
//   MapPin,
//   Bed,
//   Bath,
//   DollarSign
// } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Textarea } from '@/components/ui/textarea'
// import { Label } from '@/components/ui/label'
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
// import { toast } from 'sonner'
// import { viewingRequestsAPI } from '@/lib/api/viewing-requests'
// import { formatPrice, formatLocation } from '@/lib/utils/format'

// interface ViewingRequestModalProps {
//   property: any
//   isOpen: boolean
//   onClose: () => void
//   onSuccess?: (viewingRequest: any) => void
//   user?: any
//   viewingType?: 'PHYSICAL' | 'VIRTUAL' | 'LIVE_VIDEO'
//   landlordResponseTime?: string
// }

// const TIME_SLOTS = [
//   { value: 'morning', label: 'Morning', time: '9AM - 12PM', icon: '🌅' },
//   { value: 'afternoon', label: 'Afternoon', time: '12PM - 4PM', icon: '☀️' },
//   { value: 'evening', label: 'Evening', time: '4PM - 7PM', icon: '🌆' }
// ]

// export default function ViewingRequestModal({
//   property,
//   isOpen,
//   onClose,
//   onSuccess,
//   user,
//   viewingType = 'PHYSICAL' as 'PHYSICAL' | 'VIRTUAL' | 'LIVE_VIDEO',
//   landlordResponseTime = "within 2 hours"
// }: ViewingRequestModalProps) {
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [showSuccess, setShowSuccess] = useState(false)
//   const [successData, setSuccessData] = useState<any>(null)
  
//   const getInitialTenantName = () => {
//     if (user?.full_name && user.full_name.trim()) return user.full_name.trim();
//     const first = user?.first_name?.trim() || '';
//     const last = user?.last_name?.trim() || '';
//     return `${first} ${last}`.trim();
//   };

//   const [formData, setFormData] = useState({
//     preferred_date: '',
//     time_slot: 'afternoon' as 'morning' | 'afternoon' | 'evening',
//     contact_number: '', // Do not prefill, let user enter
//     message: '',
//     tenant_name: getInitialTenantName()
//   })
//   const [errors, setErrors] = useState<Record<string, string>>({})

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }))
//     // Clear error when user starts typing
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: '' }))
//     }
//   }

//   const formatDate = (dateStr: string) => {
//     if (!dateStr) return ""
//     const date = new Date(dateStr)
//     return date.toLocaleDateString('en-NG', { 
//       weekday: 'long', 
//       year: 'numeric', 
//       month: 'long', 
//       day: 'numeric' 
//     })
//   }

//   const getMinDate = () => {
//     const tomorrow = new Date()
//     tomorrow.setDate(tomorrow.getDate() + 1)
//     return tomorrow.toISOString().split('T')[0]
//   }

//   const getMaxDate = () => {
//     const maxDate = new Date()
//     maxDate.setMonth(maxDate.getMonth() + 3) // 3 months ahead
//     return maxDate.toISOString().split('T')[0]
//   }

//   const selectedTimeSlot = TIME_SLOTS.find(slot => slot.value === formData.time_slot)

//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {}

//     if (!formData.tenant_name.trim()) {
//       newErrors.tenant_name = "Please enter your name"
//     }

//     if (!formData.preferred_date) {
//       newErrors.preferred_date = "Please select a viewing date"
//     } else {
//       const selectedDate = new Date(formData.preferred_date)
//       const today = new Date()
//       today.setHours(0, 0, 0, 0)
      
//       if (selectedDate < today) {
//         newErrors.preferred_date = "Please select a date in the future"
//       }
//     }

//     if (!formData.time_slot) {
//       newErrors.time_slot = "Please select a time slot"
//     }

//     if (!formData.contact_number.trim()) {
//       newErrors.contact_number = "Please enter your contact number"
//     } else if (!/^[\d\s\+\-\(\)]{9,}$/.test(formData.contact_number.replace(/\s/g, ''))) {
//       newErrors.contact_number = "Please enter a valid phone number"
//     }

//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!validateForm()) {
//       toast.error("Please fill in all required fields correctly")
//       return
//     }

//     setIsSubmitting(true)

//     try {
//       const requestData = {
//         property_id: property.id,
//         preferred_date: formData.preferred_date,
//         time_slot: formData.time_slot as 'morning' | 'afternoon' | 'evening',
//         contact_number: formData.contact_number,
//         message: formData.message,
//         tenant_name: formData.tenant_name,
//         viewing_type: viewingType
//       }

//       const response = await viewingRequestsAPI.create(requestData)

//       if (response.success) {
//         // Show success screen with all viewing details from form + API response
//         // Explicitly preserve form data to ensure details are displayed correctly
//         setSuccessData({
//           ...response.data,
//           // Explicitly set form data - these take priority
//           preferred_date: formData.preferred_date,
//           time_slot: formData.time_slot,
//           contact_number: formData.contact_number,
//           tenant_name: formData.tenant_name,
//           message: formData.message
//         })
//         setShowSuccess(true)
//         toast.success('✅ Viewing request sent successfully!')
//         // Don't call onSuccess yet - let user choose their next action first
//         // onSuccess will be called when they click an action button
//       } else {
//         toast.error(response.error || 'Failed to submit viewing request')
//       }
//     } catch (error: any) {
//       console.error('Viewing request error:', error)
//       toast.error(error.message || 'Failed to submit viewing request')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleClose = () => {
//     // Don't close modal if success screen is showing - prevent accidental dismissal
//     if (showSuccess && successData) return
    
//     // Reset states only when closing from form view
//     setShowSuccess(false)
//     setSuccessData(null)
//     setFormData({
//       preferred_date: '',
//       time_slot: 'afternoon' as 'morning' | 'afternoon' | 'evening',
//       contact_number: '',
//       message: '',
//       tenant_name: getInitialTenantName()
//     })
//     setErrors({})
//     onClose()
//   }

//   const handleDialogOpenChange = (open: boolean) => {
//     // Allow closing from success screen with proper button click
//     // Don't close via backdrop click if success screen is showing
//     if (!open && showSuccess && successData) {
//       // Check if close was triggered by X button (with data in context)
//       // Allow close button to work properly
//     }
//     // Allow successful completion flow to close
//     if (!open) {
//       handleClose()
//     }
//   }

//   const handleResetAndClose = () => {
//     // Call onSuccess callback before closing
//     onSuccess?.(successData)
    
//     // Used by action buttons to reset and close
//     setShowSuccess(false)
//     setSuccessData(null)
//     setFormData({
//       preferred_date: '',
//       time_slot: 'afternoon' as 'morning' | 'afternoon' | 'evening',
//       contact_number: '',
//       message: '',
//       tenant_name: getInitialTenantName()
//     })
//     setErrors({})
//     onClose()
//   }

//   const handleNavigateToDashboard = () => {
//     handleResetAndClose()
//     window.location.href = '/tenant/viewings'
//   }

//   const handleBrowseMore = () => {
//     handleResetAndClose()
//     window.location.href = '/properties'
//   }

//   const handleApplyNow = () => {
//     handleResetAndClose()
//     // Navigate to application form for this property
//     window.location.href = `/properties/${property.id}/apply`
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
//       <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader className="space-y-3 pb-4 border-b border-slate-200">
//           {showSuccess && successData ? (
//             <div className="flex items-center gap-3">
//               <CheckCircle2 className="h-6 w-6 text-green-500" />
//               <div>
//                 <DialogTitle className="text-2xl font-bold text-slate-900">
//                   Viewing Request Sent!
//                 </DialogTitle>
//                 <DialogDescription className="text-sm text-slate-600 mt-1">
//                   Your viewing request for "{property.title}" has been submitted successfully
//                 </DialogDescription>
//               </div>
//             </div>
//           ) : (
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-orange-100 rounded-lg">
//                 <Calendar className="h-6 w-6 text-orange-600" />
//               </div>
//               <div>
//                 <DialogTitle className="text-2xl font-bold text-slate-900">
//                   Schedule Property Viewing
//                 </DialogTitle>
//                 <DialogDescription className="text-sm text-slate-600 mt-1">
//                   Request a viewing for <strong className="text-slate-900">"{property.title}"</strong>
//                 </DialogDescription>
//               </div>
//             </div>
//           )}
//         </DialogHeader>

//         <div className="space-y-6 py-6">
//           {showSuccess && successData ? (
//             <div className="flex flex-col items-center justify-center py-8">
//               <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
//               <p className="text-slate-700 mb-4 text-center max-w-md">
//                 Your request for <strong>{property.title}</strong> was submitted successfully.<br />
//                 The landlord will respond {landlordResponseTime}.<br />
//                 You'll receive confirmation via SMS and email.
//               </p>
//               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 w-full max-w-md">
//               <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
//                 <Calendar className="w-4 h-4" />
//                 Viewing Details
//               </h4>
//               <div className="text-sm text-blue-800 space-y-2">
//                 <div className="flex items-center justify-between">
//                   <span><strong>📅 Date:</strong></span>
//                   <span>{formatDate(successData.preferred_date) || successData.preferred_date || 'TBD'}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span><strong>🕐 Time:</strong></span>
//                   <span className="capitalize">
//                     {successData.time_slot ? `${TIME_SLOTS.find(s => s.value === successData.time_slot)?.label} (${TIME_SLOTS.find(s => s.value === successData.time_slot)?.time})` : 'TBD'}
//                   </span>
//                 </div>
//                 <div className="flex items-start justify-between gap-2">
//                   <span><strong>📍 Property:</strong></span>
//                   <span className="text-right">{property.title || 'Property Details'}</span>
//                 </div>
//                 <div className="flex items-start justify-between gap-2">
//                   <span><strong>📞 Contact:</strong></span>
//                   <span>{successData.contact_number || 'Provided'}</span>
//                 </div>
//               </div>
//             </div>
//               <div className="flex flex-col gap-2 w-full max-w-md">
//                 <div className="relative group">
//                   <Button 
//                     disabled
//                     className="w-full h-12 bg-gradient-to-r from-orange-300 to-orange-400 text-white font-bold opacity-60 cursor-not-allowed rounded-lg"
//                     title="Available after landlord confirms your viewing request"
//                   >
//                     Apply Now
//                   </Button>
//                   <div className="absolute bottom-full left-0 right-0 mb-2 hidden group-hover:block">
//                     <div className="bg-slate-900 text-white text-xs rounded p-3 whitespace-normal">
//                       💡 The "Apply Now" button will be enabled once the landlord confirms your viewing request. Check your dashboard for updates.
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex flex-col sm:flex-row gap-3 w-full">
//                   <Button 
//                     className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" 
//                     onClick={handleNavigateToDashboard}
//                   >
//                     Go to Dashboard
//                   </Button>
//                   <Button 
//                     className="flex-1 h-12 bg-white border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 rounded-lg" 
//                     onClick={handleBrowseMore}
//                   >
//                     Browse More
//                   </Button>
//                 </div>
//                 <Button
//                   className="w-full h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg text-sm"
//                   onClick={handleResetAndClose}
//                 >
//                   Close (Stay on Property)
//                 </Button>
//                 <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                   <p className="text-xs text-blue-800">
//                     <strong>📋 Next Step:</strong> The landlord will review your viewing request. Once confirmed, you'll be able to apply directly from your dashboard.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ) : (
//           // ...existing code for the form and property summary...
//           <>
//             {/* Property Summary Card - Enhanced */}
//             <div className="bg-gradient-to-r from-slate-50 to-orange-50 rounded-lg p-4 border border-orange-100">
//               <div className="flex gap-4">
//                 {/* Property Image */}
//                 <div className="w-24 h-24 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden">
//                   {property.images?.[0] ? (
//                     <img
//                       src={property.images[0]}
//                       alt={property.title}
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center bg-slate-300">
//                       <MapPin className="h-8 w-8 text-slate-600" />
//                     </div>
//                   )}
//                 </div>
//                 {/* Property Details */}
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-slate-900 text-base">{property.title}</h3>
//                   <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
//                     <MapPin className="h-3.5 w-3.5" />
//                     {formatLocation(property.location || property.address || 'Location TBD')}
//                   </p>
//                   {/* Price and Details */}
//                   <div className="flex items-center gap-4 mt-3 text-sm">
//                     <div className="flex items-center gap-1">
//                       <DollarSign className="h-4 w-4 text-orange-600" />
//                       <span className="font-semibold text-orange-600">
//                         {formatPrice(property.price)}/month
//                       </span>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <Bed className="h-4 w-4 text-slate-600" />
//                       <span>{property.beds || 0} bed{property.beds !== 1 ? 's' : ''}</span>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <Bath className="h-4 w-4 text-slate-600" />
//                       <span>{property.baths || 0} bath{property.baths !== 1 ? 's' : ''}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Form */}
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Name Input */}
//               <div className="space-y-2">
//                 <Label htmlFor="tenant_name" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
//                   <User className="h-4 w-4 text-orange-500" />
//                   Your Full Name
//                   <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="tenant_name"
//                   type="text"
//                   placeholder="Enter your full name"
//                   value={formData.tenant_name}
//                   onChange={(e) => handleInputChange('tenant_name', e.target.value)}
//                   className={`h-12 text-base ${errors.tenant_name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
//                 />
//                 {errors.tenant_name && (
//                   <p className="text-xs text-red-600 flex items-center gap-1">
//                     <AlertCircle className="h-3 w-3" />
//                     {errors.tenant_name}
//                   </p>
//                 )}
//               </div>

//               {/* Contact Number */}
//               <div className="space-y-2">
//                 <Label htmlFor="contact_number" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
//                   <Phone className="h-4 w-4 text-orange-500" />
//                   Your Contact Number
//                   <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="contact_number"
//                   type="tel"
//                   placeholder="Enter your phone number"
//                   value={formData.contact_number}
//                   onChange={(e) => handleInputChange('contact_number', e.target.value)}
//                   className={`h-12 text-base ${errors.contact_number ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
//                   autoComplete="tel"
//                 />
//                 {errors.contact_number && (
//                   <p className="text-xs text-red-600 flex items-center gap-1">
//                     <AlertCircle className="h-3 w-3" />
//                     {errors.contact_number}
//                   </p>
//                 )}
//               </div>

//               {/* Date Picker */}
//               <div className="space-y-2">
//                 <Label htmlFor="preferred_date" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
//                   <Calendar className="h-4 w-4 text-orange-500" />
//                   Preferred Viewing Date
//                   <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="preferred_date"
//                   type="date"
//                   min={getMinDate()}
//                   max={getMaxDate()}
//                   value={formData.preferred_date}
//                   onChange={(e) => handleInputChange('preferred_date', e.target.value)}
//                   className={`h-12 text-base ${errors.preferred_date ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
//                 />
//                 {formData.preferred_date && !errors.preferred_date && (
//                   <div className="p-2 bg-green-50 border border-green-200 rounded-md">
//                     <p className="text-xs text-green-700 flex items-center gap-1 font-medium">
//                       <CheckCircle2 className="h-3.5 w-3.5" />
//                       {formatDate(formData.preferred_date)}
//                     </p>
//                   </div>
//                 )}
//                 {errors.preferred_date && (
//                   <p className="text-xs text-red-600 flex items-center gap-1">
//                     <AlertCircle className="h-3 w-3" />
//                     {errors.preferred_date}
//                   </p>
//                 )}
//               </div>

//               {/* Time Slot Selector */}
//               <div className="space-y-3">
//                 <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
//                   <Clock className="h-4 w-4 text-orange-500" />
//                   Preferred Time Slot
//                   <span className="text-red-500">*</span>
//                 </Label>
//                 <div className="grid grid-cols-3 gap-3">
//                   {TIME_SLOTS.map((slot) => (
//                     <button
//                       key={slot.value}
//                       type="button"
//                       onClick={() => handleInputChange('time_slot', slot.value)}
//                       className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
//                         formData.time_slot === slot.value
//                           ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
//                           : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
//                       }`}
//                     >
//                       <span className="text-3xl mb-2">{slot.icon}</span>
//                       <p className={`font-semibold text-sm ${
//                         formData.time_slot === slot.value ? 'text-orange-700' : 'text-slate-700'
//                       }`}>
//                         {slot.label}
//                       </p>
//                       <p className="text-xs text-slate-500 mt-1">{slot.time}</p>
//                       {formData.time_slot === slot.value && (
//                         <CheckCircle2 className="h-5 w-5 text-orange-500 mt-2" />
//                       )}
//                     </button>
//                   ))}
//                 </div>
//                 {errors.time_slot && (
//                   <p className="text-xs text-red-600 flex items-center gap-1">
//                     <AlertCircle className="h-3 w-3" />
//                     {errors.time_slot}
//                   </p>
//                 )}
//               </div>

//               {/* Message */}
//               <div className="space-y-2">
//                 <Label htmlFor="message" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
//                   <MessageSquare className="h-4 w-4 text-orange-500" />
//                   Additional Message
//                   <span className="text-xs text-slate-500 font-normal ml-1">(Optional)</span>
//                 </Label>
//                 <Textarea
//                   id="message"
//                   placeholder="Hi, I'm interested in viewing this property. Looking forward to hearing from you!"
//                   value={formData.message}
//                   onChange={(e) => handleInputChange('message', e.target.value)}
//                   maxLength={500}
//                   rows={4}
//                   className="resize-none text-base focus:ring-orange-500"
//                 />
//                 <p className="text-xs text-slate-500 text-right">
//                   {formData.message.length}/500 characters
//                 </p>
//               </div>

//               {/* Viewing Summary */}
//               {formData.preferred_date && selectedTimeSlot && (
//                 <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//                   <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
//                     <CheckCircle2 className="w-4 h-4" />
//                     Viewing Summary
//                   </h4>
//                   <div className="text-sm text-blue-800 space-y-2">
//                     <p><strong>📅 Date:</strong> {formatDate(formData.preferred_date)}</p>
//                     <p><strong>🕐 Time:</strong> {selectedTimeSlot.time}</p>
//                     <p><strong>📍 Property:</strong> {property.title}</p>
//                     <p><strong>☎️ Contact:</strong> {formData.contact_number}</p>
//                   </div>
//                 </div>
//               )}

//               {/* Info Banners */}
//               <div className="space-y-3 pt-2">
//                 <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
//                   <p className="text-sm text-blue-800 text-center">
//                     <strong>⚡ Quick Response:</strong> Landlord typically responds {landlordResponseTime}.
//                     You'll receive confirmation via SMS and email.
//                   </p>
//                 </div>

//                 <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
//                   <p className="text-sm text-green-800 text-center">
//                     🛡️ <strong>Protected by Nulo:</strong> All viewing requests are logged and monitored for your safety.
//                   </p>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-200">
//                 <Button
//                   onClick={handleClose}
//                   variant="outline"
//                   disabled={isSubmitting}
//                   className="flex-1 h-13 border-2 border-slate-300 hover:bg-slate-50 font-semibold text-base"
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   onClick={handleSubmit}
//                   disabled={isSubmitting}
//                   className="flex-1 h-13 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
//                 >
//                   {isSubmitting ? (
//                     <>
//                       <span className="animate-spin mr-2">⏳</span>
//                       Sending Request...
//                     </>
//                   ) : (
//                     <>
//                       <Calendar className="h-5 w-5 mr-2" />
//                       Request Viewing
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </form>
//           </>
//         )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }
