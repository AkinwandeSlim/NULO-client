"use client"

import { useState } from 'react'
import { Heart, Bed, Bath, Square, Camera, MapPin, Star, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/format'

interface PropertyHoverCardProps {
  property: any
  onSelect: (property: any) => void
  onFavorite: (propertyId: string) => void
  isFavorite: boolean
  children: React.ReactNode
}

export default function PropertyHoverCard({ 
  property, 
  onSelect, 
  onFavorite, 
  isFavorite,
  children 
}: PropertyHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavorite(property.id)
  }

  const handleSelect = () => {
    onSelect(property)
  }

  const mainImage = property.images?.[0] || property.image || '/images/property-placeholder.svg'

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Trigger Element */}
      <div onClick={handleSelect} className="cursor-pointer">
        {children}
      </div>

      {/* Hover Card - Flyover Animation */}
      {isHovered && (
        <div className="absolute z-50 left-0 top-full mt-2 w-80 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="border-2 border-orange-200 shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
            {/* Property Image */}
            <div className="relative h-48 w-full overflow-hidden">
              {!imageError ? (
                <Image
                  src={mainImage}
                  alt={property.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <Home className="w-12 h-12 text-orange-500" />
                </div>
              )}
              
              {/* Favorite Button */}
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 hover:text-red-500 rounded-full p-2 h-8 w-8"
                onClick={handleFavorite}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>

              {/* Featured Badge */}
              {property.featured && (
                <Badge className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 text-xs font-bold">
                  Featured
                </Badge>
              )}

              {/* Image Count */}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {property.images?.length || 1}
              </div>
            </div>

            {/* Property Details */}
            <CardContent className="p-4 space-y-3">
              {/* Title and Enhanced Location */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-2">
                  {property.title}
                </h3>
                
                {/* Enhanced Location Display */}
                <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span className="line-clamp-1">{property.location}</span>
                </div>
                
                {/* City and State */}
                {(property.city || property.state) && (
                  <div className="text-xs text-slate-600 mt-1 ml-6">
                    {property.city && property.state 
                      ? `${property.city}, ${property.state}`
                      : property.city || property.state
                    }
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-orange-600">
                  {formatPrice(property.price)}
                </span>
                <span className="text-xs text-slate-500">/month</span>
              </div>

              {/* Property Specs */}
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Bed className="w-3 h-3" />
                  <span>{property.beds || 0} bed</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="w-3 h-3" />
                  <span>{property.baths || 0} bath</span>
                </div>
                <div className="flex items-center gap-1">
                  <Square className="w-3 h-3" />
                  <span>{property.sqft || 0} sqft</span>
                </div>
              </div>

              {/* Landlord Info */}
              {property.landlord && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-600">
                      {(property.landlord.name || 'Unknown').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">
                      {property.landlord.name || 'Unknown Landlord'}
                    </p>
                    <div className="flex items-center gap-1">
                      {property.landlord.verified && (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs px-1 py-0">
                          Verified
                        </Badge>
                      )}
                      {property.landlord.trust_score && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-slate-600">
                            {property.landlord.trust_score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={handleSelect}
                >
                  View Details
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl transition-all duration-300"
                  onClick={handleFavorite}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
