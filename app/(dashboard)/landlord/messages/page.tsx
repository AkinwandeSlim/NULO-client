"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Send,
  Search,
  X,
  ArrowLeft,
  RefreshCw,
  Building2,
  Shield,
  Star,
  MessageSquare,
  Archive,
  Filter,
  Bell,
  Phone,
  ChevronUp,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { messagesAPI } from "@/lib/api/messages"
import { applicationsAPI } from "@/lib/api/applications"
import { agreementsAPI } from "@/lib/api/agreements"
import {
  Conversation,
  Message,
  ConversationDetail,
  MessagesPagination,
} from "@/lib/api/messages"
import {
  ConversationCard,
  MessageBubble,
  DatePill,
  RentalContextBanner,
  EmptyConversationList,
  EmptyThread,
  RentalContextData,
  getMessageDate,
  UserInfoCard,
} from "@/components/messages/MessageComponents"
import { PropertyPreview } from "@/components/messages/PropertyPreview"

type ConversationFilter = "all" | "unread" | "archived" | "active"

export default function LandlordMessagesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  // ─── Core state ─────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(() => {
    return searchParams?.get("conversation") ?? null
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationDetail, setConversationDetail] = useState<ConversationDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [pagination, setPagination] = useState<MessagesPagination | null>(null)
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)

  // ─── UI state ────────────────────────────────────────────────────────────
  const [conversationFilter, setConversationFilter] = useState<ConversationFilter>("all")
  const [showFilters, setShowFilters] = useState(false)
  // FIX: renamed from showTenantInfo — toggling the collapsed info strip in the header
  const [showTenantInfo, setShowTenantInfo] = useState(false)

  // ─── Rental context ──────────────────────────────────────────────────────
  const contextCache = useRef<Map<string, RentalContextData>>(new Map())
  const [rentalContext, setRentalContext] = useState<RentalContextData | null>(null)
  
  // ─── Message context (signing, payment, etc) ────────────────────────────────
  const [conversationContext, setConversationContext] = useState<string | null>(() => {
    return searchParams?.get("context") ?? null
  })

  // ─── Refs ────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ─── Mobile view ─────────────────────────────────────────────────────────
  const [mobileView, setMobileView] = useState<"list" | "conversation">(
    selectedConversationId ? "conversation" : "list"
  )

  const currentUserId = user?.id || ""

  // ─── Scroll helpers ──────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = Math.min(el.scrollHeight, 120) + "px"
    }
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  useEffect(() => {
    setMobileView(selectedConversationId ? "conversation" : "list")
  }, [selectedConversationId])

  // ─── Filter logic ────────────────────────────────────────────────────────
  const filterConversations = useCallback(
    (convs: Conversation[], filter: ConversationFilter) => {
      switch (filter) {
        case "unread":   return convs.filter(c => c.unread_count > 0)
        // FIX-2: use archived_by_landlord (per-user flag) instead of shared status column.
        // status === "archived" is no longer reliable — each party has independent archive state.
        case "archived": return convs.filter(c => c.archived_by_landlord)
        case "active":   return convs.filter(c => !c.archived_by_landlord && c.unread_count === 0)
        default:         return convs
      }
    },
    []
  )

  // ─── Data fetching ───────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true)
    try {
      const data = await messagesAPI.getConversations()
      setConversations(data)
      // FIX: removed noisy toast.success on every load/refresh
    } catch {
      toast.error("Failed to load conversations. Please refresh.")
    } finally {
      setIsLoadingConversations(false)
    }
  }, [])

  const fetchMessages = useCallback(async (conversationId: string, offset = 0) => {
    if (offset === 0) setIsLoadingMessages(true)
    else setLoadingEarlier(true)

    try {
      const response = await messagesAPI.getMessages(conversationId, 50, offset)

      if (offset === 0) {
        setMessages(response.messages)
        setConversationDetail(response.conversation)
        setPagination(response.pagination)
      } else {
        // Prepend earlier messages while keeping scroll position
        setMessages(prev => [...response.messages, ...prev])
        const prevHeight = messagesContainerRef.current?.scrollHeight || 0
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight - prevHeight
          }
        }, 0)
      }

      setPagination(response.pagination)
    } catch {
      toast.error("Failed to load messages. Please try again.")
    } finally {
      if (offset === 0) setIsLoadingMessages(false)
      else setLoadingEarlier(false)
    }
  }, [])

  const fetchRentalContext = useCallback(async (propertyId: string) => {
    if (contextCache.current.has(propertyId)) {
      setRentalContext(contextCache.current.get(propertyId)!)
      return
    }

    setRentalContext({ application: null, agreement: null, isLoading: true })

    try {
      const [applicationsResponse, agreementsResponse] = await Promise.all([
        applicationsAPI.getReceivedApplications(),
        agreementsAPI.getByProperty(propertyId),
      ])

      const application =
        applicationsResponse.applications?.find(a => a.property_id === propertyId) ?? null
      const agreement =
        agreementsResponse.agreements?.find(a => a.property_id === propertyId) ?? null

      const context: RentalContextData = { application, agreement, isLoading: false }
      contextCache.current.set(propertyId, context)
      setRentalContext(context)
    } catch (error: any) {
      // Log the actual error for debugging
      console.error('[Messages] Failed to fetch rental context:', {
        error: error?.message || error?.toString(),
        statusCode: error?.response?.status,
        data: error?.response?.data
      })
      // Still set context but with empty data so UI doesn't break
      setRentalContext({ application: null, agreement: null, isLoading: false })
    }
  }, [])

  // ─── Messaging actions ───────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConversationId) return

    setIsSending(true)
    const content = messageInput.trim()
    setMessageInput("")
    adjustTextareaHeight()

    try {
      const newMessage = await messagesAPI.sendMessage(selectedConversationId, content)

      setMessages(prev => [...prev, newMessage])
      // FIX-9: also update last_message_sender_id so the conversation list
      // can show "You: ..." immediately without waiting for a re-fetch
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversationId
            ? {
                ...conv,
                last_message: content,
                last_message_sender_id: currentUserId,
                last_message_at: new Date().toISOString(),
              }
            : conv
        )
      )
      scrollToBottom()
      // FIX: removed noisy toast.success("Message sent") — visual feedback is the bubble appearing
    } catch {
      toast.error("Failed to send. Please try again.")
      setMessageInput(content) // Restore on failure
    } finally {
      setIsSending(false)
    }
  }, [messageInput, selectedConversationId, scrollToBottom, adjustTextareaHeight])

  // ─── Conversation actions ────────────────────────────────────────────────

  const selectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId)
      router.replace(`/landlord/messages?conversation=${conversationId}`, { scroll: false })
      setConversations(prev =>
        prev.map(c => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
      )
    },
    [router]
  )

  // FIX: functions accept string, callers guard against null before calling
  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      await messagesAPI.archiveConversation(conversationId)
      // FIX-5: write the per-user flag, not the shared status column.
      // This lets the tenant still see the conversation in their own inbox.
      setConversations(prev =>
        prev.map(c => (c.id === conversationId ? { ...c, archived_by_landlord: true } : c))
      )
      toast.success("Conversation archived")
    } catch {
      toast.error("Failed to archive conversation")
    }
  }, [])

  const unarchiveConversation = useCallback(async (conversationId: string) => {
    try {
      await messagesAPI.unarchiveConversation(conversationId)
      // FIX-5: clear the per-user flag, not the shared status column
      setConversations(prev =>
        prev.map(c => (c.id === conversationId ? { ...c, archived_by_landlord: false } : c))
      )
      toast.success("Conversation unarchived")
    } catch {
      toast.error("Failed to unarchive conversation")
    }
  }, [])

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!confirm("Delete this conversation? This cannot be undone.")) return
      try {
        await messagesAPI.deleteConversation(conversationId)
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null)
          router.replace("/landlord/messages")
        }
        toast.success("Conversation deleted")
      } catch {
        toast.error("Failed to delete conversation")
      }
    },
    [selectedConversationId, router]
  )

  const dismissBanner = useCallback(() => {
    if (selectedConversationId) {
      setDismissedBanners(prev => new Set([...prev, `${selectedConversationId}:rental-context`]))
    }
  }, [selectedConversationId])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchConversations(),
        selectedConversationId ? fetchMessages(selectedConversationId) : Promise.resolve(),
      ])
      setLastRefreshTime(new Date())
    } catch {
      toast.error("Failed to refresh messages")
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchConversations, selectedConversationId, fetchMessages])

  // ─── Get context-specific initial message ────────────────────────────────
  const getContextualInitialMessage = useCallback((context: string | null): string => {
    switch (context) {
      case "agreement_signing":
        return "Hi! I wanted to follow up on your lease agreement. Have you had a chance to review and sign the document? Please let me know if you have any questions or need clarification on any terms."
      case "agreement_payment":
        return "Hi! Thank you for signing the agreement. We're now ready to proceed with the lease setup. Please initiate the payment at your earliest convenience so we can finalize everything."
      default:
        return "Hi! I'm interested in discussing this property with you. How can I help you today?"
    }
  }, [])

  // ─── Create conversation from URL params ─────────────────────────────────

  const handleCreateConversationFromParams = useCallback(
    async (tenantId: string, propertyId: string, context: string | null) => {
      if (!user?.id || isCreatingConversation) return
      setIsCreatingConversation(true)
      try {
        // FIX: removed 13 console.log('[DEBUG]...) statements
        const existingConversation = await messagesAPI.findConversation(propertyId, tenantId)

        if (existingConversation) {
          router.replace(`/landlord/messages?conversation=${existingConversation.id}`)
          setSelectedConversationId(existingConversation.id)
        } else {
          const payload = {
            property_id: propertyId,
            landlord_id: user.id,
            tenant_id: tenantId,
            initial_message: getContextualInitialMessage(context),
          }
          const result = await messagesAPI.createConversation(payload)
          router.replace(`/landlord/messages?conversation=${result.conversation_id}`)
          setSelectedConversationId(result.conversation_id)
        }
      } catch (error: any) {
        toast.error(
          `Failed to start conversation: ${error?.response?.data?.detail ?? error?.message ?? "Unknown error"}`
        )
      } finally {
        setIsCreatingConversation(false)
      }
    },
    [user?.id, isCreatingConversation, router, getContextualInitialMessage]
  )

  // ─── Keyboard handler ────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
      if (e.key === "Escape" && selectedConversationId) {
        setSelectedConversationId(null)
        router.replace("/landlord/messages")
      }
    },
    [sendMessage, selectedConversationId, router]
  )

  const handleTyping = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessageInput(e.target.value)
      adjustTextareaHeight()
    },
    [adjustTextareaHeight]
    // FIX: removed inverted isTyping logic — it was tracking the LANDLORD'S own
    // keystrokes but displaying "Tenant is typing..." — completely backwards.
    // Real typing indicators require WebSocket/SSE; removed until then.
  )

  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => { fetchConversations() }, [fetchConversations])

  useEffect(() => {
    if (selectedConversationId) fetchMessages(selectedConversationId)
    else {
      setMessages([])
      setConversationDetail(null)
      setRentalContext(null)
    }
  }, [selectedConversationId, fetchMessages])

  useEffect(() => {
    if (conversationDetail?.property_id && conversationDetail.property_id !== "null") {
      fetchRentalContext(conversationDetail.property_id)
    } else {
      setRentalContext(null)
    }
  }, [conversationDetail?.property_id, fetchRentalContext])

  useEffect(() => {
    if (!searchParams) return
    
    const tenantId = searchParams.get("tenant")
    const propertyId = searchParams.get("property")
    const conversationId = searchParams.get("conversation")
    const context = searchParams.get("context")
    
    // Update conversation context for UI indicators
    setConversationContext(context)
    
    if (tenantId && propertyId && !conversationId && !isCreatingConversation) {
      handleCreateConversationFromParams(tenantId, propertyId, context)
    }
  }, [searchParams, isCreatingConversation, handleCreateConversationFromParams])

  // ─── Filter effect ───────────────────────────────────────────────────────

  useEffect(() => {
    let filtered = filterConversations(conversations, conversationFilter)

    // FIX-3: exclude archived conversations from non-archived views using the
    // per-user flag, not the shared status column
    if (conversationFilter !== "archived") {
      filtered = filtered.filter(c => !c.archived_by_landlord)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        c =>
          c.partner.name?.toLowerCase().includes(q) ||
          c.property?.title?.toLowerCase().includes(q) ||
          c.last_message?.toLowerCase().includes(q)
      )
    }

    setFilteredConversations(filtered)
  }, [conversations, searchQuery, conversationFilter, filterConversations])

  // ─── Derived values ───────────────────────────────────────────────────────

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)
  const isBannerDismissed = selectedConversationId
    ? dismissedBanners.has(`${selectedConversationId}:rental-context`)
    : false

  // FIX-10: filter soft-deleted messages before grouping.
  // deleted_at is non-null when a message has been soft-deleted (migration 0001).
  // They are excluded from the thread entirely for now; a future pass can render
  // a "This message was deleted" placeholder if needed.
  const visibleMessages = messages.filter(m => !m.deleted_at)

  const groupedMessages = visibleMessages.reduce(
    (groups, message) => {
      const date = getMessageDate(message.timestamp)
      if (!groups[date]) groups[date] = []
      groups[date].push(message)
      return groups
    },
    {} as Record<string, Message[]>
  )

  const unreadCount   = conversations.filter(c => c.unread_count > 0).length
  // FIX-4: use per-user archive flag, not the shared status column
  const activeCount   = conversations.filter(c => !c.archived_by_landlord && c.unread_count === 0).length
  const archivedCount = conversations.filter(c => c.archived_by_landlord).length
  const charCount    = messageInput.length
  const overLimit    = charCount > 1000

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">

      {/* Header */}
      <div className="mb-8">
        <Link href="/landlord/overview">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
              Message Management
            </h1>
            <p className="text-slate-600">
              Communicate directly with potential tenants
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Last refresh: {lastRefreshTime.toLocaleTimeString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/landlord/notifications">
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main chat layout ─────────────────────────────────────────────── */}
      {/* FIX: added `flex` — without it, left/right panels stacked vertically */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100dvh - 12rem)" }}>

        {/* ── LEFT PANEL: Conversation list ─────────────────────────────── */}

        <div className={`w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col ${
          mobileView === 'conversation' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Panel header */}
          <div className="px-4 pt-4 pb-3 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-500" />
                <span className="font-semibold text-slate-900 text-sm">Inbox</span>
                {unreadCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(f => !f)}
                  className={`h-7 w-7 transition-colors ${
                    showFilters
                      ? "text-orange-600 bg-orange-50"
                      : "text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                  }`}
                  title="Filter conversations"
                >
                  <Filter className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-7 w-7 text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* FIX: filter dropdown now correctly inside the header div, not leaking out */}
            {showFilters && (
              <div className="grid grid-cols-2 gap-1.5 mb-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                {(
                  [
                    { key: "all",      label: "All",      count: conversations.length },
                    { key: "unread",   label: "Unread",   count: unreadCount },
                    { key: "active",   label: "Active",   count: activeCount },
                    { key: "archived", label: "Archived", count: archivedCount },
                  ] as const
                ).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setConversationFilter(f.key)}
                    className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      conversationFilter === f.key
                        ? "bg-orange-100 text-orange-700 font-semibold border border-orange-200"
                        : "text-slate-600 hover:bg-white border border-transparent"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="font-medium opacity-70">{f.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search conversations…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 rounded-lg focus:ring-orange-500 focus:border-orange-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse border-b border-slate-50">
                  <div className="w-9 h-9 bg-slate-200 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                    <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map(conversation => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={conversation.id === selectedConversationId}
                  currentUserId={currentUserId}
                  onClick={selectConversation}
                />
              ))
            ) : (
              <EmptyConversationList userType="landlord" />
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-white">
            <p className="text-[11px] text-slate-400 text-center">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""} ·{" "}
              {archivedCount > 0 && (
                <button
                  onClick={() => setConversationFilter(conversationFilter === "archived" ? "all" : "archived")}
                  className="text-orange-500 hover:text-orange-600 underline underline-offset-2"
                >
                  {conversationFilter === "archived" ? "Show all" : `${archivedCount} archived`}
                </button>
              )}
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: Message thread ───────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-white ${
            mobileView === "list" ? "hidden lg:flex" : "flex"
          }`}
        >
          {isCreatingConversation ? (
            /* Creating conversation spinner */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">Starting conversation…</p>
              </div>
            </div>

          ) : selectedConversationId ? (
            /* ── Active conversation ───────────────────────────────────── */
            // FIX: this <div> was previously missing its closing tag inside the ternary,
            // causing it to close AFTER the EmptyThread branch — broken JSX tree.
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Conversation header */}
              <div className="border-b border-slate-100 bg-white px-4 py-3 flex-shrink-0">

                {/* Mobile back */}
                <button
                  onClick={() => setMobileView("list")}
                  className="lg:hidden flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 mb-2 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  All conversations
                </button>

                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 ring-2 ring-slate-100 flex-shrink-0">
                    <AvatarImage src={selectedConversation?.partner?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold text-sm">
                      {selectedConversation?.partner?.name?.charAt(0)?.toUpperCase() ?? "T"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + context */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {selectedConversation?.partner?.name ?? "Tenant"}
                      </h3>
                      {selectedConversation?.partner?.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Shield className="h-2.5 w-2.5" />
                          Verified
                        </span>
                      )}
                      <span className="text-[10px] bg-orange-100 text-orange-600 font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Tenant
                      </span>
                      {selectedConversation?.partner?.trust_score != null && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-700 font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Star className="h-2.5 w-2.5 text-yellow-500" />
                          {selectedConversation.partner.trust_score}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-0.5">
                      {selectedConversation?.property?.title && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                          <Building2 className="h-3 w-3 text-orange-400 flex-shrink-0" />
                          <span className="truncate">
                            {selectedConversation.property.title}
                            {selectedConversation.property.location && (
                              <span className="text-slate-400"> · {selectedConversation.property.location}</span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      {/* Context indicator for agreement signing/payment */}
                      {conversationContext && (
                        <div className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full w-fit"
                          style={{
                            backgroundColor: conversationContext === 'agreement_signing' ? '#fef3c7' : '#dcfce7',
                            color: conversationContext === 'agreement_signing' ? '#b45309' : '#166534',
                          }}
                        >
                          <MessageSquare className="h-2.5 w-2.5" />
                          {conversationContext === 'agreement_signing' ? 'Agreement Signing' : 'Payment Follow-up'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Header action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* FIX: removed stray `)}` that was here with no matching opening conditional */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowTenantInfo(v => !v)}
                      className={`h-8 w-8 transition-colors ${
                        showTenantInfo
                          ? "text-orange-600 bg-orange-50"
                          : "text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                      }`}
                      title="Toggle tenant details"
                    >
                      <ChevronUp className={`h-4 w-4 transition-transform ${showTenantInfo ? "" : "rotate-180"}`} />
                    </Button>

                    {/* NOTE: partner.email is intentionally absent — the backend
                        does not return email in conversation responses.
                        To contact by email, use the tenant profile page. */}

                    {selectedConversation?.property?.id && (
                      <Link
                        href={`/landlord/properties/${selectedConversation.property.id}`}
                        target="_blank"
                        title="View property"
                        className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-lg px-2.5 py-1.5 transition-all"
                      >
                        <Building2 className="h-3 w-3" />
                        Property
                      </Link>
                    )}

                    {/* FIX: archive button moved here from input bar footer — more discoverable */}
                    {/* FIX-6: use archived_by_landlord (per-user flag), not shared status column */}
                    {!conversationDetail?.archived_by_landlord && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => selectedConversationId && archiveConversation(selectedConversationId)}
                        className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        title="Archive conversation"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible tenant info strip */}
              {showTenantInfo && selectedConversation?.partner && (
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex-shrink-0">
                  <UserInfoCard
                    user={selectedConversation.partner}
                    property={selectedConversation.property ?? undefined}
                    currentUserType="landlord"
                    variant="compact"
                  />
                </div>
              )}

              {/* Property Preview */}
              {selectedConversation?.property && (
                <PropertyPreview 
                  property={selectedConversation.property} 
                  variant="strip" 
                  dismissible={false}
                />
              )}

              {/* Rental context banner */}
              {selectedConversation?.property?.id && !isBannerDismissed && (
                <RentalContextBanner
                  context={rentalContext}
                  conversationId={selectedConversationId}
                  propertyId={selectedConversation.property.id}
                  userType="landlord"
                  dismissed={isBannerDismissed}
                  onDismiss={dismissBanner}
                />
              )}

              {/* Message thread */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 bg-white"
              >
                {isLoadingMessages ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} mb-3`}>
                      <div className="max-w-[60%] h-10 bg-slate-200 rounded-2xl animate-pulse" />
                    </div>
                  ))
                ) : (
                  <>
                    {/* FIX-8: previous check was returned === limit which breaks when
                        the total message count is an exact multiple of the page size
                        (returns a full page → fetches again → gets 0 → finally stops).
                        Correct check: are there messages beyond what we've loaded? */}
                    {pagination && (pagination.offset + pagination.returned) < pagination.total && (
                      <div className="flex justify-center py-2">
                        <button
                          onClick={() => {
                            if (selectedConversationId && pagination) {
                              fetchMessages(
                                selectedConversationId,
                                pagination.offset + pagination.limit
                              )
                            }
                          }}
                          disabled={loadingEarlier}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50 bg-white border border-orange-200 hover:border-orange-300 px-4 py-1.5 rounded-full transition-all shadow-sm"
                        >
                          {loadingEarlier ? "Loading…" : "↑ Load earlier messages"}
                        </button>
                      </div>
                    )}

                    {/* Grouped messages */}
                    {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                      <div key={date}>
                        <DatePill label={date} />
                        {dateMessages.map((message, index) => {
                          const isOwn = message.sender_id === currentUserId
                          const showAvatar =
                            index === 0 ||
                            dateMessages[index - 1]?.sender_id !== message.sender_id
                          return (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              isOwn={isOwn}
                              showAvatar={!isOwn && showAvatar}
                            />
                          )
                        })}
                      </div>
                    ))}

                    {/* FIX: removed inverted "Tenant is typing..." indicator that was
                        triggered by the landlord's own keystrokes. Real typing indicators
                        require WebSocket/SSE — removed until implemented. */}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              {/* FIX-7: use archived_by_landlord (per-user flag), not shared status column */}
              {conversationDetail?.archived_by_landlord ? (
                /* Archived notice */
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <span className="text-sm text-slate-500">This conversation is archived.</span>
                  {/* FIX: guard against null before passing to unarchiveConversation */}
                  <Button
                    onClick={() => selectedConversationId && unarchiveConversation(selectedConversationId)}
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    Unarchive
                  </Button>
                </div>
              ) : (
                /* Active input */
                <div className="px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                        value={messageInput}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        className="resize-none min-h-[42px] max-h-[120px] text-sm rounded-xl border-slate-200 focus:border-orange-400 focus:ring-orange-400 bg-slate-50 pr-14"
                        rows={1}
                        disabled={isSending}
                      />
                      {/* Character count — only show when approaching limit */}
                      {charCount > 800 && (
                        <div className={`absolute bottom-2 right-2 text-xs ${overLimit ? "text-red-500 font-semibold" : "text-slate-400"}`}>
                          {charCount}/1000
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={isSending || !messageInput.trim() || overLimit}
                      className="h-[42px] w-[42px] p-0 bg-orange-500 hover:bg-orange-600 rounded-xl flex-shrink-0 disabled:opacity-40 transition-colors"
                      title={overLimit ? "Message too long" : "Send (Enter)"}
                    >
                      {isSending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-1.5 space-y-1.5">
                    <p className="text-[11px] text-slate-400">
                      <span className="font-medium">Enter</span> to send ·{" "}
                      <span className="font-medium">Shift+Enter</span> for new line
                    </p>
                    
                    {/* Context-aware helper text */}
                    {conversationContext && (
                      <p className="text-[10px] px-2 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: conversationContext === 'agreement_signing' ? '#fef3c7' : '#dcfce7',
                          color: conversationContext === 'agreement_signing' ? '#7c2d12' : '#15803d',
                        }}
                      >
                        <span className="font-semibold">Tip:</span>{" "}
                        {conversationContext === 'agreement_signing' 
                          ? "Follow up about lease agreement signing. Keep it professional and friendly."
                          : "Follow up about payment. Provide payment instructions or deadlines if applicable."}
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>

          ) : (
            /* No conversation selected */
            <EmptyThread />
          )}
        </div>

      </div>
    </div>
  )
}

