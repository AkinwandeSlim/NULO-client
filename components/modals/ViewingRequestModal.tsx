"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Phone, MessageSquare, Loader2 } from "lucide-react"
import { viewingRequestsAPI } from "@/lib/api/viewingRequests"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

interface ViewingRequestModalProps {
  isOpen: boolean
  onClose: () => void
  property: {
    id: string
    title: string
    landlord_id: string
  }
}

export function ViewingRequestModal({ isOpen, onClose, property }: ViewingRequestModalProps) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    preferred_date: "",
    time_slot: "afternoon" as "morning" | "afternoon" | "evening",
    contact_number: profile?.phone_number || "",
    tenant_name: profile?.full_name || "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please sign in to request a viewing")
      return
    }

    // Validation
    if (!formData.preferred_date) {
      toast.error("Please select a preferred date")
      return
    }

    if (!formData.contact_number) {
      toast.error("Please provide a contact number")
      return
    }

    if (!formData.tenant_name) {
      toast.error("Please provide your name")
      return
    }

    try {
      setLoading(true)
      
      const response = await viewingRequestsAPI.create({
        property_id: property.id,
        preferred_date: formData.preferred_date,
        time_slot: formData.time_slot,
        contact_number: formData.contact_number,
        tenant_name: formData.tenant_name,
        message: formData.message,
      })

      toast.success("Viewing request sent!", {
        description: "The landlord will contact you soon to confirm the viewing.",
      })

      // Reset form
      setFormData({
        preferred_date: "",
        time_slot: "afternoon",
        contact_number: profile?.phone_number || "",
        tenant_name: profile?.full_name || "",
        message: "",
      })

      onClose()
    } catch (error: any) {
      console.error("Failed to create viewing request:", error)
      toast.error("Failed to send request", {
        description: error.response?.data?.detail || "Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Request a Viewing
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Schedule a viewing for <span className="font-semibold text-slate-900">{property.title}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Preferred Date */}
          <div className="space-y-2">
            <Label htmlFor="preferred_date" className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              Preferred Date
            </Label>
            <Input
              id="preferred_date"
              type="date"
              min={getMinDate()}
              value={formData.preferred_date}
              onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
              className="w-full"
              required
            />
            <p className="text-xs text-slate-500">Select your preferred viewing date</p>
          </div>

          {/* Time Slot */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Preferred Time
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "morning", label: "Morning", time: "9AM - 12PM" },
                { value: "afternoon", label: "Afternoon", time: "12PM - 5PM" },
                { value: "evening", label: "Evening", time: "5PM - 8PM" },
              ].map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, time_slot: slot.value as any })}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.time_slot === slot.value
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-slate-200 hover:border-orange-300 text-slate-700"
                  }`}
                >
                  <div className="font-semibold text-sm">{slot.label}</div>
                  <div className="text-xs mt-1">{slot.time}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <Label htmlFor="contact_number" className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <Phone className="h-4 w-4 text-orange-600" />
              Contact Number
            </Label>
            <Input
              id="contact_number"
              type="tel"
              placeholder="+234 803 456 7890"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              className="w-full"
              required
            />
            <p className="text-xs text-slate-500">We'll share this with the landlord</p>
          </div>

          {/* Tenant Name */}
          <div className="space-y-2">
            <Label htmlFor="tenant_name" className="text-sm font-medium text-slate-900">
              Your Name
            </Label>
            <Input
              id="tenant_name"
              type="text"
              placeholder="John Doe"
              value={formData.tenant_name}
              onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
              className="w-full"
              required
            />
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Any specific questions or requirements?"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-slate-500 text-right">
              {formData.message.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
