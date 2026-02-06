"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, Plus, Edit, Trash2, Eye,
  MapPin, Bed, Bath, Square, ArrowLeft,
  MoreVertical, TrendingUp, Heart, Calendar, RefreshCw
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function PropertiesPage() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [hasInitialLoadRef] = useState({ current: false })

  const fetchProperties = useCallback(async (forceRefresh = false) => {
    try {
      // Get current values directly to avoid dependency issues
      const currentProperties = properties
      const currentTime = lastFetchTime
      const currentInitialLoad = isInitialLoad
      
      const now = Date.now()
      const timeSinceLastFetch = now - currentTime
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache
      
      // Use cached data if available and recent (unless force refresh)
      if (!forceRefresh && !currentInitialLoad && currentProperties.length > 0 && timeSinceLastFetch < CACHE_DURATION) {
        console.log('📦 [PROPERTIES PAGE] Using cached data, age:', Math.round(timeSinceLastFetch / 1000), 'seconds')
        setLoading(false)
        return
      }
      
      console.log('🔄 [PROPERTIES PAGE] Fetching fresh data...', forceRefresh ? '(forced)' : '')
      setLoading(true)
      
      // Skip cache only on force refresh or initial load
      const data = await propertiesAPI.getMyProperties(1, 20, undefined, { 
        skipCache: forceRefresh || currentInitialLoad 
      })
      
      console.log('📦 [PROPERTIES PAGE] Properties data received:', data.properties?.length || 0)
      setProperties(data.properties || [])
      setLastFetchTime(now)
      setIsInitialLoad(false)
      hasInitialLoadRef.current = true
    } catch (error: any) {
      console.error('❌ [PROPERTIES PAGE] Failed to fetch properties:', error)
      // Don't show error toast if we have cached data and this is just a refresh attempt
      if (properties.length === 0) {
        toast.error(error.message || 'Failed to load properties')
      }
    } finally {
      console.log('✅ [PROPERTIES PAGE] Fetch completed, setting loading to false')
      setLoading(false)
    }
  }, []) // Empty dependency array - function never recreates

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchProperties()
    }
  }, [pathname]) // Remove fetchProperties from dependencies

  const handleDeleteProperty = async (propertyId: string, propertyTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(propertyId)
      await propertiesAPI.delete(propertyId)
      setProperties(properties.filter(p => p.id !== propertyId))
      toast.success(`"${propertyTitle}" deleted successfully`)
      // Force refresh after deletion
      fetchProperties(true)
    } catch (error: any) {
      console.error('Failed to delete property:', error)
      toast.error(error.message || 'Failed to delete property')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRefresh = () => {
    fetchProperties(true) // Force refresh
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading && !hasInitialLoadRef.current && !mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/landlord/overview">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              My Properties
            </h1>
            <p className="text-slate-600">
              Manage your property listings and track performance
              {lastFetchTime > 0 && (
                <span className="text-sm text-slate-500 ml-2">
                  (Updated {Math.round((Date.now() - lastFetchTime) / 1000)}s ago)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/landlord/properties/new">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="py-16">
            <div className="text-center">
              <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No properties listed yet
              </h3>
              <p className="text-slate-600 mb-2">
                Start earning by listing your first property
              </p>
              <p className="text-sm text-slate-500 mb-6">
                ⚠️ Note: All properties require admin verification before appearing in the marketplace
              </p>
              <Link href="/landlord/properties/new">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  List Your First Property
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="relative">
                <Link href={`/landlord/properties/${property.id}`}>
                  <img
                    src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                    alt={property.title}
                    className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <Badge 
                  className={`absolute top-3 left-3 ${
                    property.status === 'vacant' 
                      ? 'bg-green-500 text-white' 
                      : property.status === 'rented'
                      ? 'bg-slate-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {property.status}
                </Badge>
                
                {/* Verification Status Badge */}
                <Badge 
                  className={`absolute top-3 left-24 ${
                    property.verification_status === 'approved' 
                      ? 'bg-green-600 text-white' 
                      : property.verification_status === 'rejected'
                      ? 'bg-red-600 text-white'
                      : property.verification_status === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {property.verification_status === 'pending' && '⏳ Pending'}
                  {property.verification_status === 'approved' && '✅ Verified'}
                  {property.verification_status === 'rejected' && '❌ Rejected'}
                  {property.verification_status === 'needs_review' && '📋 Review'}
                </Badge>
                <div className="absolute top-3 right-3 flex gap-2">
                  <Link href={`/landlord/properties/${property.id}/edit`}>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white shadow-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <CardContent className="p-5">
                <Link href={`/landlord/properties/${property.id}`}>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 hover:text-orange-600 transition-colors line-clamp-1">
                    {property.title}
                  </h3>
                </Link>
                
                <p className="text-sm text-slate-600 flex items-center mb-3">
                  <MapPin className="h-4 w-4 mr-1 text-orange-500" />
                  {property.location}
                </p>

                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4 text-orange-500" />
                    {property.bedrooms || property.beds || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-orange-500" />
                    {property.bathrooms || property.baths || 0}
                  </span>
                  {(property.square_feet || property.sqft) && (
                    <span className="flex items-center gap-1">
                      <Square className="h-4 w-4 text-orange-500" />
                      {property.square_feet || property.sqft}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPrice(property.rent_amount || property.price || 0)}
                    <span className="text-sm font-normal text-slate-600">/mo</span>
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-200">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-slate-400" />
                    {property.view_count || property.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-slate-400" />
                    {property.favorites_count || property.favorites || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {property.viewings_count || property.viewings || 0}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Link href={`/landlord/properties/${property.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/landlord/properties/${property.id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full text-xs border-orange-500 text-orange-600 hover:bg-orange-50">
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleDeleteProperty(property.id, property.title)}
                    disabled={deletingId === property.id}
                  >
                    {deletingId === property.id ? (
                      <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
