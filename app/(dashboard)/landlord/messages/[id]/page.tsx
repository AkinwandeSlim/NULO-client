"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, MapPin, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { messagesAPI, Conversation, ConversationDetail } from "@/lib/api/messages"
import { toast } from "sonner"
import { ChatBubble } from "@/components/chat/ChatBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { PropertyPreview } from "@/components/messages/PropertyPreview"

const DEFAULT_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"

// ---------------------------------------------------------------------------
// Poll interval — 15 s is plenty for a near-real-time feel without hammering
// the backend. 3 s (the old value) fired ~288 000 requests per user per day.
// ---------------------------------------------------------------------------
const POLL_INTERVAL_MS = 15_000

export default function ChatPage() {
  const params   = useParams()
  const router   = useRouter()
  const { user } = useAuth()
  const conversationId = (params?.id as string) || ""

  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState<string | null>(null)
  // ConversationDetail — returned by getMessages(), has IDs but no partner/property objects
  const [conversation,     setConversation]     = useState<ConversationDetail | null>(null)
  // Conversation — returned by getConversations(), has partner + property objects for the header
  const [conversationMeta, setConversationMeta] = useState<Conversation | null>(null)
  const [messages,         setMessages]         = useState<any[]>([])
  const [showProperty,     setShowProperty]     = useState(true)

  const messagesEndRef    = useRef<HTMLDivElement>(null)
  const pollIntervalRef   = useRef<NodeJS.Timeout | null>(null)
  const latestMessageIdRef = useRef<string | null>(null)

  // ── Scroll helpers ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((behaviour: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior: behaviour })
  }, [])

  // ── Initial load ──────────────────────────────────────────────────────────
  // Runs getMessages + getConversations in parallel (Promise.all — zero extra latency).
  // getMessages returns ConversationDetail (IDs only, no partner/property objects).
  // getConversations returns Conversation[] which includes the full partner + property
  // objects needed for the header, property strip, and verified badge.
  const initialize = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    setError(null)
    try {
      const [messagesData, allConversations] = await Promise.all([
        messagesAPI.getMessages(conversationId),
        messagesAPI.getConversations(),
      ])

      setMessages(messagesData.messages)
      setConversation(messagesData.conversation)

      // BUG-4 FIX: partner/property come from the Conversation list object
      const meta = allConversations.find(c => c.id === conversationId) ?? null
      if (!meta) {
        toast.error('Conversation not found')
        router.push('/landlord/messages')
        return
      }
      setConversationMeta(meta)

      // Track the latest message id so the poller knows what is genuinely new
      if (messagesData.messages.length > 0) {
        latestMessageIdRef.current = messagesData.messages[messagesData.messages.length - 1].id
      }
    } catch (err: any) {
      console.error("[CHAT] initialize error:", err)
      const msg = err?.response?.data?.detail || err?.message || "Failed to load conversation"
      // 403/404 means we shouldn't be here — navigate away cleanly
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        toast.error("Conversation not found")
        router.push("/landlord/messages")
        return
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [conversationId, router])

  // ── Silent poll — merge only genuinely new messages by ID ─────────────────
  const pollMessages = useCallback(async () => {
    if (!conversationId) return
    try {
      const data = await messagesAPI.getMessages(conversationId)
      if (!data.messages.length) return

      const newestId = data.messages[data.messages.length - 1].id
      if (newestId === latestMessageIdRef.current) return  // nothing new

      // Append only messages we don't already have
      setMessages(prev => {
        const existingIds = new Set(prev.map((m: any) => m.id))
        const incoming    = data.messages.filter((m: any) => !existingIds.has(m.id))
        if (!incoming.length) return prev
        latestMessageIdRef.current = newestId
        return [...prev, ...incoming]
      })
    } catch {
      // Silent — polling failures are not worth disturbing the user
    }
  }, [conversationId])

  // ── Mount: load + start poll; cleanup on unmount ──────────────────────────
  useEffect(() => {
    initialize()
    pollIntervalRef.current = setInterval(pollMessages, POLL_INTERVAL_MS)
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [initialize, pollMessages])

  // ── Auto-scroll when messages grow ───────────────────────────────────────
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (content: string) => {
    try {
      const newMsg = await messagesAPI.sendMessage(conversationId, content)
      setMessages(prev => [...prev, newMsg])
      latestMessageIdRef.current = newMsg.id

      // Update conversation preview without a full refetch
      setConversation((prev: ConversationDetail | null) =>
        prev
          ? {
              ...prev,
              last_message: content,
              last_message_sender_id: user?.id ?? null,
              last_message_at: new Date().toISOString(),
            }
          : prev
      )
      // No toast — the message appearing in the thread IS the confirmation
    } catch (err: any) {
      console.error("[CHAT] send error:", err)
      toast.error("Failed to send message. Try again.")
      throw err  // re-throw so ChatInput can reset its own loading state
    }
  }, [conversationId])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading conversation…</p>
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-xs px-4">
          <p className="text-slate-700 font-medium mb-1">Could not load conversation</p>
          <p className="text-sm text-slate-400 mb-5">{error}</p>
          <button
            onClick={initialize}
            className="text-sm font-medium text-orange-600 hover:text-orange-700 underline mr-4"
          >
            Try again
          </button>
          <Link
            href="/landlord/messages"
            className="text-sm font-medium text-slate-500 hover:text-slate-700 underline"
          >
            Back to messages
          </Link>
        </div>
      </div>
    )
  }

  // Derive partner and property from conversationMeta (the Conversation list object
  // which includes full partner + property objects — ConversationDetail does not).
  const partner  = conversationMeta?.partner  ?? null
  const property = conversationMeta?.property ?? null

  // Filter soft-deleted messages before rendering — same as main messages page (FIX-10b)
  const visibleMessages = messages.filter((m: any) => !m.deleted_at)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <Link href="/landlord/messages">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
              Conversation
            </h1>
            <p className="text-slate-600">
              {partner?.name ? `Chat with ${partner.name}` : 'Loading conversation...'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {property && (
              <Link href={`/landlord/properties/${property.id}`}>
                <Button variant="outline" size="sm" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                  <MapPin className="h-4 w-4 mr-2" />
                  View Property
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 10rem)' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">

        {/* Back to list */}
        <Link
          href="/landlord/messages"
          className="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Avatar */}
        <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-slate-100">
          <AvatarImage src={partner?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold text-sm">
            {partner?.name?.charAt(0)?.toUpperCase() ?? "T"}
          </AvatarFallback>
        </Avatar>

        {/* Name + property subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 text-sm truncate">
              {partner?.name ?? "Tenant"}
            </span>
            {partner?.verified && (
              <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
                Verified
              </span>
            )}
            <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
              Tenant
            </span>
          </div>
          {property && (
            <p className="text-xs text-slate-400 truncate mt-0.5">
              Re: {property.title}
            </p>
          )}
        </div>

        {/* Property quick-link — only when a property is attached */}
        {property?.id && (
          <Link
            href={`/properties/${property.id}`}
            target="_blank"
            title="View property listing"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-lg px-3 py-1.5 transition-all flex-shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Property
          </Link>
        )}
      </div>

      {/* ── Property context strip (dismissible, below header, not sticky) ── */}
      {showProperty && (
        <PropertyPreview 
          property={property} 
          variant="strip" 
          dismissible={true}
          onDismiss={() => setShowProperty(false)}
        />
      )}

      {/* ── Message thread ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50/50">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500 mb-1">No messages yet</p>
              <p className="text-xs text-slate-400">Send the first message below.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleMessages.map((message: any) => (
              <ChatBubble
                key={message.id}
                message={message.content}
                timestamp={message.timestamp ?? message.created_at}
                isOwn={message.sender_id === user?.id}
                senderName={
                  message.sender?.full_name ??
                  message.sender?.first_name ??
                  message.sender?.name
                }
                senderAvatar={message.sender?.avatar_url}
                isRead={message.read}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white">
        <ChatInput
          onSend={handleSendMessage}
          placeholder={`Message ${partner?.name ?? "tenant"}…`}
        />
      </div>
    </div>
  </div>
  )
}
