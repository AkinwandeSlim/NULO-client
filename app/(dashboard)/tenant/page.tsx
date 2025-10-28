"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Home, Heart, MessageSquare, Calendar, 
  MapPin, Bed, Bath, Square, Eye, Clock, 
  ArrowRight, TrendingUp, Search 
} from "lucide-react"
import Link from "next/link"
import { favoritesAPI } from "@/lib/api/favorites"
import { viewingRequestsAPI } from "@/lib/api/viewingRequests"
import { messagesAPI } from "@/lib/api/messages"
import { toast } from "sonner"

// Placeholder image
const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function TenantDashboard() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<any[]>([])
  const [viewingRequests, setViewingRequests] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalFavorites: 0,
    pendingViewings: 0,
    unreadMessages: 0,
    activeRentals: 0
  })

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch favorites
        try {
          const favoritesData = await favoritesAPI.getAll()
          setFavorites(favoritesData.favorites.slice(0, 4)) // Show first 4
          setStats(prev => ({ ...prev, totalFavorites: favoritesData.total }))
        } catch (error) {
          console.error('Failed to fetch favorites:', error)
        }
        
        // Fetch viewing requests
        try {
          const viewingsData = await viewingRequestsAPI.getAll()
          setViewingRequests(viewingsData.viewing_requests.slice(0, 3))
          const pending = viewingsData.viewing_requests.filter((v: any) => v.status === 'pending').length
          setStats(prev => ({ ...prev, pendingViewings: pending }))
        } catch (error) {
          console.error('Failed to fetch viewing requests:', error)
        }
        
        // Fetch conversations
        try {
          const messagesData = await messagesAPI.getConversations()
          setConversations(messagesData.conversations.slice(0, 3))
          const unread = messagesData.conversations.filter((c: any) => c.unread_count > 0).length
          setStats(prev => ({ ...prev, unreadMessages: unread }))
        } catch (error) {
          console.error('Failed to fetch messages:', error)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

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
          Welcome back, {getUserName()}! 👋
        </h1>
        <p className="text-slate-600">Here's what's happening with your property search</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/favorites">
          <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Saved Properties</p>
                  <p className="text-4xl font-bold text-slate-900">{stats.totalFavorites}</p>
                </div>
                <div className="p-4 bg-red-100 rounded-xl">
                  <Heart className="h-7 w-7 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
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

        <Link href="/messages">
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
                <p className="text-sm font-medium text-slate-600 mb-1">Active Rentals</p>
                <p className="text-4xl font-bold text-slate-900">{stats.activeRentals}</p>
              </div>
              <div className="p-4 bg-amber-100 rounded-xl">
                <Home className="h-7 w-7 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Saved Properties */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Saved Properties</CardTitle>
                <Link href="/tenant/favorites">
                  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No saved properties yet</p>
                  <Link href="/properties">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Search className="mr-2 h-4 w-4" />
                      Browse Properties
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {favorites.map((favorite) => {
                    const property = favorite
                    if (!property) return null
                    
                    return (
                      <Link key={property.id} href={`/properties/${property.id}`}>
                        <div className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-amber-300 hover:shadow-xl transition-all duration-300 cursor-pointer">
                          {/* Property Image */}
                          <div className="relative h-56 overflow-hidden">
                            <img
                              src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                              alt={property.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Favorite Badge */}
                            <div className="absolute top-3 right-3">
                              <div className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-lg">
                                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                              </div>
                            </div>
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
            </CardContent>
          </Card>

          {/* Viewing Requests */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Viewing Requests</CardTitle>
                <Link href="/properties">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    Request Viewing
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
                    <div key={request.id} className="flex items-center justify-between p-4 rounded-xl border border-stone-200">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{request.property?.title || 'Property'}</h4>
                        <p className="text-sm text-slate-600 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {request.preferred_date} - {request.time_slot}
                        </p>
                      </div>
                      <Badge
                        className={
                          request.status === "confirmed"
                            ? "bg-green-100 text-green-700 border-0"
                            : request.status === "pending"
                            ? "bg-amber-100 text-amber-700 border-0"
                            : "bg-red-100 text-red-700 border-0"
                        }
                      >
                        {request.status}
                      </Badge>
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
                <Link href="/messages">
                  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
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
                    <Link key={conv.id} href={`/messages/${conv.id}`}>
                      <div className="p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-sm text-slate-900">
                            {conv.landlord?.full_name || 'Landlord'}
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
                <Link href="/properties">
                  <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                    <Search className="mr-2 h-4 w-4" />
                    Browse Properties
                  </Button>
                </Link>
                <Link href="/favorites">
                  <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                    <Heart className="mr-2 h-4 w-4" />
                    View Favorites
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Messages
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
