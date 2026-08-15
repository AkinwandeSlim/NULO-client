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
import { cn } from '@/lib/utils'
import { dialogStyles as s } from '@/lib/utils/dialogStyles'

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
    contact_number: '',
    message: '',
    tenant_name: getInitialTenantName()
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
    maxDate.setMonth(maxDate.getMonth() + 3)
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
        setSuccessData({
          ...response.data,
          preferred_date: formData.preferred_date,
          time_slot: formData.time_slot,
          contact_number: formData.contact_number,
          tenant_name: formData.tenant_name,
          message: formData.message
        })
        setShowSuccess(true)
        toast.success('✅ Viewing request sent successfully!')
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
    if (showSuccess && successData) return

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
    if (!open) {
      handleClose()
    }
  }

  const handleResetAndClose = () => {
    onSuccess?.(successData)
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
    window.location.href = `/properties/${property.id}/apply`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={`${s.card} ${s.cardLg} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader className={s.header}>
          {showSuccess && successData ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <DialogTitle className={`${s.title} text-2xl font-bold`}>
                  Viewing Request Sent!
                </DialogTitle>
                <DialogDescription className={s.description}>
                  Your viewing request for "{property.title}" has been submitted successfully
                </DialogDescription>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-500/15">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <DialogTitle className={`${s.title} text-2xl font-bold`}>
                  Schedule Property Viewing
                </DialogTitle>
                <DialogDescription className={s.description}>
                  Request a viewing for <strong className="text-slate-900 dark:text-slate-50">"{property.title}"</strong>
                </DialogDescription>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className={cn(s.body, 'space-y-6')}>
          {showSuccess && successData ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
              <p className="mb-4 max-w-md text-center text-slate-700 dark:text-slate-300">
                Your request for <strong className="text-slate-900 dark:text-slate-50">{property.title}</strong> was submitted successfully.
                Your request is awaiting landlord confirmation. The landlord will respond {landlordResponseTime}.
                We will update you in Nulo, by email, and by SMS when available.
              </p>
              <div className={`${s.infoCardBlue} mb-6 w-full max-w-md`}>
                <h4 className="mb-3 flex items-center gap-2 font-medium text-blue-900 dark:text-blue-300">
                  <Calendar className="h-4 w-4" />
                  Viewing Details
                </h4>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex items-center justify-between">
                    <span><strong>📅 Date:</strong></span>
                    <span>{formatDate(successData.preferred_date) || successData.preferred_date || 'TBD'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span><strong>🕐 Time:</strong></span>
                    <span className="capitalize">
                      {successData.time_slot ? `${TIME_SLOTS.find(t => t.value === successData.time_slot)?.label} (${TIME_SLOTS.find(t => t.value === successData.time_slot)?.time})` : 'TBD'}
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
              <div className="flex w-full max-w-md flex-col gap-2">
                <Button
                  className={cn(s.primary, 'h-12 font-bold rounded-lg w-full')}
                  onClick={handleApplyNow}
                >
                  Apply Now →
                </Button>
                <div className="flex w-full flex-col gap-3 sm:flex-row">
                  <Button
                    className="h-12 flex-1 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                    onClick={handleNavigateToDashboard}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className={`${s.outline} flex-1`}
                    onClick={handleBrowseMore}
                  >
                    Browse More
                  </Button>
                </div>
                <Button
                  className="h-10 w-full rounded-lg bg-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={handleResetAndClose}
                >
                  Close (Stay on Property)
                </Button>
                <div className={`${s.infoCardBlue} mt-2`}>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>📋 Next Step:</strong> Your request is pending. You can apply now, or wait until the landlord confirms the exact appointment time.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Property Summary Card */}
              <div className={cn(s.section, 'border-orange-100 bg-gradient-to-r from-slate-50 to-orange-50 dark:border-orange-500/20 dark:from-slate-900/60 dark:to-orange-500/10')}>
                <div className="flex gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                    {property.images?.[0] ? (
                      <img src={property.images[0]} alt={property.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-300 dark:bg-slate-700">
                        <MapPin className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{property.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {formatLocation(property.location || property.address || 'Location TBD')}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {formatPrice(property.price)}/month
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Bed className="h-4 w-4" />
                        <span>{property.beds || 0} bed{property.beds !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Bath className="h-4 w-4" />
                        <span>{property.baths || 0} bath{property.baths !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tenant_name" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
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
                    className={`${s.inputLg} ${errors.tenant_name ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-orange-500/30'} ${s.input}`}
                  />
                  {errors.tenant_name && (
                    <p className={s.error}>
                      <AlertCircle className="h-3 w-3" />
                      {errors.tenant_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_number" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
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
                    className={`${s.inputLg} ${errors.contact_number ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-orange-500/30'} ${s.input}`}
                    autoComplete="tel"
                  />
                  {errors.contact_number && (
                    <p className={s.error}>
                      <AlertCircle className="h-3 w-3" />
                      {errors.contact_number}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_date" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
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
                    className={`${s.inputLg} ${errors.preferred_date ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-orange-500/30'} ${s.input}`}
                  />
                  {formData.preferred_date && !errors.preferred_date && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-2 dark:border-green-800/50 dark:bg-green-950/40">
                      <p className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {formatDate(formData.preferred_date)}
                      </p>
                    </div>
                  )}
                  {errors.preferred_date && (
                    <p className={s.error}>
                      <AlertCircle className="h-3 w-3" />
                      {errors.preferred_date}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
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
                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
                          formData.time_slot === slot.value
                            ? 'scale-105 border-orange-500 bg-orange-50 shadow-md dark:bg-orange-500/15'
                            : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-orange-500/50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="mb-2 text-3xl">{slot.icon}</span>
                        <p className={`text-sm font-semibold ${
                          formData.time_slot === slot.value
                            ? 'text-orange-700 dark:text-orange-300'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {slot.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{slot.time}</p>
                        {formData.time_slot === slot.value && (
                          <CheckCircle2 className="mt-2 h-5 w-5 text-orange-500" />
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.time_slot && (
                    <p className={s.error}>
                      <AlertCircle className="h-3 w-3" />
                      {errors.time_slot}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <MessageSquare className="h-4 w-4 text-orange-500" />
                    Additional Message
                    <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">(Optional)</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Hi, I'm interested in viewing this property. Looking forward to hearing from you!"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    maxLength={500}
                    rows={4}
                    className={`${s.textarea} resize-none text-base focus-visible:ring-orange-500/30`}
                  />
                  <p className="text-right text-xs text-slate-500 dark:text-slate-400">
                    {formData.message.length}/500 characters
                  </p>
                </div>

                {formData.preferred_date && selectedTimeSlot && (
                  <div className={s.infoCardBlue}>
                    <h4 className="mb-3 flex items-center gap-2 font-medium text-blue-900 dark:text-blue-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Viewing Summary
                    </h4>
                    <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <p><strong>📅 Date:</strong> {formatDate(formData.preferred_date)}</p>
                      <p><strong>🕐 Time:</strong> {selectedTimeSlot.time}</p>
                      <p><strong>📍 Property:</strong> {property.title}</p>
                      <p><strong>☎️ Contact:</strong> {formData.contact_number}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div className={s.infoCardBlue}>
                    <p className="text-center text-sm text-blue-800 dark:text-blue-200">
                      <strong>⚡ Quick Response:</strong> Landlord typically responds {landlordResponseTime}.
                      You'll receive confirmation via SMS and email.
                    </p>
                  </div>
                  <div className={s.infoCardGreen}>
                    <p className="text-center text-sm text-green-800 dark:text-green-200">
                      🛡️ <strong>Protected by Nulo:</strong> All viewing requests are logged and monitored for your safety.
                    </p>
                  </div>
                </div>

                <div className={cn(s.footer, '!bg-transparent !border-none !px-0 !py-0 sm:!justify-end !gap-3')}>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    disabled={isSubmitting}
                    className={cn(s.outline, 'h-13 text-base font-semibold flex-1')}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={cn(s.primary, 'h-13 text-base font-bold shadow-lg hover:shadow-xl flex-1')}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2 animate-spin">⏳</span>
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-5 w-5" />
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
