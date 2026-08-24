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
import { useRouter } from "next/navigation"
import {
  AlertCircle, Bot, Building2, CheckCircle2, ChevronDown, ChevronRight, Eye,
  FileText, Loader2, Lock, MapPin, MessageCircle, RotateCcw, Send, ShieldCheck,
  ThumbsUp, Video, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  propflowChat, propflowGuestChat, propflowSelect, propflowResume,
  propflowSimulatePayment, propflowStatus, propflowCompleteApplication,
  propflowListThreads,
  type ChatResponse, type PropertyMatch,
  type CompleteApplicationPayload, type ExtractedIntent,
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
  propertyMatches?: PropertyMatch[]; propertyMatchesActive?: boolean; paymentAccount?: { number: string; amount: number }
  /** Search criteria that produced `propertyMatches` — powers "View all results on map". */
  searchIntent?: ExtractedIntent
  stage?: string; actionLabel?: string; actionType?: ActionType
  actionUrl?: string  // for navigation-type actions (e.g. link to dashboard page)
  /** Agreement to review/sign — powers the "Review & Sign" deep-link card. */
  agreementId?: string
  signIn?: boolean    // renders the guest "log in to apply" card
  trustPassport?: { property: PropertyMatch }  // renders the in-chat Trust Passport card
  // Viewing scheduling (in-chat decision layer over the existing viewing API):
  viewingDecision?: { property: ViewingProperty; index?: number }       // "view first or apply now?"
  viewingSchedule?: { property: ViewingProperty; index?: number }       // compact scheduling form
  viewingConfirmation?: { property: ViewingProperty; index?: number; date: string; timeSlot: string; viewingType: string }
  viewingStatus?: { property: ViewingProperty; index?: number; request: ViewingRequest | null }
}
type ActionType = "select_property" | "sign_lease" | "review_agreement" | "simulate_payment" | "confirm_payment" | "restart" | "view_tenancy" | "payment_ack"
/** Viewing actions the chat can route to without calling the search graph. */
type ChatIntent = "view" | "apply" | "status" | "accept_reschedule" | "decline_reschedule" | null
interface PropFlowChatProps { defaultOpen?: boolean; className?: string }

/** Normalise the tenant viewing-requests list response into a typed array. */
function getViewingRequestsFrom(res: { data?: unknown }): ViewingRequest[] {
  const d = (res as { data?: { viewing_requests?: unknown } }).data
  return Array.isArray(d?.viewing_requests) ? (d.viewing_requests as ViewingRequest[]) : []
}

/** Human-readable note when a viewing request changes status while the tenant
 *  is in the chat. Returns null for transitions that need no announcement. */
function viewingTransitionText(from: string, to: string): string | null {
  if (from === to) return null
  switch (to) {
    case "confirmed":
      return "🎉 Good news — your viewing has been confirmed! The card below has the details; head to My Viewings for the full appointment info."
    case "reschedule_proposed":
      return "📅 The landlord proposed a new time for your viewing. Review it below and accept or decline."
    case "cancelled":
      return "Your viewing request was cancelled. You can request another viewing or apply for the property instead."
    case "completed":
      return "✅ Your viewing has been marked as completed. Would you like to apply for this property?"
    case "no_show":
      return "The landlord marked your viewing appointment as missed. You can request another viewing if you'd still like to see the property."
    default:
      return null
  }
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

function paymentPeriodLabel(paymentFrequency?: string): string {
  switch (paymentFrequency?.toUpperCase()) {
    case "ANNUAL": return "yr"
    case "SEMI_ANNUAL": return "6 mo"
    case "QUARTERLY": return "quarter"
    default: return "mo"
  }
}

/** Build a /properties deep-link from the search criteria that produced a set
 *  of PropFlow matches, so "View all results on map" opens the marketplace with
 *  the same filters already applied (list + map). Only the params the
 *  /properties page reads are emitted (location / max_price / beds). */
function buildPropertiesUrl(intent?: ExtractedIntent | null): string {
  const params = new URLSearchParams()
  if (intent?.location) params.set("location", intent.location)
  if (intent?.budget_monthly) params.set("max_price", String(intent.budget_monthly))
  if (intent?.bedrooms) params.set("beds", String(intent.bedrooms))
  const qs = params.toString()
  return `/properties${qs ? `?${qs}` : ""}`
}

// --- Sub-components ---------------------------------------------------------

function PropertyCard({ property, index, onSelect, selectionDisabled = false }: {
  property: PropertyMatch; index: number; onSelect: (index: number) => void; selectionDisabled?: boolean
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
          <span className="text-orange-600 font-bold text-sm">NGN {property.price.toLocaleString()}/{paymentPeriodLabel(property.payment_frequency)}</span>
          {metaBits && <span className="text-xs text-slate-400 truncate">{metaBits}</span>}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => onSelect(index)} disabled={selectionDisabled}
            className="text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-1.5 disabled:cursor-not-allowed disabled:bg-slate-300">
            {selectionDisabled ? "Previous result" : "Select This Property"}
          </button>
          <Link href={`/properties/${property.id}`}
            className="text-xs font-medium border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg py-1.5 inline-flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" />
            View Details
          </Link>
        </div>
        {property.virtual_tour_url && (
          <Link
            href={`/properties/${property.id}/virtual-tour?from=propflow`}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline"
          >
            <Video className="h-3 w-3" /> Virtual tour available — explore online
          </Link>
        )}
      </div>
    </div>
  )
}

function PaymentAccountCard({ accountNumber, amount, onComplete, isCompleting }: {
  accountNumber: string; amount: number;
  onComplete?: () => void; isCompleting?: boolean;
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm font-semibold text-green-800">Payment Account Ready</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span className="text-slate-500">Bank</span><span className="font-medium text-slate-700">NomBank MFB</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Account</span><span className="font-mono font-bold text-slate-800 tracking-widest">{accountNumber}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-green-700">NGN {amount.toLocaleString()}</span></div>
      </div>
      {onComplete && (
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="mt-3 w-full text-sm font-medium rounded-lg py-2 px-4 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white disabled:opacity-60"
        >
          {isCompleting ? "Processing…" : "Mark Payment Complete"}
        </button>
      )}
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
  awaiting_landlord_signature: { label: "Waiting for landlord signature", tone: "amber" },
  nomba_provisioned: { label: "Payment pending", tone: "sky" },
  payment_confirmed: { label: "Payment received", tone: "green" },
  awaiting_full_payment: { label: "Payment pending", tone: "sky" },
  disbursement_complete: { label: "Tenancy active", tone: "green" },
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

/**
 * Map a PropFlow workflow stage to the action card the tenant should see next.
 *
 * `agreement_drafted` deliberately uses `review_agreement` (a deep link to the
 * agreement detail page) instead of `sign_lease` — the tenant must read the
 * terms on the agreement page before signing. Signing no longer happens in-chat.
 *
 * `agreementId` is optional: when present the card deep-links straight to
 * /tenant/agreements/{id}; when absent it falls back to the agreements list.
 */
function buildStageAction(
  stage: string,
  agreementId?: string | null,
  paymentAccount?: { number: string; amount: number } | null,
): {
  actionType?: ActionType; actionLabel?: string; text: string;
  agreementId?: string; paymentAccount?: { number: string; amount: number };
} | null {
  switch (stage) {
    case "agreement_drafted":
      return {
        actionType: "review_agreement",
        actionLabel: "Review & Sign Agreement",
        text: "🎉 Your application was approved! The rental agreement is ready. Tap below to read the terms and sign.",
        agreementId: agreementId || undefined,
      }
    case "nomba_provisioned":
      return {
        actionType: "simulate_payment",
        actionLabel: "Mark Payment Complete",
        text: paymentAccount
          ? "💳 Your dedicated payment account is ready! Transfer the exact amount below from any bank app, then tap the button to confirm your payment."
          : "💳 Your dedicated payment account is ready! Tap below to view it and complete your payment.",
        paymentAccount: paymentAccount || undefined,
      }
    // awaiting_full_payment intentionally omitted — confirm_payment is
    // landlord-only and handled via the propflow:open confirmPayment event.
    case "payment_confirmed":
      // Acknowledgment only — deliberately NO action button here. The tenancy
      // is not active until the landlord reviews and releases the funds; "View
      // My Tenancy" only appears at disbursement_complete. `payment_ack` is a
      // non-rendering sentinel actionType: it gives the poller a stable dedup
      // key (a bare undefined actionType would match every plain message) and
      // lets the disbursement upgrade flip this card's chip in place, but it
      // renders no button (no actionLabel, and no renderer branch for it).
      return {
        actionType: "payment_ack",
        text: paymentAccount
          ? `✅ Payment of ₦${paymentAccount.amount.toLocaleString("en-NG")} received and verified! The landlord has been notified and is reviewing your payment. Once they confirm and release the funds, your tenancy will be fully active. I'll update you here the moment it happens.`
          : "✅ Your payment has been received and verified! The landlord has been notified and is reviewing your payment. Once they confirm and release the funds, your tenancy will be fully active. I'll update you here the moment it happens.",
      }
    case "disbursement_complete":
      return {
        actionType: "view_tenancy",
        actionLabel: "View My Tenancy",
        text: "🎉 Your tenancy is now fully active! The landlord has confirmed and released your payment. Welcome to your new home! You can now schedule your move-in and coordinate key handover with the landlord.",
        agreementId: agreementId || undefined,
      }
    default:
      return null
  }
}

/** Extract the payment account (NUBAN + expected amount) from a status response. */
function paymentAccountFrom(s: {
  virtual_account_number?: string | null
  expected_payment_amount?: number | null
}): { number: string; amount: number } | null {
  return s.virtual_account_number && s.expected_payment_amount != null
    ? { number: s.virtual_account_number, amount: s.expected_payment_amount }
    : null
}

/** Terminal stages — the workflow is finished (or dead), nothing left to
 *  poll. Everything else keeps polling: an allowlist of "waiting" stages let
 *  a stale localStorage stage (e.g. awaiting_trust_profile persisted mid-flow)
 *  permanently disable the poller, blinding the tenant to live changes. */
const STAGES_NOT_POLLED = new Set([
  "rejected",
  "disbursement_complete",
  "expired",
])

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
            NGN {property.price.toLocaleString()}/{paymentPeriodLabel(property.payment_frequency)}
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

function ChatBubble({ msg, onSelectProperty, onAction, onOpenTrust, onViewing, viewingContext, onClose, isCompleting }: {
  msg: Message; onSelectProperty?: (i: number) => void; onAction?: (t: ActionType) => void
  onOpenTrust?: () => void
  onViewing?: ViewingHandlers
  viewingContext?: { name: string; phone: string; submitting: boolean; error: string | null }
  onClose?: () => void
  isCompleting?: boolean
}) {
  const isUser = msg.role === "user"
  const isSystem = msg.role === "system"
  const hasCards = !isUser && !isSystem && !!(msg.propertyMatches && msg.propertyMatches.length > 0)
  const cardsAreCurrent = msg.propertyMatchesActive !== false
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
    const card = (
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
    // Transition announcements carry their text plus the live status card in
    // ONE message unit — the bubble promises "the card below", so the card
    // must render directly beneath the text, never float above it.
    if (msg.text) {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center"><Bot className="h-4 w-4 text-orange-600" /></div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-white text-slate-800 shadow-sm border border-slate-100">
              {msg.text}
            </div>
          </div>
          {card}
        </div>
      )
    }
    return card
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
          {msg.paymentAccount && (
            <PaymentAccountCard
              accountNumber={msg.paymentAccount.number}
              amount={msg.paymentAccount.amount}
              onComplete={() => onAction?.("simulate_payment")}
              isCompleting={isCompleting}
            />
          )}

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

        {/* Review & sign agreement — navigates to the agreement page where the
            tenant must read the terms before signing (no in-chat signing).
            Falls back to the agreements list if the agreement id is unknown.
            Closes the widget first so it doesn't overlap the signing card. */}
        {msg.actionType === "review_agreement" && (
          <Link href={msg.agreementId ? `/tenant/agreements/${msg.agreementId}` : "/tenant/agreements"}
            onClick={() => onClose?.()}
            className="w-full text-sm font-medium rounded-lg py-2 px-4 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white">
            <FileText className="h-4 w-4" />
            {msg.actionLabel || "Review & Sign Agreement"}
          </Link>
        )}

        {/* View tenancy — deep-links to the tenant's active tenancy page after
            payment is confirmed or the tenancy is fully active. */}
        {msg.actionType === "view_tenancy" && (
          <Link href="/tenant/active-rent"
            onClick={() => onClose?.()}
            className="w-full text-sm font-medium rounded-lg py-2 px-4 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
            <CheckCircle2 className="h-4 w-4" />
            {msg.actionLabel || "View My Tenancy"}
          </Link>
        )}

        {/* Single action button — hidden for simulate_payment when the NUBAN card
            is already showing (the card's own "Mark Payment Complete" button
            handles it, so a second button below would be redundant). */}
        {msg.actionLabel && msg.actionType && !msg.actionUrl && msg.actionType !== "review_agreement"
          && msg.actionType !== "view_tenancy"
          && !(msg.actionType === "simulate_payment" && msg.paymentAccount) && (
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
          {msg.propertyMatches!.map((p, i) => <PropertyCard key={p.id} property={p} index={i} onSelect={(idx) => onSelectProperty?.(idx)} selectionDisabled={!cardsAreCurrent} />)}
          {/* Deep-link to the marketplace with the same search applied (list + map). */}
          <Link
            href={buildPropertiesUrl(msg.searchIntent)}
            className="text-xs font-medium border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg py-2 inline-flex items-center justify-center gap-1.5"
          >
            <MapPin className="h-3.5 w-3.5" />
            {msg.propertyMatches!.length === 1 ? "View this result on map" : "View all results on map"}
          </Link>
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
// The widget's open/closed state is stored separately from the chat payload so
// it survives both a "New chat" reset (which wipes CHAT_STORAGE_KEY) and — more
// importantly — layout remounts. Navigating from the dashboard route group to a
// public page (e.g. clicking "View Details" → /properties/[id]) remounts
// <PropFlowChat/>; persisting isOpen means the panel reopens automatically with
// the conversation (and property cards) intact instead of collapsing shut.
const WIDGET_OPEN_KEY = "propflow_widget_open"
// Guest searches persist the last inquiry here so it can be auto-replayed
// (via the authenticated /chat) immediately after the guest logs in.
const GUEST_PENDING_KEY = "propflow_guest_pending"

export default function PropFlowChat({ defaultOpen = false, className }: PropFlowChatProps) {
  const [isOpen, setIsOpen] = useState(() => {
    // Rehydrate open state so the widget stays open across navigation/remounts.
    try {
      const saved = localStorage.getItem(WIDGET_OPEN_KEY)
      if (saved !== null) return saved === "1"
    } catch { /* ignore */ }
    return defaultOpen
  })
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
  // Mirror of `messages` readable inside interval callbacks without re-subscribing.
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  // Mirror of `currentStage` for the stage poller (avoids re-subscribing the
  // interval on every stage change).
  const currentStageRef = useRef(currentStage)
  currentStageRef.current = currentStage
  // Request IDs whose reschedule decision the tenant just made in this chat.
  // The viewing poller skips announcing transitions for these (short TTL) so the
  // tenant isn't told about a change they caused themselves.
  const handledTransitionsRef = useRef<Map<string, number>>(new Map())

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
  // Same ref-forwarding pattern for addMessage: the viewing poller (declared
  // above) needs it, but addMessage itself is declared further down.
  const addMessageRef = useRef<((m: Omit<Message, "id" | "timestamp">) => void) | null>(null)

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
    // Only reuse cards while those exact cards are the active selection set.
    // After a no-match/clarification response, cached cards may be from a
    // previous area and must never replace a fresh property search.
    if (currentStage !== "awaiting_tenant_selection") return false
    if (propertyMatchesRef.current.length === 0) return false
    const t = text.toLowerCase()
    // Match browsing intent phrases — the user wants to inspect or filter what they already saw
    return /\b(list|show|prices|which ones|filter|sort|cheaper|more expensive|under \d+|over \d+|have \d+ bed)\b/.test(t)
  }, [currentStage])

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

    // Strong appointment verbs — safe to act on even before a property is picked.
    // A virtual tour is self-guided, not an appointment: its explicit card/link
    // opens the tour directly, while a free-text search for one stays with the
    // normal search conversation until a property is in focus.
    if (/(book|schedule|arrange|request).{0,20}(viewing|inspection|tour)|(viewing|inspection|tour).{0,20}(book|schedule|arrange)|inspect (the |this )?propert|live tour|schedule an inspection/.test(t)) return "view"

    // Referential viewing ("view it", "view first") — only with a property in focus.
    if ((ctx || (hasCards && inSelection)) && /\bview (it|this|the property)\b|view first|viewing first|want to (view|see) (it|this)|can i (view|see|inspect) (it|this)/.test(t)) return "view"

    return null
  }, [getContextProperty, propertyMatchesRef, currentStage])

  const { user, userProfile } = useAuth()
  const router = useRouter()
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

  // Persist the widget's open/closed state so it survives remounts (e.g.
  // crossing from the dashboard layout to a public property page). Without this
  // the panel snaps shut on every "View Details" navigation.
  useEffect(() => {
    try { localStorage.setItem(WIDGET_OPEN_KEY, isOpen ? "1" : "0") } catch { /* ignore */ }
  }, [isOpen])

  // Landlord: the widget has no tenant-style chat activity — keep it collapsed
  // by default even if a persisted open state rehydrates from localStorage.
  // It still opens when explicitly triggered (propflow:open events fired from
  // dashboard banners, e.g. "Continue in PropFlow" / confirm-payment), because
  // those run after this mount-time effect and don't re-trigger it.
  useEffect(() => {
    if (isLandlord) setIsOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLandlord])

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
  }, [user?.id, messages.length])

  
  // ── Auto-attach to the tenant's active workflow ───────────────────────────
  // Autonomous PropFlow: the pollers below only run when threadId is set, but
  // threadId comes from localStorage — a tenant who applied via chat on
  // another device, cleared storage, or whose saved chat state was wiped has
  // no threadId, so the chat never notices when the landlord approves and the
  // "Continue in PropFlow" banner click becomes the only way in. When a
  // signed-in tenant has NO thread saved, look up their most recent active
  // workflow and attach to it. The panel stays closed on attach — the stage
  // poller opens it if the stage advances to something the tenant must act on.
  const autoAttachAttemptedRef = useRef(false)
  useEffect(() => {
    if (isLandlord || !user?.id || threadId || autoAttachAttemptedRef.current) return
    // Skip while a guest search is about to be replayed after login — the
    // replay starts a fresh thread that would replace any attachment anyway.
    try {
      if (localStorage.getItem(GUEST_PENDING_KEY)) return
    } catch { /* ignore */ }
    autoAttachAttemptedRef.current = true

    let cancelled = false
    propflowListThreads().then(res => {
      if (cancelled || !res.success || !res.threads?.length) return
      const terminal = new Set(["rejected", "disbursement_complete", "expired"])
      const active = res.threads
        .filter(t => t.status === "active" && t.current_stage && !terminal.has(t.current_stage))
        .sort((a, b) =>
          new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
          new Date(a.updated_at ?? a.created_at ?? 0).getTime()
        )
      const mostRecent = active[0]
      if (!mostRecent) return
      setThreadId(mostRecent.thread_id)
      setCurrentStage(mostRecent.current_stage)
    }).catch(() => { /* best-effort — the banner path still works */ })
    return () => { cancelled = true }
  }, [user?.id, isLandlord, threadId])

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

    // ── Case 1: Stage already actionable from localStorage ─────────────────
    // Show the matching action card immediately (no backend call), except the
    // agreement card which needs the agreement_id — fetch status once for it.
    // The functional updater in setMessages prevents duplicates.
    const localConfig = buildStageAction(currentStage)
    if (localConfig) {
      if (localConfig.actionType === "review_agreement" || localConfig.actionType === "simulate_payment" || localConfig.actionType === "view_tenancy" || localConfig.actionType === "payment_ack") {
        // The agreement card needs the agreement_id, the payment card needs
        // the NUBAN + amount, and the tenancy card needs the amount for the
        // acknowledgment message — fetch status once, then show the card with data.
        let cancelled = false
        propflowStatus(threadId).then(s => {
          if (cancelled) return
          const cfg = buildStageAction(s.current_stage, s.agreement_id, paymentAccountFrom(s))
          if (!cfg) return
          setCurrentStage(s.current_stage)
          setMessages(p => {
            const existing = p.find(m => m.actionType === cfg.actionType)
            // Skip if the same card already exists — unless we're upgrading a
            // NUBAN-less payment card with freshly fetched account details.
            if (existing && !(cfg.actionType === "simulate_payment" && cfg.paymentAccount && !existing.paymentAccount)) return p
            const withoutStale = p.filter(m => m.actionType !== cfg.actionType)
            return [...withoutStale, {
              id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
              text: cfg.text, stage: s.current_stage,
              actionType: cfg.actionType, actionLabel: cfg.actionLabel,
              agreementId: cfg.agreementId,
              paymentAccount: cfg.paymentAccount,
            }]
          })
        }).catch(() => { /* status check best-effort */ })
        return () => { cancelled = true }
      }

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

    // ── Case 2: Waiting stages — poll once ─────────────────────────────────
    // The tenant may have left the page while the landlord was approving or
    // countersigning. Fetch fresh status so the next card appears on refresh.
    const waitingStages = new Set([
      "awaiting_landlord_approval", "application_created", "intent_extracted", "idle",
      "awaiting_landlord_signature",  // landlord may have countersigned while tenant was away
      // Payment-waiting stages — the backend safety-net may have corrected a
      // stale checkpoint (e.g. payment landed, landlord released), so a single
      // poll on reload picks up the corrected card immediately.
      "awaiting_full_payment",
      "nomba_provisioned",
      "payment_confirmed",
    ])
    if (!waitingStages.has(currentStage)) return

    let cancelled = false
    propflowStatus(threadId).then(s => {
      if (cancelled) return

      const config = buildStageAction(s.current_stage, s.agreement_id, paymentAccountFrom(s))
      if (!config) return

      setCurrentStage(s.current_stage)
      setMessages(p => {
        const existing = p.find(m => m.actionType === config.actionType)
        if (existing && !(config.actionType === "simulate_payment" && config.paymentAccount && !existing.paymentAccount)) return p
        const withoutStale = p.filter(m => m.actionType !== config.actionType)
        return [...withoutStale, {
          id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
          text: config.text, stage: s.current_stage,
          actionType: config.actionType, actionLabel: config.actionLabel,
          agreementId: config.agreementId,
          paymentAccount: config.paymentAccount,
        }]
      })
    }).catch(() => { /* status check best-effort */ })
    return () => { cancelled = true }
    // Depend on the stable user id, not the user object — AuthContext replaces
    // the object several times (cache → quick → resolved → token refresh) and
    // each new identity would re-run this effect unnecessarily.
  }, [threadId, user?.id, isLandlord])

  // ── Continuous workflow-stage polling (live landlord approval) ────────────
  // While the tenant is waiting on the landlord (approval, countersign, etc.),
  // poll the workflow status every 15s so the next action card appears LIVE —
  // e.g. awaiting_landlord_approval → agreement_drafted shows the
  // "Review & Sign Agreement" card without the tenant refreshing or clicking.
  // Skips when the tab is hidden, a request is in flight, or the stage is not
  // one where the tenant is waiting on someone else. When the tab becomes
  // visible (or the window regains focus) again, tick immediately so the
  // tenant doesn't wait a full interval for the catch-up.
  useEffect(() => {
    if (!threadId || !user || isLandlord) return
    const STAGE_POLL_MS = 15_000
    let inFlight = false

    const tick = async () => {
      if (inFlight || document.hidden) return
      if (STAGES_NOT_POLLED.has(currentStageRef.current)) return
      inFlight = true
      try {
        const s = await propflowStatus(threadId)
        if (!s.success) return

        // Stage unchanged → usually nothing to do. Exception: nomba_provisioned
        // without a NUBAN yet — keep polling until the account details arrive
        // so the payment card can be upgraded with the real NUBAN + amount.
        const needsNubanUpgrade =
          s.current_stage === "nomba_provisioned" &&
          s.current_stage === currentStageRef.current &&
          !!paymentAccountFrom(s) &&
          !messagesRef.current.some(m => m.actionType === "simulate_payment" && m.paymentAccount)

        if (s.current_stage === currentStageRef.current && !needsNubanUpgrade) return

        const config = buildStageAction(s.current_stage, s.agreement_id, paymentAccountFrom(s))
        setCurrentStage(s.current_stage)
        if (!config) return

        // ── Autonomous surfacing ──────────────────────────────────────────
        // The stage genuinely advanced AND the new stage needs tenant action —
        // the landlord approved / countersigned / released funds while this
        // tenant browsed. Open the panel so the next step is presented
        // immediately, without the tenant having to notice the dashboard
        // banner and click "Continue in PropFlow". Fires once per transition,
        // so closing the panel afterwards never re-triggers it.
        setIsOpen(true)

        setMessages(p => {
          // When the landlord releases the funds, flip the earlier payment
          // acknowledgment to the final state in place — otherwise its chip
          // keeps showing the payment-waiting label ("Payment pending" /
          // "Payment received") even though the tenancy is now active.
          const upgraded = s.current_stage === "disbursement_complete"
            ? p.map(m => m.actionType === "payment_ack"
              // Flip the earlier payment acknowledgment's chip to the final
              // "Tenancy active" state in place (keep its ack text) so it no
              // longer reads as payment-waiting once the landlord releases.
              ? { ...m, stage: "disbursement_complete" }
              : m)
            : p
          const existing = upgraded.find(m => m.actionType === config.actionType)
          // Skip if the same card already exists — unless we're upgrading a
          // NUBAN-less payment card with freshly fetched account details.
          if (existing && !(config.actionType === "simulate_payment" && config.paymentAccount && !existing.paymentAccount)) return upgraded
          const withoutStale = upgraded.filter(m => m.actionType !== config.actionType)
          return [...withoutStale, {
            id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
            text: config.text, stage: s.current_stage,
            actionType: config.actionType, actionLabel: config.actionLabel,
            agreementId: config.agreementId,
            paymentAccount: config.paymentAccount,
          }]
        })
      } catch { /* status poll best-effort */ }
      finally { inFlight = false }
    }

    const interval = setInterval(tick, STAGE_POLL_MS)
    // Catch up quickly after mount/remount instead of waiting a full interval.
    const first = setTimeout(tick, 2500)
    // Immediate catch-up when the tab becomes visible or the window is focused
    // again — the interval ticks are skipped while hidden, so without this the
    // tenant would wait up to 15s after switching back to the tab.
    const onVisible = () => { if (!document.hidden) tick() }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => {
      clearInterval(interval)
      clearTimeout(first)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
    // Depend on the stable user id, not the user object (see note above).
  }, [threadId, user?.id, isLandlord])

  // ── Tenant viewing-status polling ─────────────────────────────────────────
  // Landlord-side changes (confirm / reschedule / cancel / complete / no-show)
  // are reflected in the chat cards without the tenant triggering anything.
  // Reads current cards via messagesRef so `messages` never enters the dep
  // array (the interval would otherwise re-subscribe on every render).
  useEffect(() => {
    if (!user || isLandlord) return
    const POLL_MS = 15_000
    let inFlight = false

    const tick = async () => {
      if (inFlight || document.hidden) return
      // Only poll while at least one viewing card is in the chat. Status cards
      // are tracked by request ID; confirmation cards ("Viewing request sent")
      // are tracked by property so the landlord's first action swaps them for
      // a live status card.
      const cards = messagesRef.current.filter(m => m.viewingStatus?.request || m.viewingConfirmation)
      if (cards.length === 0) return
      inFlight = true
      try {
        const res = await viewingRequestsAPI.getMyRequests()
        if (!res.success) return
        const latest = getViewingRequestsFrom(res)
        const byId = new Map(latest.map(r => [r.id, r]))
        // Newest request per property — confirmation cards carry the property
        // but not the request ID, so they resolve through this map.
        const byProperty = new Map<string, ViewingRequest>()
        for (const r of latest) {
          const pid = r.property?.id || r.property_id
          const prev = byProperty.get(pid)
          if (!prev || (r.created_at || "") > (prev.created_at || "")) byProperty.set(pid, r)
        }

        // Detect transitions by comparing the latest requests against the
        // cards currently in the chat (read via messagesRef). This MUST happen
        // outside the setMessages updater: React runs updater functions during
        // the render phase — after this synchronous block — so collecting
        // transitions inside the updater would leave the announcement loop
        // below with an empty list (and StrictMode double-invokes updaters).
        // Each transition keeps its source card's property/index so the
        // announcement can render a fresh status card of its own.
        const transitions: { from: string; to: string; request: ViewingRequest; property: ViewingProperty; index?: number }[] = []
        for (const m of messagesRef.current) {
          const st = m.viewingStatus
          if (st?.request) {
            const fresh = byId.get(st.request.id)
            if (fresh && fresh.status !== st.request.status) {
              transitions.push({ from: st.request.status, to: fresh.status, request: fresh, property: st.property, index: st.index })
            }
            continue
          }
          const conf = m.viewingConfirmation
          if (conf) {
            // The request was "pending" when submitted. Once the landlord acts
            // (confirm / reschedule / cancel / …) the static "request sent"
            // card is due for a swap to the live status card.
            const fresh = byProperty.get(conf.property.id)
            if (fresh && fresh.status !== "pending") {
              transitions.push({ from: "pending", to: fresh.status, request: fresh, property: conf.property, index: conf.index })
            }
          }
        }

        // Plan the announcements first. A transition that gets an announcement
        // renders its own live status card directly UNDER the message (so the
        // promised "the card below" always exists and is actionable), and the
        // superseded card higher up is removed instead of updated in place —
        // otherwise the tenant sees the same card twice with nothing new after
        // the announcement.
        const handled = handledTransitionsRef.current
        const now = Date.now()
        for (const [id, expires] of handled) {
          if (expires <= now) handled.delete(id)
        }
        const announcements = new Map<string, {
          text: string; request: ViewingRequest; property: ViewingProperty; index?: number
        }>()
        // Dedupe by request+status (multiple cards can reference one request).
        const seen = new Set<string>()
        for (const t of transitions) {
          const key = `${t.request.id}:${t.to}`
          if (seen.has(key)) continue
          seen.add(key)
          // Skip transitions the tenant just caused themselves (accept/decline
          // reschedule already posts its own confirmation — see handleReschedule).
          if (handled.has(t.request.id)) continue
          const text = viewingTransitionText(t.from, t.to)
          if (text) announcements.set(t.request.id, { text, request: t.request, property: t.property, index: t.index })
        }

        // Update remaining cards in place (match by request.id); cards whose
        // transition is announced are removed — their replacement lives under
        // the announcement message appended below. Pure updaters — no side
        // effects, never append duplicate cards.
        setMessages(prev => prev.flatMap(m => {
          const req = m.viewingStatus?.request
          if (req && announcements.has(req.id)) return []
          const conf = m.viewingConfirmation
          if (conf && announcements.has(byProperty.get(conf.property.id)?.id ?? "")) return []
          if (req) {
            const fresh = byId.get(req.id)
            if (!fresh || fresh.status === req.status) return m
            return { ...m, viewingStatus: { ...m.viewingStatus!, request: fresh } }
          }
          if (conf) {
            // Replace the static "request sent" card with the live status card
            // — that's the one with the accept/decline reschedule buttons.
            const fresh = byProperty.get(conf.property.id)
            if (!fresh || fresh.status === "pending") return m
            return {
              ...m,
              viewingConfirmation: undefined,
              viewingStatus: { property: conf.property, index: conf.index, request: fresh },
            }
          }
          return m
        }))

        // Announce each planned transition WITH its live status card attached,
        // so every announcement is immediately followed by an actionable card
        // (Go to My Viewings / Start application / Accept–Decline time / …).
        for (const a of announcements.values()) {
          addMessageRef.current?.({
            role: "agent",
            text: a.text,
            viewingStatus: { property: a.property, index: a.index, request: a.request },
          })
        }
      } catch { /* polling is best-effort */ }
      finally { inFlight = false }
    }

    const id = setInterval(tick, POLL_MS)
    // Catch up quickly after a page refresh/remount instead of waiting a full
    // interval (messages are hydrated synchronously from localStorage).
    const first = setTimeout(tick, 2500)
    // Immediate catch-up when the tab becomes visible or the window is focused
    // again — ticks are skipped while hidden, so without this the tenant would
    // wait up to 15s after switching back to the tab.
    const onVisible = () => { if (!document.hidden) tick() }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => {
      clearInterval(id)
      clearTimeout(first)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
    // Depend on the stable user id, not the user object — AuthContext replaces
    // the object several times (cache → quick → resolved → token refresh) and
    // each new identity would tear down and recreate this interval.
  }, [user?.id, isLandlord])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  // When the panel opens (including reopening after a navigation remount), jump
  // straight to the latest message so the tenant lands on the property cards
  // without having to scroll down manually.
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
        inputRef.current?.focus()
      }, 150)
    }
  }, [isOpen])
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
              "payment_confirmed": {
                url: "/landlord/payments",
                label: "Review & Release Funds",
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
            } else if (status.current_stage === "payment_confirmed") {
              text = briefing
                ? `💰 **Payment Received**\n\n${briefing}`
                : "💰 The tenant's payment has been received. Review and release the funds to complete the tenancy."
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

        // ── Tenant just signed on the agreement page ─────────────────────────
        // The agreement detail page dispatches this after a successful signature
        // so the widget reopens with a completion message instead of staying
        // closed (or worse, still showing the stale "Review & Sign" card).
        // The backend has already synced the workflow stage (sync_stage_after_tenant_sign),
        // so we set the stage directly and show the next-step message.
        if (detail.justSigned && !isLandlord) {
          setThreadId(detail.workflow_id)
          const fullySigned = !!detail.bothSigned
          setCurrentStage(fullySigned ? "nomba_provisioned" : "awaiting_landlord_signature")
          setMessages(p => {
            // Replace any stale "Review & Sign" card with the completion message.
            const withoutStale = p.filter(m => m.actionType !== "review_agreement")
            return [...withoutStale, {
              id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
              text: fullySigned
                ? "🎉 Both parties have signed! Your tenancy is being set up — payment details are coming next."
                : "✅ You've signed the agreement! The landlord has been notified to countersign. I'll update you here as soon as they do.",
              stage: fullySigned ? "nomba_provisioned" : "awaiting_landlord_signature",
            }]
          })
          welcomeSet.current = true
          setIsOpen(true)
          return
        }

        // ── Tenant / general flow ───────────────────────────────────────────
        setThreadId(detail.workflow_id)
        // When both parties already signed (payment banner), the PropFlow workflow
        // stage may not have been advanced if signing happened outside the chat.
        // Skip past "idle" -> "agreement_drafted" to "nomba_provisioned" so the
        // status check shows "Simulate Payment" instead of "Review & Sign".
        setCurrentStage(detail.bothSigned ? "nomba_provisioned" : "agreement_drafted")
        // Preserve the existing conversation — append the next-step action card
        // instead of clearing the chat. (Clearing here wiped history on every
        // banner click, leaving an empty chat with no way back.)
        //
        // Signing no longer happens in-chat: the agreement card deep-links the
        // tenant to /tenant/agreements/{id} where they must read the terms
        // before signing. `detail.agreement_id` comes from the banner that
        // dispatched this event.
        setMessages(p => {
          const actionType = detail.bothSigned ? "simulate_payment" : "review_agreement"
          if (p.some(m => m.actionType === actionType)) return p
          return [...p, {
            id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
            text: detail.bothSigned
              ? "💳 Your dedicated payment account is ready! Transfer the exact amount from any bank app, then tap the button to confirm your payment."
              : "🎉 Your application was approved! The rental agreement is ready. Tap below to read the terms and sign.",
            stage: detail.bothSigned ? "nomba_provisioned" : "agreement_drafted",
            actionType: actionType as ActionType,
            actionLabel: detail.bothSigned ? "Mark Payment Complete" : "Review & Sign Agreement",
            agreementId: detail.agreement_id || undefined,
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
  // Keep the ref in sync so effects declared above (viewing poller) can append
  // messages without a temporal-dead-zone error.
  addMessageRef.current = addMessage

  const handleChatResponse = useCallback((r: ChatResponse) => {
    setErrorBanner(null)
    setThreadId(r.workflow_id)
    setCurrentStage(r.current_stage)
    const matches = r.matched_properties ?? undefined
    if (matches && matches.length > 0) propertyMatchesRef.current = matches
    else if (r.current_stage !== "awaiting_tenant_selection") propertyMatchesRef.current = []
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
      searchIntent: showingCards ? (r.extracted_intent ?? undefined) : undefined,
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
  }, [user?.id, addMessage, handleChatResponse])

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
          text: propertyMatchesRef.current.length === 1
            ? "Here is the property I found for you:"
            : `Here are the ${propertyMatchesRef.current.length} properties I found for you:`,
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
    if (threadId) setMessages(p => p
      // Keep prior results in the transcript, but prevent an old card index
      // from selecting an item in the new workflow's result set.
      .map(m => m.propertyMatches ? { ...m, propertyMatchesActive: false } : m)
      .filter(m => !m.trustPassport && !m.viewingDecision && !m.viewingSchedule && !m.viewingConfirmation && !m.viewingStatus)
    )
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

      if (r.current_stage === "existing_application") {
        // Do not open Trust Passport for a property the tenant already applied
        // for. The server returns the canonical application id, so take the
        // tenant directly to the record that explains its present status.
        addMessage({ role: "agent", text: r.response_message, stage: r.current_stage })
        setTrustModalOpen(false)
        router.push(r.application_id ? `/tenant/applications/${r.application_id}` : "/tenant/applications")
        return
      }

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
  }, [threadId, isLoading, addMessage, user, router])

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
        role: "agent",
        text: "Your viewing request has been sent! The landlord will review it — you can track their response and accept or decline any proposed time in My Viewings.",
      })
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
      // Self-caused transition: stop the viewing poller from re-announcing the
      // status change this response just triggered (expires after a short TTL).
      handledTransitionsRef.current.set(requestId, Date.now() + 90_000)
      // Refresh so the chat shows the confirmed (accept) or closed (decline) state.
      const list = await viewingRequestsAPI.getMyRequests()
      if (list.success) {
        const req = getViewingRequestsFrom(list).find(r => r.id === requestId) || null
        if (decision === "accept") {
          addMessage({ role: "agent", text: "You've accepted the new time — your viewing is now confirmed. Head to My Viewings for the full appointment details." })
        } else {
          addMessage({ role: "agent", text: "You've declined the proposed time. The viewing request has been closed. You can request another time or apply for this property instead." })
        }
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
      // Success — close the modal, then land on the tenant dashboard where the
      // application status is tracked. The chat (and this confirmation) is
      // persisted to localStorage, so the widget reopens on /tenant with the
      // conversation intact. Short beat so the success message is seen first.
      setTrustModalOpen(false)
      setErrorBanner(null)
      window.setTimeout(() => router.push("/tenant"), 2000)
    } catch (e: any) {
      const msg = (e as any)?.message || "Submission failed"
      addMessage({ role: "agent", text: "Submission failed: " + msg, stage: "error" })
      setErrorBanner({ message: msg })
      retryRef.current = () => setTrustModalOpen(true)
      throw e  // surfaced inline by the card so the tenant can retry without reopening
    } finally { setIsLoading(false) }
  }, [threadId, isLoading, addMessage, router])

  const handleAction = useCallback(async (type: ActionType) => {
    if (!threadId || isLoading) return
    setIsLoading(true)
    try {
      if (type === "sign_lease") {
        // Tenants no longer sign in-chat — they must read the terms on the
        // agreement page first. If a tenant somehow triggers this, send them
        // to the agreement detail page instead of signing.
        if (!isLandlord) {
          setIsLoading(false)
          addMessage({
            role: "agent",
            text: "📝 To sign, please open the agreement so you can read the terms first.",
            stage: currentStageRef.current,
            actionType: "review_agreement",
            actionLabel: "Review & Sign Agreement",
          })
          return
        }
        addMessage({ role: "system", text: "Signing..." })
        const r = await propflowResume(threadId, "signed")
        setCurrentStage(r.current_stage)
        const needsLandlordSign = r.current_stage === "awaiting_landlord_signature"
        const nextActionType: ActionType | undefined =
          needsLandlordSign && isLandlord ? "sign_lease" :
          r.current_stage === "nomba_provisioned" ? "simulate_payment" :
          r.current_stage === "awaiting_full_payment" ? "confirm_payment" :
          r.current_stage === "disbursement_complete" ? "restart" : undefined
        const nextActionLabel: string | undefined =
          needsLandlordSign && isLandlord ? "Sign (as Landlord)" :
          r.current_stage === "nomba_provisioned" ? "Simulate Payment" :
          r.current_stage === "awaiting_full_payment" ? "Confirm Payment" :
          r.current_stage === "disbursement_complete" ? "Start New Search" : undefined
        // Idempotent insert (same race as simulate_payment below): the stage
        // poller / mount-time status check may already have appended this
        // stage's action card from its own status poll while the resume call
        // was in flight.
        setMessages(p => {
          if (nextActionType && p.some(m => m.actionType === nextActionType)) return p
          return [...p, {
            id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
            // Note: no paymentAccount here — the resume response doesn't carry the
            // expected amount, and showing "NGN 0" would be wrong. The mount-time
            // status check / 15s poller fetches the real NUBAN + amount and
            // upgrades the card with full details.
            text: r.response_message, stage: r.current_stage,
            actionType: nextActionType, actionLabel: nextActionLabel,
          }]
        })
      } else if (type === "simulate_payment") {
        addMessage({ role: "system", text: "Processing payment..." })
        const p = await propflowSimulatePayment(threadId)
        if (p.success) {
          // Remove the stale NUBAN card — payment is done, no need to show the
          // account details + "Mark Payment Complete" button anymore.
          setMessages(prev => prev.filter(m => !m.paymentAccount))
          // The backend's sync_after_payment flips the graph straight to
          // payment_confirmed (FULL_PAYMENT), so mirror that here — tagging
          // this message with the old awaiting_full_payment stage rendered a
          // stale "Payment pending" chip that survived all the way past the
          // landlord's release. The acknowledgment carries no action button:
          // "View My Tenancy" only appears once the landlord releases the
          // funds (disbursement_complete).
          const ackText = p.amount != null
            ? `✅ Payment of ₦${p.amount.toLocaleString("en-NG")} received and verified! The landlord has been notified and is reviewing your payment. Once they confirm and release the funds, your tenancy will be fully active. I'll update you here the moment it happens.`
            : (p.message || "Payment recorded!")
          // Idempotent insert — NOT a bare addMessage. While this request was
          // in flight, the stage poller's own status poll could already see
          // payment_confirmed (its currentStageRef guard is stale until React
          // commits) and append the identical acknowledgment first. Deduping
          // on actionType here means whichever side loses that race finds the
          // winner's card in prev and skips — no more double "Payment
          // received" bubbles.
          setMessages(p => p.some(m => m.actionType === "payment_ack")
            ? p
            : [...p, {
              id: crypto.randomUUID(), role: "agent" as const, timestamp: new Date(),
              text: ackText, stage: "payment_confirmed", actionType: "payment_ack",
            }])
          setCurrentStage("payment_confirmed")
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
  }, [threadId, isLoading, addMessage, isLandlord])

  // Removed: confirmRejection, cancelRejection — landlords manage approvals from the dashboard.

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Stages where the chat pauses for a click, not typing. awaiting_tenant_selection
  // is NOT included — property results stay conversational so the tenant can type
  // a refinement ("within 500k-600k", "okay 3-bed") as well as pick a property.
  const actionStages = new Set(["awaiting_trust_profile", "agreement_drafted",
    "awaiting_landlord_signature", "nomba_provisioned", "payment_confirmed", "awaiting_full_payment", "disbursement_complete"])

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
                    onClose={() => setIsOpen(false)}
                    isCompleting={isLoading}
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
