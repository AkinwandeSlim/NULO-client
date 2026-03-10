"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Send, Search, X, ArrowLeft } from "lucide-react"
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
  RentalContextData,
  formatRelativeTime,
  getMessageDate
} from "@/components/messages/MessageComponents"

export default function TenantMessagesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  
  // Page state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get('conversation')
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationDetail, setConversationDetail] = useState<ConversationDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [pagination, setPagination] = useState<MessagesPagination | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())
  
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
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversationId 
          ? { ...conv, last_message: content, last_message_at: new Date().toISOString() }
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
  
  // Filter conversations based on search
  useEffect(() => {
    let filtered = conversations
    
    // Filter by archived status
    if (!showArchived) {
      filtered = filtered.filter(conv => conv.status !== 'archived')
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
  }, [conversations, searchQuery, showArchived])
  
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
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = getMessageDate(message.timestamp)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, Message[]>)
  
  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden bg-slate-50">
      {/* Left Panel - Conversation List */}
      <div className={`w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col ${
        mobileView === 'conversation' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            // Skeleton cards
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border-b border-slate-200 animate-pulse">
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
          ) : (
            <EmptyConversationList userType="tenant" />
          )}
        </div>
        
        {/* Archived Toggle */}
        <div className="p-4 border-t border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="text-sm text-slate-600"
          >
            {showArchived ? 'Hide' : 'Show'} archived
          </Button>
        </div>
      </div>
      
      {/* Right Panel - Active Conversation */}
      <div className={`flex-1 flex flex-col overflow-hidden bg-white ${
        mobileView === 'list' ? 'hidden lg:flex' : 'flex'
      }`}>
        {selectedConversationId ? (
          <>
            {/* Mobile Back Button */}
            <MobileBackButton onBack={() => setMobileView('list')} />
            
            {/* Property Context Card */}
            {selectedConversation && (
              <PropertyContextCard
                property={selectedConversation.property}
                partner={selectedConversation.partner}
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
                  {pagination && pagination.returned === pagination.limit && (
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
            {conversationDetail?.status === 'archived' ? (
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
              </div>
            )}
          </>
        ) : (
          <EmptyThread />
        )}
      </div>
    </div>
  )
}
