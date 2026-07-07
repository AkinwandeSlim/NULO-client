"use client"

import { useEffect, useRef, useState } from "react"
import { X, Upload, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { maintenanceAPI, type CreateMaintenanceData } from "@/lib/api/maintenance"

interface RentedProperty {
  property_id: string
  property?: {
    id?: string
    title?: string
    address?: string
    city?: string
  }
}

interface ReportIssueModalProps {
  isOpen: boolean
  onClose: () => void
  rentedProperties: RentedProperty[]
  onSuccess: () => void
}

const CATEGORIES = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "APPLIANCE", label: "Appliance" },
  { value: "HVAC", label: "HVAC / Climate" },
  { value: "PEST_CONTROL", label: "Pest Control" },
  { value: "SECURITY", label: "Security" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "OTHER", label: "Other" },
]

const URGENCIES = [
  { value: "LOW", label: "Low — can wait", dotClass: "bg-blue-500" },
  { value: "MEDIUM", label: "Medium — needs attention", dotClass: "bg-amber-500" },
  { value: "HIGH", label: "High — urgent", dotClass: "bg-red-500" },
  { value: "EMERGENCY", label: "Emergency — immediate", dotClass: "bg-red-700" },
]

interface FormErrors {
  property_id?: string
  category?: string
  title?: string
  description?: string
  urgency?: string
}

export function ReportIssueModal({ isOpen, onClose, rentedProperties, onSuccess }: ReportIssueModalProps) {
  const [propertyId, setPropertyId] = useState("")
  const [category, setCategory] = useState("PLUMBING")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [urgency, setUrgency] = useState("MEDIUM")
  const [preferredDate, setPreferredDate] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setErrors({})
      setSubmitting(false)
      // Pre-select first property if available
      if (rentedProperties.length === 1 && !propertyId) {
        setPropertyId(rentedProperties[0].property_id)
      } else if (!propertyId && rentedProperties.length === 0) {
        // No rented properties — leave blank, validation will catch it
      }
    } else {
      // On close, fully reset
      setPropertyId("")
      setCategory("PLUMBING")
      setTitle("")
      setDescription("")
      setUrgency("MEDIUM")
      setPreferredDate("")
      removeAllPhotoPreviews()
      setPhotos([])
      setErrors({})
      setSubmitting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const removeAllPhotoPreviews = () => {
    photoPreviews.forEach((url) => URL.revokeObjectURL(url))
    setPhotoPreviews([])
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles: File[] = []
    const newPreviews: string[] = []

    Array.from(files).forEach((file) => {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is over 10MB and was skipped`)
        return
      }
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image and was skipped`)
        return
      }
      newFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    })

    setPhotos((prev) => [...prev, ...newFiles])
    setPhotoPreviews((prev) => [...prev, ...newPreviews])

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed)
      return prev.filter((_, i) => i !== index)
    })
  }

  const validate = (): FormErrors => {
    const e: FormErrors = {}
    if (!propertyId) e.property_id = "Please select a property"
    if (!category) e.category = "Please select a category"
    const titleTrim = title.trim()
    if (titleTrim.length < 5) e.title = "Title must be at least 5 characters"
    if (titleTrim.length > 255) e.title = "Title must be at most 255 characters"
    if (description.trim().length < 20)
      e.description = "Description must be at least 20 characters so the landlord understands the issue"
    if (!urgency) e.urgency = "Please select an urgency"
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const eMap = validate()
    setErrors(eMap)
    if (Object.keys(eMap).length > 0) {
      toast.error("Please fix the highlighted fields")
      return
    }

    setSubmitting(true)
    try {
      const payload: CreateMaintenanceData = {
        property_id: propertyId,
        category: category as CreateMaintenanceData["category"],
        title: title.trim(),
        description: description.trim(),
        urgency: urgency as CreateMaintenanceData["urgency"],
        preferred_date: preferredDate || undefined,
      }

      await maintenanceAPI.create(payload, photos.length > 0 ? photos : undefined)

      toast.success("Maintenance request submitted", {
        description: "Your landlord has been notified and will respond shortly.",
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error("Failed to submit maintenance request:", err)
      const msg = err?.response?.data?.detail || err?.message || "Failed to submit maintenance request"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const noProperties = rentedProperties.length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-issue-title"
      onClick={(e) => {
        // Click outside closes (unless submitting)
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 id="report-issue-title" className="text-2xl font-bold text-slate-900">
              Report New Issue
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Describe the maintenance issue. Your landlord will be notified immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5" noValidate>
          {noProperties && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  No active rental found
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  You can only report issues for properties you are actively renting.
                  Once you have an active agreement, you can submit a request.
                </p>
              </div>
            </div>
          )}

          {/* Property */}
          <div>
            <label htmlFor="property" className="block text-sm font-medium text-slate-700 mb-1.5">
              Property <span className="text-red-500">*</span>
            </label>
            <select
              id="property"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              disabled={noProperties || submitting}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 ${
                errors.property_id ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option value="">— Select a property —</option>
              {rentedProperties.map((p) => (
                <option key={p.property_id} value={p.property_id}>
                  {p.property?.title || "Property"} — {p.property?.city || ""}
                </option>
              ))}
            </select>
            {errors.property_id && (
              <p className="text-xs text-red-600 mt-1">{errors.property_id}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Kitchen sink leaking under cabinet"
              maxLength={255}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 ${
                errors.title ? "border-red-500" : "border-slate-300"
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.title ? (
                <p className="text-xs text-red-600">{errors.title}</p>
              ) : (
                <p className="text-xs text-slate-500">A short summary of the issue (5–255 chars)</p>
              )}
              <p className="text-xs text-slate-400">{title.length}/255</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="Provide details: when did it start, what have you tried, etc."
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 resize-none ${
                errors.description ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.description ? (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Minimum 20 characters</p>
            )}
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Urgency <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {URGENCIES.map((u) => (
                <label
                  key={u.value}
                  className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                    urgency === u.value
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={u.value}
                    checked={urgency === u.value}
                    onChange={(e) => setUrgency(e.target.value)}
                    disabled={submitting}
                    className="sr-only"
                  />
                  <span className={`h-2.5 w-2.5 rounded-full ${u.dotClass}`} aria-hidden="true" />
                  <span className="text-sm text-slate-700">{u.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Date */}
          <div>
            <label htmlFor="preferred-date" className="block text-sm font-medium text-slate-700 mb-1.5">
              Preferred visit date <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <input
              id="preferred-date"
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              disabled={submitting}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Photos <span className="text-slate-400 text-xs">(optional, max 10MB each)</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                disabled={submitting}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:text-orange-600"
              >
                <Upload className="h-5 w-5" />
                <span className="text-sm">Click to upload images</span>
              </label>
              {photoPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photoPreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        disabled={submitting}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || noProperties}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportIssueModal