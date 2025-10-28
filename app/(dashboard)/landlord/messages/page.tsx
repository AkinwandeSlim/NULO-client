"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, ArrowLeft, Send, 
  Home, MapPin, User, Clock,
  Search
} from "lucide-react"
import Link from "next/link"
import { messagesAPI } from "@/lib/api/messages"
import { toast } from "sonner"

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed='

export default function LandlordMessagesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const data = await messagesAPI.getConversations()
      setConversations(data.conversations)
      
      if (data.conversations.length > 0 && !selectedConversation) {
        selectConversation(data.conversations[0])
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error)
      toast.error(error.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conversation: any) => {
    try {
      setSelectedConversation(conversation)
      setLoadingMessages(true)
      
      const data = await messagesAPI.getMessages(conversation.id)
      setMessages(data.messages)
      
      if (conversation.unread_count > 0) {
        await messagesAPI.markAsRead(conversation.id)
        setConversations(conversations.map(c => 
          c.id === conversation.id ? { ...c, unread_count: 0 } : c
        ))
      }
    } catch (error: any) {
      console.error('Failed to fetch messages:', error)
      toast.error(error.message || 'Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSendingMessage(true)
      const data = await messagesAPI.sendMessage(
        selectedConversation.id,
        newMessage.trim()
      )
      
      setMessages([...messages, data.message])
      setNewMessage('')
      
      setConversations(conversations.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, last_message: newMessage.trim(), updated_at: new Date().toISOString() }
          : c
      ))
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/landlord/overview">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Messages
        </h1>
        <p className="text-slate-600">
          Chat with tenants about your properties
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="py-16">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No conversations yet
              </h3>
              <p className="text-slate-600 mb-6">
                Messages from tenants will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          <Card className="bg-white/90 backdrop-blur-sm border-white/50 lg:col-span-1 overflow-hidden">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="p-4 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-orange-50 border-l-4 border-l-orange-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={conversation.tenant?.avatar_url || DEFAULT_AVATAR + conversation.tenant?.id}
                        alt={conversation.tenant?.full_name || 'Tenant'}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-slate-900 truncate">
                            {conversation.tenant?.full_name || 'Tenant'}
                          </h4>
                          {conversation.unread_count > 0 && (
                            <Badge className="bg-orange-500 text-white text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 flex items-center mb-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {conversation.property?.title || 'Property'}
                        </p>
                        <p className="text-sm text-slate-600 truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTime(conversation.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/50 lg:col-span-2 overflow-hidden">
            {selectedConversation ? (
              <CardContent className="p-0 h-full flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedConversation.tenant?.avatar_url || DEFAULT_AVATAR + selectedConversation.tenant?.id}
                      alt={selectedConversation.tenant?.full_name || 'Tenant'}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {selectedConversation.tenant?.full_name || 'Tenant'}
                      </h3>
                      <Link href={`/properties/${selectedConversation.property?.id}`}>
                        <p className="text-sm text-orange-600 hover:underline flex items-center">
                          <Home className="h-3 w-3 mr-1" />
                          {selectedConversation.property?.title || 'Property'}
                        </p>
                      </Link>
                    </div>
                    <Link href={`/properties/${selectedConversation.property?.id}`}>
                      <Button variant="outline" size="sm">
                        View Property
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.sender_id === user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-orange-100' : 'text-slate-500'
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={sendingMessage}
                    />
                    <Button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600"
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
