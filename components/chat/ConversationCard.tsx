import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Home, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConversationCardProps {
  id: string
  property: {
    id: string
    title: string
    location?: string
    images?: string[]
  }
  partner: {
    id: string
    name: string
    avatar_url?: string
    verified?: boolean
  }
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
}

export function ConversationCard({
  id,
  property,
  partner,
  lastMessage,
  lastMessageAt,
  unreadCount
}: ConversationCardProps) {
  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`
    }
  }

  const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'

  return (
    <Link href={`/dashboard/tenant/messages/${id}`}>
      <div className={cn(
        "group relative bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer",
        unreadCount > 0 && "border-orange-200 bg-orange-50/30"
      )}>
        <div className="flex gap-4 p-4">
          {/* Property Image */}
          <div className="relative flex-shrink-0">
            <img
              src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
              alt={property.title}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
              <Home className="h-3 w-3 text-orange-500" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Property Title */}
            <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
              {property.title}
            </h3>

            {/* Partner Info */}
            <div className="flex items-center gap-2 mb-2">
              {partner.avatar_url ? (
                <img 
                  src={partner.avatar_url} 
                  alt={partner.name} 
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-semibold">
                  {partner.name?.charAt(0).toUpperCase() || 'L'}
                </div>
              )}
              <span className="text-sm text-slate-600 font-medium">
                {partner.name}
              </span>
              {partner.verified && (
                <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0 h-5 border-0">
                  Verified
                </Badge>
              )}
            </div>

            {/* Last Message */}
            <p className={cn(
              "text-sm text-slate-500 line-clamp-1 mb-1",
              unreadCount > 0 && "font-semibold text-slate-700"
            )}>
              {lastMessage || 'No messages yet'}
            </p>

            {/* Location */}
            {property.location && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {property.location}
              </p>
            )}
          </div>

          {/* Right Side - Time & Unread Badge */}
          <div className="flex flex-col items-end justify-between flex-shrink-0">
            <span className="text-xs text-slate-400">
              {formatTime(lastMessageAt)}
            </span>
            {unreadCount > 0 && (
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 h-6 min-w-[24px] flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
