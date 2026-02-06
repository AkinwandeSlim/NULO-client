"use client"

import { useState } from 'react'
import { Search, Grid, List, Bed, Bath, Square, Heart, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import PropertyHoverCard from './PropertyHoverCard'
import { formatPrice } from '@/lib/utils/format'

interface PropertyGridProps {
  properties: any[]
  loading?: boolean
  onPropertySelect: (property: any) => void
  onPropertyFavorite: (propertyId: string) => void
  favorites?: string[]
}

export default function PropertyGrid({ 
  properties, 
  loading = false, 
  onPropertySelect, 
  onPropertyFavorite,
  favorites = []
}: PropertyGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredProperties = properties.filter(property => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return property.title.toLowerCase().includes(query) ||
             property.location.toLowerCase().includes(query)
    }
    return true
  })

  const isFavorite = (propertyId: string) => favorites.includes(propertyId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Discover Your Perfect Home
        </h1>
        <p className="text-slate-600">
          {properties.length} amazing properties waiting for you
        </p>
      </div>

      {/* Search Bar */}
      <Card className="border-2 border-orange-200 rounded-2xl shadow-lg p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by location, property type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-300 focus:border-orange-500 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-orange-500 hover:bg-orange-600' : 'border-slate-300'}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-orange-500 hover:bg-orange-600' : 'border-slate-300'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-600">
          Showing <span className="font-semibold text-orange-600">{filteredProperties.length}</span> properties
        </p>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="border-2 border-orange-200 rounded-2xl p-12 text-center">
          <p className="text-slate-600">No properties found</p>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "space-y-4"
        }>
          {filteredProperties.map((property) => (
            <PropertyHoverCard
              key={property.id}
              property={property}
              onSelect={onPropertySelect}
              onFavorite={onPropertyFavorite}
              isFavorite={isFavorite(property.id)}
            >
              <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-slate-200 rounded-2xl overflow-hidden cursor-pointer">
                {/* Property Image */}
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200">
                  <img
                    src={property.images?.[0] || '/images/property-placeholder.svg'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/property-placeholder.svg'
                    }}
                  />
                  
                  {property.featured && (
                    <Badge className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 text-xs font-bold">
                      Featured
                    </Badge>
                  )}

                  {isFavorite(property.id) && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5">
                      <Heart className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </div>

                {/* Property Info */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 line-clamp-1 mb-1">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{property.location}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-orange-600">
                      {formatPrice(property.price)}
                    </span>
                    <span className="text-xs text-slate-500">/month</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Bed className="w-3 h-3" />
                      <span>{property.beds}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-3 h-3" />
                      <span>{property.baths}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="w-3 h-3" />
                      <span>{property.sqft}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PropertyHoverCard>
          ))}
        </div>
      )}
    </div>
  )
}
