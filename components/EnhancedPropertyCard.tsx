"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Bed, Bath, Square, Star, Calendar, Camera, Zap, Shield, Wifi, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

interface Property {
  id: string
  title: string
  location: string
  price: number
  pricePerMonth: number
  beds: number
  baths: number
  sqft: number
  type: string
  image: string
  featured: boolean
  latitude: number
  longitude: number
  description?: string
  amenities?: string[]
  availableFrom?: string
  views?: number
  rating?: number
}

interface EnhancedPropertyCardProps {
  property: Property
  onSelect?: (property: Property) => void
  onFavorite?: (propertyId: string) => void
  isFavorite?: boolean
  showMapButton?: boolean
  compact?: boolean
}

export default function EnhancedPropertyCard({
  property,
  onSelect,
  onFavorite,
  isFavorite = false,
  showMapButton = true,
  compact = false
}: EnhancedPropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(isFavorite)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Format price with Nigerian Naira
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  // Format compact price for cards
  const formatPriceCompact = (price: number) => {
    if (price >= 1000000) {
      return `₦${(price / 1000000).toFixed(1)}M`
    } else if (price >= 1000) {
      return `₦${(price / 1000).toFixed(0)}K`
    }
    return `₦${price.toLocaleString()}`
  }

  // Get property type color
  const getPropertyTypeColor = (type: string) => {
    const colors = {
      apartment: 'bg-blue-100 text-blue-800 border-blue-200',
      house: 'bg-green-100 text-green-800 border-green-200',
      duplex: 'bg-purple-100 text-purple-800 border-purple-200',
      bungalow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      flat: 'bg-pink-100 text-pink-800 border-pink-200',
      penthouse: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      studio: 'bg-orange-100 text-orange-800 border-orange-200',
      townhouse: 'bg-teal-100 text-teal-800 border-teal-200',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Get amenity icons
  const getAmenityIcon = (amenity: string): React.ReactNode => {
    const icons: { [key: string]: React.ReactNode } = {
      wifi: <Wifi className="w-4 h-4" />,
      parking: <Car className="w-4 h-4" />,
      security: <Shield className="w-4 h-4" />,
      power: <Zap className="w-4 h-4" />,
    }
    return icons[amenity.toLowerCase()] || <Star className="w-4 h-4" />
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsFavorited(!isFavorited)
    onFavorite?.(property.id)
    
    toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites', {
      position: 'bottom-center',
      duration: 2000
    })
  }

  const handleCardClick = () => {
    onSelect?.(property)
  }

  if (compact) {
    return (
      <Card 
        className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md hover:shadow-xl hover:-translate-y-1"
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {/* Compact Image */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
              {!imageError && property.image ? (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-100 ${imageLoaded ? 'hidden' : 'block'}`} />
                  <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    sizes="96px"
                  />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-orange-400" />
                </div>
              )}
              
              {property.featured && (
                <div className="absolute top-1 left-1">
                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-1.5 py-0.5">
                    Featured
                  </Badge>
                </div>
              )}
            </div>

            {/* Compact Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                  {property.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-orange-50"
                  onClick={handleFavorite}
                >
                  <Heart className={`w-3 h-3 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </Button>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{property.location}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    {property.beds}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-3 h-3" />
                    {property.baths}
                  </span>
                  <span className="flex items-center gap-1">
                    <Square className="w-3 h-3" />
                    {property.sqft.toLocaleString()}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-sm text-orange-600">
                    {formatPriceCompact(property.price)}
                  </div>
                  <Badge className={`text-xs ${getPropertyTypeColor(property.type)}`}>
                    {property.type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative h-56 overflow-hidden">
          {!imageError && property.image ? (
            <>
              <div className={`absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 ${imageLoaded ? 'hidden' : 'block'} animate-pulse`} />
              <Image
                src={property.image}
                alt={property.title}
                fill
                className={`object-cover transition-all duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 flex items-center justify-center">
              <Camera className="w-12 h-12 text-orange-300" />
            </div>
          )}

          {/* Image Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {property.featured && (
              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            <Badge className={`backdrop-blur-sm ${getPropertyTypeColor(property.type)}`}>
              {property.type}
            </Badge>
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full"
            onClick={handleFavorite}
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}`} />
          </Button>

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-3">
              {property.views && (
                <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  {property.views}
                </div>
              )}
              {property.rating && (
                <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {property.rating.toFixed(1)}
                </div>
              )}
            </div>
            {showMapButton && (
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 h-7 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://maps.google.com/?q=${property.latitude},${property.longitude}`, '_blank')
                }}
              >
                <MapPin className="w-3 h-3 mr-1" />
                View Map
              </Button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">
                {property.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="line-clamp-1">{property.location}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-xl text-orange-600 mb-1">
                {formatPrice(property.price)}
              </div>
              {property.pricePerMonth && (
                <div className="text-xs text-gray-500">
                  {formatPrice(property.pricePerMonth)}/month
                </div>
              )}
            </div>
          </div>

          {/* Property Features */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-700">
              <Bed className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{property.beds}</span>
              <span className="text-gray-500">beds</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700">
              <Bath className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{property.baths}</span>
              <span className="text-gray-500">baths</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700">
              <Square className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{property.sqft.toLocaleString()}</span>
              <span className="text-gray-500">sqft</span>
            </div>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {getAmenityIcon(amenity)}
                  <span>{amenity}</span>
                </div>
              ))}
              {property.amenities.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{property.amenities.length - 3} more
                </div>
              )}
            </div>
          )}

          {/* Available Date */}
          {property.availableFrom && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Calendar className="w-3 h-3" />
              <span>Available from {new Date(property.availableFrom).toLocaleDateString()}</span>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {property.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = `/properties/${property.id}`
              }}
            >
              View Details
            </Button>
            
            {showMapButton && (
              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://maps.google.com/?q=${property.latitude},${property.longitude}`, '_blank')
                }}
              >
                <MapPin className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
