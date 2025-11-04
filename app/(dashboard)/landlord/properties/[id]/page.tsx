"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MapPin, Bed, Bath, Square, Eye, Heart, Calendar, 
  Edit, Trash2, ArrowLeft, MessageSquare,
  Home, Wifi, Car, Dumbbell, Shield, Wind, CheckCircle2,
  ChevronRight, TrendingUp, Users, Clock
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function LandlordPropertyViewPage() {
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const propertyId = params.id as string

  useEffect(() => {
    fetchProperty()
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const data = await propertiesAPI.getById(propertyId)
      setProperty(data)
    } catch (error: any) {
      console.error('Failed to fetch property:', error)
      toast.error(error.message || 'Failed to load property')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${property?.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(true)
      await propertiesAPI.delete(propertyId)
      toast.success('Property deleted successfully')
      router.push('/landlord/properties')
    } catch (error: any) {
      console.error('Failed to delete property:', error)
      toast.error(error.message || 'Failed to delete property')
    } finally {
      setDeleting(false)
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

  const getAmenityIcon = (amenity: string) => {
    const key = amenity.toLowerCase()
    if (key.includes('wifi')) return Wifi
    if (key.includes('park')) return Car
    if (key.includes('gym')) return Dumbbell
    if (key.includes('security')) return Shield
    if (key.includes('air') || key.includes('ac')) return Wind
    return Home
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading property...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Property not found</p>
          <Link href="/landlord/properties">
            <Button>Back to Properties</Button>
          </Link>
        </div>
      </div>
    )
  }

  const images = property.photos || property.images || [DEFAULT_PROPERTY_IMAGE]
  const displayImages = images.length >= 4 ? images.slice(0, 4) : [...images, ...Array(4 - images.length).fill(DEFAULT_PROPERTY_IMAGE)]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/landlord/overview" className="text-slate-600 hover:text-orange-600 transition-colors font-medium">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link href="/landlord/properties" className="text-slate-600 hover:text-orange-600 transition-colors font-medium">
              My Properties
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-semibold truncate max-w-[300px]">
              {property.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Modern Image Gallery */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-4 gap-2 h-[500px] rounded-2xl overflow-hidden">
          {/* Main Large Image */}
          <div 
            className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-slate-100"
            onClick={() => setSelectedImage(0)}
          >
            <img
              src={displayImages[0]}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <Badge className="absolute top-4 left-4 bg-green-500 text-white">
              {property.status || 'vacant'}
            </Badge>
          </div>

          {/* Three Smaller Images */}
          {displayImages.slice(1, 4).map((img: string, idx: number) => (
            <div
              key={idx}
              className="relative group cursor-pointer overflow-hidden bg-slate-100"
              onClick={() => setSelectedImage(idx + 1)}
            >
              <img
                src={img}
                alt={`View ${idx + 2}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {idx === 2 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons Overlay */}
        <div className="flex items-center justify-end gap-2 -mt-16 relative z-10 px-4">
          <Link href={`/landlord/properties/${propertyId}/edit`}>
            <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg">
              <Edit className="h-4 w-4 mr-2" />
              Edit Property
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="shadow-lg"
          >
            {deleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Property Details */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Price */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      {property.title}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{property.location}</span>
                    </div>
                    {/* Performance Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{property.view_count || 0} views</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        <Heart className="h-3.5 w-3.5" />
                        <span>{property.favorites_count || 0} favorites</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{property.status || 'vacant'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-orange-600">
                      {formatPrice(property.rent_amount || property.price || 0)}
                    </div>
                    <div className="text-sm text-slate-600">/month</div>
                  </div>
                </div>

                {/* Key Features */}
                <div className="flex items-center gap-6 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{property.bedrooms || property.beds || 0}</span>
                    <span className="text-slate-600 text-sm">Beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{property.bathrooms || property.baths || 0}</span>
                    <span className="text-slate-600 text-sm">Baths</span>
                  </div>
                  {(property.square_feet || property.sqft) && (
                    <div className="flex items-center gap-2">
                      <Square className="h-5 w-5 text-slate-400" />
                      <span className="font-semibold text-slate-900">{property.square_feet || property.sqft}</span>
                      <span className="text-slate-600 text-sm">sqft</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-slate-900 capitalize">{property.property_type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-3">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {property.description || 'No description provided.'}
                      </p>
                    </div>
                    {property.address && (
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Address</h3>
                        <p className="text-slate-700">{property.address}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="amenities">
                    {property.amenities && property.amenities.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {property.amenities.map((amenity: string, idx: number) => {
                          const Icon = getAmenityIcon(amenity)
                          return (
                            <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                              <Icon className="h-5 w-5 text-orange-500" />
                              <span className="text-slate-700">{amenity}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-600">No amenities listed</p>
                    )}
                  </TabsContent>

                  <TabsContent value="performance">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{property.view_count || 0}</p>
                        <p className="text-sm text-slate-600">Total Views</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{property.favorites_count || 0}</p>
                        <p className="text-sm text-slate-600">Favorites</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Calendar className="h-6 w-6 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{property.viewings_count || 0}</p>
                        <p className="text-sm text-slate-600">Viewing Requests</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{property.messages_count || 0}</p>
                        <p className="text-sm text-slate-600">Messages</p>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/landlord/viewings?property=${propertyId}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Viewing Requests ({property.viewings_count || 0})
                  </Button>
                </Link>
                <Link href={`/landlord/messages?property=${propertyId}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Messages ({property.messages_count || 0})
                  </Button>
                </Link>
                <Link href={`/landlord/properties/${propertyId}/edit`}>
                  <Button variant="outline" className="w-full justify-start border-orange-500 text-orange-600 hover:bg-orange-50">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Property
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Property Type</span>
                  <span className="font-medium capitalize">{property.property_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status</span>
                  <Badge className={property.status === 'vacant' ? 'bg-green-500' : 'bg-slate-500'}>
                    {property.status}
                  </Badge>
                </div>
                {property.availability_start && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Available From</span>
                    <span className="font-medium">
                      {new Date(property.availability_start).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Listed On</span>
                  <span className="font-medium">
                    {new Date(property.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
