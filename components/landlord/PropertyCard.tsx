"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Bed, Bath, Square, MapPin, Eye, Heart, Edit, Trash2, Loader2, Home
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PropertyLifecycleBadge } from "@/components/ui/verification-badge"

const DEFAULT_PROPERTY_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export type PropertyCardVariant = 'full' | 'compact'

export interface PropertyCardProps {
  property: any
  /** 'full' = with status badge, Edit/Delete buttons, h-56 image
   *  'compact' = overview-style, h-48 image, whole card is a link */
  variant?: PropertyCardVariant
  onDelete?: (id: string, title: string) => void
  deletingId?: string | null
  formatPrice?: (price: number) => string
}

const defaultFormatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

/**
 * Shared property card used by both /landlord/properties (full)
 * and /landlord/overview (compact). Centralizes:
 *  - Field name fallbacks (rent_amount || price, bedrooms || beds, etc.)
 *  - Location display logic (location || city, state)
 *  - Status badge rendering
 *  - View count positioning (variant-aware)
 *  - Action buttons (full variant only)
 *  - Lazy image loading
 *  - Accessibility (aria-labels on status badge)
 */
export function PropertyCard({
  property,
  variant = 'compact',
  onDelete,
  deletingId,
  formatPrice = defaultFormatPrice,
}: PropertyCardProps) {
  const router = useRouter()
  const isFull = variant === 'full'

  // Centralized field fallbacks (fixes issues #3, #4)
  const price = property.rent_amount || property.price || 0
  const beds = property.bedrooms || property.beds || 0
  const baths = property.bathrooms || property.baths || 0
  const sqft = property.square_feet || property.sqft
  const location = property.location || `${property.city}, ${property.state}`

  const statusLabel = property.status === 'vacant' ? '✅ Available'
    : property.status === 'occupied' ? '🔒 Occupied'
    : property.status === 'maintenance' ? '🔧 Maintenance'
    : '⏳ Pending'

  const statusAria = `Property status: ${property.status || 'pending'}`

  const cardInner = (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 ${
        isFull ? 'flex flex-col' : 'cursor-pointer'
      }`}
    >
      {/* Image */}
      <div
        onClick={isFull ? () => router.push(`/landlord/properties/${property.id}`) : undefined}
        className={`relative overflow-hidden bg-slate-100 ${
          isFull ? 'h-56 cursor-pointer' : 'h-48'
        }`}
      >
        <img
          src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
          alt={property.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Status badge — full variant only (fixes issue #1) */}
        {isFull && (
          <Badge
            aria-label={statusAria}
            className={`absolute top-4 left-4 ${
              property.status === 'vacant' ? 'bg-green-500 text-white'
                : property.status === 'occupied' ? 'bg-red-500 text-white'
                : property.status === 'maintenance' ? 'bg-yellow-500 text-white'
                : 'bg-slate-500 text-white'
            }`}
          >
            {statusLabel}
          </Badge>
        )}

        {/* View count — position varies by variant (fixes issue #2) */}
        {property.view_count > 0 && (
          <div
            className={`absolute ${
              isFull ? 'bottom-3 left-3' : 'top-3 left-3'
            } bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-slate-700 shadow-lg`}
          >
            <Eye className="h-3 w-3" />
            {property.view_count} views
          </div>
        )}

        {/* Lifecycle badge — always top-right (consistent) */}
        <PropertyLifecycleBadge
          status={property.verification_status || 'pending'}
          isDeleted={!!property.deleted_at}
          deletedAt={property.deleted_at}
          className="absolute top-4 right-4"
        />
      </div>

      {/* Card body */}
      <div className={`p-5 ${isFull ? 'flex flex-col flex-grow' : ''}`}>
        {/* Price + secondary info */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-2xl font-bold text-orange-600">
            {formatPrice(price)}
            <span className="text-sm font-normal text-slate-500">/year</span>
          </p>
          {isFull && property.favorites_count > 0 && (
            <Badge className="bg-pink-100 text-pink-800 border-pink-200">
              <Heart className="h-3 w-3 mr-1" />
              {property.favorites_count}
            </Badge>
          )}
          {!isFull && property.application_count > 0 && (
            <Badge className="bg-purple-100 text-purple-800 text-xs">
              {property.application_count} applicant{property.application_count > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
          {property.title}
        </h3>

        {/* Location (fixes location display issue) */}
        <p className="text-sm text-slate-600 flex items-center mb-4">
          <MapPin className="h-4 w-4 mr-1.5 text-orange-500 flex-shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </p>

        {/* Specs */}
        <div
          className={`flex items-center gap-4 text-sm text-slate-600 py-4 border-t border-slate-100 ${
            isFull ? 'border-b mb-4' : ''
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{beds}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{baths}</span>
          </div>
          {sqft && (
            <div className="flex items-center gap-1.5">
              <Square className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{sqft.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        {/* Action buttons — full variant only */}
        {isFull && onDelete && (
          <div className="flex flex-col gap-2 mt-auto">
            {property.status === 'occupied' && (
              <Link href="/landlord/occupied-properties" className="w-full">
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </Link>
            )}
            <div className="flex gap-2 w-full">
              <Link href={`/landlord/properties/${property.id}`} className="flex-1">
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
              <Button
                onClick={() => onDelete(property.id, property.title)}
                disabled={deletingId === property.id}
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                {deletingId === property.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Compact variant: wrap whole card in a Link for navigation
  if (!isFull) {
    return (
      <Link key={property.id} href={`/landlord/properties/${property.id}`}>
        {cardInner}
      </Link>
    )
  }
  return <div key={property.id}>{cardInner}</div>
}

export default PropertyCard