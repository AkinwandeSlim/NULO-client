"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Shield, Star, Building2, ChevronUp, Archive, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ConversationPartner, ConversationProperty } from "@/lib/api/messages"

interface ChatHeaderProps {
  partner: ConversationPartner
  property?: ConversationProperty | null
  showUserInfo: boolean
  onToggleUserInfo: () => void
  currentUserType: 'tenant' | 'landlord'
  conversationDetail?: any
  onArchiveConversation?: (conversationId: string) => void
  selectedConversationId?: string
  onMobileBack?: () => void
}

export function ChatHeader({
  partner,
  property,
  showUserInfo,
  onToggleUserInfo,
  currentUserType,
  conversationDetail,
  onArchiveConversation,
  selectedConversationId,
  onMobileBack
}: ChatHeaderProps) {
  const isLandlord = currentUserType === 'landlord'
  const partnerType = partner.user_type === 'landlord' ? 'Landlord' : 'Tenant'
  const themeColor = isLandlord ? 'orange' : 'purple'
  const avatarBg = isLandlord ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'

  return (
    <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white">
      {/* Mobile Back Button */}
      {onMobileBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileBack}
          className="lg:hidden h-8 w-8 text-slate-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Avatar */}
      <Avatar className="h-10 w-10 ring-2 ring-slate-100 flex-shrink-0">
        <AvatarImage src={partner.avatar_url ?? undefined} />
        <AvatarFallback className={`${avatarBg} font-semibold text-sm`}>
          {partner.name?.charAt(0)?.toUpperCase() ?? partnerType.charAt(0)}
        </AvatarFallback>
      </Avatar>

      {/* Name + context */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-900 text-sm truncate">
            {partner.name ?? partnerType}
          </h3>
          {partner.verified && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Shield className="h-2.5 w-2.5" />
              Verified
            </span>
          )}
          <span className={`text-[10px] bg-${themeColor}-100 text-${themeColor}-600 font-medium px-1.5 py-0.5 rounded-full flex-shrink-0`}>
            {partnerType}
          </span>
          {partner.trust_score != null && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-700 font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Star className="h-2.5 w-2.5 text-yellow-500" />
              {partner.trust_score}
            </span>
          )}
        </div>

        {property?.title && (
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 truncate">
            <Building2 className={`h-3 w-3 text-${themeColor}-400 flex-shrink-0`} />
            <span className="truncate">
              {property.title}
              {property.location && (
                <span className="text-slate-400"> · {property.location}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Header action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleUserInfo}
          className={`h-8 w-8 transition-colors ${
            showUserInfo
              ? `text-${themeColor}-600 bg-${themeColor}-50`
              : `text-slate-400 hover:text-${themeColor}-600 hover:bg-${themeColor}-50`
          }`}
          title={`Toggle ${partnerType.toLowerCase()} details`}
        >
          <ChevronUp className={`h-4 w-4 transition-transform ${showUserInfo ? "" : "rotate-180"}`} />
        </Button>

        {property?.id && (
          <Link
            href={`/${currentUserType}/properties${isLandlord ? '' : `/${property.id}`}`}
            target="_blank"
            title="View property"
            className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-lg px-2.5 py-1.5 transition-all"
          >
            <Building2 className="h-3 w-3" />
            Property
          </Link>
        )}

        {/* Archive button - only show if not archived */}
        {!conversationDetail?.[`archived_by_${currentUserType}`] && onArchiveConversation && selectedConversationId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onArchiveConversation(selectedConversationId)}
            className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            title="Archive conversation"
          >
            <Archive className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
