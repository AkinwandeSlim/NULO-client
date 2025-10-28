"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
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
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/tenant">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Messages
        </h1>
        <p className="text-slate-600">
          Chat with landlords about properties
        </p>
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
              className="pl-12 h-12 rounded-xl border-slate-200 focus:border-orange-300 focus:ring-orange-200"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {conversations.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="py-16">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No conversations yet
              </h3>
              <p className="text-slate-600 mb-6">
                Start browsing properties and contact landlords to begin chatting
              </p>
              <Link href="/properties">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Home className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : filteredConversations.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="py-16">
            <div className="text-center">
              <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No conversations found
              </h3>
              <p className="text-slate-600">
                Try searching with different keywords
              </p>
            </div>
          </CardContent>
        </Card>
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
    </div>
  )
}
