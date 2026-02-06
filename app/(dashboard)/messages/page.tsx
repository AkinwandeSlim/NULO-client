"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Paperclip, MoreVertical, Search, Phone, Video, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

// Sample conversations data
const conversationsData = [
  {
    id: 1,
    name: "Sarah Kimani",
    avatar: "/avatar-1.jpg",
    lastMessage: "Hi, I'm interested in viewing the property this weekend. Is Saturday available?",
    time: "2 min ago",
    unread: 2,
    online: true,
    property: "Modern Villa in Nairobi",
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "/avatar-2.jpg",
    lastMessage: "Thank you for the quick response! I'll be there at 3 PM.",
    time: "1 hour ago",
    unread: 0,
    online: true,
    property: "Luxury Apartment Lagos",
  },
  {
    id: 3,
    name: "Emma Williams",
    avatar: "/avatar-3.jpg",
    lastMessage: "Is the price negotiable? I'm very interested in this property.",
    time: "3 hours ago",
    unread: 1,
    online: false,
    property: "Penthouse in Cape Town",
  },
  {
    id: 4,
    name: "John Mensah",
    avatar: "/avatar-4.jpg",
    lastMessage: "Perfect! Looking forward to seeing the property.",
    time: "Yesterday",
    unread: 0,
    online: false,
    property: "Cozy Apartment in Accra",
  },
  {
    id: 5,
    name: "Amara Okafor",
    avatar: "/avatar-5.jpg",
    lastMessage: "Could you send me more photos of the kitchen?",
    time: "2 days ago",
    unread: 0,
    online: false,
    property: "Garden Apartment Kigali",
  },
]

// Sample messages for selected conversation
const messagesData = {
  1: [
    {
      id: 1,
      sender: "Sarah Kimani",
      message: "Hello! I saw your listing for the Modern Villa in Nairobi. It looks amazing!",
      time: "10:30 AM",
      isOwn: false,
    },
    {
      id: 2,
      sender: "You",
      message: "Thank you for your interest! The villa is indeed a beautiful property. Would you like to schedule a viewing?",
      time: "10:32 AM",
      isOwn: true,
    },
    {
      id: 3,
      sender: "Sarah Kimani",
      message: "Yes, I would love to! What days are you available this week?",
      time: "10:35 AM",
      isOwn: false,
    },
    {
      id: 4,
      sender: "You",
      message: "I'm available Tuesday through Saturday. What works best for you?",
      time: "10:37 AM",
      isOwn: true,
    },
    {
      id: 5,
      sender: "Sarah Kimani",
      message: "Hi, I'm interested in viewing the property this weekend. Is Saturday available?",
      time: "Just now",
      isOwn: false,
    },
  ],
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversationsData[0])
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const currentMessages = messagesData[selectedConversation.id as keyof typeof messagesData] || []

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message to the backend
      console.log("Sending message:", messageInput)
      setMessageInput("")
    }
  }

  const filteredConversations = conversationsData.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.property.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-stone-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-stone-800">Nulo</span>
              <span className="text-orange-600">Africa</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-slate-700 hover:text-orange-600 transition-colors">
                Home
              </Link>
              <Link href="/properties" className="text-slate-700 hover:text-orange-600 transition-colors">
                Properties
              </Link>
              <Link href="/messages" className="text-orange-600 font-semibold">
                Messages
              </Link>
              <Link href="/dashboard" className="text-slate-700 hover:text-orange-600 transition-colors">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Messages
          </h1>
          <p className="text-slate-600">
            {conversationsData.filter(c => c.unread > 0).length > 0 
              ? `You have ${conversationsData.reduce((acc, c) => acc + c.unread, 0)} unread messages`
              : 'All caught up!'
            }
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          {/* Left Column - Conversations List */}
          <Card className="lg:col-span-1 bg-white/90 backdrop-blur-sm border-white/50 rounded-2xl shadow-lg overflow-hidden flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Search Bar */}
              <div className="p-4 border-b border-stone-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-stone-200 bg-white text-slate-800 placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation, index) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-amber-50 transition-all duration-300 border-b border-stone-100 animate-fade-in-up ${
                      selectedConversation.id === conversation.id
                        ? "bg-amber-50 border-l-4 border-l-amber-500"
                        : ""
                    }`}
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      opacity: 0,
                      animationFillMode: 'forwards'
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 border-2 border-white">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">
                          {conversation.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Message Preview */}
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">
                          {conversation.name}
                        </h4>
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                          {conversation.time}
                        </span>
                      </div>
                      <p className="text-xs text-amber-600 mb-1 truncate">
                        {conversation.property}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {conversation.unread > 0 && (
                      <Badge className="bg-amber-500 text-white border-0 h-5 min-w-5 flex items-center justify-center text-xs">
                        {conversation.unread}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Chat Window */}
          <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-white/50 rounded-2xl shadow-lg overflow-hidden flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Chat Header */}
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-amber-200">
                      <AvatarImage src={selectedConversation.avatar} />
                      <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">
                        {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {selectedConversation.name}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {selectedConversation.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-600 hover:text-amber-600 hover:bg-amber-50">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-600 hover:text-amber-600 hover:bg-amber-50">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-600 hover:text-amber-600 hover:bg-amber-50">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Property Context Banner */}
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Property:</span>{" "}
                  <span className="text-amber-700">{selectedConversation.property}</span>
                </p>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-stone-50/30">
                {currentMessages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} animate-fade-in-up`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      opacity: 0,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <div className={`max-w-[70%] ${msg.isOwn ? "order-2" : "order-1"}`}>
                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.isOwn
                            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-sm"
                            : "bg-stone-100 text-slate-800 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                      {/* Time */}
                      <p className={`text-xs text-slate-500 mt-1 ${msg.isOwn ? "text-right" : "text-left"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-stone-200 bg-white/50">
                <div className="flex items-end gap-3">
                  {/* Attachment Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-600 hover:text-amber-600 hover:bg-amber-50 flex-shrink-0"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  {/* Image Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-600 hover:text-amber-600 hover:bg-amber-50 flex-shrink-0"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>

                  {/* Text Input */}
                  <div className="flex-1 relative">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Type your message..."
                      rows={1}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-slate-800 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
                    />
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
