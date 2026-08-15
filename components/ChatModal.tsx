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
import { messagesAPI, Message } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { dialogStyles as s } from "@/lib/utils/dialogStyles"

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
          conversation_id: "simulated-conversation",
          sender_id: currentUserId,
          recipient_id: landlordId,
          content: "Hi, I'm interested in this property. Is it still available?",
          property_id: propertyId.toString(),
          message_type: "text",
          read: true,
          read_at: new Date(Date.now() - 3000000).toISOString(),
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          deleted_at: null,
          sender: {
            id: currentUserId,
            full_name: null,
            first_name: "You",
            avatar_url: null
          }
        },
        {
          id: "2",
          conversation_id: "simulated-conversation",
          sender_id: landlordId,
          recipient_id: currentUserId,
          content: `Yes, it's available! Would you like to schedule a viewing? I typically respond ${landlordResponseTime}.`,
          property_id: propertyId.toString(),
          message_type: "text",
          read: true,
          read_at: new Date(Date.now() - 2400000).toISOString(),
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          deleted_at: null,
          sender: {
            id: landlordId,
            full_name: landlordName,
            first_name: null,
            avatar_url: landlordAvatar
          }
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
        router.push(`/tenant/messages?conversation=${response.conversation_id}`)
      } else {
        // Send message in existing conversation
        const response = await messagesAPI.sendMessage(conversationId, messageContent)
        
        const message: Message = {
          id: response.id,
          conversation_id: response.conversation_id,
          sender_id: response.sender_id,
          recipient_id: response.recipient_id,
          content: response.content,
          property_id: response.property_id,
          message_type: response.message_type,
          read: response.read,
          read_at: response.read_at,
          timestamp: response.timestamp,
          deleted_at: response.deleted_at || null,
          sender: response.sender
        }
        setMessages(prev => [...prev, message])

        toast.success(
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">✅ Message sent!</p>
              <p className="text-xs text-slate-600">
                Your message has been delivered to {landlordName}
              </p>
            </div>
            <Link 
              href={`/tenant/messages?conversation=${conversationId}`}
              className="ml-4 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
            >
              View in Messages →
            </Link>
          </div>
        )
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${s.card} ${s.cardLg} h-[85vh] flex flex-col`}>
        {/* Header */}
        <DialogHeader className="flex-shrink-0 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={landlordAvatar} />
                <AvatarFallback className="bg-orange-500 font-semibold text-white">
                  {landlordName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {landlordName}
                  {landlordVerified && (
                    <Badge className="bg-green-500 px-1.5 py-0 text-xs text-white">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </DialogTitle>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
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
            className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/60"
          >
            <img
              src={propertyImage}
              alt={propertyTitle}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {propertyTitle}
              </p>
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {propertyPrice}
              </p>
            </div>
            <Home className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </Link>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {messages.length === 0 && showTemplates && (
            <div className="space-y-4">
              <div className="py-8 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/15">
                  <Send className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Start a conversation
                </h3>
                <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                  Send a message to {landlordName} about this property
                </p>
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  Quick Messages
                </p>
                {quickTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateClick(template)}
                    className="w-full rounded-lg border-2 border-slate-200 bg-white p-3 text-left text-sm text-slate-700 transition-all hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500/50 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId
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
                        : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <div className={`mt-1 flex items-center gap-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatTime(new Date(message.timestamp))}
                    </span>
                    {isOwn && (
                      message.read ? (
                        <CheckCircle2 className="h-3 w-3 text-blue-500" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Trust & Safety Banner */}
        <div className="flex-shrink-0 border-t border-green-200 bg-green-50 px-6 py-2 dark:border-green-800/50 dark:bg-green-950/40">
          <p className="flex items-center justify-center gap-1 text-center text-xs text-green-800 dark:text-green-200">
            <Shield className="h-3.5 w-3.5" />
            <strong>Protected by Nulo:</strong> All messages are encrypted and monitored for your safety
          </p>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
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
                className={`h-12 resize-none text-base focus-visible:ring-orange-500/30 ${s.input}`}
                disabled={isSending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              className="h-12 bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-400"
            >
              {isSending ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
