"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MessageSquare, ArrowLeft, Home, Search
} from "lucide-react"
import Link from "next/link"
import { messagesAPI } from "@/lib/api/messages"
import { toast } from "sonner"
import { ConversationCard } from "@/components/chat/ConversationCard"

export default function MessagesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const data = await messagesAPI.getConversations()
      setConversations(data.conversations)
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error)
      toast.error(error.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.partner?.name?.toLowerCase().includes(query) ||
      conv.property?.title?.toLowerCase().includes(query) ||
      conv.property?.location?.toLowerCase().includes(query)
    )
  })

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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/tenant">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
              Messages
            </h1>
            <p className="text-slate-600">
              Chat with tenants about properties
            </p>
          </div>
          <Link href="/properties">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
              <Home className="mr-2 h-4 w-4" />
              Browse Properties
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Conversations</p>
                <p className="text-2xl font-bold text-slate-900">{conversations.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Unread Messages</p>
                <p className="text-2xl font-bold text-orange-600">
                  {conversations.filter(c => c.unread_count > 0).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">
                  {conversations.filter(c => c.unread_count > 0).length > 0 ? '!' : '✓'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Chats</p>
                <p className="text-2xl font-bold text-green-600">
                  {conversations.filter(c => c.last_message).length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Search Bar */}
      {conversations.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none bg-white"
            />
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Conversations</span>
            <span className="text-sm font-normal text-slate-500">
              {conversations.length} conversations
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No conversations yet</h3>
              <p className="text-slate-600 mb-8">
                Messages from tenants will appear here
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/properties">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                    <Home className="mr-2 h-4 w-4" />
                    Browse Properties
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => toast.info('Be polite and clear when messaging landlords about properties!')}
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messaging Tips
                </Button>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No conversations found</h3>
              <p className="text-slate-600 mb-8">
                Try searching with different keywords
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Search className="mr-2 h-4 w-4" />
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  id={conversation.id}
                  property={conversation.property}
                  partner={conversation.partner}
                  lastMessage={conversation.last_message}
                  lastMessageAt={conversation.last_message_at}
                  unreadCount={conversation.unread_count || 0}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
