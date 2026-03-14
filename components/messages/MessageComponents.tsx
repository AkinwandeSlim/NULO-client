"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Check, 
  CheckCheck, 
  MessageSquare, 
  Home,
  Calendar,
  FileText,
  Send,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Building2,
  X,
  ArrowLeft,
  Users,
  Star,
  ChevronUp
} from "lucide-react"
import { UserInfoCard } from "./UserInfoCard"
import { ChatHeader } from "./ChatHeader"
import Link from "next/link"
import { 
  Conversation, 
  ConversationPartner, 
  ConversationProperty, 
  Message, 
  MessageSender 
} from "@/lib/api/messages"
import { Application } from "@/lib/api/applications"
import { AgreementWithDetails } from "@/lib/api/agreements"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RentalContextData {
  application: Application | null
  agreement: AgreementWithDetails | null
  isLoading: boolean
}

export interface ConversationCardProps {
  conversation: Conversation
  isSelected: boolean
  currentUserId: string
  onClick: (id: string) => void
}

export interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
}

export interface DatePillProps { 
  label: string 
}

export interface RentalContextBannerProps {
  context: RentalContextData | null
  conversationId: string
  propertyId: string | null
  userType: "tenant" | "landlord"
  dismissed: boolean
  onDismiss: () => void
}

export interface PropertyContextCardProps {
  property: ConversationProperty | null
  partner: ConversationPartner
}

export interface EmptyConversationListProps { 
  userType: "tenant" | "landlord" 
}

export interface EmptyThreadProps {}

export interface UserInfoCardProps {
  // Add props for UserInfoCard here
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return ""
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

export const formatMessageTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

export const getMessageDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  if (messageDate.getTime() === today.getTime()) return "Today"
  if (messageDate.getTime() === yesterday.getTime()) return "Yesterday"
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export function ConversationCard({ 
  conversation, 
  isSelected, 
  currentUserId, 
  onClick 
}: ConversationCardProps) {
  const { partner, property, last_message, last_message_at, unread_count } = conversation
  // FIX-A: use per-user archive flags (migration 0001) instead of shared status column.
  // Component is used by both landlord and tenant pages — check both flags.
  const isArchived = conversation.archived_by_landlord || conversation.archived_by_tenant
  // "You: ..." preview — uses last_message_sender_id from FIX-9 (messages.py + messages.ts)
  const lastMessagePreview = last_message
    ? conversation.last_message_sender_id === currentUserId
      ? `You: ${last_message}`
      : last_message
    : null
  
  return (
    <div
      onClick={() => onClick(conversation.id)}
      className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-orange-50 border-l-4 border-l-orange-500' 
          : 'hover:bg-slate-50'
      } ${isArchived ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={partner.avatar_url || undefined} />
          <AvatarFallback className="bg-slate-200 text-slate-600 text-sm font-medium">
            {partner.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-medium text-slate-900 truncate">
                  {partner.name || 'User'}
                </span>
                {partner.verified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                {partner.user_type === 'landlord' ? 'Landlord' : 'Tenant'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {formatRelativeTime(last_message_at)}
              </span>
              {unread_count > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-medium">
                  {unread_count > 9 ? '9+' : unread_count}
                </span>
              )}
            </div>
          </div>
          
          {property && (
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="truncate">
                  {property.title}
                </span>
              </div>
            </div>
          )}
          
          {lastMessagePreview && (
            <p className="text-sm text-slate-500 truncate">
              {lastMessagePreview.length > 60 ? `${lastMessagePreview.substring(0, 60)}...` : lastMessagePreview}
            </p>
          )}
          
          {isArchived && (
            <Badge variant="secondary" className="text-xs mt-1">
              Archived
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

export function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  const { sender, content, timestamp, read } = message
  
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwn && showAvatar && (
        <Avatar className="h-7 w-7 mr-2 mt-1 flex-shrink-0">
          <AvatarImage src={sender?.avatar_url || undefined} />
          <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
            {sender?.full_name?.charAt(0)?.toUpperCase() || 
             sender?.first_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-orange-500 text-white'
              : 'bg-white text-slate-900 border border-slate-200'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
        
        <div className={`flex items-center gap-1 mt-1 px-1 ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-xs text-slate-400">
            {formatMessageTime(timestamp)}
          </span>
          {isOwn && (
            read ? (
              <CheckCheck className="h-3 w-3 text-orange-400" />
            ) : (
              <Check className="h-3 w-3 text-slate-300" />
            )
          )}
        </div>
      </div>
    </div>
  )
}

export function DatePill({ label }: DatePillProps) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  )
}

export function RentalContextBanner({ 
  context, 
  conversationId, 
  propertyId, 
  userType, 
  dismissed, 
  onDismiss 
}: RentalContextBannerProps) {
  if (!context || context.isLoading || !propertyId) return null
  
  const { application, agreement } = context
  
  // Determine banner state and content
  let bannerContent: {
    text: string
    color: string
    bgColor: string
    cta?: { text: string; href: string }
    icon: React.ReactNode
  } | null = null
  
  if (userType === 'tenant') {
    // Tenant-side banner logic
    if (!application) {
      bannerContent = {
        text: "You haven't applied yet. Schedule a viewing or apply directly.",
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        cta: { text: 'Apply Now', href: `/properties/${propertyId}/apply` },
        icon: <FileText className="h-4 w-4" />
      }
    } else if (application.status === 'pending') {
      bannerContent = {
        text: "Application submitted — awaiting landlord review.",
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        cta: { text: 'View Application', href: `/tenant/applications` },
        icon: <Clock className="h-4 w-4" />
      }
    } else if (application.status === 'rejected') {
      bannerContent = {
        text: "Application not approved. You may message the landlord for feedback.",
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        icon: <AlertCircle className="h-4 w-4" />
      }
    } else if (application.status === 'approved') {
      if (agreement) {
        if (agreement.status === 'PENDING_TENANT') {
          bannerContent = {
            text: "Your agreement is ready to sign.",
            color: 'text-blue-700',
            bgColor: 'bg-blue-50',
            cta: { text: 'Sign Agreement', href: `/tenant/agreements/${agreement.id}` },
            icon: <FileText className="h-4 w-4" />
          }
        } else if (agreement.status === 'SIGNED') {
          bannerContent = {
            text: "Agreement signed — proceed to payment to confirm your tenancy.",
            color: 'text-blue-700',
            bgColor: 'bg-blue-50',
            cta: { text: 'Pay Now', href: `/tenant/payments/new?agreement_id=${agreement.id}` },
            icon: <Send className="h-4 w-4" />
          }
        } else if (agreement.status === 'ACTIVE') {
          bannerContent = {
            text: "✅ Active tenancy. Move-in confirmed.",
            color: 'text-green-700',
            bgColor: 'bg-green-50',
            icon: <CheckCircle2 className="h-4 w-4" />
          }
        }
      } else {
        bannerContent = {
          text: "🎉 Application approved! Your agreement should arrive soon.",
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: <CheckCircle2 className="h-4 w-4" />
        }
      }
    }
  } else {
    // Landlord-side banner logic
    if (application && application.status === 'pending') {
      bannerContent = {
        text: "Application pending review.",
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        cta: { text: 'Review Application', href: `/landlord/applications?property=${propertyId}` },
        icon: <FileText className="h-4 w-4" />
      }
    } else if (agreement) {
      if (agreement.status === 'PENDING_TENANT') {
        bannerContent = {
          text: "Waiting for tenant to sign the agreement.",
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          icon: <Clock className="h-4 w-4" />
        }
      } else if (agreement.status === 'SIGNED') {
        bannerContent = {
          text: "Agreement signed. Awaiting tenant payment.",
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          icon: <Clock className="h-4 w-4" />
        }
      } else if (agreement.status === 'ACTIVE') {
        bannerContent = {
          text: "✅ Active tenancy for this property.",
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: <CheckCircle2 className="h-4 w-4" />
        }
      }
    }
  }
  
  if (!bannerContent || dismissed) return null
  
  return (
    <div className={`${bannerContent.bgColor} ${bannerContent.color} px-4 py-3 flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        {bannerContent.icon}
        <span className="text-sm">{bannerContent.text}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {bannerContent.cta && (
          <Link href={bannerContent.cta.href}>
            <Button variant="ghost" size="sm" className="text-sm h-auto p-1">
              {bannerContent.cta.text}
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-auto p-1"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function PropertyContextCard({ property, partner }: PropertyContextCardProps) {
  if (!property) {
    return (
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={partner.avatar_url || undefined} />
            <AvatarFallback className="bg-slate-200 text-slate-600">
              {partner.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{partner.name}</h3>
            <p className="text-sm text-slate-600">Direct conversation</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 border-b border-slate-200 bg-slate-50">
      {/* Property Information */}
      <Link 
        href={`/properties/${property.id}`}
        className="flex items-center gap-3 hover:bg-white p-2 -m-2 rounded-lg transition-colors group"
        target="_blank"
      >
        <div className="w-[60px] h-[60px] rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
          <img 
            src={property.images?.[0] || '/placeholder-property.jpg'} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
            {property.title}
          </h3>
          <p className="text-sm text-slate-600 truncate flex items-center gap-1">
            📍 {property.location}
          </p>
          <p className="text-sm font-bold text-orange-600">
            ₦{property.price?.toLocaleString()}/month
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Home className="h-5 w-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
          <span className="text-xs text-slate-500">View</span>
        </div>
      </Link>
    </div>
  )
}

// Enhanced component for tenant information display
interface TenantInfoCardProps {
  tenant: ConversationPartner
  property?: ConversationProperty
  userType?: 'landlord' | 'tenant'
}

export function TenantInfoCard({ tenant, property, userType = 'landlord' }: TenantInfoCardProps) {
  return (
    <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-start gap-4">
        {/* Tenant Avatar */}
        <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-white shadow-sm">
          <AvatarImage src={tenant.avatar_url || undefined} />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-medium">
            {tenant.name?.charAt(0)?.toUpperCase() || 'T'}
          </AvatarFallback>
        </Avatar>
        
        {/* Tenant Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-slate-900 text-lg">{tenant.name || 'Tenant'}</h3>
            {tenant.verified && (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              {tenant.user_type === 'landlord' ? 'Landlord' : 'Tenant'}
            </Badge>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-1 text-sm text-slate-600">
            {tenant.phone_number && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-slate-400" />
                <span>{tenant.phone_number}</span>
              </div>
            )}
          </div>
          
          {/* Trust Score */}
          {tenant.trust_score !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Trust Score:</span>
                <span className={`text-sm font-bold ${
                  (tenant.trust_score || 0) >= 70 ? 'text-green-600' : 
                  (tenant.trust_score || 0) >= 40 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {tenant.trust_score || 0}/100
                </span>
              </div>
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (tenant.trust_score || 0) >= 70 ? 'bg-green-500' : 
                    (tenant.trust_score || 0) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${tenant.trust_score || 0}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Property Context */}
          {property && (
            <div className="mt-3 p-2 bg-white/50 rounded-lg border border-blue-100">
              <p className="text-xs text-slate-600 mb-1">Regarding:</p>
              <p className="text-sm font-medium text-slate-800 truncate">{property.title}</p>
              <p className="text-xs text-slate-500">📍 {property.location}</p>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {userType === 'landlord' && (
            <>
              <Button variant="outline" size="sm" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Application
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Viewing
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Enhanced component for landlord information display
interface LandlordInfoCardProps {
  landlord: ConversationPartner
  property?: ConversationProperty
  userType?: 'tenant' | 'landlord'
}

export function LandlordInfoCard({ landlord, property, userType = 'tenant' }: LandlordInfoCardProps) {
  return (
    <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <div className="flex items-start gap-4">
        {/* Landlord Avatar */}
        <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-white shadow-sm">
          <AvatarImage src={landlord.avatar_url || undefined} />
          <AvatarFallback className="bg-purple-100 text-purple-600 text-lg font-medium">
            {landlord.name?.charAt(0)?.toUpperCase() || 'L'}
          </AvatarFallback>
        </Avatar>
        
        {/* Landlord Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-slate-900 text-lg">{landlord.name || 'Landlord'}</h3>
            {landlord.verified && (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
              {landlord.user_type === 'landlord' ? 'Landlord' : 'Property Manager'}
            </Badge>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-1 text-sm text-slate-600">
            {landlord.phone_number && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-slate-400" />
                <span>{landlord.phone_number}</span>
              </div>
            )}
          </div>
          
          {/* Trust Score */}
          {landlord.trust_score !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">Trust Score:</span>
                <span className={`text-sm font-bold ${
                  (landlord.trust_score || 0) >= 70 ? 'text-green-600' : 
                  (landlord.trust_score || 0) >= 40 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {landlord.trust_score || 0}/100
                </span>
              </div>
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (landlord.trust_score || 0) >= 70 ? 'bg-green-500' : 
                    (landlord.trust_score || 0) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${landlord.trust_score || 0}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Property Context */}
          {property && (
            <div className="mt-3 p-2 bg-white/50 rounded-lg border border-purple-100">
              <p className="text-xs text-slate-600 mb-1">Regarding:</p>
              <p className="text-sm font-medium text-slate-800 truncate">{property.title}</p>
              <p className="text-xs text-slate-500">📍 {property.location}</p>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {userType === 'tenant' && (
            <>
              <Button variant="outline" size="sm" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                Property
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Schedule
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function EmptyConversationList({ userType }: EmptyConversationListProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        No conversations yet
      </h3>
      <p className="text-sm text-slate-600 mb-6">
        {userType === 'tenant' 
          ? "Browse properties and use the Chat button to start talking with a landlord."
          : "Tenants will reach out when they're interested in your properties."
        }
      </p>
      {userType === 'tenant' && (
        <Link href="/properties">
          <Button className="bg-orange-500 hover:bg-orange-600">
            Browse Properties
          </Button>
        </Link>
      )}
    </div>
  )
}

export function EmptyThread({}: EmptyThreadProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Select a conversation
        </h3>
        <p className="text-sm text-slate-600">
          Choose from the list to view your messages
        </p>
      </div>
    </div>
  )
}

export function MobileBackButton({ onBack }: { onBack: () => void }) {
  return (
    <div className="lg:hidden flex items-center gap-2 p-4 border-b border-slate-200 bg-white">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="p-2"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <span className="font-medium text-slate-900">Messages</span>
    </div>
  )
}

// Re-export UserInfoCard for convenience
export { UserInfoCard }
export { ChatHeader }