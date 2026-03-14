"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Building2 } from "lucide-react"
import { TrustScoreBadge } from "@/components/ui/TrustScoreBadge"
import { ConversationPartner, ConversationProperty } from "@/lib/api/messages"

export interface UserInfoCardProps {
  user: ConversationPartner
  property?: ConversationProperty
  currentUserType: 'tenant' | 'landlord'
  variant?: 'full' | 'compact'
  showActions?: boolean
}

export function UserInfoCard({ 
  user, 
  property, 
  currentUserType, 
  variant = 'full',
  showActions = true 
}: UserInfoCardProps) {
  const isLandlord = user.user_type === 'landlord'
  const isCurrentUserLandlord = currentUserType === 'landlord'
  const themeColor = isLandlord ? 'purple' : 'blue'
  const bgColor = isLandlord ? 'from-purple-50 to-indigo-50' : 'from-blue-50 to-indigo-50'
  const avatarBg = isLandlord ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
  const badgeBg = isLandlord ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'

  const getRoleLabel = () => {
    if (isLandlord) return 'Landlord'
    return 'Tenant'
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-50 border-b border-slate-200">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className={avatarBg}>
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">{user.name || 'User'}</h3>
            {user.verified && (
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            <Badge variant="secondary" className={`text-xs px-2 py-0.5 flex-shrink-0 ${badgeBg}`}>
              {getRoleLabel()}
            </Badge>
            {user.trust_score !== null && user.trust_score !== undefined && (
              <TrustScoreBadge score={user.trust_score} variant="compact" size="sm" />
            )}
          </div>
          {property && (
            <p className="text-xs text-slate-500 truncate">{property.title}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 border-b border-slate-200 bg-gradient-to-r ${bgColor}`}>
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-white shadow-sm">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className={`${avatarBg} text-lg font-medium`}>
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* User Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-slate-900 text-lg">{user.name || 'User'}</h3>
            {user.verified && (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <Badge variant="secondary" className={`text-xs ${badgeBg}`}>
              {getRoleLabel()}
            </Badge>
          </div>
          
          {/* Trust Score with Progress Bar */}
          {user.trust_score !== null && user.trust_score !== undefined && (
            <div className="mb-3">
              <TrustScoreBadge 
                score={user.trust_score} 
                variant="detailed" 
                showProgress={true}
                showLabel={true}
                size="md"
              />
            </div>
          )}
          
          {/* Property Context */}
          {property && (
            <div className="p-2 bg-white/50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Regarding:</p>
              <p className="text-sm font-medium text-slate-800 truncate">{property.title}</p>
              <p className="text-xs text-slate-500">📍 {property.location}</p>
              {property.price && (
                <p className="text-xs text-slate-500 font-medium">₦{property.price.toLocaleString()}/year</p>
              )}
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        {showActions && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            {isCurrentUserLandlord && (
              <>
                <Button variant="outline" size="sm" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  View Profile
                </Button>

              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
