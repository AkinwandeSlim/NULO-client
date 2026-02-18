"use client"

import { useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
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
import { viewingRequestsAPI } from '@/lib/api/viewing-requests'
import { formatPrice, formatLocation } from '@/lib/utils/format'
import Image from 'next/image'

interface ViewingRequestModalProps {
  property: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: (viewingRequest: any) => void
  user?: any
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
  landlordResponseTime = "within 2 hours"
}: ViewingRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    preferred_date: '',
    time_slot: 'afternoon' as 'morning' | 'afternoon' | 'evening',
    contact_number: user?.phone_number || '',
    message: '',
    tenant_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || ''
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
        tenant_name: formData.tenant_name
      }

      const response = await viewingRequestsAPI.create(requestData)

      if (response.success) {
        toast.success('✅ Viewing request sent successfully!')
        onSuccess?.(response.data)
        
        // Reset form
        setFormData({
          preferred_date: '',
          time_slot: 'afternoon' as 'morning' | 'afternoon' | 'evening',
          contact_number: user?.phone_number || '',
          message: '',
          tenant_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || ''
        })
        setErrors({})
        
        onClose()
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Schedule Property Viewing
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 mt-1">
                Request a viewing for <strong className="text-slate-900">"{property.title}"</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Property Summary Card - Enhanced */}
          <div className="bg-gradient-to-r from-slate-50 to-orange-50 rounded-lg p-4 border border-orange-100">
            <div className="flex gap-4">
              {/* Property Image */}
              <div className="w-24 h-24 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden">
                {property.images?.[0] ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-300">
                    <MapPin className="h-8 w-8 text-slate-600" />
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-base">{property.title}</h3>
                <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
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
                    <Bed className="h-4 w-4 text-slate-600" />
                    <span>{property.beds || 0} bed{property.beds !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-slate-600" />
                    <span>{property.baths || 0} bath{property.baths !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="tenant_name" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
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
                className={`h-12 text-base ${errors.tenant_name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
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
              <Label htmlFor="contact_number" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-500" />
                Your Contact Number
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_number"
                type="tel"
                placeholder="+234 803 456 7890"
                value={formData.contact_number}
                onChange={(e) => handleInputChange('contact_number', e.target.value)}
                className={`h-12 text-base ${errors.contact_number ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
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
              <Label htmlFor="preferred_date" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
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
                className={`h-12 text-base ${errors.preferred_date ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
              />
              {formData.preferred_date && !errors.preferred_date && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs text-green-700 flex items-center gap-1 font-medium">
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

            {/* Time Slot Selector - Visual Grid */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
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
                        : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-3xl mb-2">{slot.icon}</span>
                    <p className={`font-semibold text-sm ${
                      formData.time_slot === slot.value ? 'text-orange-700' : 'text-slate-700'
                    }`}>
                      {slot.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{slot.time}</p>
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
              <Label htmlFor="message" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-500" />
                Additional Message
                <span className="text-xs text-slate-500 font-normal ml-1">(Optional)</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Hi, I'm interested in viewing this property. Looking forward to hearing from you!"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                maxLength={500}
                rows={4}
                className="resize-none text-base focus:ring-orange-500"
              />
              <p className="text-xs text-slate-500 text-right">
                {formData.message.length}/500 characters
              </p>
            </div>

            {/* Viewing Summary */}
            {formData.preferred_date && selectedTimeSlot && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Viewing Summary
                </h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>📅 Date:</strong> {formatDate(formData.preferred_date)}</p>
                  <p><strong>🕐 Time:</strong> {selectedTimeSlot.time}</p>
                  <p><strong>📍 Property:</strong> {property.title}</p>
                  <p><strong>☎️ Contact:</strong> {formData.contact_number}</p>
                </div>
              </div>
            )}

            {/* Info Banners */}
            <div className="space-y-3 pt-2">
              {/* Response Time Notice */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 text-center">
                  <strong>⚡ Quick Response:</strong> Landlord typically responds {landlordResponseTime}.
                  You'll receive confirmation via SMS and email.
                </p>
              </div>

              {/* Trust & Safety */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800 text-center">
                  🛡️ <strong>Protected by Nulo:</strong> All viewing requests are logged and monitored for your safety.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-200">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
            className="flex-1 h-13 border-2 border-slate-300 hover:bg-slate-50 font-semibold text-base"
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
      </DialogContent>
    </Dialog>
  )
}
