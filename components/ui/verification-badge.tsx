"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, AlertTriangle, Shield, Star, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

// interface VerificationBadgeProps {
//   status: 'pending' | 'approved' | 'rejected' | 'verified' | 'not_verified'
//   type?: 'tenant' | 'landlord' | 'property'
//   size?: 'sm' | 'md' | 'lg'
//   showIcon?: boolean
//   className?: string
// }


interface VerificationBadgeProps {
  /** Real verification status from API/DB. Note: 'deleted' is NOT included here
   *  because it's not a stored value — it's a derived lifecycle state. */
  status: 'pending' | 'approved' | 'rejected' | 'verified' | 'not_verified'
  /** Whether the resource has been soft-deleted. When true, the badge
   *  renders as "Deleted" with highest priority, regardless of status. */
  isDeleted?: boolean
  /** Optional timestamp of deletion — when provided AND isDeleted is true,
   *  displays a tooltip with the deletion date. */
  deletedAt?: string | null
  type?: 'tenant' | 'landlord' | 'property'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}



export function VerificationBadge({
  status,
  isDeleted = false,
  deletedAt,
  type = 'tenant',
  size = 'md',
  showIcon = true,
  className
}: VerificationBadgeProps) {
  const getBadgeConfig = () => {
    const configs = {
      pending: {
        variant: "secondary" as const,
        icon: Clock,
        text: "Pending Review",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200"
      },
      approved: {
        variant: "default" as const,
        icon: CheckCircle,
        text: "Approved",
        className: "bg-green-100 text-green-800 border-green-200"
      },
      rejected: {
        variant: "destructive" as const,
        icon: XCircle,
        text: "Rejected",
        className: "bg-red-100 text-red-800 border-red-200"
      },
      deleted: {
        variant: "secondary" as const,
        icon: Trash2,  // need to import this from lucide-react
        text: "Deleted",
        className: "bg-slate-200 text-slate-700 border-slate-300"
      },
      verified: {
        variant: "default" as const,
        icon: Shield,
        text: "Verified",
        className: "bg-green-100 text-green-800 border-green-200"
      },
      not_verified: {
        variant: "outline" as const,
        icon: AlertTriangle,
        text: "Not Verified",
        className: "bg-gray-100 text-gray-800 border-gray-200"
      }
    }

    return configs[status]
  }

  const getSizeClasses = () => {
    const sizes = {
      sm: "text-xs px-2 py-0.5",
      md: "text-sm px-2.5 py-1",
      lg: "text-base px-3 py-1.5"
    }
    return sizes[size]
  }

  const getIconSize = () => {
    const sizes = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5"
    }
    return sizes[size]
  }

  const config = getBadgeConfig()
  const Icon = config.icon



  // Priority 1: Deleted state takes precedence over all other statuses.
  // This is the lifecycle overlay — when a resource is soft-deleted, we
  // always show "Deleted" regardless of its underlying verification status.
  if (isDeleted) {
    const Trash = Trash2  // from lucide-react (added to imports)
    const tooltip = deletedAt
      ? `Deleted on ${new Date(deletedAt).toLocaleDateString()}`
      : undefined
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-slate-200 text-slate-700 border-slate-300 flex items-center gap-1",
          getSizeClasses(),
          className
        )}
        title={tooltip}
      >
        {showIcon && <Trash className={getIconSize()} />}
        <span className="font-medium">🗑️ Deleted</span>
      </Badge>
    )
  }










  // Special handling for verified status with star
  if (status === 'verified' && type === 'tenant') {
    return (
      <Badge 
        variant={config.variant}
        className={cn(
          "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 flex items-center gap-1",
          getSizeClasses(),
          className
        )}
      >
        {showIcon && <Star className={cn("fill-green-600", getIconSize())} />}
        <Shield className={getIconSize()} />
        <span className="font-medium">✓ Verified Tenant</span>
      </Badge>
    )
  }

  if (status === 'verified' && type === 'landlord') {
    return (
      <Badge 
        variant={config.variant}
        className={cn(
          "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 flex items-center gap-1",
          getSizeClasses(),
          className
        )}
      >
        {showIcon && <Star className={cn("fill-blue-600", getIconSize())} />}
        <Shield className={getIconSize()} />
        <span className="font-medium">✓ Verified Landlord</span>
      </Badge>
    )
  }

  if (status === 'verified' && type === 'property') {
    return (
      <Badge 
        variant={config.variant}
        className={cn(
          "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 flex items-center gap-1",
          getSizeClasses(),
          className
        )}
      >
        {showIcon && <Star className={cn("fill-purple-600", getIconSize())} />}
        <Shield className={getIconSize()} />
        <span className="font-medium">✓ Verified Property</span>
      </Badge>
    )
  }

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        config.className,
        getSizeClasses(),
        "flex items-center gap-1",
        className
      )}
    >
      {showIcon && <Icon className={getIconSize()} />}
      <span className="font-medium">{config.text}</span>
    </Badge>
  )
}

// Preset configurations for common use cases
export const TenantVerificationBadge = (props: Omit<VerificationBadgeProps, 'type'>) => (
  <VerificationBadge {...props} type="tenant" />
)

export const LandlordVerificationBadge = (props: Omit<VerificationBadgeProps, 'type'>) => (
  <VerificationBadge {...props} type="landlord" />
)

export const PropertyVerificationBadge = (props: Omit<VerificationBadgeProps, 'type'>) => (
  <VerificationBadge {...props} type="property" />
)

// Compact version for cards and lists
export const CompactVerificationBadge = ({ 
  status, 
  type = 'tenant',
  className 
}: Pick<VerificationBadgeProps, 'status' | 'type' | 'className'>) => (
  <VerificationBadge 
    status={status} 
    type={type} 
    size="sm" 
    showIcon={true}
    className={cn("font-semibold", className)}
  />
)

// Large version for headers and hero sections
export const HeroVerificationBadge = ({ 
  status, 
  type = 'tenant',
  className 
}: Pick<VerificationBadgeProps, 'status' | 'type' | 'className'>) => (
  <VerificationBadge 
    status={status} 
    type={type} 
    size="lg" 
    showIcon={true}
    className={cn("shadow-lg", className)}
  />
)



/**
 * PropertyLifecycleBadge — use this for property cards/listings.
 * Renders "Deleted" with highest priority when isDeleted=true, otherwise
 * falls through to the standard verification badge.
 *
 * @example
 *   <PropertyLifecycleBadge
 *     status={property.verification_status}
 *     isDeleted={!!property.deleted_at}
 *     deletedAt={property.deleted_at}
 *   />
 */
export const PropertyLifecycleBadge = ({
  status,
  isDeleted,
  deletedAt,
  className,
}: Pick<VerificationBadgeProps, 'status' | 'isDeleted' | 'deletedAt' | 'className'>) => (
  <VerificationBadge
    status={status}
    isDeleted={isDeleted}
    deletedAt={deletedAt}
    type="property"
    size="sm"
    showIcon={true}
    className={className}
  />
)