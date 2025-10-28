"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Shield, 
  CheckCircle2,
  Clock,
  Home,
  X,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { messagesAPI } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  propertyId: number
  propertyTitle: string
  propertyPrice: string
  propertyImage: string
  landlordName: string
  landlordId: string
  landlordAvatar: string
  landlordVerified: boolean
  landlordResponseTime: string
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  status: 'sent' | 'delivered' | 'read'
}

const quickTemplates = [
  "Is this property still available?",
  "Can I schedule a viewing?",
  "Can you send more photos?",
  "What's included in the rent?",
]

export function ChatModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  propertyPrice,
  propertyImage,
  landlordName,
  landlordId,
  landlordAvatar,
  landlordVerified,
  landlordResponseTime
}: ChatModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserId = user?.id || ""

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load initial messages (simulate)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Simulate loading existing conversation
      const existingMessages: Message[] = [
        {
          id: "1",
          senderId: "tenant-1",
          senderName: "You",
          content: "Hi, I'm interested in this property. Is it still available?",
          timestamp: new Date(Date.now() - 3600000),
          status: "read"
        },
        {
          id: "2",
          senderId: "landlord-1",
          senderName: landlordName,
          content: `Yes, it's available! Would you like to schedule a viewing? I typically respond ${landlordResponseTime}.`,
          timestamp: new Date(Date.now() - 3000000),
          status: "read"
        }
      ]
      // Only show if this is a returning conversation
      // setMessages(existingMessages)
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message")
      return
    }

    setIsSending(true)
    setShowTemplates(false)
    const messageContent = newMessage.trim()
    setNewMessage("")

    try {
      if (!conversationId) {
        // Create new conversation
        const response = await messagesAPI.createConversation({
          property_id: propertyId.toString(),
          landlord_id: landlordId,
          initial_message: messageContent
        })
        
        toast.success(
          <div>
            <p className="font-semibold">✅ Message sent!</p>
            <p className="text-xs text-slate-600">
              Opening conversation with {landlordName}...
            </p>
          </div>
        )

        // Close modal and redirect to chat page
        onClose()
        router.push(`/dashboard/tenant/messages/${response.conversation_id}`)
      } else {
        // Send message in existing conversation
        const response = await messagesAPI.sendMessage(conversationId, {
          content: messageContent
        })
        
        const message: Message = {
          id: response.message.id,
          senderId: response.message.sender_id,
          senderName: "You",
          content: response.message.content,
          timestamp: new Date(response.message.timestamp),
          status: "sent"
        }
        setMessages(prev => [...prev, message])

        toast.success("Message sent!")
      }
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error(error.response?.data?.detail || 'Failed to send message. Please try again.')
      // Restore message if failed
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  const handleTemplateClick = (template: string) => {
    setNewMessage(template)
    setShowTemplates(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-3 w-3 text-slate-400" />
      case 'delivered':
        return <CheckCircle2 className="h-3 w-3 text-slate-400" />
      case 'read':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[85vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={landlordAvatar} />
                <AvatarFallback className="bg-orange-500 text-white font-semibold">
                  {landlordName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {landlordName}
                  {landlordVerified && (
                    <Badge className="bg-green-500 text-white text-xs px-1.5 py-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Typically responds {landlordResponseTime}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Property Context Card */}
          <Link 
            href={`/properties/${propertyId}`}
            className="mt-4 flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <img 
              src={propertyImage} 
              alt={propertyTitle}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 truncate">
                {propertyTitle}
              </p>
              <p className="text-sm text-orange-600 font-bold">
                {propertyPrice}
              </p>
            </div>
            <Home className="h-5 w-5 text-slate-400" />
          </Link>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && showTemplates && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <Send className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Send a message to {landlordName} about this property
                </p>
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Quick Messages
                </p>
                {quickTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateClick(template)}
                    className="w-full text-left p-3 bg-white border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 rounded-lg transition-all text-sm text-slate-700 hover:text-orange-700"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isOwn = message.senderId === currentUserId
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-slate-500">
                      {formatTime(message.timestamp)}
                    </span>
                    {isOwn && getStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Trust & Safety Banner */}
        <div className="px-6 py-2 bg-green-50 border-t border-green-200 flex-shrink-0">
          <p className="text-xs text-green-800 text-center flex items-center justify-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            <strong>Protected by Nulo:</strong> All messages are encrypted and monitored for your safety
          </p>
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="h-12 text-base resize-none focus:ring-orange-500"
                disabled={isSending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {isSending ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
