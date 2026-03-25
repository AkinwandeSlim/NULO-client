"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import Link from "next/link"
import { Send, Search, X, ArrowLeft, RefreshCw, MessageSquare, Home, FileText, Calendar, CreditCard, Users, Bell, ChevronUp, Building2, Shield, Star, Archive, Filter } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { messagesAPI } from "@/lib/api/messages"
import { applicationsAPI } from "@/lib/api/applications"
import { agreementsAPI } from "@/lib/api/agreements"
import {
  Conversation,
  Message,
  ConversationDetail,
  MessagesPagination
} from "@/lib/api/messages"
import {
  ConversationCard,
  MessageBubble,
  DatePill,
  RentalContextBanner,
  PropertyContextCard,
  EmptyConversationList,
  EmptyThread,
  MobileBackButton,
  UserInfoCard,
  ChatHeader,
  RentalContextData,
  formatRelativeTime,
  getMessageDate
} from "@/components/messages/MessageComponents"
import { PropertyPreview } from "@/components/messages/PropertyPreview"

type ConversationFilter = "all" | "unread" | "archived" | "active"

export default function TenantMessagesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  
  // Page state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(() => {
    return searchParams?.get('conversation') ?? null
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
  const [conversationFilter, setConversationFilter] = useState<ConversationFilter>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [showLandlordInfo, setShowLandlordInfo] = useState(false)
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  
  // Conversaton context (signing, payment, etc.)
  const [conversationContext, setConversationContext] = useState<string | null>(() => {
    return searchParams?.get("context") ?? null
  })
  
  // Rental context for banner
  const contextCache = useRef<Map<string, RentalContextData>>(new Map())
  const [rentalContext, setRentalContext] = useState<RentalContextData | null>(null)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // Mobile view state
  const [mobileView, setMobileView] = useState<"list" | "conversation">(
    selectedConversationId ? "conversation" : "list"
  )
  
  const currentUserId = user?.id || ""
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])
  
  // Update mobile view when selection changes
  useEffect(() => {
    setMobileView(selectedConversationId ? "conversation" : "list")
  }, [selectedConversationId])
  
  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true)
    try {
      const conversationsData = await messagesAPI.getConversations()
      setConversations(conversationsData)
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error)
      toast.error("Failed to load conversations")
    } finally {
      setIsLoadingConversations(false)
    }
  }, [])
  
  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string, offset = 0) => {
    if (offset === 0) {
      setIsLoadingMessages(true)
    } else {
      setLoadingEarlier(true)
    }
    
    try {
      const response = await messagesAPI.getMessages(conversationId, 50, offset)
      
      if (offset === 0) {
        setMessages(response.messages)
        setConversationDetail(response.conversation)
        setPagination(response.pagination)
      } else {
        // Prepend earlier messages
        setMessages(prev => [...response.messages, ...prev])
        // Keep scroll position stable
        const scrollHeight = messagesContainerRef.current?.scrollHeight || 0
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - scrollHeight
          }
        }, 0)
      }
      
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Failed to fetch messages:', error)
      toast.error("Failed to load messages")
    } finally {
      if (offset === 0) {
        setIsLoadingMessages(false)
      } else {
        setLoadingEarlier(false)
      }
    }
  }, [])
  
  // Fetch rental context for banner
  const fetchRentalContext = useCallback(async (propertyId: string) => {
    if (contextCache.current.has(propertyId)) {
      setRentalContext(contextCache.current.get(propertyId)!)
      return
    }
    
    setRentalContext({ application: null, agreement: null, isLoading: true })
    
    try {
      const [applicationsResponse, agreementsResponse] = await Promise.all([
        applicationsAPI.getMyApplications(),
        agreementsAPI.getMyAgreements()
      ])
      
      const application = applicationsResponse.applications?.find(app => app.property_id === propertyId) || null
      const agreement = agreementsResponse.agreements?.find(agr => agr.property_id === propertyId) || null
      
      const context: RentalContextData = {
        application,
        agreement,
        isLoading: false
      }
      
      contextCache.current.set(propertyId, context)
      setRentalContext(context)
    } catch (error) {
      console.error('Failed to fetch rental context:', error)
      setRentalContext({ application: null, agreement: null, isLoading: false })
    }
  }, [])
  
  // Send message
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConversationId) return
    
    setIsSending(true)
    const content = messageInput.trim()
    setMessageInput("")
    
    try {
      const newMessage = await messagesAPI.sendMessage(selectedConversationId, content)
      
      // Optimistic update
      setMessages(prev => [...prev, newMessage])
      
      // Update conversation's last message in list
      // FIX-4: also set last_message_sender_id so ConversationCard shows "You: ..." immediately
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversationId 
          ? {
              ...conv,
              last_message: content,
              last_message_sender_id: currentUserId,
              last_message_at: new Date().toISOString(),
            }
          : conv
      ))
      
      scrollToBottom()
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error("Failed to send message. Try again.")
      setMessageInput(content) // Restore message on error
    } finally {
      setIsSending(false)
    }
  }, [messageInput, selectedConversationId, scrollToBottom])
  
  // Handle conversation selection
  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId)
    router.replace(`/tenant/messages?conversation=${conversationId}`, { scroll: false })
  }, [router])
  
  // Handle banner dismissal
  const dismissBanner = useCallback(() => {
    if (selectedConversationId) {
      setDismissedBanners(prev => new Set([...prev, `${selectedConversationId}:rental-context`]))
    }
  }, [selectedConversationId])
  
  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchConversations(),
        selectedConversationId ? fetchMessages(selectedConversationId) : Promise.resolve()
      ])
      setLastRefreshTime(new Date())
      // FIX-6: removed toast.success("Messages refreshed") — fires on every refresh, too noisy
    } catch (error) {
      toast.error("Failed to refresh messages")
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchConversations, selectedConversationId, fetchMessages])
  
  // Archive conversation (per-user flag — does not affect landlord's view)
  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      await messagesAPI.archiveConversation(conversationId)
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, archived_by_tenant: true } : conv
        )
      )
      setConversationDetail(prev => prev ? { ...prev, archived_by_tenant: true } : prev)
    } catch {
      toast.error("Failed to archive conversation")
    }
  }, [])

  // Filter conversations based on search + active filter tab
  useEffect(() => {
    let filtered = conversations

    // Apply tab filter — archived_by_tenant is the per-user flag (never shared with landlord)
    switch (conversationFilter) {
      case "unread":
        filtered = filtered.filter(c => c.unread_count > 0)
        break
      case "archived":
        filtered = filtered.filter(c => c.archived_by_tenant)
        break
      case "active":
        filtered = filtered.filter(c => !c.archived_by_tenant && c.unread_count === 0)
        break
      default:
        // "all" — hide archived unless the archived tab is explicitly selected
        filtered = filtered.filter(c => !c.archived_by_tenant)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(conv =>
        conv.partner.name?.toLowerCase().includes(query) ||
        conv.property?.title?.toLowerCase().includes(query)
      )
    }

    setFilteredConversations(filtered)
  }, [conversations, searchQuery, conversationFilter])
  
  // Initial data fetch
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])
  
  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId)
    } else {
      setMessages([])
      setConversationDetail(null)
      setRentalContext(null)
    }
  }, [selectedConversationId, fetchMessages])
  
  // Fetch rental context when conversation with property is selected
  useEffect(() => {
    if (conversationDetail?.property_id && conversationDetail.property_id !== 'null') {
      fetchRentalContext(conversationDetail.property_id)
    } else {
      setRentalContext(null)
    }
  }, [conversationDetail?.property_id, fetchRentalContext])
  
  // Create conversation from landlord and property parameters
  const getContextualInitialMessage = useCallback((context: string | null): string => {
    switch (context) {
      case "agreement_signing":
        return "Hi! I've completed my part of the lease agreement signing. Could you please review and sign it at your earliest convenience? Let me know if you have any questions."
      default:
        return "Hi! I'm interested in your property. Could you tell me more about it?"
    }
  }, [])

  const handleCreateConversationFromParams = useCallback(async (landlordId: string, propertyId: string, context: string | null) => {
    if (!user?.id || isCreatingConversation) return
    
    setIsCreatingConversation(true)
    
    try {
      // First, check if there's an existing conversation for this property
      console.log('🔍 [MESSAGES] Looking for existing conversation...')
      const existingConversation = await messagesAPI.findConversation(propertyId, landlordId)
      
      if (existingConversation) {
        console.log('✅ [MESSAGES] Found existing conversation:', existingConversation.id)
        // Navigate to existing conversation
        router.replace(`/tenant/messages?conversation=${existingConversation.id}`)
        setSelectedConversationId(existingConversation.id)
        
        // Always send the contextual message, even for existing conversations
        if (context) {
          const contextualMessage = getContextualInitialMessage(context)
          console.log('🔍 [MESSAGES] Sending contextual message to existing conversation:', contextualMessage)
          
          try {
            await messagesAPI.sendMessage(
              existingConversation.id,  // conversation_id
              contextualMessage         // content
            )
            toast.success('Message sent to landlord')
          } catch (sendError) {
            console.error('❌ [MESSAGES] Failed to send contextual message:', sendError)
            toast.error('Conversation loaded but failed to send message')
          }
        } else {
          toast.success('Conversation loaded')
        }
      } else {
        console.log('🔍 [MESSAGES] Creating new conversation...')
        // Create a new conversation with contextual initial message
        const result = await messagesAPI.createConversation({
          property_id: propertyId,
          landlord_id: landlordId,
          initial_message: getContextualInitialMessage(context)
        })
        
        console.log('✅ [MESSAGES] Created new conversation:', result.conversation_id)
        // Navigate to the new conversation
        router.replace(`/tenant/messages?conversation=${result.conversation_id}`)
        setSelectedConversationId(result.conversation_id)
        toast.success('Conversation started')
      }
    } catch (error) {
      console.error('❌ [MESSAGES] Failed to create conversation from parameters:', error)
      
      // Better error handling based on error type
      let errorMessage = 'Failed to start conversation. Please try again.'
      const axiosError = error as any // Type assertion for axios error
      
      if (axiosError?.response?.status === 500) {
        errorMessage = 'Database connection issue. Please try again in a moment.'
      } else if (axiosError?.response?.status === 400) {
        errorMessage = 'Invalid conversation request. Please check the property details.'
      } else if (axiosError?.code === 'ECONNABORTED' || axiosError?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.'
      }
      
      toast.error(errorMessage, {
        action: {
          label: 'Retry',
          onClick: () => handleCreateConversationFromParams(landlordId, propertyId, context)
        }
      })
    } finally {
      setIsCreatingConversation(false)
    }
  }, [user?.id, router, isCreatingConversation, getContextualInitialMessage])
  
  // Handle tenant and property URL parameters for auto-creating conversations
  useEffect(() => {
    if (!searchParams) return
    
    const landlordId = searchParams.get('landlord')
    const propertyId = searchParams.get('property')
    const conversationId = searchParams.get('conversation')
    const context = searchParams.get('context')
    
    // Update conversation context
    setConversationContext(context)
    
    // Only proceed if we have landlord and property but no conversation
    if (landlordId && propertyId && !conversationId && !isCreatingConversation) {
      handleCreateConversationFromParams(landlordId, propertyId, context)
    }
  }, [searchParams, isCreatingConversation, handleCreateConversationFromParams])
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])
  
  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId)
  const isBannerDismissed = selectedConversationId ? 
    dismissedBanners.has(`${selectedConversationId}:rental-context`) : false
  
  // FIX-5: filter soft-deleted messages before grouping (migration 0001 adds deleted_at).
  // Matches FIX-10b on the landlord page.
  const visibleMessages = messages.filter(m => !m.deleted_at)

  // Group messages by date
  const groupedMessages = visibleMessages.reduce((groups, message) => {
    const date = getMessageDate(message.timestamp)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, Message[]>)
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">

      {/* Header */}
      <div className="mb-8">
        <Link href="/tenant">
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
              Communicate directly with property landlords
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
            <Link href="/tenant/notifications">
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100dvh - 12rem)" }}>
        {/* Mobile Floating Action Button */}
        {selectedConversationId && mobileView === 'conversation' && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setMobileView('list')}
            className="lg:hidden absolute top-4 left-4 z-10 bg-blue-500 hover:bg-blue-600 shadow-lg"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            All Chats
          </Button>
        )}
        
      {/* Left Panel - Conversation List */}
      <div className={`w-80 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col ${
        mobileView === 'conversation' ? 'hidden lg:flex' : 'flex'
      }`}>

        {/* Left panel header — inbox label + unread badge + refresh + filter */}
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-slate-900 text-sm">Inbox</span>
              {conversations.filter(c => c.unread_count > 0).length > 0 && (
                <span className="text-[10px] bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {conversations.filter(c => c.unread_count > 0).length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(v => !v)}
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
                title="Refresh conversations"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Filter tabs — shown when filter button is toggled */}
          {showFilters && (
            <div className="flex gap-1 mb-3">
              {(["all", "unread", "active", "archived"] as ConversationFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setConversationFilter(f)}
                  className={`flex-1 text-[10px] font-medium py-1 rounded-md capitalize transition-colors ${
                    conversationFilter === f
                      ? "bg-orange-500 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {f}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm border-slate-200 focus:border-orange-400 focus:ring-orange-400 rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            // Skeleton cards
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border-b border-slate-100 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
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
          ) : selectedConversationId ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Loading conversation...
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Please wait while we connect to the server
              </p>
              <Button
                onClick={() => fetchConversations()}
                className="mt-4"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <EmptyConversationList userType="tenant" />
          )}
        </div>
      </div>
      
      {/* Right Panel - Active Conversation */}
      <div className={`flex-1 flex flex-col overflow-hidden bg-white ${
        mobileView === 'list' ? 'hidden lg:flex' : 'flex'
      }`}>
        {isCreatingConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Starting Conversation</h3>
              <p className="text-slate-600">Setting up your chat...</p>
            </div>
          </div>
        ) : selectedConversationId && selectedConversation ? (
          <>
            <ChatHeader
              partner={selectedConversation.partner}
              property={selectedConversation.property}
              showUserInfo={showLandlordInfo}
              onToggleUserInfo={() => setShowLandlordInfo(v => !v)}
              currentUserType="tenant"
              conversationDetail={conversationDetail}
              onArchiveConversation={archiveConversation}
              selectedConversationId={selectedConversationId}
              onMobileBack={() => setMobileView('list')}
            />
            
            {/* Collapsible landlord info strip */}
            {showLandlordInfo && selectedConversation?.partner && (
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex-shrink-0">
                <UserInfoCard
                  user={selectedConversation.partner}
                  property={selectedConversation.property ?? undefined}
                  currentUserType="tenant"
                  variant="compact"
                />
              </div>
            )}
            
            {/* Context indicator for agreement signing */}
            {conversationContext && (
              <div className="px-4 py-2 border-b border-slate-100 bg-blue-50 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs font-medium"
                  style={{
                    color: conversationContext === 'agreement_signing' ? '#1e40af' : '#0f766e',
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {conversationContext === 'agreement_signing' ? 'Agreement Signing': 'Conversation'}
                </div>
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
            
            {/* Rental Context Banner */}
            {selectedConversation?.property?.id && (
              <RentalContextBanner
                context={rentalContext}
                conversationId={selectedConversationId}
                propertyId={selectedConversation.property?.id}
                userType="tenant"
                dismissed={isBannerDismissed}
                onDismiss={dismissBanner}
              />
            )}
            
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4"
            >
              {isLoadingMessages ? (
                // Skeleton messages
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className={`max-w-[70%] ${i % 2 === 0 ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl px-4 py-2.5 h-12 bg-slate-200 animate-pulse`} />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Load Earlier Messages Button */}
                  {/* FIX-3: previous check (returned === limit) breaks when total is an exact
                      multiple of page size. Correct check: are there messages beyond what we loaded? */}
                  {pagination && (pagination.offset + pagination.returned) < pagination.total && (
                    <div className="text-center mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedConversationId && pagination) {
                            fetchMessages(selectedConversationId, pagination.offset + pagination.limit)
                          }
                        }}
                        disabled={loadingEarlier}
                      >
                        {loadingEarlier ? 'Loading...' : 'Load earlier messages'}
                      </Button>
                    </div>
                  )}
                  
                  {/* Message Groups */}
                  {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                      <DatePill label={date} />
                      {dateMessages.map((message, index) => {
                        const isOwn = message.sender_id === currentUserId
                        const showAvatar = index === 0 || 
                          (index > 0 && dateMessages[index - 1].sender_id !== message.sender_id)
                        
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
                </>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Bar */}
            {/* FIX-2: use archived_by_tenant (per-user flag) not shared status column */}
            {conversationDetail?.archived_by_tenant ? (
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-600 text-center">
                  This conversation is archived.
                </p>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-200">
                <div className="flex items-end gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 resize-none min-h-[44px] max-h-[120px]"
                    rows={1}
                    disabled={isSending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isSending || !messageInput.trim()}
                    className="h-[44px] px-4 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Press Enter to send • Shift + Enter for new line
                </p>
                
                {/* Context-aware helper text */}
                {conversationContext && (
                  <p className="text-[10px] mt-2 px-2 py-1.5 rounded-lg text-blue-900 bg-blue-50"
                    style={{
                      backgroundColor: conversationContext === 'agreement_signing' ? '#dbeafe' : '#ccfbf1',
                      color: conversationContext === 'agreement_signing' ? '#1e3a8a' : '#134e4a',
                    }}
                  >
                    <span className="font-semibold">Tip:</span>{" "}
                    {conversationContext === 'agreement_signing' 
                      ? "Let landlord know you've signed. Be professional and request their signature soon."
                      : "Keep messages clear and professional."}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <EmptyThread />
        )}
      </div>
      </div>
    </div>
  )
}