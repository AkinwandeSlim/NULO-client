"use client"

/**
 * PropFlowChat
 * Floating AI rental assistant widget powered by Qwen.
 *
 * Behaviour:
 *  - Appears as a floating button on the tenant dashboard and property pages.
 *  - Expands into a full chat panel.
 *  - Sends messages to POST /api/v1/propflow/chat.
 *  - Renders property match cards inline when the agent finds results.
 *  - Shows a payment account card when DVA is provisioned.
 */

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  propflowChat,
  propflowResume,
  type ChatResponse,
  type PropertyMatch,
} from "@/lib/api/propflow"

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "agent" | "system"

interface Message {
  id: string
  role: MessageRole
  text: string
  timestamp: Date
  propertyMatches?: PropertyMatch[]
  paymentAccount?: { number: string; amount: number }
  stage?: string
}

interface PropFlowChatProps {
  /** Pre-fill a property so tenant can start the flow from a property page */
  propertyId?: string
  /** Show widget immediately open */
  defaultOpen?: boolean
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_NAME = "PropFlow"
const WELCOME_MESSAGE =
  "Hi! I'm PropFlow, your AI rental assistant 🏠\n\nJust tell me what you're looking for — for example:\n\n\"I wan 2-bed flat for Lekki, budget 500k monthly\"\n\nI'll find matching properties and handle the application for you."

const STAGE_LABELS: Record<string, string> = {
  started: "Starting...",
  intent_extracted: "Searching properties...",
  property_matched: "Found matches",
  application_created: "Application submitted",
  awaiting_landlord_approval: "Awaiting approval",
  landlord_approved: "Approved!",
  agreement_created: "Lease ready",
  nomba_provisioned: "Payment account ready",
  disbursement_complete: "Lease active!",
  rejected: "Not approved",
  error: "Error",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PropertyCard({ property }: { property: PropertyMatch }) {
  return (
    <div className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
      {property.images?.[0] && (
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-28 object-cover"
        />
      )}
      <div className="p-3">
        <p className="font-semibold text-sm text-slate-800 truncate">{property.title}</p>
        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{property.location}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-orange-600 font-bold text-sm">
            ₦{property.price.toLocaleString()}/mo
          </span>
          <span className="text-xs text-slate-400">{property.beds} bed</span>
        </div>
      </div>
    </div>
  )
}

function PaymentAccountCard({
  accountNumber,
  amount,
}: {
  accountNumber: string
  amount: number
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm font-semibold text-green-800">Payment Account Ready</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Bank</span>
          <span className="font-medium text-slate-700">NomBank MFB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Account No.</span>
          <span className="font-mono font-bold text-slate-800 tracking-widest">
            {accountNumber}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Amount</span>
          <span className="font-bold text-green-700">₦{amount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function StagePill({ stage }: { stage: string }) {
  const label = STAGE_LABELS[stage]
  if (!label) return null

  const isSuccess = ["disbursement_complete", "landlord_approved", "nomba_provisioned"].includes(stage)
  const isError = ["rejected", "error"].includes(stage)
  const isActive = !isSuccess && !isError

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        isSuccess && "bg-green-100 text-green-700",
        isError && "bg-red-100 text-red-600",
        isActive && "bg-orange-100 text-orange-700",
      )}
    >
      {isActive && <Sparkles className="h-2.5 w-2.5" />}
      {label}
    </span>
  )
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user"
  const isSystem = msg.role === "system"

  return (
    <div
      className={cn(
        "flex gap-2",
        isUser && "flex-row-reverse",
        isSystem && "justify-center",
      )}
    >
      {/* Avatar — agent only */}
      {!isUser && !isSystem && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
          <Bot className="h-4 w-4 text-orange-600" />
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-2", isSystem && "max-w-full")}>
        {/* Text bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
            isUser && "rounded-tr-sm bg-orange-500 text-white",
            !isUser && !isSystem && "rounded-tl-sm bg-white text-slate-800 shadow-sm border border-slate-100",
            isSystem && "text-center text-xs text-slate-400 bg-transparent border-0 shadow-none px-0",
          )}
        >
          {msg.text}
        </div>

        {/* Stage pill — under agent messages */}
        {!isUser && !isSystem && msg.stage && (
          <div className="pl-1">
            <StagePill stage={msg.stage} />
          </div>
        )}

        {/* Property match cards */}
        {msg.propertyMatches && msg.propertyMatches.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {msg.propertyMatches.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}

        {/* Payment account card */}
        {msg.paymentAccount && (
          <PaymentAccountCard
            accountNumber={msg.paymentAccount.number}
            amount={msg.paymentAccount.amount}
          />
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PropFlowChat({
  propertyId,
  defaultOpen = false,
  className,
}: PropFlowChatProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | undefined>()
  const [currentStage, setCurrentStage] = useState<string>("idle")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: crypto.randomUUID(), timestamp: new Date() },
    ])
  }, [])

  const handleResponse = useCallback(
    (resp: ChatResponse) => {
      setThreadId(resp.thread_id)
      setCurrentStage(resp.stage)

      addMessage({
        role: "agent",
        text: resp.message,
        stage: resp.stage,
        propertyMatches: resp.property_matches?.length ? resp.property_matches : undefined,
        paymentAccount:
          resp.virtual_account_number && resp.stage === "nomba_provisioned"
            ? { number: resp.virtual_account_number, amount: 0 }
            : undefined,
      })

      // Inline error hint
      if (resp.error) {
        addMessage({
          role: "system",
          text: `⚠ ${resp.error}`,
        })
      }
    },
    [addMessage],
  )

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput("")
    setIsLoading(true)

    addMessage({ role: "user", text })

    try {
      const resp = await propflowChat({
        message: text,
        thread_id: threadId,
        property_id: propertyId,
      })
      handleResponse(resp)
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Could not reach PropFlow. Check your connection."
      addMessage({
        role: "agent",
        text: `Sorry, something went wrong: ${errorMsg}`,
        stage: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, threadId, propertyId, addMessage, handleResponse])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3", className)}>
      {/* Chat panel */}
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-2rem)] bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{AGENT_NAME}</p>
                <p className="text-white/75 text-[10px]">AI Rental Assistant · Powered by Qwen</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentStage !== "idle" && <StagePill stage={currentStage} />}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Minimise chat"
              >
                <ChevronDown className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 max-h-[420px]">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-orange-600" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm border border-slate-100 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 text-orange-400 animate-spin" />
                  <span className="text-xs text-slate-400">PropFlow is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3">
            <div className="flex items-end gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what you're looking for..."
                className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none min-h-[24px] max-h-24 leading-relaxed"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  input.trim() && !isLoading
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                )}
                aria-label="Send"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              Powered by Qwen AI · NuloAfrica PropFlow
            </p>
          </div>
        </div>
      )}

      {/* FAB — floating action button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          isOpen
            ? "bg-slate-800 hover:bg-slate-700"
            : "bg-orange-500 hover:bg-orange-600",
        )}
        aria-label={isOpen ? "Close PropFlow chat" : "Open PropFlow rental assistant"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  )
}
