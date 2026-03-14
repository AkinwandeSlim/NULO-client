"use client"

import { 
  useState, 
  useEffect, 
  useCallback, 
  useRef 
} from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, Plus, Edit, Trash2, Eye,
  MapPin, Bed, Bath, Square, ArrowLeft,
  MoreVertical, TrendingUp, Heart, Calendar, RefreshCw,
  Home, ArrowRight, AlertCircle, DollarSign
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function PropertiesPage() {
  const { user, userProfile } = useAuth()
  const pathname = usePathname()
  const [properties, setProperties] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const isMounted = useRef(false)

  const fetchProperties = useCallback(async (filter: string) => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 [PROPERTIES PAGE] Fetching properties...')
      
      // skipCache: true on every call — the properties page always needs fresh data.
      // The 5-minute TTL was causing stale empty results to be served after the
      // status_filter=all bug was previously triggered.
      const data = await propertiesAPI.getMyProperties(1, 20, filter, { skipCache: true })
      console.log('📦 [PROPERTIES PAGE] Properties data received:', data.properties?.length || 0)
      
      setProperties(data.properties || [])
    } catch (error: any) {
      console.error('❌ [PROPERTIES PAGE] Failed to fetch properties:', error)
      setError(error.message || 'Failed to load properties')
      toast.error(error.message || 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, []) // No statusFilter dependency — filter is passed as an argument

  // Single useEffect watching statusFilter — fires once on mount and on every filter change
  useEffect(() => {
    fetchProperties(statusFilter)
  }, [statusFilter, fetchProperties])

  // Filter change now only updates state — the useEffect above handles the fetch
  const handleStatusFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter)
  }

  const handleDeleteProperty = async (propertyId: string, propertyTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(propertyId)
      await propertiesAPI.delete(propertyId)
      setProperties(properties.filter(p => p.id !== propertyId))
      toast.success(`"${propertyTitle}" deleted successfully`)
      fetchProperties(statusFilter)
    } catch (error: any) {
      console.error('Failed to delete property:', error)
      toast.error(error.message || 'Failed to delete property')
    } finally {
      setDeletingId(null)
    }
  }

  // Refresh uses the current filter
  const handleRefresh = () => {
    fetchProperties(statusFilter)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const getUserName = () =>
    userProfile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'there'

  // ─── Error State ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Properties</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <Button onClick={() => fetchProperties(statusFilter)} className="bg-orange-500 hover:bg-orange-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading State ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Your Properties</h3>
              <p className="text-slate-600">Please wait while we fetch your property listings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="container mx-auto px-4 py-8">

        {/* Hero — Same structure as tenant/landlord overview */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                My Properties
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Manage your property listings and track performance
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/landlord/properties/new">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                    <Plus className="mr-2 h-4 w-4" />Add Property
                  </Button>
                </Link>
                <Link href="/landlord/overview">
                  <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                    <ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { value: 'all',         label: 'All Properties' },
                { value: 'vacant',      label: '✅ Available' },
                { value: 'occupied',    label: '🔒 Occupied' },
                { value: 'maintenance', label: '🔧 Maintenance' },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={statusFilter === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange(value)}
                  className={statusFilter === value
                    ? 'bg-orange-500 text-white'
                    : 'border-orange-200 text-orange-700 hover:bg-orange-50'}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="flex items-center gap-4">
              {/* <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
                    <p className="text-xs text-slate-600">Total Properties</p>
                  </div>
                </CardContent>
              </Card> */}
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleRefresh}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Properties Content */}
        {properties.length === 0 ? (
          /* Empty State — Same anatomy as tenant */
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No properties listed yet
                </h3>
                <p className="text-slate-600 mb-2">
                  Start earning by listing your first property
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  All properties require admin verification before appearing in the marketplace
                </p>
                <Link href="/landlord/properties/new">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                    <Plus className="mr-2 h-4 w-4" />List Your First Property
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Properties Grid — Same card anatomy as tenant */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Card key={property.id} className="border-2 border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-[1.02]">
                <div className="relative h-48 overflow-hidden">
                  <Link href={`/landlord/properties/${property.id}`}>
                    <img
                      src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </Link>
                  
                  {/* Rental Status Badge — Top Left */}
                  <Badge 
                    className={`absolute top-3 left-3 ${
                      property.status === 'vacant'
                        ? 'bg-green-500 text-white'
                        : property.status === 'occupied'
                        ? 'bg-red-500 text-white'
                        : property.status === 'maintenance'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {property.status === 'vacant' ? '✅ Available'
                      : property.status === 'occupied' ? '🔒 Occupied'
                      : property.status === 'maintenance' ? '🔧 Maintenance'
                      : '⏳ Pending'}
                  </Badge>
                  
                  {/* Verification Status — Top Right */}
                  <Badge 
                    className={`absolute top-3 right-3 ${
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

                  {/* View Count — Bottom Left */}
                  {property.view_count > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-slate-700 shadow-lg">
                        <Eye className="h-3 w-3" />{property.view_count} views
                      </div>
                    </div>
                  )}

                  {/* Edit Button — Bottom Right */}
                  <div className="absolute bottom-3 right-3">
                    <Link href={`/landlord/properties/${property.id}/edit`}>
                      <Button
                        size="icon"
                        className="bg-white/95 hover:bg-white shadow-lg h-9 w-9"
                      >
                        <Edit className="h-4 w-4 text-slate-600" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <CardContent className="p-5">
                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-2xl font-bold text-orange-600">
                      {formatPrice(property.rent_amount || property.price || 0)}
                      <span className="text-sm font-normal text-slate-500">/year</span>
                    </p>
                    {property.favorites_count > 0 && (
                      <Badge className="bg-pink-100 text-pink-800 border-pink-200">
                        <Heart className="h-3 w-3 mr-1" />{property.favorites_count}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <Link href={`/landlord/properties/${property.id}`}>
                    <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {property.title}
                    </h3>
                  </Link>

                  {/* Location */}
                  <p className="text-sm text-slate-600 flex items-center mb-4">
                    <MapPin className="h-4 w-4 mr-1.5 text-orange-500 flex-shrink-0" />
                    <span className="line-clamp-1">{property.location || `${property.city}, ${property.state}`}</span>
                  </p>

                  {/* Property Specs */}
                  <div className="flex items-center gap-4 text-sm text-slate-600 pt-4 border-t border-slate-100 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Bed className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{property.bedrooms || property.beds || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{property.bathrooms || property.baths || 0}</span>
                    </div>
                    {(property.square_feet || property.sqft) && (
                      <div className="flex items-center gap-1.5">
                        <Square className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{property.square_feet || property.sqft} sqft</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Link href={`/landlord/properties/${property.id}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs border-orange-200 text-orange-700 hover:bg-orange-50">
                        <Eye className="mr-1 h-3 w-3" />View
                      </Button>
                    </Link>
                    <Link href={`/landlord/properties/${property.id}/edit`}>
                      <Button variant="outline" size="sm" className="w-full text-xs border-slate-200 hover:bg-slate-50">
                        <Edit className="mr-1 h-3 w-3" />Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDeleteProperty(property.id, property.title)}
                      disabled={deletingId === property.id}
                    >
                      {deletingId === property.id ? (
                        <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-1 h-3 w-3" />Delete
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
    </div>
  )
}
