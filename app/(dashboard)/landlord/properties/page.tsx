"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, Plus, Edit, Trash2, Eye,
  MapPin, Bed, Bath, Square, ArrowLeft,
  MoreVertical, TrendingUp, Heart, Calendar
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function PropertiesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const data = await propertiesAPI.getMyProperties()
      setProperties(data.properties)
    } catch (error: any) {
      console.error('Failed to fetch properties:', error)
      toast.error(error.message || 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProperty = async (propertyId: string, propertyTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(propertyId)
      // TODO: Create delete property API endpoint
      // await propertiesAPI.delete(propertyId)
      setProperties(properties.filter(p => p.id !== propertyId))
      toast.success(`"${propertyTitle}" deleted successfully`)
    } catch (error: any) {
      console.error('Failed to delete property:', error)
      toast.error(error.message || 'Failed to delete property')
    } finally {
      setDeletingId(null)
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
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} listed
            </p>
          </div>
          <Link href="/landlord/properties/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </Link>
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
              <p className="text-slate-600 mb-6">
                Start earning by listing your first property
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
                <Link href={`/properties/${property.id}`}>
                  <img
                    src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                    alt={property.title}
                    className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <Badge 
                  className={`absolute top-3 left-3 ${
                    property.status === 'available' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-slate-500 text-white'
                  }`}
                >
                  {property.status}
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
                <Link href={`/properties/${property.id}`}>
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
                    {property.beds}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-orange-500" />
                    {property.baths}
                  </span>
                  <span className="flex items-center gap-1">
                    <Square className="h-4 w-4 text-orange-500" />
                    {property.sqft}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPrice(property.price)}
                    <span className="text-sm font-normal text-slate-600">/mo</span>
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-200">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-slate-400" />
                    {property.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-slate-400" />
                    {property.favorites || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {property.viewings || 0}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Link href={`/properties/${property.id}`}>
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
