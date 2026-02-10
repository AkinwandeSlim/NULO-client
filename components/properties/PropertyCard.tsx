"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Bed, Bath, Square, Camera, Users, Eye, ChevronRight, Home, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { formatPrice, formatLocation } from '@/lib/utils/format'

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
          <div className="flex items-center gap-1 text-sm text-slate-700">
            <Bed className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{property.beds || '--'} beds</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-700">
            <Bath className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{property.baths || '--'} baths</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-700">
            <Square className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{property.sqft || '--'} sqft</span>
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
