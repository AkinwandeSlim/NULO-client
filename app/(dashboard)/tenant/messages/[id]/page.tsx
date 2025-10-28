"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, Home, MapPin, MoreVertical,
  Phone, Video, Info
} from "lucide-react"
import Link from "next/link"
import { messagesAPI } from "@/lib/api/messages"
import { toast } from "sonner"
import { ChatBubble } from "@/components/chat/ChatBubble"
import { ChatInput } from "@/components/chat/ChatInput"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const conversationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch conversation and messages
  useEffect(() => {
    if (!conversationId) return

    fetchConversation()
    fetchMessages()

    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(true)
    }, 3000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [conversationId])

  const fetchConversation = async () => {
    try {
      const data = await messagesAPI.getConversations()
      const conv = data.conversations.find((c: any) => c.id === conversationId)
      if (conv) {
        setConversation(conv)
      } else {
        toast.error('Conversation not found')
        router.push('/dashboard/tenant/messages')
      }
    } catch (error: any) {
      console.error('Failed to fetch conversation:', error)
      toast.error('Failed to load conversation')
    }
  }

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      const data = await messagesAPI.getMessages(conversationId)
      setMessages(data.messages)
    } catch (error: any) {
      console.error('Failed to fetch messages:', error)
      if (!silent) {
        toast.error('Failed to load messages')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    try {
      const data = await messagesAPI.sendMessage(conversationId, content)
      
      // Add new message to list
      setMessages([...messages, data.message])
      
      // Update conversation
      if (conversation) {
        setConversation({
          ...conversation,
          last_message: content,
          last_message_at: new Date().toISOString()
        })
      }

      toast.success('Message sent')
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Conversation not found</p>
          <Link href="/dashboard/tenant/messages">
            <Button className="bg-orange-500 hover:bg-orange-600">
              Back to Messages
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const partner = conversation.partner
  const property = conversation.property

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <Link href="/dashboard/tenant/messages">
        <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Messages
        </Button>
      </Link>

      {/* Chat Container */}
      <Card className="bg-white/90 backdrop-blur-sm border-white/50 overflow-hidden">
        <CardContent className="p-0">
          {/* Chat Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              {/* Partner Info */}
              <div className="flex items-center gap-3">
                {partner?.avatar_url ? (
                  <img
                    src={partner.avatar_url}
                    alt={partner.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-lg font-semibold">
                    {partner?.name?.charAt(0).toUpperCase() || 'L'}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    {partner?.name || 'Landlord'}
                    {partner?.verified && (
                      <Badge className="bg-green-100 text-green-700 text-xs border-0">
                        Verified
                      </Badge>
                    )}
                  </h2>
                  <Link href={`/properties/${property?.id}`}>
                    <p className="text-sm text-orange-600 hover:underline flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {property?.title || 'Property'}
                    </p>
                  </Link>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Link href={`/properties/${property?.id}`}>
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    <Home className="mr-2 h-4 w-4" />
                    View Property
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="text-slate-600">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Property Preview */}
            {property && (
              <Link href={`/properties/${property.id}`}>
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-orange-300 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <img
                      src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                      alt={property.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">
                        {property.title}
                      </h4>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {property.location || 'Location not specified'}
                      </p>
                      <p className="text-sm font-bold text-orange-600 mt-1">
                        ₦{property.price?.toLocaleString()}/mo
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Messages Area */}
          <div className="h-[calc(100vh-450px)] md:h-[500px] overflow-y-auto p-6 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-slate-400">
                  <p className="text-lg mb-2">No messages yet</p>
                  <p className="text-sm">Start the conversation below!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message.content}
                    timestamp={message.timestamp || message.created_at}
                    isOwn={message.sender_id === user?.id}
                    senderName={message.sender?.full_name || message.sender?.name}
                    senderAvatar={message.sender?.avatar_url}
                    isRead={message.read}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
            
            {/* Refreshing Indicator */}
            {refreshing && (
              <div className="text-center py-2">
                <span className="text-xs text-slate-400">Checking for new messages...</span>
              </div>
            )}
          </div>

          {/* Message Input */}
          <ChatInput
            onSend={handleSendMessage}
            placeholder={`Message ${partner?.name || 'landlord'}...`}
          />
        </CardContent>
      </Card>
    </div>
  )
}
