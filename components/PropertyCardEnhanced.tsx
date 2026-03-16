"use client"

import { useState, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Heart, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Star, 
  Eye,
  Calendar,
  Home,
  Camera,
  BadgeCheck,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Property {
  id: string
  title: string
  location: string
  city: string
  price: number
  pricePerMonth?:number
  beds: number
  baths: number
  sqft?: number
  property_type: string
  image?: string
  images?: string[]
  latitude: number | null
  longitude: number | null
  featured?: boolean
  rating?: number
  reviews_count?: number
  listed_date?: string
  landlord_id?: string
  landlord_name?: string
  landlord_avatar?: string
  verified?: boolean
  view_count?: number
  description?: string
  amenities?: string[]
}

interface PropertyCardProps {
  property: Property
  isFavorited?: boolean
  onFavoriteToggle?: () => void
  onSelect?: () => void
  isSelected?: boolean
  formatPrice?: (price: number) => string
  className?: string
  showLandlord?: boolean
  compact?: boolean
}

// ✅ OPTIMIZED: Memoized property card with better UX
const PropertyCardEnhanced = memo(({
  property,
  isFavorited = false,
  onFavoriteToggle,
  onSelect,
  isSelected = false,
  formatPrice = (price: number) => `₦${price.toLocaleString()}`,
  className,
  showLandlord = true,
  compact = false
}: PropertyCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Get display image
  const displayImage = property.image || property.images?.[0] || ''
  
  // Calculate price per month if applicable
  const pricePerMonth = property.pricePerMonth || property.price
  
  // Format rating
  const formattedRating = property.rating ? property.rating.toFixed(1) : null
  
  // Format date
  const listedDate = property.listed_date 
    ? new Date(property.listed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  
  // Handle favorite toggle
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavoriteToggle?.()
  }
  
  // Handle card click
  const handleCardClick = () => {
    onSelect?.()
  }
  
  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] relative overflow-hidden",
        isSelected && "ring-2 ring-orange-500 ring-offset-2",
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Featured Badge */}
      {property.featured && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <Zap className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}
      
      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "absolute top-3 right-3 z-10 h-8 w-8 p-0 bg-white/90 hover:bg-white transition-all duration-200",
          isFavorited && "text-red-500 hover:text-red-600"
        )}
        onClick={handleFavoriteToggle}
      >
        <Heart 
          className={cn(
            "h-4 w-4 transition-all duration-200",
            isFavorited ? "fill-current" : ""
          )} 
        />
      </Button>
      
      {/* Image Section */}
      <div className="relative overflow-hidden">
        <div className={cn(
          "relative bg-gray-100",
          compact ? "h-48" : "h-56"
        )}>
          {!imageError && displayImage ? (
            <>
              <Image
                src={displayImage}
                alt={property.title}
                fill
                className={cn(
                  "object-cover transition-all duration-500",
                  imageLoaded ? "opacity-100" : "opacity-0",
                  isHovered && "scale-110"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Home className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Image Count */}
          {property.images && property.images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {property.images.length}
            </div>
          )}
          
          {/* Verified Badge */}
          {property.verified && (
            <div className="absolute bottom-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <CardContent className={cn(
        "p-4 space-y-3",
        compact && "p-3 space-y-2"
      )}>
        {/* Title & Location */}
        <div className="space-y-1">
          <h3 className={cn(
            "font-semibold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors",
            compact ? "text-sm" : "text-base"
          )}>
            {property.title}
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{property.location}, {property.city}</span>
          </div>
        </div>
        
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "font-bold text-orange-600",
            compact ? "text-lg" : "text-xl"
          )}>
            {formatPrice(pricePerMonth)}
          </span>
          <span className="text-sm text-gray-500">/month</span>
        </div>
        
        {/* Property Specs */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>{property.beds}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{property.baths}</span>
          </div>
          {property.sqft && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{property.sqft.toLocaleString()} sqft</span>
            </div>
          )}
        </div>
        
        {/* Rating & Reviews */}
        {formattedRating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium ml-1">{formattedRating}</span>
            </div>
            {property.reviews_count && (
              <span className="text-sm text-gray-500">
                ({property.reviews_count} reviews)
              </span>
            )}
          </div>
        )}
        
        {/* Property Type */}
        <Badge variant="secondary" className="w-fit">
          {property.property_type}
        </Badge>
        
        {/* Landlord Info */}
        {showLandlord && property.landlord_name && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <Avatar className="h-6 w-6">
              <AvatarImage src={property.landlord_avatar} alt={property.landlord_name} />
              <AvatarFallback className="text-xs">
                {property.landlord_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">{property.landlord_name}</span>
          </div>
        )}
        
        {/* Stats Bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {property.view_count && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{property.view_count}</span>
              </div>
            )}
            {listedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{listedDate}</span>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/properties/${property.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
      
      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      )}
    </Card>
  )
})

PropertyCardEnhanced.displayName = 'PropertyCardEnhanced'

export default PropertyCardEnhanced
