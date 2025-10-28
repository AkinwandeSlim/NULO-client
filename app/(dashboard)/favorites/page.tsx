"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Bed, Bath, Square, Heart, Search, Eye, Filter } from "lucide-react"
import Link from "next/link"
import { favoritesAPI } from "@/lib/api/favorites"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function FavoritesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<any[]>([])
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')

  useEffect(() => {
    fetchFavorites()
  }, [user])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const data = await favoritesAPI.getAll()
      setFavorites(data.favorites)
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
      toast.error('Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      await favoritesAPI.remove(propertyId)
      setFavorites(prev => prev.filter(fav => fav.property.id !== propertyId))
      toast.success('❤️ Removed from favorites')
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      toast.error('Failed to remove from favorites')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const filteredFavorites = favorites.filter(fav => {
    if (filterType === 'all') return true
    return fav.property?.property_type?.toLowerCase() === filterType.toLowerCase()
  })

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    if (sortBy === 'price-low') return a.property.price - b.property.price
    if (sortBy === 'price-high') return b.property.price - a.property.price
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Saved Properties ❤️
        </h1>
        <p className="text-slate-600">
          {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No saved properties yet</h3>
            <p className="text-slate-600 mb-6">
              Start browsing and save properties you're interested in
            </p>
            <Link href="/properties">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Search className="mr-2 h-4 w-4" />
                Browse Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters and Sort */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                All
              </Button>
              <Button
                variant={filterType === 'apartment' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('apartment')}
                className={filterType === 'apartment' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                Apartments
              </Button>
              <Button
                variant={filterType === 'house' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('house')}
                className={filterType === 'house' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                Houses
              </Button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="recent">Recently Added</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Properties Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedFavorites.map((favorite) => {
              const property = favorite.property
              if (!property) return null

              return (
                <Card key={favorite.id} className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                  <div className="relative">
                    <img
                      src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                      alt={property.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white shadow-lg"
                        onClick={(e) => {
                          e.preventDefault()
                          handleRemoveFavorite(property.id)
                        }}
                      >
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <div className="mb-3">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {property.property_type || 'Property'}
                      </Badge>
                      <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1">
                        {property.title}
                      </h3>
                      <p className="text-sm text-slate-600 flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-orange-500" />
                        {property.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Bed className="h-4 w-4 text-orange-500" />
                        {property.beds}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4 text-orange-500" />
                        {property.baths}
                      </span>
                      <span className="flex items-center gap-1">
                        <Square className="h-4 w-4 text-orange-500" />
                        {property.sqft} sqft
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatPrice(property.price)}
                        </p>
                        <p className="text-xs text-slate-500">per month</p>
                      </div>
                      <Link href={`/properties/${property.id}`}>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {sortedFavorites.length === 0 && (
            <Card className="bg-white/90 backdrop-blur-sm border-white/50">
              <CardContent className="p-12 text-center">
                <Filter className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties match your filter</h3>
                <p className="text-slate-600 mb-6">
                  Try adjusting your filters to see more properties
                </p>
                <Button
                  variant="outline"
                  onClick={() => setFilterType('all')}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
