"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, MapPin, Bed, Bath, Square, 
  Trash2, Eye, Calendar, MessageSquare,
  ArrowLeft, Search
} from "lucide-react"
import Link from "next/link"
import { favoritesAPI } from "@/lib/api/favorites"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<any[]>([])
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const data = await favoritesAPI.getAll()
      setFavorites(data.favorites)
    } catch (error: any) {
      console.error('Failed to fetch favorites:', error)
      toast.error(error.message || 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (favoriteId: string, propertyTitle: string) => {
    try {
      setRemovingId(favoriteId)
      await favoritesAPI.remove(favoriteId)
      setFavorites(favorites.filter(f => f.id !== favoriteId))
      toast.success(`Removed "${propertyTitle}" from favorites`)
    } catch (error: any) {
      console.error('Failed to remove favorite:', error)
      toast.error(error.message || 'Failed to remove favorite')
    } finally {
      setRemovingId(null)
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
        <Link href="/dashboard/tenant">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Saved Properties
            </h1>
            <p className="text-slate-600">
              {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
            </p>
          </div>
          <Link href="/properties">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Search className="mr-2 h-4 w-4" />
              Browse More
            </Button>
          </Link>
        </div>
      </div>

      {/* Favorites Grid */}
      {favorites.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="py-16">
            <div className="text-center">
              <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No saved properties yet
              </h3>
              <p className="text-slate-600 mb-6">
                Start browsing and save properties you're interested in
              </p>
              <Link href="/properties">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {favorites.map((property) => {
            if (!property) return null

            return (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  {/* Property Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Remove Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemoveFavorite(property.id, property.title)
                      }}
                      disabled={removingId === property.id}
                      className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {removingId === property.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                      )}
                    </button>
                  </div>

                  {/* Property Details */}
                  <div className="p-5">
                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-2xl font-bold text-amber-600">
                        {formatPrice(property.price)}
                        <span className="text-sm font-normal text-slate-500">/mo</span>
                      </p>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {property.title}
                    </h3>

                    {/* Location */}
                    <p className="text-sm text-slate-600 flex items-center mb-4">
                      <MapPin className="h-4 w-4 mr-1.5 text-amber-500 flex-shrink-0" />
                      <span className="line-clamp-1">{property.location}</span>
                    </p>

                    {/* Features */}
                    <div className="flex items-center gap-4 text-sm text-slate-600 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Bed className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{property.beds || property.bedrooms || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{property.baths || property.bathrooms || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Square className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{property.sqft || property.square_feet || 0} sqft</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
