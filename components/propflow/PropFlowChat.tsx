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
  Bot, Building2, CheckCircle2, ChevronDown, Eye, Loader2, Lock,
  MapPin, MessageCircle, RotateCcw, Send, Shield, Sparkles, ThumbsUp, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { applicationsAPI } from "@/lib/api/applications"
import {
  propflowChat, propflowGuestChat, propflowSelect, propflowResume,
  propflowSimulatePayment, propflowStatus,
  type ChatResponse, type PropertyMatch, type StatusResponse,
} from "@/lib/api/propflow"

// --- Types ------------------------------------------------------------------

type MessageRole = "user" | "agent" | "system"
interface Message {
  id: string; role: MessageRole; text: string; timestamp: Date
  propertyMatches?: PropertyMatch[]; paymentAccount?: { number: string; amount: number }
  stage?: string; actionLabel?: string; actionType?: ActionType
  actionUrl?: string  // for navigation-type actions (e.g. link to dashboard page)
  signIn?: boolean    // renders the guest "log in to apply" card
}
type ActionType = "select_property" | "sign_lease" | "simulate_payment" | "confirm_payment" | "restart"
interface PropFlowChatProps { defaultOpen?: boolean; className?: string }

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

function STAGE_LABELS(s: string) {
  const m: Record<string, string> = {
    awaiting_tenant_selection: "Choose", awaiting_landlord_approval: "Approval",
    agreement_drafted: "Sign", awaiting_landlord_signature: "Countersign",
    nomba_provisioned: "Pay", awaiting_full_payment: "Confirm",
    disbursement_complete: "Done!", rejected: "Rejected", error: "Error",
  }
  return m[s]
}

function StagePill({ stage }: { stage: string }) {
  const label = STAGE_LABELS(stage)
  if (!label) return null
  const ok = stage === "disbursement_complete" || stage === "nomba_provisioned"
  const err = stage === "rejected" || stage === "error"
  return (
    <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium " +
      (ok ? "bg-green-100 text-green-700" : err ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-700")}>
      {!ok && !err && <Sparkles className="h-2.5 w-2.5" />}
      {label}
    </span>
  )
}

function ChatBubble({ msg, onSelectProperty, onAction }: {
  msg: Message; onSelectProperty?: (i: number) => void; onAction?: (t: ActionType) => void
}) {
  const isUser = msg.role === "user"
  const isSystem = msg.role === "system"
  const hasCards = !isUser && !isSystem && !!(msg.propertyMatches && msg.propertyMatches.length > 0)
  // Guest sign-in card renders full-width instead of a text bubble.
  if (msg.signIn) return <GuestSignInCard />
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
          {!isUser && !isSystem && msg.stage && <div className="pl-1"><StagePill stage={msg.stage} /></div>}
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const welcomeSet = useRef(false)
  // Tracks whether a guest search was already replayed after login.
  const guestResumedRef = useRef(false)

  // State for context-aware landlord review — now redirects to dashboard instead of opening chat
  const [landlordReviewData, setLandlordReviewData] = useState<{
    workflow_id: string;
    application_id: string;
    briefing?: string;
    tenantName?: string;
    propertyTitle?: string;
    isLoading: boolean;
  } | null>(null)

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
      }))
    } catch { /* storage full — silently ignore */ }
  }, [messages, threadId, currentStage])

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
    setThreadId(r.workflow_id)
    setCurrentStage(r.current_stage)
    const matches = r.matched_properties ?? undefined
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

  const sendMessage = useCallback(async () => {
    const t = input.trim()
    if (!t || isLoading) return
    setInput(""); setIsLoading(true)
    addMessage({ role: "user", text: t })
    try {
      if (user) {
        handleChatResponse(await propflowChat({ message: t }))
      } else {
        // Guest (unauthenticated) search-only path. Persist the inquiry so it
        // can be replayed through the authenticated /chat after login.
        try { localStorage.setItem(GUEST_PENDING_KEY, JSON.stringify({ text: t, ts: Date.now() })) } catch { /* ignore */ }
        handleChatResponse(await propflowGuestChat({ message: t }))
      }
    } catch (e: any) {
      const m = e?.message || ""
      addMessage({ role: "agent", text: m.includes("401") ? "Session expired. Refresh." : "Sorry: " + m, stage: "error" })
    } finally { setIsLoading(false) }
  }, [input, isLoading, addMessage, handleChatResponse, user])

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
      const r = await propflowSelect(threadId, idx)
      setCurrentStage(r.current_stage)
      addMessage({ role: "agent", text: r.response_message, stage: r.current_stage })
    } catch (e: any) {
      addMessage({ role: "agent", text: "Selection failed: " + (e?.message || "Unknown"), stage: "error" })
    } finally { setIsLoading(false) }
  }, [threadId, isLoading, addMessage, user])

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
        setLandlordReviewData(null)
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

  const actionStages = new Set(["awaiting_tenant_selection", "agreement_drafted",
    "awaiting_landlord_signature", "nomba_provisioned", "awaiting_full_payment", "disbursement_complete"])

  return (
    <div className={"fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" + (className ? " " + className : "")}>
      {isOpen && (
        <div className="w-full h-[min(88dvh,720px)] sm:w-[min(460px,100vw-2rem)] sm:h-auto sm:max-h-[min(72vh,720px)] sm:min-h-[420px] bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><Building2 className="h-5 w-5 text-white" /></div>
              <div><p className="text-white font-semibold text-sm">{AGENT_NAME}</p><p className="text-white/75 text-[10px]">AI Rental Assistant</p></div>
            </div>
            {messages.length > 0 && (
              <button onClick={() => { setThreadId(undefined); setCurrentStage("idle"); setMessages([]); setLandlordReviewData(null); welcomeSet.current = false; localStorage.removeItem(CHAT_STORAGE_KEY) }}
                className="p-1 rounded-lg hover:bg-white/20 text-white/60 hover:text-white mr-auto" title="New Chat">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            {currentStage !== "idle" && currentStage !== "disbursement_complete" && <StagePill stage={currentStage} />}
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/20"><ChevronDown className="h-4 w-4 text-white" /></button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map(msg => (
              <React.Fragment key={msg.id}>
                <ChatBubble
                  msg={msg}
                  onSelectProperty={handleSelectProperty}
                  onAction={handleAction}
                />
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
          {!actionStages.has(currentStage) && (
            <div className="px-3 pb-3">
              <div className="flex items-end gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
                <textarea ref={inputRef} rows={1} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="Type your message..."
                  className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none min-h-[24px] max-h-24 leading-relaxed"
                  disabled={isLoading} />
                <button onClick={sendMessage} disabled={isLoading || !input.trim()}
                  className={"flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center " +
                    (input.trim() && !isLoading ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-slate-100 text-slate-400")}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <button onClick={() => setIsOpen(v => !v)}
        className={"w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 " +
          (isOpen ? "bg-slate-800 hover:bg-slate-700" : "bg-orange-500 hover:bg-orange-600")}
        aria-label={isOpen ? "Close" : "Open PropFlow"}>
        {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </button>
    </div>
  )
}
