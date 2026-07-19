"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Bed, Bath, Square, Camera, Users, Eye, MapPin, ChevronRight, Home, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { formatPrice, formatLocation } from '@/lib/utils/format'
import { useTheme } from '@/contexts/ThemeContext'

interface PropertyCardProps {
  property: any
  onSelect: (property: any) => void
  onFavorite: (propertyId: string, isFavorite: boolean) => void
  isFavorite: boolean
  compact?: boolean
  isAuthLoading?: boolean
  isPendingFavorite?: boolean
}

export default function PropertyCard({ 
  property, 
  onSelect, 
  onFavorite, 
  isFavorite, 
  compact = false,
  isAuthLoading = false,
  isPendingFavorite = false
}: PropertyCardProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Pass propertyId and current favorite status
    onFavorite(property.id, isFavorite)
  }

  const handleCardClick = () => {
    // Select property for map in split view
    onSelect(property)
  }

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Navigate to property detail page
    router.push(`/properties/${property.id}`)
  }

  const mainImage = property.images?.[0] || property.image || '/images/property-placeholder.jpg'
  const location = formatLocation(property)

  // ── Compact vertical card (used in split view 2-column grid) ──────────────────
  if (compact) {
    return (
      <div
        className={`group flex flex-col rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer ${
          theme === "dark"
            ? "bg-[#0A0A0A] border-white/10 hover:border-orange-400/50 hover:shadow-lg hover:shadow-orange-500/10"
            : "bg-white border-slate-200 hover:border-orange-300 hover:shadow-md"
        }`}
        onClick={handleCardClick}
      >
        {/* Image container */}
        <div className={`relative h-32 overflow-hidden ${theme === "dark" ? "bg-white/5" : "bg-slate-100"}`}>
          {!imageError ? (
            <Image
              src={mainImage}
              alt={property.title}
              fill
              sizes="200px"
              className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className={`h-8 w-8 ${theme === "dark" ? "text-white/20" : "text-slate-300"}`} />
            </div>
          )}
          {!imageLoaded && !imageError && (
            <div className={`absolute inset-0 animate-pulse ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />
          )}
          
          {/* Status badge - Improved visibility */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold shadow-md ${
            property.status === 'vacant' 
              ? 'bg-green-500 text-white' 
              : 'bg-orange-500 text-white'
          }`}>
            {property.status === 'vacant' ? 'Available' : 'Rented'}
          </div>
          
          {/* Price overlay */}
          <div className={`absolute bottom-2 left-2 backdrop-blur-sm px-2 py-1 rounded shadow-md ${
            theme === "dark" ? "bg-black/70" : "bg-white/90"
          }`}>
            <span className="text-xs font-bold text-orange-600">
              {formatPrice(property.price)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Title */}
          <h3 className={`text-sm font-semibold leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors mb-1 ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}>
            {property.title}
          </h3>

          {/* Location */}
          <p className={`text-xs line-clamp-1 mb-2 flex items-center gap-1 ${
            theme === "dark" ? "text-white/60" : "text-slate-500"
          }`}>
            <MapPin className="w-3 h-3 text-orange-500 flex-shrink-0" />
            {location}
          </p>

          {/* Specs - Improved with better icons and tooltips */}
          <div className="flex items-center gap-3 text-xs mb-2">
            {/* Bedrooms */}
            <div 
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors group relative ${
                theme === "dark" 
                  ? "bg-white/5 hover:bg-orange-500/10" 
                  : "bg-slate-50 hover:bg-orange-50"
              }`}
              title={`${property.beds} Bedroom${property.beds !== 1 ? 's' : ''}`}
            >
              <Bed className="w-3.5 h-3.5 text-orange-500" />
              <span className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}>{property.beds}</span>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {property.beds} Bedroom{property.beds !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Bathrooms */}
            <div 
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors group relative ${
                theme === "dark" 
                  ? "bg-white/5 hover:bg-blue-500/10" 
                  : "bg-slate-50 hover:bg-blue-50"
              }`}
              title={`${property.baths} Bathroom${property.baths !== 1 ? 's' : ''}`}
            >
              <Bath className="w-3.5 h-3.5 text-blue-500" />
              <span className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}>{property.baths}</span>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {property.baths} Bathroom{property.baths !== 1 ? 's' : ''}
              </div>
            </div>

            {/* View count - Always show if available */}
          {(property.view_count || 0) >= 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors group relative ${
              theme === "dark" 
                ? "bg-white/5 hover:bg-blue-500/10" 
                : "bg-slate-50 hover:bg-blue-50"
            }`}
                 title={`${property.view_count || 0} view${(property.view_count || 0) !== 1 ? 's' : ''}`}>
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span className={`font-semibold text-xs ${theme === "dark" ? "text-white" : "text-slate-700"}`}>{property.view_count || 0}</span>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {property.view_count || 0} view{(property.view_count || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Size if available */}
          {property.sqft && (
            <div 
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors group relative ${
                theme === "dark" 
                  ? "bg-white/5 hover:bg-purple-500/10" 
                  : "bg-slate-50 hover:bg-purple-50"
              }`}
              title={`${property.sqft} sq ft`}
            >
              <Square className="w-3.5 h-3.5 text-purple-500" />
              <span className={`font-semibold text-[10px] ${theme === "dark" ? "text-white" : "text-slate-700"}`}>{Math.round(property.sqft / 100) * 100}<span className="text-[8px] ml-0.5">sqft</span></span>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {property.sqft.toLocaleString()} sq ft
              </div>
            </div>
          )}
          </div>

          {/* Footer with favorite */}
          <div className="flex items-center justify-between mt-auto">
            {/* Verified badge */}
            {property.landlord?.verified && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                theme === "dark"
                  ? "text-green-400 bg-green-500/10 border border-green-500/20"
                  : "text-green-700 bg-green-50 border border-green-100"
              }`}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="8" height="8"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Verified
              </span>
            )}
            
            {/* Favorite button */}
            <button
              className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                isFavorite ? 'text-red-500' : theme === "dark" ? "text-white/30 hover:text-red-400" : "text-slate-300 hover:text-red-400"
              }`}
              onClick={handleFavorite}
              disabled={isAuthLoading || isPendingFavorite}
            >
              {isPendingFavorite ? (
                <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
              ) : (
                <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-slate-200 rounded-2xl overflow-hidden cursor-pointer"
          onClick={handleCardClick}>
      <div className="relative h-56 w-full overflow-hidden cursor-pointer" onClick={handleCardClick}>
        {!imageError && (
          <Image
            src={mainImage}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover group-hover:scale-110 transition-transform duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        )}
        {imageError && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
            <Home className="h-12 w-12 text-slate-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <Badge 
          className={`absolute top-4 right-4 font-semibold shadow-lg ${
            property.status === 'vacant' 
              ? 'bg-green-500 hover:bg-green-600' 
              : property.status === 'rented'
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-slate-500'
          }`}
        >
          {property.status === 'vacant' ? 'Available' : property.status === 'rented' ? 'Rented' : property.status || 'Available'}
        </Badge>
        
        {/* Application Count - Social Proof */}
        {property.application_count > 0 && (
          <Badge className="absolute top-4 left-4 bg-gradient-to-r from-orange-600 to-orange-500 backdrop-blur-sm text-white font-semibold shadow-lg">
            <Users className="w-3 h-3 mr-1" />
            {property.application_count} {property.application_count === 1 ? 'person' : 'people'} interested
          </Badge>
        )}
        
        {/* Favorite button */}
        <Button
          size="sm"
          variant="ghost"
          className={`absolute top-4 right-16 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 ${
            isFavorite ? 'text-red-500 hover:text-red-600' : 'text-slate-600 hover:text-red-500'
          } ${isAuthLoading || isPendingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleFavorite}
          disabled={isAuthLoading || isPendingFavorite}
          title={isAuthLoading ? 'Verifying your account...' : isPendingFavorite ? 'Updating...' : 'Add to favorites'}
        >
          {isPendingFavorite ? (
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          ) : (
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          )}
        </Button>
        
        {/* Photo count */}
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Camera className="h-3 w-3" />
            {property.images.length}
          </div>
        )}
      </div>
      
      <CardContent className="p-5">
        {/* Verified Landlord Badge */}
        {property.landlord?.verified && (
          <div className="mb-2">
            <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs flex items-center gap-1 w-fit">
              <CheckCircle2 className="w-3 h-3" />
              Verified Landlord
            </Badge>
          </div>
        )}

        
        {/* Clickable Title - Link for easy navigation */}
        <Link href={`/properties/${property.id}`}>
          <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-1 group-hover:text-orange-600 cursor-pointer transition-colors duration-200 hover:underline">
            {property.title}
          </h3>
        </Link>
        
        <div className="flex items-center text-sm text-slate-600 mb-3">
          <Home className="w-4 h-4 mr-1 text-orange-500" />
          <span className="line-clamp-1">{location}</span>
        </div>
        
        <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-2xl font-bold text-orange-600">
              {formatPrice(property.price)}
            </span>
            <span className="text-sm text-slate-500 ml-1">/month</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div 
            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-orange-50 transition-colors group relative"
            title={`${property.beds || 0} Bedroom${property.beds !== 1 ? 's' : ''}`}
          >
            <Bed className="w-4 h-4 text-orange-500" />
            <span className="font-medium text-slate-700">{property.beds || '--'} bed{property.beds !== 1 ? 's' : ''}</span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {property.beds || 0} Bedroom{property.beds !== 1 ? 's' : ''}
            </div>
          </div>
          <div 
            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-blue-50 transition-colors group relative"
            title={`${property.baths || 0} Bathroom${property.baths !== 1 ? 's' : ''}`}
          >
            <Bath className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-slate-700">{property.baths || '--'} bath{property.baths !== 1 ? 's' : ''}</span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {property.baths || 0} Bathroom{property.baths !== 1 ? 's' : ''}
            </div>
          </div>
          <div 
            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-purple-50 transition-colors group relative"
            title={`${property.sqft || 0} sq ft`}
          >
            <Square className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-slate-700">{property.sqft ? `${(property.sqft).toLocaleString()}` : '--'} sqft</span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {property.sqft ? `${property.sqft.toLocaleString()} sq ft` : 'Size not available'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            {/* Only show view count if > 0 */}
            {(property.view_count || 0) > 0 && (
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1 text-slate-400" />
                <span>{property.view_count} views</span>
              </div>
            )}
            
            {/* Show photo count if multiple images */}
            {property.images && property.images.length > 1 && (
              <div className="flex items-center">
                <Camera className="w-4 h-4 mr-1 text-orange-500" />
                <span className="font-medium text-slate-900">{property.images.length}</span>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-600 font-semibold transition-all duration-300 rounded-lg"
            onClick={handleViewDetails}
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
