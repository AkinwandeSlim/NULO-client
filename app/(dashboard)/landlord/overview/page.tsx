"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Home, Building2, Calendar, MessageSquare,
  DollarSign, TrendingUp, Eye, Plus,
  MapPin, Bed, Bath, Square, Users,
  ArrowRight, AlertCircle, CheckCircle
} from "lucide-react"
import Link from "next/link"
import { propertiesAPI } from "@/lib/api/properties"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function LandlordDashboard() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])
  const [viewingRequests, setViewingRequests] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    pendingViewings: 0,
    unreadMessages: 0,
    totalViews: 0,
    occupancyRate: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch landlord's properties
      try {
        const propertiesData = await propertiesAPI.getMyProperties()
        const propertiesList = propertiesData.properties || []
        setProperties(propertiesList)
        
        // Calculate stats from properties
        const totalProperties = propertiesList.length
        const activeListings = propertiesList.filter((p: any) => p.status === 'vacant').length
        const totalViews = propertiesList.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0)
        
        setStats(prev => ({
          ...prev,
          totalProperties,
          activeListings,
          totalViews
        }))
      } catch (error) {
        console.error('Failed to fetch properties:', error)
        toast.error('Failed to load properties')
      }
      
      // TODO: Fetch viewing requests (landlord side) - Need to create landlord endpoint
      // For now, skip this to avoid 403 errors
      
      // TODO: Fetch conversations (landlord side) - Need to create landlord endpoint
      // For now, skip this to avoid 403 errors
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getUserName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'there'
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
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl md:text-4xl font-bold text-slate-900">
          Welcome back{mounted && `, ${getUserName()}`}!
        </h1>
        <p className="text-slate-600">Here's what's happening with your properties</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/landlord/properties">
          <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Properties</p>
                  <p className="text-4xl font-bold text-slate-900">{stats.totalProperties}</p>
                </div>
                <div className="p-4 bg-orange-100 rounded-xl">
                  <Building2 className="h-7 w-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/landlord/viewings">
          <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Pending Viewings</p>
                  <p className="text-4xl font-bold text-slate-900">{stats.pendingViewings}</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Calendar className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/landlord/messages">
          <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Unread Messages</p>
                  <p className="text-4xl font-bold text-slate-900">{stats.unreadMessages}</p>
                </div>
                <div className="p-4 bg-green-100 rounded-xl">
                  <MessageSquare className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Views</p>
                <p className="text-4xl font-bold text-slate-900">{stats.totalViews}</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-xl">
                <Eye className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Properties */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">My Properties</CardTitle>
                <div className="flex gap-2">
                  <Link href="/landlord/properties">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/landlord/properties/new">
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="mr-1 h-4 w-4" />
                      Add Property
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No properties listed yet</p>
                  <Link href="/landlord/properties/new">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="mr-2 h-4 w-4" />
                      List Your First Property
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <Link key={property.id} href={`/landlord/properties/${property.id}`}>
                      <div className="flex gap-4 p-4 rounded-xl border border-stone-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                        <img
                          src={property.photos?.[0] || property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                          alt={property.title}
                          className="h-24 w-32 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-1">{property.title}</h3>
                              <p className="text-sm text-slate-600 flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-orange-500" />
                                {property.location}
                              </p>
                            </div>
                            <Badge
                              className={
                                property.status === "vacant"
                                  ? "bg-green-100 text-green-700 border-0"
                                  : property.status === "rented"
                                  ? "bg-slate-100 text-slate-700 border-0"
                                  : "bg-amber-100 text-amber-700 border-0"
                              }
                            >
                              {property.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3 text-orange-500" />
                              {property.bedrooms}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3 text-orange-500" />
                              {property.bathrooms}
                            </span>
                            {property.square_feet && (
                              <span className="flex items-center gap-1">
                                <Square className="h-3 w-3 text-orange-500" />
                                {property.square_feet} sqft
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-orange-500" />
                              {property.view_count || 0} views
                            </span>
                          </div>
                          <p className="text-lg font-bold text-orange-600">{formatPrice(property.rent_amount || property.price || 0)}/mo</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Viewing Requests */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Recent Viewing Requests</CardTitle>
                <Link href="/landlord/viewings">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {viewingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No viewing requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 rounded-xl border border-stone-200 hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{request.tenant?.full_name || 'Tenant'}</h4>
                          {request.status === 'pending' && (
                            <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{request.property?.title || 'Property'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {request.preferred_date} - {request.time_slot}
                        </p>
                      </div>
                      <Link href={`/landlord/viewings`}>
                        <Button size="sm" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                          Review
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Recent Messages */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Messages</CardTitle>
                <Link href="/landlord/messages">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-sm">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <Link key={conv.id} href={`/landlord/messages/${conv.id}`}>
                      <div className="p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-sm text-slate-900">
                            {conv.tenant?.full_name || 'Tenant'}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-orange-500 text-white text-xs">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/landlord/properties/new">
                  <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Property
                  </Button>
                </Link>
                <Link href="/landlord/properties">
                  <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                    <Building2 className="mr-2 h-4 w-4" />
                    Manage Properties
                  </Button>
                </Link>
                <Link href="/landlord/viewings">
                  <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Requests
                  </Button>
                </Link>
                <Link href="/landlord/messages">
                  <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">Response Rate</span>
                    <span className="text-sm font-semibold text-slate-900">--</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">Occupancy Rate</span>
                    <span className="text-sm font-semibold text-slate-900">{stats.occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.occupancyRate}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
