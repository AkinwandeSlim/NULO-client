"use client"

/**
 * PropFlow in-chat viewing cards.
 *
 * These cards turn "viewing scheduling" into a native decision point inside
 * the PropFlow chat — the tenant can schedule a viewing, track its status, or
 * accept/decline a landlord-proposed time WITHOUT leaving the widget.
 *
 * All writes go through the existing tenant viewing API
 * (lib/api/viewingRequestsTenant.ts) and the existing viewing_requests table.
 * No parallel flow, no new tables, no migration.
 *
 * Confirmed-only details (safety instructions, caretaker, meeting URL) are
 * rendered ONLY from a request whose status is "confirmed" — the backend
 * already masks those fields to null until the appointment is fixed, and this
 * component never invents them.
 */

import React, { useState } from "react"
import Link from "next/link"
import {
  Building2, CalendarCheck2, CheckCircle2, Clock, Loader2, MapPin, Sparkles, Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ViewingRequest, ViewingRequestData } from "@/lib/api/viewingRequestsTenant"

export type ViewingType = "PHYSICAL" | "VIRTUAL" | "LIVE_VIDEO"
export type TimeSlot = "morning" | "afternoon" | "evening"

/**
 * The subset of a property the viewing cards actually render. Both the
 * PropFlow match (PropertyMatch) and the viewing API's `property` row satisfy
 * this shape.
 */
export interface ViewingProperty {
  id: string
  title: string
  location?: string
  price?: number
  images?: string[]
  virtual_tour_url?: string
  video_tour_url?: string
}

export const TIME_SLOT_LABEL: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
}

export const VIEWING_TYPE_LABEL: Record<string, string> = {
  PHYSICAL: "Physical viewing",
  VIRTUAL: "Virtual tour",
  LIVE_VIDEO: "Live video viewing",
}

export function formatDate(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  })
}

function PropertyRow({ property }: { property: ViewingProperty }) {
  return (
    <div className="flex items-center gap-3 p-3">
      {property.images?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={property.images[0]} alt={property.title} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-slate-300" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{property.title}</p>
        {property.location && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
        )}
        {typeof property.price === "number" && property.price > 0 && (
          <p className="text-xs font-semibold text-orange-600 mt-0.5">
            NGN {property.price.toLocaleString()}/mo
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Step header — makes each AI turn visually distinct ──────────────────────
// Every viewing card opens with a colored band naming the step, so a new
// response never reads as "the same property card again". Each card type uses
// a different color: decision=indigo, schedule=blue, confirmation=green,
// status=per-status tone.
const STEP_HEADER_TONE: Record<string, string> = {
  indigo: "bg-indigo-600",
  blue: "bg-blue-600",
  green: "bg-emerald-600",
  amber: "bg-amber-500",
  slate: "bg-slate-600",
}

function StepHeader({ step, title, tone, icon }: {
  step: string
  title?: string
  tone: "indigo" | "blue" | "green" | "amber" | "slate"
  icon?: React.ReactNode
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 ${STEP_HEADER_TONE[tone]}`}>
      {icon && <span className="text-white/90 flex-shrink-0">{icon}</span>}
      <div className="min-w-0">
        <p className="text-white/80 text-[10px] font-semibold uppercase tracking-wider">{step}</p>
        {title && <p className="text-white text-sm font-semibold leading-tight truncate">{title}</p>}
      </div>
    </div>
  )
}

// ─── Viewing decision — "view first, or apply now?" ─────────────────────────

export function ViewingDecisionCard({ property, onScheduleViewing, onApplyNow, onContinueBrowsing, onAskQuestion }: {
  property: ViewingProperty
  onScheduleViewing: () => void
  onApplyNow: () => void
  onContinueBrowsing: () => void
  onAskQuestion: () => void
}) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
      <StepHeader
        step="Next step"
        title="Choose your next step"
        tone="indigo"
        icon={<Sparkles className="h-4 w-4" />}
      />
      <div className="px-3 pb-3">
        <p className="text-sm text-slate-700 leading-relaxed pt-3">
          <span className="font-semibold text-slate-800">{property.title}</span> is ready to explore. A virtual tour is self-guided; after it, you can apply or book a physical viewing to confirm the property in person.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onScheduleViewing}
            className="text-sm font-medium rounded-xl py-2 inline-flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            <CalendarCheck2 className="h-4 w-4" />
            Book physical viewing
          </button>
          <button
            type="button"
            onClick={onApplyNow}
            className="text-sm font-medium rounded-xl py-2 border border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            Apply now
          </button>
        </div>
        {property.virtual_tour_url && (
          <Link
            href={`/properties/${property.id}/virtual-tour?from=propflow`}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <Video className="h-4 w-4" /> Start self-guided virtual tour
          </Link>
        )}
        <div className="mt-2.5 flex items-center justify-center gap-3 text-xs">
          <button type="button" onClick={onContinueBrowsing}
            className="text-slate-500 hover:text-slate-700 underline underline-offset-2">Continue browsing</button>
          <span className="text-slate-200">·</span>
          <button type="button" onClick={onAskQuestion}
            className="text-slate-500 hover:text-slate-700 underline underline-offset-2">Ask a question</button>
        </div>
      </div>
    </div>
  )
}

// ─── Viewing scheduling — compact in-chat form ───────────────────────────────

function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string; disabled?: boolean }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "text-xs font-medium rounded-lg py-1.5 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300",
            value === o.value
              ? "bg-orange-500 border-orange-500 text-white"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
            o.disabled && "opacity-40 cursor-not-allowed",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const inputCls =
  "w-full text-sm rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-colors"
const labelCls = "block text-[11px] font-medium text-slate-500 mb-1"

export function ViewingScheduleCard({ property, defaultName, defaultPhone, submitting, error, onSubmit, onApplyNow }: {
  property: ViewingProperty
  defaultName: string
  defaultPhone: string
  submitting: boolean
  error?: string | null
  onSubmit: (data: ViewingRequestData) => void
  onApplyNow?: () => void
}) {
  const [viewingType, setViewingType] = useState<ViewingType>("PHYSICAL")
  const [date, setDate] = useState("")
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning")
  const [contact, setContact] = useState(defaultPhone || "")
  const [message, setMessage] = useState("")

  const supportsLive = !!property.video_tour_url
  const typeOptions: { value: ViewingType; label: string; disabled?: boolean }[] = [
    { value: "PHYSICAL", label: "Physical" },
    { value: "LIVE_VIDEO", label: "Live video", disabled: !supportsLive },
  ]
  const effectiveType = typeOptions.find(o => o.value === viewingType && !o.disabled)?.value ?? "PHYSICAL"

  // Same window as the manual viewing modal: today → +3 months.
  const today = new Date()
  const minDate = today.toISOString().split("T")[0]
  const maxDateObj = new Date()
  maxDateObj.setMonth(maxDateObj.getMonth() + 3)
  const maxDate = maxDateObj.toISOString().split("T")[0]

  const contactOk = contact.trim().length >= 9
  const nameOk = !!defaultName.trim()
  const valid = !!date && !!timeSlot && contactOk && nameOk

  const remainingText = !contactOk
    ? "Add your phone number to continue."
    : !date
    ? "Choose a preferred date."
    : "Pick a time period."

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || submitting) return
    onSubmit({
      property_id: property.id,
      preferred_date: date,
      time_slot: timeSlot,
      contact_number: contact.trim(),
      message: message.trim() || undefined,
      tenant_name: defaultName.trim(),
      viewing_type: effectiveType,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden">
      <StepHeader
        step="Book an appointment"
        title={property.title}
        tone="blue"
        icon={<CalendarCheck2 className="h-4 w-4" />}
      />
      <div className="px-3 pt-3">
        <p className="text-[11px] text-slate-500">Choose a physical or live viewing time — the landlord will confirm.</p>
      </div>
      <PropertyRow property={property} />
      <div className="px-3 pb-3 space-y-2.5">
        {property.virtual_tour_url && (
          <Link
            href={`/properties/${property.id}/virtual-tour?from=propflow`}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <Video className="h-4 w-4" /> Prefer to explore online first? Start the virtual tour
          </Link>
        )}
        <div>
          <span className={labelCls}>Appointment type</span>
          <Segmented options={typeOptions} value={effectiveType} onChange={setViewingType} />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-viewing-date">Preferred date</label>
          <input id="pf-viewing-date" type="date" min={minDate} max={maxDate} value={date}
            onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <span className={labelCls}>Preferred time period</span>
          <Segmented
            options={["morning", "afternoon", "evening"].map(v => ({ value: v as TimeSlot, label: TIME_SLOT_LABEL[v] }))}
            value={timeSlot}
            onChange={setTimeSlot}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-viewing-phone">Your phone number</label>
          <input id="pf-viewing-phone" type="tel" inputMode="tel" value={contact} onChange={e => setContact(e.target.value)}
            placeholder="e.g. 0801 234 5678" className={inputCls} />
          {!contactOk && contact.trim() !== "" && (
            <p className="text-[11px] text-red-500 mt-1">Enter a valid phone number.</p>
          )}
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-viewing-note">Note to landlord (optional)</label>
          <textarea id="pf-viewing-note" rows={1} value={message} onChange={e => setMessage(e.target.value)}
            placeholder="e.g. I'm free after 4pm on weekdays"
            className={cn(inputCls, "resize-none min-h-[36px]")} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={!valid || submitting}
          className="w-full text-sm font-medium rounded-xl py-2 inline-flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request viewing"}
        </button>
        {!valid && !submitting && <p className="text-[11px] text-amber-600 text-center mt-1">{remainingText}</p>}
        {onApplyNow && (
          <div className="flex items-center justify-center">
            <button type="button" onClick={onApplyNow} disabled={submitting}
              className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2">
              Apply now instead
            </button>
          </div>
        )}
      </div>
    </form>
  )
}

// ─── Viewing confirmation — after a successful request ───────────────────────

export function ViewingConfirmationCard({ property, date, timeSlot, viewingType, onApplyNow, onContinueBrowsing }: {
  property: ViewingProperty
  date: string
  timeSlot: string
  viewingType: string
  onApplyNow: () => void
  onContinueBrowsing: () => void
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
      <StepHeader
        step="Viewing request sent"
        title={property.title}
        tone="green"
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <div className="p-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-900">Request received</p>
      </div>
      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
        The landlord will review your preferred time. Track their response in <span className="font-semibold">My Viewings</span> — we'll also notify you by email when they confirm or propose a new time.
      </p>
      <div className="mt-2.5 rounded-xl border border-emerald-100 bg-white p-2.5 space-y-1 text-xs">
        <div className="flex justify-between gap-3"><span className="text-slate-500">Property</span><span className="font-medium text-slate-700 text-right">{property.title}</span></div>
        <div className="flex justify-between gap-3"><span className="text-slate-500">Requested</span><span className="font-medium text-slate-700 text-right">{formatDate(date)} · {TIME_SLOT_LABEL[timeSlot] || timeSlot}</span></div>
        <div className="flex justify-between gap-3"><span className="text-slate-500">Type</span><span className="font-medium text-slate-700 text-right">{VIEWING_TYPE_LABEL[viewingType] || viewingType}</span></div>
      </div>
      {/* Primary CTA — the dashboard is where the next action happens */}
      <div className="mt-3">
        <Link href="/tenant/viewings"
          className="block w-full text-sm font-semibold rounded-xl py-2.5 text-center bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          Go to My Viewings
        </Link>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={onApplyNow}
          className="text-sm font-medium rounded-lg py-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
          Apply now instead
        </button>
        <button type="button" onClick={onContinueBrowsing}
          className="text-sm font-medium rounded-lg py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
          Continue browsing
        </button>
      </div>
      </div>
    </div>
  )
}

// ─── Viewing status — lifecycle-aware, driven by the backend status ──────────

export function ViewingStatusCard({ property, request, onContinueBrowsing, onApplyNow, onRequestAnotherViewing, onAcceptReschedule, onDeclineReschedule }: {
  property: ViewingProperty
  request: ViewingRequest | null
  onContinueBrowsing: () => void
  onApplyNow: () => void
  onRequestAnotherViewing: () => void
  onAcceptReschedule: () => void
  onDeclineReschedule: () => void
}) {
  const status = request?.status

  if (!request || !status) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <p className="text-sm text-slate-600">No viewing request found for this property.</p>
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={onRequestAnotherViewing}
            className="text-sm font-medium text-orange-600 hover:underline underline-offset-2">Request a viewing</button>
        </div>
      </div>
    )
  }

  const requestedLine = `${formatDate(request.preferred_date)} · ${TIME_SLOT_LABEL[request.time_slot] || request.time_slot}`

  // Confirmed-only instructions — only rendered when status is confirmed and
  // the field exists (the backend masks these to null otherwise).
  const showConfirmedDetails =
    status === "confirmed" &&
    !!(request.safety_instructions || request.caretaker_name || request.caretaker_phone || request.meeting_url)

  const statusTone: "amber" | "blue" | "green" | "slate" =
    status === "pending" ? "amber" :
    status === "reschedule_proposed" ? "blue" :
    status === "confirmed" ? "green" :
    "slate"
  const statusStep =
    status === "pending" ? "Awaiting landlord review" :
    status === "reschedule_proposed" ? "New time proposed" :
    status === "confirmed" ? "Viewing confirmed" :
    status === "completed" ? "How did the viewing go?" :
    status === "cancelled" ? "Request closed" :
    "Appointment missed"

  const footerTwo: React.ReactNode = (
    <>
      <div className="mt-3">
        <Link href="/tenant/viewings"
          className="block w-full text-sm font-semibold rounded-xl py-2.5 text-center bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          Go to My Viewings
        </Link>
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={onContinueBrowsing}
          className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2">Continue browsing</button>
      </div>
    </>
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <StepHeader
        step="Viewing status"
        title={statusStep}
        tone={statusTone}
        icon={<Clock className="h-4 w-4" />}
      />
      <PropertyRow property={property} />
      <div className="px-3 pb-3">
        {status === "pending" && (
          <>
            <p className="text-xs text-slate-500 mt-1">Your viewing request is awaiting landlord review.</p>
            <div className="mt-2 text-xs bg-slate-50 rounded-lg p-2">
              <div className="flex justify-between gap-3"><span className="text-slate-500">Requested</span><span className="font-medium text-slate-700 text-right">{requestedLine}</span></div>
            </div>
            {footerTwo}
            <div className="mt-2 flex justify-center">
              <button type="button" onClick={onApplyNow}
                className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2">Apply now instead</button>
            </div>
          </>
        )}

        {status === "reschedule_proposed" && (
          <>
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-slate-800">New time proposed by the landlord</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              The landlord proposed{" "}
              <span className="font-semibold text-slate-700">{formatDate(request.confirmed_date)} at {request.confirmed_time}</span>.
              Does that work for you?
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={onAcceptReschedule}
                className="text-sm font-medium rounded-lg py-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                Accept new time
              </button>
              <button type="button" onClick={onDeclineReschedule}
                className="text-sm font-medium rounded-lg py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
                Decline new time
              </button>
            </div>
          </>
        )}

        {status === "confirmed" && (
          <>
            {(() => {
              // Check if viewing date is in the past
              const viewingDate = request.confirmed_date || request.preferred_date
              const isPastDate = viewingDate && new Date(viewingDate) < new Date(new Date().setHours(0, 0, 0, 0))
              
              if (isPastDate) {
                // Past viewing - treat as completed
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <p className="text-sm font-semibold text-slate-800">Viewing completed</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Your viewing appointment was on <span className="font-semibold text-slate-700">{formatDate(request.confirmed_date)} at {request.confirmed_time}</span>.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={onApplyNow}
                        className="text-sm font-medium rounded-lg py-2 bg-orange-500 hover:bg-orange-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                        Start application
                      </button>
                      <button type="button" onClick={onContinueBrowsing}
                        className="text-sm font-medium rounded-lg py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
                        Keep searching
                      </button>
                    </div>
                  </>
                )
              }
              
              // Future viewing - show normal confirmation
              return (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-slate-800">Viewing confirmed</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Confirmed for <span className="font-semibold text-slate-700">{formatDate(request.confirmed_date)} at {request.confirmed_time}</span>.
                  </p>
                  {showConfirmedDetails && (
                    <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-xs space-y-1">
                      {request.safety_instructions && <p className="text-slate-600">{request.safety_instructions}</p>}
                      {request.caretaker_name && (
                        <p className="text-slate-600">Caretaker: <span className="font-medium text-slate-700">{request.caretaker_name}</span>{request.caretaker_phone ? ` · ${request.caretaker_phone}` : ""}</p>
                      )}
                      {request.meeting_url && (
                        <a href={request.meeting_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
                          <Video className="h-3 w-3" /> Join live video
                        </a>
                      )}
                    </div>
                  )}
                  <div className="mt-3">
                    <Link href="/tenant/viewings"
                      className="block w-full text-sm font-semibold rounded-xl py-2.5 text-center bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                      Go to My Viewings
                    </Link>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={onApplyNow}
                      className="text-sm font-medium rounded-lg py-2 border border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                      Start application
                    </button>
                    <button type="button" onClick={onContinueBrowsing}
                      className="text-sm font-medium rounded-lg py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
                      Keep searching
                    </button>
                  </div>
                </>
              )
            })()}
          </>
        )}

        {status === "cancelled" && (
          <>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-slate-800">Viewing request closed</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">This viewing request was cancelled.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={onRequestAnotherViewing}
                className="text-sm font-medium rounded-lg py-2 bg-orange-500 hover:bg-orange-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                Request another viewing
              </button>
              <button type="button" onClick={onContinueBrowsing}
                className="text-sm font-medium rounded-lg py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
                Continue browsing
              </button>
            </div>
            <div className="mt-2 flex justify-center">
              <button type="button" onClick={onApplyNow}
                className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2">Apply now instead</button>
            </div>
          </>
        )}

        {status === "completed" && (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-slate-800">How did the viewing go?</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">Would you like to apply for this property?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={onApplyNow}
                className="text-sm font-medium rounded-lg py-2 bg-orange-500 hover:bg-orange-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                Apply now
              </button>
              <button type="button" onClick={onContinueBrowsing}
                className="text-sm font-medium rounded-lg py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
                Keep searching
              </button>
            </div>
          </>
        )}

        {status === "no_show" && (
          <>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-slate-800">Appointment missed</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              The landlord marked this appointment as missed. If you'd still like to see this property, you can request another viewing.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={onRequestAnotherViewing}
                className="text-sm font-medium rounded-lg py-2 bg-orange-500 hover:bg-orange-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
                Request another viewing
              </button>
              <button type="button" onClick={onContinueBrowsing}
                className="text-sm font-medium rounded-lg py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
                Continue browsing
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
