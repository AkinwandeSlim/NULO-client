"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MessageCircle, Phone, User, CheckCircle2, AlertCircle, Shield } from "lucide-react"
import { toast } from "sonner"

interface ViewingRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: ViewingRequestData) => void
  propertyTitle: string
  landlordName: string
  landlordResponseTime: string
}

export interface ViewingRequestData {
  date: string
  timeSlot: 'morning' | 'afternoon' | 'evening'
  message: string
  contactNumber: string
  name: string
}

export function ViewingRequestModal({
  isOpen,
  onClose,
  onConfirm,
  propertyTitle,
  landlordName,
  landlordResponseTime
}: ViewingRequestModalProps) {
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('afternoon')
  const [message, setMessage] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  
  // Get date 3 months from now
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const timeSlots = [
    { value: 'morning', label: 'Morning', time: '9AM - 12PM', icon: '🌅' },
    { value: 'afternoon', label: 'Afternoon', time: '12PM - 4PM', icon: '☀️' },
    { value: 'evening', label: 'Evening', time: '4PM - 7PM', icon: '🌆' },
  ] as const

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Please enter your name"
    }

    if (!selectedDate) {
      newErrors.date = "Please select a viewing date"
    }

    if (!contactNumber.trim()) {
      newErrors.contactNumber = "Please enter your contact number"
    } else if (!/^[\d\s\+\-\(\)]+$/.test(contactNumber)) {
      newErrors.contactNumber = "Please enter a valid phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      const requestData: ViewingRequestData = {
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        message: message.trim(),
        contactNumber: contactNumber.trim(),
        name: name.trim(),
      }

      onConfirm(requestData)
      setIsSubmitting(false)
      
      // Reset form
      setSelectedDate("")
      setSelectedTimeSlot('afternoon')
      setMessage("")
      setContactNumber("")
      setName("")
      setErrors({})
    }, 1000)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
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
                Request Property Viewing
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 mt-1">
                Schedule a viewing for <strong className="text-slate-900">"{propertyTitle}"</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-orange-500" />
              Your Full Name
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors(prev => ({ ...prev, name: "" }))
              }}
              className={`h-12 text-base ${errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
            />
            {errors.name && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Preferred Viewing Date
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                min={today}
                max={maxDateStr}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setErrors(prev => ({ ...prev, date: "" }))
                }}
                className={`h-12 text-base ${errors.date ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
              />
            </div>
            {selectedDate && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs text-green-700 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {formatDate(selectedDate)}
                </p>
              </div>
            )}
            {errors.date && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.date}
              </p>
            )}
          </div>

          {/* Time Slot Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Preferred Time Slot
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setSelectedTimeSlot(slot.value)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    selectedTimeSlot === slot.value
                      ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
                      : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-3xl mb-2">{slot.icon}</span>
                  <p className={`font-semibold text-sm ${
                    selectedTimeSlot === slot.value ? 'text-orange-700' : 'text-slate-700'
                  }`}>{slot.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{slot.time}</p>
                  {selectedTimeSlot === slot.value && (
                    <CheckCircle2 className="h-5 w-5 text-orange-500 mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Phone className="h-4 w-4 text-orange-500" />
              Your Contact Number
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 803 456 7890"
              value={contactNumber}
              onChange={(e) => {
                setContactNumber(e.target.value)
                setErrors(prev => ({ ...prev, contactNumber: "" }))
              }}
              className={`h-12 text-base ${errors.contactNumber ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
            />
            {errors.contactNumber && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.contactNumber}
              </p>
            )}
          </div>

          {/* Message to Landlord */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-orange-500" />
              Additional Message
              <span className="text-xs text-slate-500 font-normal ml-1">(Optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Hi, I'm interested in viewing this property. Looking forward to hearing from you!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none text-base focus:ring-orange-500"
            />
            <p className="text-xs text-slate-500 text-right">
              {message.length}/500 characters
            </p>
          </div>

          {/* Info Banners */}
          <div className="space-y-3 pt-2">
            {/* Response Time Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800 text-center">
                <strong>⚡ Quick Response:</strong> {landlordName} typically responds {landlordResponseTime}. 
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

