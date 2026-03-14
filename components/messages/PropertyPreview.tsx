"use client"

import Link from "next/link"
import { MapPin, Home, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConversationProperty } from "@/lib/api/messages"

const DEFAULT_PROPERTY_IMAGE = 
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"

export interface PropertyPreviewProps {
  property: ConversationProperty | null
  variant?: "card" | "strip" | "compact"
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export function PropertyPreview({ 
  property, 
  variant = "card",
  dismissible = false,
  onDismiss,
  className = ""
}: PropertyPreviewProps) {
  if (!property) return null

  const baseClasses = "transition-all duration-200"
  
  // Card variant (full preview, like tenant page)
  if (variant === "card") {
    return (
      <Link href={`/properties/${property.id}`}>
        <div className={`${baseClasses} mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-orange-300 cursor-pointer ${className}`}>
          <div className="flex gap-3">
            <img
              src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
              alt={property.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">
                {property.title}
              </h4>
              <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {property.location || 'Location not specified'}
              </p>
              <p className="text-sm font-bold text-orange-600 mt-1">
                ₦{property.price?.toLocaleString()}/mo
              </p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Strip variant (compact, like landlord page)
  if (variant === "strip") {
    return (
      <div className={`${baseClasses} ${className}`}>
        {dismissible && onDismiss ? (
          <div className="flex-shrink-0 bg-slate-50 border-b border-slate-100">
            <Link href={`/properties/${property.id}`} target="_blank" className="block">
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors group">
                <img
                  src={property.images?.[0] ?? DEFAULT_PROPERTY_IMAGE}
                  alt={property.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {property.title}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {property.location ?? "Location not specified"}
                    <span className="mx-1 text-slate-300">·</span>
                    <span className="font-semibold text-orange-600">
                      ₦{property.price?.toLocaleString()}/mo
                    </span>
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-orange-500 flex-shrink-0 transition-colors" />
              </div>
            </Link>
            <button
              onClick={onDismiss}
              className="w-full text-center text-[10px] text-slate-300 hover:text-slate-500 py-0.5 transition-colors"
            >
              hide
            </button>
          </div>
        ) : (
          <div className="flex-shrink-0 bg-slate-50 border-b border-slate-100">
            <Link href={`/properties/${property.id}`} target="_blank" className="block">
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors group">
                <img
                  src={property.images?.[0] ?? DEFAULT_PROPERTY_IMAGE}
                  alt={property.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {property.title}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {property.location ?? "Location not specified"}
                    <span className="mx-1 text-slate-300">·</span>
                    <span className="font-semibold text-orange-600">
                      ₦{property.price?.toLocaleString()}/mo
                    </span>
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-orange-500 flex-shrink-0 transition-colors" />
              </div>
            </Link>
          </div>
        )}
      </div>
    )
  }

  // Compact variant (minimal, for tight spaces)
  if (variant === "compact") {
    return (
      <Link href={`/properties/${property.id}`} className={`block ${className}`}>
        <div className={`${baseClasses} flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-orange-300`}>
          <img
            src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
            alt={property.title}
            className="w-8 h-8 rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">
              {property.title}
            </p>
            <p className="text-[10px] text-slate-500">
              ₦{property.price?.toLocaleString()}/mo
            </p>
          </div>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </div>
      </Link>
    )
  }

  return null
}
