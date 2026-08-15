"use client"

/**
 * PropFlowChat
 * Floating AI rental assistant widget powered by Qwen.
 *
 * Supports the full 4-interrupt flow:
 *   1. Chat to property selection
 *   2. Landlord approval
 *   3. Lease signing (tenant + landlord)
 *   4. Payment + confirmation
 */

import React, { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle, Bot, Building2, CheckCircle2, ChevronDown, ChevronRight, Eye,
  Loader2, Lock, MapPin, MessageCircle, RotateCcw, Send, ShieldCheck,
  ThumbsUp, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  propflowChat, propflowGuestChat, propflowSelect, propflowResume,
  propflowSimulatePayment, propflowStatus, propflowCompleteApplication,
  type ChatResponse, type PropertyMatch,
  type CompleteApplicationPayload,
} from "@/lib/api/propflow"
import { viewingRequestsAPI, type ViewingRequest, type ViewingRequestData } from "@/lib/api/viewingRequestsTenant"
import TrustPassportCard from "./TrustPassportCard"
import {
  ViewingDecisionCard, ViewingScheduleCard, ViewingConfirmationCard,
  ViewingStatusCard,
  type ViewingProperty,
} from "./ViewingFlowCard"

// --- Types ------------------------------------------------------------------

type MessageRole = "user" | "agent" | "system"
interface Message {
  id: string; role: MessageRole; text: string; timestamp: Date
  propertyMatches?: PropertyMatch[]; paymentAccount?: { number: string; amount: number }
  stage?: string; actionLabel?: string; actionType?: ActionType
  actionUrl?: string  // for navigation-type actions (e.g. link to dashboard page)
  signIn?: boolean    // renders the guest "log in to apply" card
  trustPassport?: { property: PropertyMatch }  // renders the in-chat Trust Passport card
  // Viewing scheduling (in-chat decision layer over the existing viewing API):
  viewingDecision?: { property: ViewingProperty; index?: number }       // "view first or apply now?"
  viewingSchedule?: { property: ViewingProperty; index?: number }       // compact scheduling form
  viewingConfirmation?: { property: ViewingProperty; index?: number; date: string; timeSlot: string; viewingType: string }
  viewingStatus?: { property: ViewingProperty; index?: number; request: ViewingRequest | null }
}
type ActionType = "select_property" | "sign_lease" | "simulate_payment" | "confirm_payment" | "restart"
/** Viewing actions the chat can route to without calling the search graph. */
type ChatIntent = "view" | "apply" | "status" | "accept_reschedule" | "decline_reschedule" | null
interface PropFlowChatProps { defaultOpen?: boolean; className?: string }

/** Normalise the tenant viewing-requests list response into a typed array. */
function getViewingRequestsFrom(res: { data?: unknown }): ViewingRequest[] {
  const d = (res as { data?: { viewing_requests?: unknown } }).data
  return Array.isArray(d?.viewing_requests) ? (d.viewing_requests as ViewingRequest[]) : []
}

/** Callbacks the viewing cards fire back into the chat widget. */
type ViewingHandlers = {
  onSchedule: (p: ViewingProperty, index?: number) => void
  onApply: (p: ViewingProperty, index?: number) => void
  onSubmit: (p: ViewingProperty, index: number | undefined, data: ViewingRequestData) => void
  onContinue: () => void
  onAsk: () => void
  onReschedule: (id: string, decision: "accept" | "decline", p: ViewingProperty, index?: number) => void
  onRequestAgain: (p: ViewingProperty, index?: number) => void
}

const AGENT_NAME = "PropFlow"

// --- Sub-components ---------------------------------------------------------

function PropertyCard({ property, index, onSelect }: {
  property: PropertyMatch; index: number; onSelect: (index: number) => void
}) {
  const images = property.images || []
  const type = property.property_type
    ? property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)
    : null
  const metaBits = [
    property.beds ? `${property.beds} bed${property.beds > 1 ? "s" : ""}` : null,
    property.baths ? `${property.baths} bath${property.baths > 1 ? "s" : ""}` : null,
    type,
  ].filter(Boolean).join(" · ")

  return (
    <div className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
      <div className="relative">
        {images[0] ? (
          <img src={images[0]} alt={property.title} className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 bg-slate-100 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-slate-300" />
          </div>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-medium rounded-md px-1.5 py-0.5">
            {images.length} photos
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-slate-800 truncate">{property.title}</p>
        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-orange-600 font-bold text-sm">NGN {property.price.toLocaleString()}/mo</span>
          {metaBits && <span className="text-xs text-slate-400 truncate">{metaBits}</span>}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => onSelect(index)}
            className="text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-1.5">
            Select This Property
          </button>
          <Link href={`/properties/${property.id}`}
            className="text-xs font-medium border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg py-1.5 inline-flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" />
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}

function PaymentAccountCard({ accountNumber, amount }: { accountNumber: string; amount: number }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm font-semibold text-green-800">Payment Account Ready</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span className="text-slate-500">Bank</span><span className="font-medium text-slate-700">NomBank MFB (Demo)</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Account</span><span className="font-mono font-bold text-slate-800 tracking-widest">{accountNumber}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-green-700">NGN {amount.toLocaleString()}</span></div>
      </div>
    </div>
  )
}

/**
 * Calm contextual status shown in the header (and on messages) instead of the
 * old red "Error" pill. A red state is only used when a real request fails and
 * includes a "Try again" affordance. Every other stage maps to a quiet,
 * reassuring label.
 */
type Tone = "slate" | "orange" | "amber" | "indigo" | "sky" | "green" | "red"

const STATUS_FOR_STAGE: Record<string, { label: string; tone: Tone }> = {
  idle: { label: "Ready", tone: "slate" },
  intent_extracted: { label: "Finding homes", tone: "slate" },
  needs_clarification: { label: "Just a moment", tone: "amber" },
  awaiting_tenant_selection: { label: "Finding homes", tone: "slate" },
  awaiting_trust_profile: { label: "Application ready", tone: "orange" },
  application_created: { label: "Waiting for landlord review", tone: "amber" },
  awaiting_landlord_approval: { label: "Waiting for landlord review", tone: "amber" },
  agreement_drafted: { label: "Action needed", tone: "indigo" },
  awaiting_landlord_signature: { label: "Action needed", tone: "indigo" },
  nomba_provisioned: { label: "Payment pending", tone: "sky" },
  awaiting_full_payment: { label: "Payment pending", tone: "sky" },
  disbursement_complete: { label: "All done", tone: "green" },
}

const TONE_CLS: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600",
  orange: "bg-orange-50 text-orange-700",
  amber: "bg-amber-50 text-amber-700",
  indigo: "bg-indigo-50 text-indigo-700",
  sky: "bg-sky-50 text-sky-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-600",
}
const DOT_CLS: Record<Tone, string> = {
  slate: "bg-slate-400", orange: "bg-orange-500", amber: "bg-amber-500",
  indigo: "bg-indigo-500", sky: "bg-sky-500", green: "bg-emerald-500", red: "bg-red-500",
}

function StatusChip({ stage, error, onRetry, showIdle = false }: {
  stage: string
  error?: string | null
  onRetry?: () => void
  showIdle?: boolean
}) {
  if (error) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">
        <AlertCircle className="h-3 w-3" />
        Something went wrong
        {onRetry && (
          <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2 hover:text-red-700">
            Try again
          </button>
        )}
      </span>
    )
  }
  const st = STATUS_FOR_STAGE[stage]
  if (!st) return null
  if (stage === "idle" && !showIdle) return null
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", TONE_CLS[st.tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLS[st.tone])} />
      {st.label}
    </span>
  )
}

/** Compact in-chat card for the property the tenant selected — the full guided
 *  application opens as a focused modal (TrustPassportCard), not inline. */
function TrustPassportBanner({ property, onContinue }: {
  property: PropertyMatch
  onContinue: () => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {property.images?.[0] ? (
          <img src={property.images[0]} alt={property.title} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-slate-300" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 leading-tight">Complete your application</p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {property.title}{property.location ? ` · ${property.location}` : ""}
          </p>
          <p className="text-xs font-semibold text-orange-600 mt-0.5">
            NGN {property.price.toLocaleString()}/mo
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 text-orange-500 flex-shrink-0" />
      </div>
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onContinue}
          className="w-full text-sm font-medium rounded-xl py-2.5 inline-flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          Continue application
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ChatBubble({ msg, onSelectProperty, onAction, onOpenTrust, onViewing, viewingContext }: {
  msg: Message; onSelectProperty?: (i: number) => void; onAction?: (t: ActionType) => void
  onOpenTrust?: () => void
  onViewing?: ViewingHandlers
  viewingContext?: { name: string; phone: string; submitting: boolean; error: string | null }
}) {
  const isUser = msg.role === "user"
  const isSystem = msg.role === "system"
  const hasCards = !isUser && !isSystem && !!(msg.propertyMatches && msg.propertyMatches.length > 0)
  // Guest sign-in card renders full-width instead of a text bubble.
  if (msg.signIn) return <GuestSignInCard />
  // Trust Passport renders full-width as a compact "continue" banner — the form
  // itself lives in the focused modal so the chat stays uncluttered.
  if (msg.trustPassport) {
    return <TrustPassportBanner property={msg.trustPassport.property} onContinue={() => onOpenTrust?.()} />
  }

  // ── Viewing decision: "view first, or apply now?" ──────────────────────────
  if (msg.viewingDecision && onViewing) {
    const d = msg.viewingDecision
    return (
      <ViewingDecisionCard
        property={d.property}
        onScheduleViewing={() => onViewing.onSchedule(d.property, d.index)}
        onApplyNow={() => onViewing.onApply(d.property, d.index)}
        onContinueBrowsing={() => onViewing.onContinue()}
        onAskQuestion={() => onViewing.onAsk()}
      />
    )
  }

  // ── Viewing scheduling: compact in-chat form ───────────────────────────────
  if (msg.viewingSchedule && onViewing && viewingContext) {
    const s = msg.viewingSchedule
    return (
      <ViewingScheduleCard
        property={s.property}
        defaultName={viewingContext.name}
        defaultPhone={viewingContext.phone}
        submitting={viewingContext.submitting}
        error={viewingContext.error}
        onSubmit={data => onViewing.onSubmit(s.property, s.index, data)}
        onApplyNow={() => onViewing.onApply(s.property, s.index)}
      />
    )
  }

  // ── Viewing confirmation: after a successful request ───────────────────────
  if (msg.viewingConfirmation && onViewing) {
    const c = msg.viewingConfirmation
    return (
      <ViewingConfirmationCard
        property={c.property}
        date={c.date}
        timeSlot={c.timeSlot}
        viewingType={c.viewingType}
        onApplyNow={() => onViewing.onApply(c.property, c.index)}
        onContinueBrowsing={() => onViewing.onContinue()}
      />
    )
  }

  // ── Viewing status: lifecycle-aware (pending / reschedule / confirmed / …) ─
  if (msg.viewingStatus && onViewing) {
    const st = msg.viewingStatus
    return (
      <ViewingStatusCard
        property={st.property}
        request={st.request}
        onContinueBrowsing={() => onViewing.onContinue()}
        onApplyNow={() => onViewing.onApply(st.property, st.index)}
        onRequestAnotherViewing={() => onViewing.onRequestAgain(st.property, st.index)}
        onAcceptReschedule={() => st.request && onViewing.onReschedule(st.request.id, "accept", st.property, st.index)}
        onDeclineReschedule={() => st.request && onViewing.onReschedule(st.request.id, "decline", st.property, st.index)}
      />
    )
  }

  return (
    <div className={hasCards ? "space-y-2" : ""}>
      <div className={"flex gap-2 " + (isUser ? "flex-row-reverse" : "") + (isSystem ? " justify-center" : "")}>
        {!isUser && !isSystem && <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center"><Bot className="h-4 w-4 text-orange-600" /></div>}
        <div className={"max-w-[85%] space-y-2" + (isSystem ? " max-w-full" : "")}>
          <div className={"rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap " +
            (isUser ? "rounded-tr-sm bg-orange-500 text-white" :
             isSystem ? "text-center text-xs text-slate-400 bg-transparent border-0 shadow-none px-0" :
             "rounded-tl-sm bg-white text-slate-800 shadow-sm border border-slate-100")}>
            {msg.text}
          </div>
          {!isUser && !isSystem && msg.stage && <div className="pl-1"><StatusChip stage={msg.stage} /></div>}
          {msg.paymentAccount && <PaymentAccountCard accountNumber={msg.paymentAccount.number} amount={msg.paymentAccount.amount} />}

        {/* Navigation link button (opens dashboard page) */}
        {msg.actionUrl && (
          <a href={msg.actionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-sm font-medium rounded-lg py-2 px-4 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white">
            <Eye className="h-4 w-4" />
            {msg.actionLabel || "Open"}
          </a>
        )}

        {/* Single action button */}
        {msg.actionLabel && msg.actionType && !msg.actionUrl && (
          <button onClick={() => onAction?.(msg.actionType!)}
            className={"w-full text-sm font-medium rounded-lg py-2 px-4 flex items-center justify-center gap-2 " +
              (msg.actionType === "sign_lease" ? "bg-blue-500 hover:bg-blue-600 text-white" :
               msg.actionType === "simulate_payment" ? "bg-green-500 hover:bg-green-600 text-white" :
               msg.actionType === "confirm_payment" ? "bg-purple-500 hover:bg-purple-600 text-white" :
               "bg-slate-100 hover:bg-slate-200 text-slate-700")}>
            {msg.actionType === "simulate_payment" && <CheckCircle2 className="h-4 w-4" />}
            {msg.actionType === "confirm_payment" && <ThumbsUp className="h-4 w-4" />}
            {msg.actionLabel}
          </button>
        )}
        </div>
      </div>

      {/* Property cards — full panel width so the listing isn't squeezed */}
      {hasCards && (
        <div className="grid grid-cols-1 gap-2">
          {msg.propertyMatches!.map((p, i) => <PropertyCard key={p.id} property={p} index={i} onSelect={(idx) => onSelectProperty?.(idx)} />)}
        </div>
      )}
    </div>
  )
}

// --- Main Component ---------------------------------------------------------

/** Renders the guest "you're one step away" card before the auth fork. */
function GuestSignInCard() {
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Lock className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-semibold text-orange-800">Log in to apply</span>
      </div>
      <p className="text-xs text-slate-600 mb-3">
        You're one step away — log in to apply for this property. You'll pick up right where you left off.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/signup/tenant?redirect_to=/tenant?propflow=1"
          className="text-sm font-medium text-center bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2">
          Create account
        </Link>
        <Link href="/signin?redirect_to=/tenant?propflow=1"
          className="text-sm font-medium text-center border border-orange-300 text-orange-700 hover:bg-orange-100 rounded-lg py-2">
          Log in
        </Link>
      </div>
    </div>
  )
}

const CHAT_STORAGE_KEY = "propflow_chat_state"
// Guest searches persist the last inquiry here so it can be auto-replayed
// (via the authenticated /chat) immediately after the guest logs in.
const GUEST_PENDING_KEY = "propflow_guest_pending"

export default function PropFlowChat({ defaultOpen = false, className }: PropFlowChatProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [messages, setMessages] = useState<Message[]>(() => {
    // Hydrate from localStorage so chat survives page refresh
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.messages?.length) {
          // Rehydrate Date objects (JSON.parse turns them into strings)
          return parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }
      }
    } catch { /* ignore corrupt data */ }
    return []
  })
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | undefined>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.threadId || undefined
      }
    } catch { /* ignore */ }
    return undefined
  })
  const [currentStage, setCurrentStage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.currentStage || "idle"
      }
    } catch { /* ignore */ }
    return "idle"
  })
  // Trust Passport modal — kept mounted while hidden so a partial draft survives
  // "Save and finish later" (closing the modal never loses the tenant's inputs).
  const [trustModalOpen, setTrustModalOpen] = useState(false)
  const [errorBanner, setErrorBanner] = useState<{ message: string } | null>(null)
  // Inline error shown on the viewing schedule card (e.g. duplicate request).
  const [viewingError, setViewingError] = useState<string | null>(null)
  const retryRef = useRef<(() => void) | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const welcomeSet = useRef(false)
  const trustPanelRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(isLoading)
  isLoadingRef.current = isLoading

  // Auto-grow the composer: `rows={1}` + `max-h-24` alone clips wrapped text
  // (the first line disappears behind a 1-row field unless the user scrolls).
  // Recompute height from scrollHeight on every keystroke, capped at max-h-24.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }, [input])
  // Tracks whether a guest search was already replayed after login.
  const guestResumedRef = useRef(false)
  // Latest matched properties — used to render the Trust Passport card for the
  // property the tenant selects (the /select response doesn't echo it back).
  const propertyMatchesRef = useRef<PropertyMatch[]>(
    (() => {
      try {
        const saved = localStorage.getItem(CHAT_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          return parsed.propertyMatches || []
        }
      } catch { /* ignore corrupt data */ }
      return []
    })()
  )
  // The viewing intent handler is defined below (after handleSelectProperty, on
  // which it depends). sendMessage dispatches through this ref instead, so the
  // declaration order stays readable without a temporal-dead-zone error.
  const handleViewingIntentRef = useRef<((intent: Exclude<ChatIntent, null>) => Promise<boolean>) | null>(null)

  // The property currently in a viewing context (decision/schedule/status card).
  const getContextProperty = useCallback((): { property: ViewingProperty; index?: number } | null => {
    const m = [...messages].reverse().find(mm =>
      mm.viewingDecision || mm.viewingSchedule || mm.viewingConfirmation || mm.viewingStatus)
    if (!m) return null
    return {
      property: (m.viewingDecision?.property || m.viewingSchedule?.property || m.viewingConfirmation?.property || m.viewingStatus?.property) as ViewingProperty,
      index: m.viewingDecision?.index ?? m.viewingSchedule?.index ?? m.viewingConfirmation?.index ?? m.viewingStatus?.index,
    }
  }, [messages])

  // Detect browsing intent: user wants to see/filter existing results, not run a new search.
  // Keywords: "list", "show", "prices", "which ones", "filter", "sort", "cheaper", "more expensive"
  // Returns true if we should re-present existing cards instead of sending to the graph.
  const detectBrowsingIntent = useCallback((text: string): boolean => {
    if (propertyMatchesRef.current.length === 0) return false
    const t = text.toLowerCase()
    // Match browsing intent phrases — the user wants to inspect or filter what they already saw
    return /\b(list|show|prices|which ones|filter|sort|cheaper|more expensive|under \d+|over \d+|have \d+ bed)\b/.test(t)
  }, [])

  // Lightweight conversational intent detection for viewing actions. Deliberately
  // conservative: a phrase like "I want to view a 2-bed in Lekki" must NOT be
  // hijacked — it only triggers with a strong scheduling verb or a referential
  // "view it/first" that needs a property already in focus.
  const detectViewingIntent = useCallback((
    text: string,
  ): ChatIntent => {
    const t = text.toLowerCase()
    const ctx = getContextProperty()
    const hasCards = propertyMatchesRef.current.length > 0
    const inSelection = currentStage === "awaiting_tenant_selection"

    // Specific actions first — accept/decline a proposed time, or check status.
    if (/accept (the )?(new |proposed )?(viewing )?(time|slot|date)|accept (the )?reschedule|accept (the )?new time/.test(t)) return "accept_reschedule"
    if (/decline (the )?(new |proposed )?(viewing )?(time|slot|date)|decline (the )?reschedule/.test(t)) return "decline_reschedule"
    if (/what('s| is) happening with my viewing|status of my viewing|track my viewing|when is my viewing|my viewing request/.test(t)) return "status"

    if (/\bapply now\b|'i am ready to apply'|'am ready to apply'|ready to apply|'want to apply for'|'want to apply now'|'let's apply'|'continue my application'|'start application'|'apply for that property'|i am ready to apply|am ready to apply|want to apply for|want to apply now|let['\u2019]s apply|continue my application|start application|apply for that property|i want to apply|i('d| would) like to apply/.test(t)) return "apply"

    // Strong scheduling verbs — safe to act on even before a property is picked.
    if (/(book|schedule|arrange|request).{0,20}(viewing|inspection|tour)|(viewing|inspection|tour).{0,20}(book|schedule|arrange)|inspect (the |this )?propert|virtual tour|live tour|schedule an inspection/.test(t)) return "view"

    // Referential viewing ("view it", "view first") — only with a property in focus.
    if ((ctx || (hasCards && inSelection)) && /\bview (it|this|the property)\b|view first|viewing first|want to (view|see) (it|this)|can i (view|see|inspect) (it|this)/.test(t)) return "view"

    return null
  }, [getContextProperty, propertyMatchesRef, currentStage])

  const { user, userProfile } = useAuth()
  const userName = user?.full_name || user?.email?.split("@")[0] || "there"
  const isLandlord = user?.user_type === "landlord"

  // Auto-save chat state to localStorage so it survives page refresh
  useEffect(() => {
    if (messages.length === 0) {
      localStorage.removeItem(CHAT_STORAGE_KEY)
      return
    }
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
        messages: messages.slice(-50),  // keep last 50 messages max
        threadId,
        currentStage,
        propertyMatches: propertyMatchesRef.current,
      }))
    } catch { /* storage full — silently ignore */ }
  }, [messages, threadId, currentStage, propertyMatchesRef])

  // Auto-open when arriving via "Continue in PropFlow" (/tenant?propflow=1).
  // Reads the URL once, opens the panel, and strips the param so a refresh or
  // close doesn't keep forcing it open.
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      if (q.get("propflow") === "1") {
        setIsOpen(true)
        q.delete("propflow")
        const rest = q.toString()
        window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : ""))
      }
    } catch { /* ignore */ }
  }, [])

  // Welcome message — works for guests (searchable anonymously) and users.
  useEffect(() => {
    if (welcomeSet.current || messages.length > 0) return
    welcomeSet.current = true
    const welcome = user
      ? isLandlord
        ? "Hi " + userName + "! 👋 This assistant is for tenants searching for properties. Head over to your **Applications page** to review and manage tenant applications."
        : "Hi " + userName + "! I'm PropFlow, your AI rental assistant. Let me know what you're looking for." + "\n\nExample: 'I want a 2-bedroom apartment in Lekki with a budget of 500,000 Naira per month.'"
      : "Hi! I'm PropFlow 💬 Tell me what you're looking for and I'll find it — no login needed to search."
    setMessages([{ id: "welcome", role: "agent", text: welcome, timestamp: new Date() }])
  }, [user, messages.length])

  
  // ── Status check on mount ────────────────────────────────────────────────
  // Handles the full flow: sign → payment → confirm → complete.
  //
  // Case 1 — If localStorage already has an actionable stage (agreement_drafted,
  //           nomba_provisioned, etc.), show the matching action button immediately
  //           without an API call.  This preserves the existing chat restoration.
  //
  // Case 2 — If the stage is a pre-sign stage, poll once to see whether the
  //           landlord has already approved so we can show a "Sign Now" button.
  //
  // Any other stage is left alone — the restored chat messages speak for themselves.
  useEffect(() => {
    // Skip the restore/status poll while a guest search is about to be replayed
    // after login — the guest thread is stale and the pending replay replaces it.
    const hasPendingGuest = (() => {
      try { return !!localStorage.getItem(GUEST_PENDING_KEY) } catch { return false }
    })()
    if (!threadId || !user || isLandlord || hasPendingGuest) return

    // Map workflow stages to the action button the tenant should see next
    const stageActions: Record<string, { actionType: ActionType; actionLabel: string; text: string }> = {
      "agreement_drafted": {
        actionType: "sign_lease",
        actionLabel: "Sign Now",
        text: "🎉 Your application was approved! The rental agreement is ready — tap below to sign.",
      },
      "nomba_provisioned": {
        actionType: "simulate_payment",
        actionLabel: "Simulate Payment",
        text: "💳 Your virtual account is ready! Tap below to simulate payment and complete your tenancy.",
      },
      // awaiting_full_payment intentionally omitted — confirm_payment is
      // landlord-only and handled via the propflow:open confirmPayment event.
      "disbursement_complete": {
        actionType: "restart",
        actionLabel: "Start New Search",
        text: "✅ All done! Your tenancy is active. Feel free to start a new search if needed.",
      },
    }

    // ── Case 1: Stage already actionable from localStorage ─────────────────
    // Show the matching action button immediately (no backend call).
    // The functional updater in setMessages prevents duplicates.
    const localConfig = stageActions[currentStage]
    if (localConfig) {
      setMessages(p => {
        if (p.some(m => m.actionType === localConfig.actionType)) return p
        return [...p, {
          id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
          text: localConfig.text, stage: currentStage,
          actionType: localConfig.actionType, actionLabel: localConfig.actionLabel,
        }]
      })
      return
    }

    // ── Case 2: Pre-sign stages — poll once ────────────────────────────────
    // The tenant may have left the page while the landlord was approving.
    const preSignStages = new Set(["awaiting_landlord_approval", "application_created", "intent_extracted", "idle"])
    if (!preSignStages.has(currentStage)) return

    let cancelled = false
    propflowStatus(threadId).then(s => {
      if (cancelled) return

      const config = stageActions[s.current_stage]
      if (!config) return

      setCurrentStage(s.current_stage)
      setMessages(p => {
        if (p.some(m => m.actionType === config.actionType)) return p
        return [...p, {
          id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
          text: config.text, stage: s.current_stage,
          actionType: config.actionType, actionLabel: config.actionLabel,
        }]
      })
    }).catch(() => { /* status check best-effort */ })
    return () => { cancelled = true }
  }, [threadId, user, isLandlord])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 150) }, [isOpen])
  useEffect(() => {
    const h = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // Landlord: redirect to the application detail page instead of opening chat
      if (detail?.mode === 'landlord_review' && isLandlord) {
        const appId = detail.application_id
        if (appId) {
          window.location.href = '/landlord/applications/' + appId
          return  // Don't open chat for landlords
        }
      }
      setIsOpen(true)
      // Context-aware open: load a specific PropFlow workflow (e.g., from approval banner)
      if (detail?.workflow_id) {
        // ── Landlord confirm-payment flow ───────────────────────────────────
        // When the landlord clicks "Continue in PropFlow" on the pending-release
        // banner, open the chat with the "Confirm Payment" action so they can
        // release funds directly from the chat widget.
        if (detail.confirmPayment && isLandlord) {
          setThreadId(detail.workflow_id)
          setCurrentStage("awaiting_full_payment")
          setMessages([{
            id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
            text: "💰 Payment received! Confirm below to release funds to your bank account.",
            stage: "awaiting_full_payment",
            actionType: "confirm_payment" as ActionType,
            actionLabel: "Confirm Payment",
          }])
          welcomeSet.current = true
          setIsOpen(true)
          return
        }

        // ── Landlord: AI briefing + dashboard link ───────────────────────────
        // When a landlord clicks "Continue in PropFlow" on any banner (except
        // confirmPayment which is handled above), show the AI briefing with a
        // link to the relevant dashboard page for the action they need to take.
        if (detail?.workflow_id && isLandlord && !detail.confirmPayment) {
          setThreadId(detail.workflow_id)
          setCurrentStage("idle")
          setMessages([])
          welcomeSet.current = true
          setIsOpen(true)

          // Fetch workflow status to get the AI briefing
          propflowStatus(detail.workflow_id).then(status => {
            setCurrentStage(status.current_stage)

            // Determine the right dashboard link + label for each stage
            const stageLinks: Record<string, { url: string; label: string }> = {
              "awaiting_landlord_approval": {
                url: status.application_id
                  ? `/landlord/applications/${status.application_id}`
                  : "/landlord/applications",
                label: "Review Application",
              },
              "agreement_drafted": {
                url: "/landlord/agreements",
                label: "View Agreements",
              },
              "awaiting_landlord_signature": {
                url: "/landlord/agreements",
                label: "Countersign Agreement",
              },
              "nomba_provisioned": {
                url: "/landlord/payments",
                label: "Review Payments",
              },
              "awaiting_full_payment": {
                url: "/landlord/payments",
                label: "Review Payments",
              },
              "disbursement_complete": {
                url: "/landlord/agreements",
                label: "View Agreement",
              },
            }

            const link = stageLinks[status.current_stage] || {
              url: "/landlord",
              label: "Go to Dashboard",
            }

            const briefing = status.landlord_briefing
            let text = ""
            if (status.current_stage === "awaiting_landlord_approval" && briefing) {
              text = `📋 **AI Briefing — Tenant Application**\n\n${briefing}\n\nReview the full application details before making your decision.`
            } else if (status.current_stage === "awaiting_landlord_approval") {
              text = "📋 A tenant has applied to your property. Review their application to approve or reject."
            } else if (status.current_stage === "agreement_drafted" || status.current_stage === "awaiting_landlord_signature") {
              text = "📝 The rental agreement is ready for your countersignature. Review and sign to finalize."
            } else if (status.current_stage === "nomba_provisioned" || status.current_stage === "awaiting_full_payment") {
              text = briefing
                ? `💰 **Payment Update**\n\n${briefing}`
                : "💰 A payment is ready for your review and confirmation."
            } else if (status.current_stage === "disbursement_complete") {
              text = "✅ Tenancy is fully active! All payments have been completed."
            } else {
              text = briefing
                ? `🤖 **PropFlow Update**\n\n${briefing}`
                : `🤖 Your workflow is at stage "${status.current_stage}". Visit your dashboard to take action.`
            }

            setMessages([{
              id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
              text,
              stage: status.current_stage,
              actionLabel: link.label,
              actionUrl: link.url,
            }])
          }).catch(() => {
            // Fallback if status API fails
            setMessages([{
              id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
              text: "Hello! I'm PropFlow, your AI rental assistant. Review tenant applications, agreements, and payments from your dashboard.",
              stage: "idle",
            }])
          })

          return
        }

        // ── Tenant / general flow ───────────────────────────────────────────
        setThreadId(detail.workflow_id)
        // When both parties already signed (payment banner), the PropFlow workflow
        // stage may not have been advanced if signing happened outside the chat.
        // Skip past "idle" -> "agreement_drafted" to "nomba_provisioned" so the
        // status check shows "Simulate Payment" instead of "Sign Now".
        setCurrentStage(detail.bothSigned ? "nomba_provisioned" : "agreement_drafted")
        // Preserve the existing conversation — append the next-step action button
        // instead of clearing the chat. (Clearing here wiped history on every
        // banner click, leaving an empty chat with no way back.)
        setMessages(p => {
          const actionType = detail.bothSigned ? "simulate_payment" : "sign_lease"
          if (p.some(m => m.actionType === actionType)) return p
          return [...p, {
            id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
            text: detail.bothSigned
              ? "💳 Your virtual account is ready! Tap below to simulate payment and complete your tenancy."
              : "🎉 Your application was approved! The rental agreement is ready — tap below to sign.",
            stage: detail.bothSigned ? "nomba_provisioned" : "agreement_drafted",
            actionType: actionType as ActionType,
            actionLabel: detail.bothSigned ? "Simulate Payment" : "Sign Now",
          }]
        })
        // Prevent the welcome-message effect from firing (it would reset the session).
        welcomeSet.current = true
      }
    }
    window.addEventListener("propflow:open", h)
    return () => window.removeEventListener("propflow:open", h)
  }, [isLandlord])

  // No longer auto-detects landlord applications — landlords manage applications from the dashboard.
  // The banner "Continue in PropFlow" button now links directly to /landlord/applications/{id}.

  const addMessage = useCallback((m: Omit<Message, "id" | "timestamp">) => {
    setMessages(p => [...p, { ...m, id: crypto.randomUUID(), timestamp: new Date() }])
  }, [])

  const handleChatResponse = useCallback((r: ChatResponse) => {
    setErrorBanner(null)
    setThreadId(r.workflow_id)
    setCurrentStage(r.current_stage)
    const matches = r.matched_properties ?? undefined
    if (matches && matches.length > 0) propertyMatchesRef.current = matches
    const sel = r.current_stage === "awaiting_tenant_selection"
    const showingCards = sel && matches && matches.length > 0
    // Strip the enumerated property list from text when showing cards (avoids duplication)
    let text = r.response_message
    if (showingCards) {
      // Keep only the header sentence before the numbered list
      const headerEnd = text.indexOf("\n  ")
      if (headerEnd > 0) text = text.substring(0, headerEnd)
    }
    addMessage({
      role: "agent", text, stage: r.current_stage,
      propertyMatches: showingCards ? matches : undefined,
      actionType: r.current_stage === "disbursement_complete" ? "restart" :
        r.current_stage === "agreement_drafted" ? "sign_lease" : undefined,
      actionLabel: r.current_stage === "disbursement_complete" ? "Start New Search" :
        r.current_stage === "agreement_drafted" ? "Sign Now" : undefined,
    })
    if (r.error_message) addMessage({ role: "system", text: r.error_message })
  }, [addMessage])

  // Auto-resume after a guest logs in: replay their last guest search through
  // the authenticated /chat so they land right back at their property picks.
  useEffect(() => {
    if (!user || guestResumedRef.current) return
    let pendingSearch: string | null = null
    try {
      const raw = localStorage.getItem(GUEST_PENDING_KEY)
      if (raw) { const p = JSON.parse(raw); pendingSearch = p?.text || null }
    } catch { /* ignore corrupt data */ }
    if (!pendingSearch) return
    guestResumedRef.current = true
    localStorage.removeItem(GUEST_PENDING_KEY)
    // A guest search thread can't be resumed under an authed session — drop it
    // and start a fresh run via the regular authenticated /chat.
    setThreadId(undefined)
    // Suppress the welcome text and drop any that just fired this commit, then
    // replay the saved inquiry so the tenant lands back at their picks.
    welcomeSet.current = true
    setMessages(p => {
      const rest = p.filter(m => m.id !== "welcome")
      return [...rest, { id: crypto.randomUUID(), role: "user", text: pendingSearch, timestamp: new Date() }]
    })
    setIsLoading(true)
    propflowChat({ message: pendingSearch })
      .then(handleChatResponse)
      .catch((e: any) => addMessage({ role: "agent", text: "Sorry: " + (e?.message || "Unknown"), stage: "error" }))
      .finally(() => setIsLoading(false))
  }, [user, addMessage, handleChatResponse])

  // Removed: loadLandlordReview — Landlords now manage applications from the dashboard detail page.
  // The propflow:open event redirects landlords directly to /landlord/applications/{id}.

  const sendMessage = useCallback(async (text?: string) => {
    const t = (text ?? input).trim()
    if (!t || isLoading) return
    setInput(""); setIsLoading(true)
    setErrorBanner(null)

    // ── Browsing intent — user wants to see/filter existing results ──────────
    // If results exist and the message is about browsing (list/show/prices/filter),
    // re-present the cards instead of re-running a search (saves bandwidth on slow networks).
    if (detectBrowsingIntent(t)) {
      addMessage({ role: "user", text: t })
      // Re-add the property cards with a contextual response
      if (propertyMatchesRef.current.length > 0) {
        addMessage({
          role: "agent",
          text: `Here are the ${propertyMatchesRef.current.length} properties I found for you:`,
          propertyMatches: propertyMatchesRef.current,
          stage: "awaiting_tenant_selection",
        })
      }
      setIsLoading(false)
      return
    }

    // ── Viewing / apply / status intent — handle locally against the existing
    //    viewing backend instead of re-running a property search. ─────────────
    const intent = detectViewingIntent(t)
    if (intent) {
      addMessage({ role: "user", text: t })
      try {
        await handleViewingIntentRef.current?.(intent)
      } catch (e: any) {
        addMessage({ role: "agent", text: "Sorry: " + (e?.message || "Something went wrong"), stage: "error" })
      } finally {
        setIsLoading(false)
      }
      return
    }

    // A new search makes any previously-shown property cards, viewing cards and
    // in-progress application obsolete — drop them so stale "Select"/"Continue"
    // buttons can't act on the wrong property from the new thread.
    if (threadId) setMessages(p => p.filter(m => !m.propertyMatches && !m.trustPassport && !m.viewingDecision && !m.viewingSchedule && !m.viewingConfirmation && !m.viewingStatus))
    addMessage({ role: "user", text: t })
    try {
      if (user) {
        // Follow-ups pass the current thread so the server carries the earlier
        // conversation and resolves the new message in context.
        handleChatResponse(await propflowChat({ message: t, workflow_id: threadId }))
      } else {
        // Guest (unauthenticated) search-only path. Persist the inquiry so it
        // can be replayed through the authenticated /chat after login.
        try { localStorage.setItem(GUEST_PENDING_KEY, JSON.stringify({ text: t, ts: Date.now() })) } catch { /* ignore */ }
        handleChatResponse(await propflowGuestChat({ message: t, workflow_id: threadId }))
      }
    } catch (e: any) {
      const m = e?.message || "Something went wrong"
      addMessage({ role: "agent", text: m.includes("401") ? "Session expired. Refresh." : "Sorry: " + m, stage: "error" })
      setErrorBanner({ message: m })
      retryRef.current = () => { void sendMessage(t) }
    } finally { setIsLoading(false) }
  }, [input, isLoading, addMessage, handleChatResponse, user, threadId, detectBrowsingIntent, detectViewingIntent])

  const handleSelectProperty = useCallback(async (idx: number) => {
    if (isLoading) return
    // Guest: selecting a property starts application creation server-side, which
    // requires login. Show the sign-in card instead (never call /select).
    if (!user) {
      addMessage({ role: "system", text: "You'll need an account to apply.", signIn: true })
      return
    }
    if (!threadId) {
      addMessage({ role: "system", text: "Cannot select property — session not found. Please start a new search." })
      return
    }
    setIsLoading(true)
    addMessage({ role: "system", text: "Selected option " + (idx + 1) + "..." })
    try {
      const r = await propflowSelect(threadId, { property_index: idx })
      setCurrentStage(r.current_stage)

      if (r.current_stage === "awaiting_trust_profile") {
        // Add the compact in-chat banner for the selected property, then open the
        // focused Trust Passport modal (the form no longer lives in the chat).
        const property = propertyMatchesRef.current[idx]
        addMessage({ role: "agent", text: r.response_message, stage: r.current_stage })
        if (property) {
          addMessage({ role: "agent", text: "", stage: r.current_stage, trustPassport: { property } })
        }
        setTrustModalOpen(true)
      } else {
        addMessage({ role: "agent", text: r.response_message, stage: r.current_stage })
      }
    } catch (e: any) {
      addMessage({ role: "agent", text: "Selection failed: " + (e?.message || "Unknown"), stage: "error" })
      setErrorBanner({ message: e?.message || "Something went wrong" })
    } finally { setIsLoading(false) }
  }, [threadId, isLoading, addMessage, user])

  // ── Viewing scheduling — client-side decision layer over the existing
  //     viewing_requests backend. No parallel flow, no new tables. ────────────

  /** Remove any earlier viewing card (decision/schedule/status/confirmation)
   *  for the same property, so the newest card always wins and nothing stacks. */
  const replaceViewingCards = useCallback((property: ViewingProperty) => {
    setMessages(p => p.filter(m => {
      if (m.viewingDecision) return m.viewingDecision.property.id !== property.id
      if (m.viewingSchedule) return m.viewingSchedule.property.id !== property.id
      if (m.viewingStatus) return m.viewingStatus.property.id !== property.id
      if (m.viewingConfirmation) return m.viewingConfirmation.property.id !== property.id
      return true
    }))
  }, [])

  /** Show a schedule form, unless the tenant already has an ACTIVE request for
   *  this property (pending/confirmed/reschedule_proposed) — then show its
   *  status instead so duplicates are never offered in the first place. */
  const showScheduleOrStatus = useCallback(async (property: ViewingProperty, index?: number) => {
    if (!user) { addMessage({ role: "system", text: "You'll need an account to schedule a viewing.", signIn: true }); return }
    setViewingError(null)
    // A schedule form is already open for this property — don't re-mount it
    // (re-mounting would reset the tenant's inputs).
    const newest = [...messages].reverse().find(m =>
      m.viewingDecision || m.viewingSchedule || m.viewingStatus || m.viewingConfirmation)
    if (newest?.viewingSchedule && newest.viewingSchedule.property.id === property.id) return
    setIsLoading(true)
    try {
      const res = await viewingRequestsAPI.getMyRequests()
      const active = ["pending", "confirmed", "reschedule_proposed"]
      const req = res.success
        ? getViewingRequestsFrom(res).find(r => r.property?.id === property.id && active.includes(r.status))
        : null
      replaceViewingCards(property)
      
      if (req) {
        // ✨ SMART FLOW: Check if viewing is in the past
        const viewingDate = req.confirmed_date || req.preferred_date
        const isPastDate = viewingDate && new Date(viewingDate) < new Date(new Date().setHours(0, 0, 0, 0))
        
        // If viewing was completed or confirmed but in the past, suggest application
        if (req.status === "completed" || (req.status === "confirmed" && isPastDate)) {
          addMessage({ 
            role: "agent", 
            text: `Your viewing for this property has been completed. Would you like to proceed with your application?`
          })
          addMessage({ role: "agent", text: "", viewingStatus: { property, index, request: req } })
        }
        // For future confirmed or pending viewings, show the status card normally
        else {
          addMessage({ role: "agent", text: "", viewingStatus: { property, index, request: req } })
        }
      } else {
        addMessage({ role: "agent", text: "", viewingSchedule: { property, index } })
      }
    } catch {
      replaceViewingCards(property)
      addMessage({ role: "agent", text: "", viewingSchedule: { property, index } })
    } finally { setIsLoading(false) }
  }, [user, addMessage, messages, replaceViewingCards])

  const handleViewingSubmit = useCallback(async (property: ViewingProperty, index: number | undefined, data: ViewingRequestData) => {
    if (!user) { addMessage({ role: "system", text: "You'll need an account to request a viewing.", signIn: true }); return }
    setViewingError(null)
    setIsLoading(true)
    try {
      const res = await viewingRequestsAPI.create(data)
      if (!res.success) {
        const err = String(res.error || "")
        if (/active viewing request/i.test(err)) {
          addMessage({ role: "agent", text: "You already have an active viewing request for this property. You can track it in My Viewings." })
          const list = await viewingRequestsAPI.getMyRequests()
          console.log('[PropFlow] Viewing requests API response:', list)
          if (list.success) {
            const allRequests = getViewingRequestsFrom(list)
            console.log('[PropFlow] All viewing requests:', allRequests)
            console.log('[PropFlow] Looking for property_id:', property.id)
            // Fix: API returns property object, not property_id directly
            const req = allRequests.find(r => r.property?.id === property.id)
            console.log('[PropFlow] Found existing viewing request:', req)
            if (req) {
              addMessage({ role: "agent", text: "", viewingStatus: { property, index, request: req } })
            } else {
              console.warn('[PropFlow] No matching viewing request found for property:', property.id)
              console.warn('[PropFlow] Available property IDs:', allRequests.map(r => r.property?.id))
            }
          } else {
            console.error('[PropFlow] Failed to fetch viewing requests:', list.error)
          }
        } else if (/in the past|cannot be in the past/i.test(err)) {
          addMessage({ role: "agent", text: "Please choose today or a future date." })
        } else {
          addMessage({ role: "agent", text: "Could not send your viewing request: " + err, stage: "error" })
        }
        return
      }
      // Success — drop the stale form + any old status card, show confirmation.
      setMessages(p => p.filter(m => !m.viewingSchedule && !(m.viewingStatus && m.viewingStatus.property.id === property.id)))
      addMessage({
        role: "agent", text: "",
        viewingConfirmation: {
          property, index,
          date: data.preferred_date,
          timeSlot: data.time_slot,
          viewingType: data.viewing_type || "PHYSICAL",
        },
      })
    } catch {
      addMessage({ role: "agent", text: "We could not send your request just now. Nothing has been booked yet — please try again.", stage: "error" })
    } finally { setIsLoading(false) }
  }, [user, addMessage])

  const handleViewingStatus = useCallback(async (property?: ViewingProperty, index?: number) => {
    if (!user) { addMessage({ role: "system", text: "You'll need an account to track viewings.", signIn: true }); return }
    setIsLoading(true)
    try {
      const res = await viewingRequestsAPI.getMyRequests()
      if (!res.success) { addMessage({ role: "agent", text: "Could not fetch your viewings right now. Please try again.", stage: "error" }); return }
      const requests = getViewingRequestsFrom(res)
      const target = property ? requests.find(r => r.property?.id === property.id) : requests[0]
      if (!target) {
        addMessage({ role: "agent", text: "You don't have any viewing requests yet. Pick a property and I'll help you schedule a viewing." })
        return
      }
      addMessage({
        role: "agent", text: "",
        viewingStatus: { property: property || (target.property as unknown as ViewingProperty), index, request: target },
      })
    } catch {
      addMessage({ role: "agent", text: "Could not fetch your viewings right now. Please try again.", stage: "error" })
    } finally { setIsLoading(false) }
  }, [user, addMessage])

  const handleReschedule = useCallback(async (requestId: string, decision: "accept" | "decline", property: ViewingProperty, index?: number) => {
    setIsLoading(true)
    try {
      const res = await viewingRequestsAPI.respondToReschedule(requestId, decision)
      if (!res.success) {
        addMessage({ role: "agent", text: "Could not process that response: " + (res.error || "Please try again."), stage: "error" })
        return
      }
      // Refresh so the chat shows the confirmed (accept) or closed (decline) state.
      const list = await viewingRequestsAPI.getMyRequests()
      if (list.success) {
        const req = getViewingRequestsFrom(list).find(r => r.id === requestId) || null
        addMessage({ role: "agent", text: "", viewingStatus: { property, index, request: req } })
      }
    } catch {
      addMessage({ role: "agent", text: "Could not process that response. Please try again.", stage: "error" })
    } finally { setIsLoading(false) }
  }, [addMessage])

  const applyForProperty = useCallback(async (property: ViewingProperty, index?: number) => {
    if (!user) { addMessage({ role: "system", text: "You'll need an account to apply.", signIn: true }); return }
    if (!threadId) {
      addMessage({ role: "system", text: "Cannot apply — session not found. Please start a new search or refresh the page." })
      return
    }

    // ── Viewing context (informational only, never blocks) ───────────────
    // Show the viewing status card alongside the application flow so the
    // tenant has full context. The viewing cards remain visible after
    // applying (append-only, no filtering).
    setIsLoading(true)
    let existingViewing: ViewingRequest | null = null
    try {
      const res = await viewingRequestsAPI.getMyRequests()
      if (res.success) {
        const allRequests = getViewingRequestsFrom(res)
        existingViewing = allRequests.find(r => r.property?.id === property.id) || null
      }
    } catch {
      // viewing fetch is best-effort, never block the application
    }

    addMessage({ role: "system", text: `Applying for ${property.title}...` })

    try {
      // ── Call /select with property_id (prefer id; fall back to index) ──
      const hasId = !!(property as any).id
      const r = hasId
        ? await propflowSelect(threadId, { property_id: (property as any).id })
        : index != null
          ? await propflowSelect(threadId, { property_index: index })
          : await propflowSelect(threadId, { property_id: property.id })

      setCurrentStage(r.current_stage)

      const stage = r.current_stage

      // ── Already-in-progress: thread at a protected stage ───────────────
      // The server returned the existing stage without overwriting it.
      // Don't open Trust Passport; show the existing application state.
      if (stage !== "awaiting_trust_profile" && r.success) {
        if (existingViewing) {
          addMessage({ role: "agent", text: "", viewingStatus: { property, index, request: existingViewing } })
        }
        addMessage({ role: "agent", text: r.response_message, stage })
        setIsLoading(false)
        return
      }

      // ── Fresh application: show the Trust Passport banner + modal ──────
      addMessage({ role: "agent", text: r.response_message, stage })

      // Show the viewing status card as context alongside the application
      if (existingViewing) {
        addMessage({ role: "agent", text: "", viewingStatus: { property, index, request: existingViewing } })
      }

      // Cast ViewingProperty to PropertyMatch for trustPassport
      addMessage({
        role: "agent", text: "", stage,
        trustPassport: { property: property as unknown as PropertyMatch },
      })
      setTrustModalOpen(true)
    } catch (e: any) {
      const errMsg = e?.message || "Unknown error"
      addMessage({
        role: "agent",
        text: `Could not apply for this property: ${errMsg}. Please try again.`,
        stage: "error",
      })
      setErrorBanner({ message: errMsg })
    } finally {
      setIsLoading(false)
    }
  }, [user, threadId, addMessage, setCurrentStage, setTrustModalOpen, setErrorBanner])

  const handleViewingIntent = useCallback(async (
    intent: Exclude<ChatIntent, null>,
  ): Promise<boolean> => {
    const ctx = getContextProperty()
    const matches = propertyMatchesRef.current

    if (intent === "view") {
      if (ctx) { await showScheduleOrStatus(ctx.property, ctx.index); return true }
      if (matches.length === 1) { await showScheduleOrStatus(matches[0]); return true }
      if (matches.length > 1) {
        addMessage({ role: "agent", text: "Which property would you like to schedule a viewing for? Tap one of the options above." })
        return true
      }
      addMessage({ role: "agent", text: "Happy to help you schedule a viewing! First tell me what you're looking for — or pick a property from the results — and I'll set up the viewing for you." })
      return true
    }

    if (intent === "apply") {
      if (ctx) { await applyForProperty(ctx.property, ctx.index); return true }
      if (matches.length === 1) { await applyForProperty(matches[0]); return true }
      addMessage({ role: "agent", text: "Which property would you like to apply for? Tap one of the options above." })
      return true
    }

    if (intent === "status") {
      await handleViewingStatus(ctx?.property, ctx?.index)
      return true
    }

    if (intent === "accept_reschedule" || intent === "decline_reschedule") {
      const decision = intent === "accept_reschedule" ? "accept" : "decline"
      if (!ctx) {
        addMessage({ role: "agent", text: `Which viewing time would you like to ${decision}? Open the property's viewing card and choose the response there.` })
        return true
      }
      const res = await viewingRequestsAPI.getMyRequests()
      const req = getViewingRequestsFrom(res).find(r => r.property?.id === ctx.property.id && r.status === "reschedule_proposed")
      if (!req) {
        addMessage({ role: "agent", text: "There's no proposed time awaiting your response for this property right now." })
        return true
      }
      await handleReschedule(req.id, decision, ctx.property, ctx.index)
      return true
    }
    return false
  }, [getContextProperty, showScheduleOrStatus, applyForProperty, handleViewingStatus, handleReschedule, addMessage])

  // Make the intent handler reachable from sendMessage (declared earlier).
  handleViewingIntentRef.current = handleViewingIntent

  const openViewingDecision = useCallback((index: number) => {
    if (isLoading) return
    if (!user) { addMessage({ role: "system", text: "You'll need an account to view or apply for this property.", signIn: true }); return }
    if (!threadId) { addMessage({ role: "system", text: "Cannot proceed — session not found. Please start a new search." }); return }
    const property = propertyMatchesRef.current[index]
    if (!property) return
    // Back-to-fork: replace any open form/status card for this property with the
    // fresh "view or apply" decision.
    replaceViewingCards(property)
    addMessage({ role: "agent", text: "", viewingDecision: { property, index } })
  }, [isLoading, user, threadId, addMessage, replaceViewingCards])

  const handleContinueBrowsing = useCallback(() => {
    setMessages(p => p.filter(m => !m.viewingDecision && !m.viewingSchedule && !m.viewingConfirmation && !m.viewingStatus))
  }, [])

  const handleAskQuestion = useCallback(() => {
    // Keep the viewing card in place — just hand focus to the composer so the
    // tenant can type their question (a non-viewing message clears the cards).
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const viewingHandlers: ViewingHandlers = {
    onSchedule: (p, index) => { void showScheduleOrStatus(p, index) },
    onApply: (p, index) => { void applyForProperty(p, index) },
    onSubmit: (p, index, data) => { void handleViewingSubmit(p, index, data) },
    onContinue: handleContinueBrowsing,
    onAsk: handleAskQuestion,
    onReschedule: (id, decision, p, index) => { void handleReschedule(id, decision, p, index) },
    onRequestAgain: (p, index) => { void showScheduleOrStatus(p, index) },
  }

  const handleCompleteTrust = useCallback(async (payload: CompleteApplicationPayload) => {
    if (!threadId || isLoading) return
    setIsLoading(true)
    try {
      const r = await propflowCompleteApplication(threadId, payload)
      setCurrentStage(r.current_stage)
      addMessage({ role: "agent", text: r.response_message, stage: r.current_stage })
      // Success — close the modal and let the chat show the next step.
      setTrustModalOpen(false)
      setErrorBanner(null)
    } catch (e: any) {
      const msg = (e as any)?.message || "Submission failed"
      addMessage({ role: "agent", text: "Submission failed: " + msg, stage: "error" })
      setErrorBanner({ message: msg })
      retryRef.current = () => setTrustModalOpen(true)
      throw e  // surfaced inline by the card so the tenant can retry without reopening
    } finally { setIsLoading(false) }
  }, [threadId, isLoading, addMessage])

  const handleAction = useCallback(async (type: ActionType) => {
    if (!threadId || isLoading) return
    setIsLoading(true)
    try {
      if (type === "sign_lease") {
        addMessage({ role: "system", text: "Signing..." })
        const r = await propflowResume(threadId, "signed")
        setCurrentStage(r.current_stage)
        const needsLandlordSign = r.current_stage === "awaiting_landlord_signature"
        addMessage({
          role: "agent", text: r.response_message, stage: r.current_stage,
          paymentAccount: r.current_stage === "nomba_provisioned" && r.virtual_account_number
            ? { number: r.virtual_account_number, amount: 0 } : undefined,
          actionType: needsLandlordSign && isLandlord ? "sign_lease" :
            r.current_stage === "nomba_provisioned" ? "simulate_payment" :
            r.current_stage === "awaiting_full_payment" ? "confirm_payment" :
            r.current_stage === "disbursement_complete" ? "restart" : undefined,
          actionLabel: needsLandlordSign && isLandlord ? "Sign (as Landlord)" :
            r.current_stage === "nomba_provisioned" ? "Simulate Payment" :
            r.current_stage === "awaiting_full_payment" ? "Confirm Payment" :
            r.current_stage === "disbursement_complete" ? "Start New Search" : undefined,
        })
      } else if (type === "simulate_payment") {
        addMessage({ role: "system", text: "Processing payment..." })
        const p = await propflowSimulatePayment(threadId)
        if (p.success) {
          addMessage({ role: "agent", text: p.message || "Payment recorded!", stage: "awaiting_full_payment" })
          setCurrentStage("awaiting_full_payment")
        } else throw new Error(p.error || "Simulation failed")
      } else if (type === "confirm_payment") {
        addMessage({ role: "system", text: "Confirming..." })
        const r = await propflowResume(threadId, "confirm_payment")
        setCurrentStage(r.current_stage)
        addMessage({ role: "agent", text: r.response_message, stage: r.current_stage,
          actionType: r.current_stage === "disbursement_complete" ? "restart" : undefined,
          actionLabel: r.current_stage === "disbursement_complete" ? "New Search" : undefined })
      } else if (type === "restart") {
        welcomeSet.current = false
        setThreadId(undefined); setCurrentStage("idle"); setMessages([])
        setViewingError(null)
        localStorage.removeItem(CHAT_STORAGE_KEY)
      }
    } catch (e: any) {
      addMessage({ role: "agent", text: "Failed: " + (e?.message || "Unknown"), stage: "error" })
    } finally { setIsLoading(false) }
  }, [threadId, isLoading, addMessage])

  // Removed: confirmRejection, cancelRejection — landlords manage approvals from the dashboard.

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Stages where the chat pauses for a click, not typing. awaiting_tenant_selection
  // is NOT included — property results stay conversational so the tenant can type
  // a refinement ("within 500k-600k", "okay 3-bed") as well as pick a property.
  const actionStages = new Set(["awaiting_trust_profile", "agreement_drafted",
    "awaiting_landlord_signature", "nomba_provisioned", "awaiting_full_payment", "disbursement_complete"])

  // The property being applied for — drives both the in-chat banner and the
  // focused Trust Passport modal. Use the NEWEST one in case the tenant picks a
  // different property after saving a draft.
  const trustMessage = [...messages].reverse().find(m => m.trustPassport)
  const selectedTrustProperty = trustMessage?.trustPassport?.property

  // Close the modal on Escape and move focus into it when it opens (a11y).
  useEffect(() => {
    if (!trustModalOpen) return
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoadingRef.current) setTrustModalOpen(false)
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [trustModalOpen])

  useEffect(() => {
    if (!trustModalOpen) return
    const t = setTimeout(() => trustPanelRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [trustModalOpen])

  return (
    <div className={cn("propflow-shell fixed right-3 bottom-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col items-end gap-3", className)}>
      {isOpen && (
        <div className="propflow-panel w-full h-[calc(100dvh-0.75rem)] sm:w-[min(440px,100vw-2rem)] sm:h-auto sm:max-h-[min(80vh,760px)] sm:min-h-[480px] bg-white rounded-3xl shadow-2xl ring-1 ring-slate-200 flex flex-col overflow-hidden">
          {/* Header — calm; orange reserved for accent/actions */}
          <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-900 font-semibold text-sm leading-tight">{AGENT_NAME}</p>
                <p className="text-slate-400 text-[10px]">AI Rental Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {messages.length > 0 && (
                <StatusChip
                  stage={currentStage}
                  error={errorBanner?.message}
                  onRetry={() => retryRef.current?.()}
                  showIdle={messages.length > 1}
                />
              )}
              {messages.length > 0 && (
                <button
                  onClick={() => { setThreadId(undefined); setCurrentStage("idle"); setMessages([]); welcomeSet.current = false; setTrustModalOpen(false); setErrorBanner(null); setViewingError(null); retryRef.current = null; localStorage.removeItem(CHAT_STORAGE_KEY) }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Start a new chat" aria-label="Start a new chat">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Collapse chat">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages — single scroll container */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3 bg-slate-50/60">
            {messages.map(msg => (
              <React.Fragment key={msg.id}>
                {/* Once the application has moved past the trust gate, hide the
                    "continue application" banner — the chat already shows the
                    next-step message for the tenant. */}
                {msg.trustPassport && currentStage !== "awaiting_trust_profile" ? null : (
                  <ChatBubble
                    msg={msg}
                    onSelectProperty={openViewingDecision}
                    onAction={handleAction}
                    onOpenTrust={() => setTrustModalOpen(true)}
                    onViewing={viewingHandlers}
                    viewingContext={{
                      name: user?.full_name || "",
                      phone: (user?.phone_number as string) || (userProfile as any)?.phone || "",
                      submitting: isLoading,
                      error: viewingError,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center"><Bot className="h-4 w-4 text-orange-600" /></div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 text-orange-400 animate-spin" />
                  <span className="text-xs text-slate-400">Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer — hidden while the tenant completes the formal application */}
          {!actionStages.has(currentStage) && (
            <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-3">
              <div className="flex items-end gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm transition-shadow focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
                <textarea ref={inputRef} rows={1} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentStage === "awaiting_tenant_selection" ? "Refine your search or pick a property…" : "Type your message..."}
                  className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none min-h-[24px] max-h-24 leading-relaxed"
                  disabled={isLoading} />
                <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
                  className={"flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors " +
                    (input.trim() && !isLoading ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-slate-100 text-slate-400")}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating launcher — hidden inside the sheet on mobile when open */}
      <button onClick={() => setIsOpen(v => !v)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg items-center justify-center transition-all duration-200",
          isOpen ? "hidden sm:flex bg-slate-800 hover:bg-slate-700" : "flex bg-orange-500 hover:bg-orange-600",
        )}
        aria-label={isOpen ? "Close" : "Open PropFlow"}>
        {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </button>

      {/* Trust Passport modal — desktop: focused centred panel over a dimmed
          backdrop; mobile: full-screen sheet with sticky header/footer. Always
          mounted (hidden) so a "Save and finish later" draft survives closing. */}
      {selectedTrustProperty && (
        <div className={cn("fixed inset-0 z-[70] items-end justify-center sm:items-center", trustModalOpen ? "flex" : "hidden")}>
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => { if (!isLoadingRef.current) setTrustModalOpen(false) }}
            aria-hidden="true"
          />
          <div
            ref={trustPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Complete your application"
            tabIndex={-1}
            className="propflow-panel relative flex flex-col w-full h-full sm:w-[min(660px,calc(100vw-2.5rem))] sm:h-auto sm:max-h-[min(92dvh,900px)] sm:my-5 sm:rounded-3xl bg-white shadow-2xl overflow-hidden outline-none"
          >
            <TrustPassportCard
              property={selectedTrustProperty}
              onSubmit={handleCompleteTrust}
              isLoading={isLoading}
              onSaveLater={() => setTrustModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
