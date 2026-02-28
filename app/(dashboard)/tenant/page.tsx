"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { Notification } from "@/contexts/NotificationContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Home, Heart, MessageSquare, Calendar, 
  MapPin, Bed, Bath, Square, Eye, Clock, 
  ArrowRight, TrendingUp, Search, Bell,
  Settings, User, Star, Zap, Activity,
  Filter, CheckCircle, AlertCircle, Building2,
  Target, Award, Users, BarChart3, FileText,
  Send, X, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { favoritesAPI } from "@/lib/api/favorites"
import { viewingRequestsAPI } from "@/lib/api/viewingRequests"
import { messagesAPI } from "@/lib/api/messages"
import { applicationsAPI, Application } from "@/lib/api/applications"
import { engagementAPI, getEngagementLevelColor, getEngagementLevelTextColor, getEngagementLevelBgColor, getTrustScoreColor, getTrustScoreTextColor, getTrustScoreBgColor, trackEngagement } from "@/lib/api/engagement"
import { toast } from "sonner"

// Placeholder image
const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function TenantDashboard() {
  const { user, userProfile } = useAuth()
  const { state } = useNotifications()
  const { notifications, unreadCount } = state
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<any[]>([])
  const [viewingRequests, setViewingRequests] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState({
    totalFavorites: 0,
    pendingViewings: 0,
    confirmedViewings: 0,
    unreadMessages: 0,
    activeRentals: 0,
    totalViews: 0,
    thisWeekActivity: 0,
    propertiesContacted: 0,
    applicationsSubmitted: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    responseRate: 0,
    engagementScore: 0,
    trustScore: 50,
    engagementLevel: 'Low' as 'Low' | 'Medium' | 'High'
  })
  const [engagementMetrics, setEngagementMetrics] = useState<any>(null)

  // Track engagement activities
  const trackActivity = useCallback(async (activityType: any, metadata?: any) => {
    if (user?.id) {
      await trackEngagement(user.id, activityType, metadata)
    }
  }, [user?.id])

  // Fetch dashboard data
  useEffect(() => {
    setLoading(true)
    fetchDashboardData()
  }, [pathname]) // Add pathname to trigger refresh on navigation

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
          const confirmed = viewingsData.viewing_requests.filter((v: any) => v.status === 'confirmed').length
          setStats(prev => ({ 
            ...prev, 
            pendingViewings: pending,
            confirmedViewings: confirmed,
            propertiesContacted: viewingsData.viewing_requests.length
          }))
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
        
        // Fetch applications
        try {
          const applicationsData = await applicationsAPI.getMyApplications()
          setApplications(applicationsData.applications.slice(0, 3))
          const pending = applicationsData.applications.filter((app: Application) => app.status === 'pending').length
          const approved = applicationsData.applications.filter((app: Application) => app.status === 'approved').length
          setStats(prev => ({ 
            ...prev, 
            applicationsSubmitted: applicationsData.applications.length,
            pendingApplications: pending,
            approvedApplications: approved
          }))
        } catch (error) {
          console.error('Failed to fetch applications:', error)
        }
        
        // Fetch engagement metrics
        try {
          const engagementData = await engagementAPI.getEngagementMetrics(user?.id || '')
          setEngagementMetrics(engagementData)
          setStats(prev => ({
            ...prev,
            engagementScore: engagementData.engagement_score,
            trustScore: engagementData.trust_score,
            engagementLevel: engagementData.engagement_level
          }))
        } catch (error) {
          console.error('Failed to fetch engagement metrics:', error)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

  // Memoize expensive calculations and event handlers (must be before early returns)
  const getUserName = useMemo(() => () =>
    user?.full_name || user?.email?.split('@')[0] || 'there'
  , [user])

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.read) {
      try {
        // Mark notification as read logic here
        console.log('Mark notification as read:', notification.id)
      } catch {}
    }
    if (notification.link) router.push(notification.link)
  }, [router])

  // Use backend engagement data
  const engagementDisplay = useMemo(() => {
    const score = stats.engagementScore || 0
    const level = stats.engagementLevel || 'Low'
    
    return {
      score,
      level,
      color: getEngagementLevelColor(level),
      textColor: getEngagementLevelTextColor(level),
      bgColor: getEngagementLevelBgColor(level),
      icon: level === 'High' ? Award : level === 'Medium' ? Target : Users
    }
  }, [stats.engagementScore, stats.engagementLevel])

  // Trust score display
  const trustDisplay = useMemo(() => {
    const score = stats.trustScore || 50
    return {
      score,
      color: getTrustScoreColor(score),
      textColor: getTrustScoreTextColor(score),
      bgColor: getTrustScoreBgColor(score)
    }
  }, [stats.trustScore])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTimeSlot = (slot: string) => {
    const slots: Record<string, string> = {
      morning: 'Morning (9AM–12PM)',
      afternoon: 'Afternoon (12PM–4PM)',
      evening: 'Evening (4PM–7PM)',
    }
    return slots[slot?.toLowerCase()] ?? slot
  }

  const formatViewingType = (type: string) => {
    const types: Record<string, string> = {
      PHYSICAL: '🏠 Physical',
      VIRTUAL: '💻 Virtual',
      LIVE_VIDEO: '📹 Live Video',
    }
    return types[type] ?? type
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Your Dashboard</h3>
              <p className="text-slate-600">Please wait while we fetch your property search activity...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                Welcome back, {getUserName()}!
              </h1>
              <p className="text-lg text-gray-600 mb-6">Your property search dashboard</p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Link href="/properties">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                    <Search className="mr-2 h-4 w-4" />Browse Properties
                  </Button>
                </Link>
                <Link href="/tenant/viewings">
                  <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                    <Calendar className="mr-2 h-4 w-4" />My Viewings
                    {(stats.pendingViewings + stats.confirmedViewings) > 0 && (
                      <span className="ml-1.5 h-5 w-5 bg-orange-500 text-white text-xs rounded-full inline-flex items-center justify-center">
                        {stats.pendingViewings + stats.confirmedViewings}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/tenant/favorites">
                  <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                    <Heart className="mr-2 h-4 w-4" />Saved
                    {stats.totalFavorites > 0 && (
                      <span className="ml-1.5 text-xs text-orange-500 font-semibold">{stats.totalFavorites}</span>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/messages">
                <Button variant="outline" size="lg" className="relative border-orange-200 text-orange-700 hover:bg-orange-50">
                  <MessageSquare className="h-4 w-4" />
                  {stats.unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {stats.unreadMessages}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/tenant/settings">
                <Button variant="outline" size="lg" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Key Metrics Overview - Enhanced */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Your Overview</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 bg-${engagementDisplay.color}-500 rounded-full animate-pulse`}></div>
                <span className="text-sm font-medium text-slate-600">{engagementDisplay.level} Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Trust Score:</span>
                <Badge className={`${trustDisplay.bgColor} ${trustDisplay.textColor} border-0`}>
                  {trustDisplay.score}/100
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Saved Properties</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalFavorites}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/tenant/viewings">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-600 mb-1">Viewings</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.pendingViewings + stats.confirmedViewings}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {stats.pendingViewings > 0 && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            {stats.pendingViewings} pending
                          </span>
                        )}
                        {stats.confirmedViewings > 0 && (
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {stats.confirmedViewings} confirmed
                          </span>
                        )}
                        {stats.pendingViewings === 0 && stats.confirmedViewings === 0 && (
                          <span className="text-xs text-slate-400">none scheduled</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Unread Messages</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.unreadMessages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/tenant/applications">
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-600 mb-1">Applications</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.applicationsSubmitted}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {stats.pendingApplications > 0 && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            {stats.pendingApplications} pending
                          </span>
                        )}
                        {stats.approvedApplications > 0 && (
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {stats.approvedApplications} approved
                          </span>
                        )}
                        {stats.pendingApplications === 0 && stats.approvedApplications === 0 && (
                          <span className="text-xs text-slate-400">none submitted</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Properties Contacted</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.propertiesContacted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Engagement Progress Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Search Progress</h2>
              <p className="text-gray-600">Track your property search journey</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Engagement Score:</span>
              <span className="text-lg font-bold text-orange-600">{engagementDisplay.score}/100</span>
            </div>
          </div>
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Overall Progress</span>
                    <span className="text-slate-600">{engagementDisplay.score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${engagementDisplay.score}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Achievement Badges */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      stats.totalFavorites > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Heart className="h-4 w-4" />
                      <span className="text-sm font-medium">{stats.totalFavorites} Saved</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      stats.propertiesContacted > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">{stats.propertiesContacted} Contacted</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      stats.confirmedViewings > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{stats.confirmedViewings} Viewings</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      stats.applicationsSubmitted > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{stats.applicationsSubmitted} Applications</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {engagementDisplay.icon && <engagementDisplay.icon className="h-5 w-5 text-slate-600" />}
                    <span className="text-sm font-medium text-slate-600">{engagementDisplay.level} Activity</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content - 3/4 width */}
          <div className="lg:col-span-3 space-y-8">
            {/* Saved Properties Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Saved Properties</h2>
                  <p className="text-gray-600">Properties you've saved for later</p>
                </div>
                <Link href="/tenant/favorites">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No saved properties yet</h3>
                    <p className="text-slate-600 mb-6">Start browsing and save properties you're interested in</p>
                    <Link href="/properties">
                      <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
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
                        <Link 
                          key={property.id} 
                          href={`/properties/${property.id}`}
                          onClick={() => trackActivity('property_viewed', { property_id: property.id, property_title: property.title })}
                        >
                          <div className="group relative bg-white rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]">
                            {/* Property Image */}
                            <div className="relative h-48 overflow-hidden">
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
                              {property.rating && (
                                <div className="absolute top-3 left-3">
                                  <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-current" />
                                    {property.rating}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Property Details */}
                            <div className="p-5">
                              {/* Price */}
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-2xl font-bold text-orange-600">
                                  {formatPrice(property.price)}
                                  <span className="text-sm font-normal text-slate-500">/mo</span>
                                </p>
                              </div>

                              {/* Title */}
                              <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                {property.title}
                              </h3>

                              {/* Location */}
                              <p className="text-sm text-slate-600 flex items-center mb-4">
                                <MapPin className="h-4 w-4 mr-1.5 text-orange-500 flex-shrink-0" />
                                <span className="line-clamp-1">{property.location}</span>
                              </p>

                              {/* Features */}
                              <div className="flex items-center gap-4 text-sm text-slate-600 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <Bed className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium">{property.beds || property.bedrooms || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Bath className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium">{property.baths || property.bathrooms || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Square className="h-4 w-4 text-orange-500" />
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
            </section>

            {/* Viewing Requests Section - Enhanced */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Viewing Requests</h2>
                  <p className="text-gray-600">Your scheduled property viewings and landlord responses</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/tenant/viewings">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/properties">
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      Request Viewing
                    </Button>
                  </Link>
                </div>
              </div>
              
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                {viewingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No viewing requests yet</h3>
                    <p className="text-slate-600 mb-4">Find a property you like and request a viewing to get started</p>
                    <Link href="/properties">
                      <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                        <Search className="mr-2 h-3 w-3" />Browse Properties
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-slate-900">{request.property?.title || 'Property'}</h4>
                            {request.status === 'confirmed' && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold animate-pulse">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Confirmed
                              </Badge>
                            )}
                            {request.status === 'pending' && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}

                          </div>
                          <p className="text-sm text-slate-600 flex items-center">
                            <Clock className="h-3 w-3 mr-2 text-orange-500" />
                            {formatDate(request.preferred_date)} · {formatTimeSlot(request.time_slot)}
                          </p>
                          {request.viewing_type && (
                            <p className="text-xs text-slate-500 mt-1">{formatViewingType(request.viewing_type)}</p>
                          )}
                          {/* Landlord response time */}
                          {request.status === 'confirmed' && request.created_at && (
                            <p className="text-xs text-green-600 mt-1">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Landlord responded in {Math.round((new Date(request.updated_at).getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60))} hours
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Link href={`/properties/${request.property?.id}`}>
                            <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs gap-1.5">
                              <Eye className="h-3.5 w-3.5" />View
                            </Button>
                          </Link>
                          {request.status === 'confirmed' && (
                            <Link href="/messages">
                              <Button variant="outline" size="sm" className="border-green-300 text-green-600 hover:bg-green-50 text-xs gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />Message
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </CardContent>
              </Card>
            </section>

            {/* Applications Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">My Applications</h2>
                  <p className="text-gray-600">Track your rental applications and their status</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/tenant/applications">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/properties">
                    <Button size="sm" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                      <FileText className="mr-2 h-3 w-3" />New Application
                    </Button>
                  </Link>
                </div>
              </div>
              
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications yet</h3>
                    <p className="text-slate-600 mb-4">Ready to apply for your dream rental property?</p>
                    <Link href="/properties">
                      <Button size="sm" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                        <Search className="mr-2 h-3 w-3" />Browse Properties
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-300">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-slate-900">{application.property?.title || 'Property'}</h4>
                            {application.status === 'approved' && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold animate-pulse">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                            {application.status === 'pending' && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending Review
                              </Badge>
                            )}
                            {application.status === 'rejected' && (
                              <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold">
                                <X className="h-3 w-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 flex items-center mb-2">
                            <MapPin className="h-3 w-3 mr-2 text-orange-500" />
                            {application.property?.location || 'Location not specified'}
                          </p>
                          {application.property?.price && (
                            <p className="text-sm font-medium text-slate-900">
                              {formatPrice(application.property.price)}
                              <span className="text-sm font-normal text-slate-500">/mo</span>
                            </p>
                          )}
                          {/* Application details */}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Applied: {formatDate(application.created_at)}</span>
                            {application.move_in_date && (
                              <span>Move-in: {formatDate(application.move_in_date)}</span>
                            )}
                            {application.viewed_by_landlord && (
                              <span className="text-green-600">
                                <Eye className="h-3 w-3 inline mr-1" />
                                Viewed by landlord
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Link href={`/tenant/applications/${application.id}`}>
                            <Button variant="outline" size="sm" className="border-green-300 text-green-600 hover:bg-green-50 text-xs gap-1.5">
                              <Eye className="h-3.5 w-3.5" />View Details
                            </Button>
                          </Link>
                          {application.status === 'approved' && (
                            <Link href={`/messages`}>
                              <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />Contact Landlord
                              </Button>
                            </Link>
                          )}
                          {application.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-300 text-red-600 hover:bg-red-50 text-xs gap-1.5"
                              onClick={async () => {
                                try {
                                  await applicationsAPI.withdraw(application.id)
                                  toast.success('Application withdrawn successfully')
                                  fetchDashboardData() // Refresh data
                                } catch (error) {
                                  toast.error('Failed to withdraw application')
                                }
                              }}
                            >
                              <X className="h-3.5 w-3.5" />Withdraw
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Sidebar - 1/4 width */}
          <div className="space-y-6">
            {/* Notifications Sidebar */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-orange-500 text-white animate-pulse">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  {(!notifications || notifications.length === 0) ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">No notifications</h3>
                    <p className="text-xs text-slate-600">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification: Notification) => (
                     
                      <div key={notification.id} className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            {notification.type === 'visit' && <Calendar className="h-4 w-4 text-orange-600" />}
                            {notification.type === 'message' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                            {notification.type === 'email_verified' && <Bell className="h-4 w-4 text-slate-600" />}
                            {notification.type === 'onboarding_submitted' && <Heart className="h-4 w-4 text-red-600" />}
                            {notification.type === 'system' && <Bell className="h-4 w-4 text-slate-600" />}
                            {(!notification.type || !['visit', 'message', 'onboarding_submitted', 'system', 'email_verified', 'onboarding_approved', 'onboarding_rejected', 'onboarding_needs_correction'].includes(notification.type)) && <Bell className="h-4 w-4 text-slate-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(notification.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications && notifications.length > 5 && (
                      <Link href="/notifications">
                        <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                          View All Notifications
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
                </CardContent>
              </Card>
            </section>

            {/* Recent Messages */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent Messages</h3>
                <Link href="/messages">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    View All
                  </Button>
                </Link>
              </div>
              
              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">No messages yet</h3>
                    <p className="text-xs text-slate-600">Start chatting with landlords</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversations.map((conv) => (
                      <Link key={conv.id} href={`/messages/${conv.id}`}>
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-300 cursor-pointer">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {conv.landlord?.full_name || 'Landlord'}
                            </p>
                            {conv.unread_count > 0 && (
                              <Badge className="bg-green-500 text-white text-xs">
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
                    <Link href="/messages">
                      <Button variant="outline" size="sm" className="w-full border-green-300 text-green-600 hover:bg-green-50">
                        View All Messages
                      </Button>
                    </Link>
                  </div>
                )}
                </CardContent>
              </Card>
            </section>

            {/* Quick Actions */}
            <Card className="border-2 border-slate-200 rounded-2xl shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-200 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-orange-700" />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Link href="/properties">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                      <Search className="mr-2 h-4 w-4" />
                      Browse Properties
                    </Button>
                  </Link>
                  <Link href="/tenant/favorites">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                      <Heart className="mr-2 h-4 w-4" />
                      View Favorites
                    </Button>
                  </Link>
                  <Link href="/tenant/viewings">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                      <Calendar className="mr-2 h-4 w-4" />
                      My Viewings
                    </Button>
                  </Link>
                  <Link href="/tenant/applications">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-green-500 hover:text-green-600">
                      <FileText className="mr-2 h-4 w-4" />
                      My Applications
                      {stats.applicationsSubmitted > 0 && (
                        <span className="ml-auto text-xs text-green-600 font-semibold">{stats.applicationsSubmitted}</span>
                      )}
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                      <User className="mr-2 h-4 w-4" />
                      Update Profile
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="outline" className="w-full justify-start border-slate-300 hover:bg-white hover:border-orange-500 hover:text-orange-600">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity — built from real viewingRequests + conversations */}
            <Card className="border-2 border-slate-200 rounded-2xl shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900">Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {(() => {
                  // Build activity feed from real data: viewings + messages + applications
                  const activityItems: { id: string; icon: any; iconBg: string; iconColor: string; title: string; subtitle: string; date: string }[] = []

                  // Add viewing requests
                  viewingRequests.forEach((v: any) => {
                    activityItems.push({
                      id: v.id,
                      icon: Calendar,
                      iconBg: v.status === "confirmed" ? "bg-green-100" : "bg-blue-100",
                      iconColor: v.status === "confirmed" ? "text-green-600" : "text-blue-600",
                      title: v.status === "confirmed"
                        ? `Viewing confirmed — ${v.property?.title || "Property"}`
                        : `Viewing requested — ${v.property?.title || "Property"}`,
                      subtitle: `${formatDate(v.preferred_date)} · ${formatTimeSlot(v.time_slot)}`,
                      date: v.created_at,
                    })
                  })

                  // Add applications
                  applications.forEach((app: Application) => {
                    activityItems.push({
                      id: `app-${app.id}`,
                      icon: FileText,
                      iconBg: app.status === "approved" ? "bg-green-100" : app.status === "rejected" ? "bg-red-100" : "bg-orange-100",
                      iconColor: app.status === "approved" ? "text-green-600" : app.status === "rejected" ? "text-red-600" : "text-orange-600",
                      title: app.status === "approved"
                        ? `Application approved — ${app.property?.title || "Property"}`
                        : app.status === "rejected"
                        ? `Application rejected — ${app.property?.title || "Property"}`
                        : `Application submitted — ${app.property?.title || "Property"}`,
                      subtitle: app.property?.price ? `${formatPrice(app.property.price)}/mo` : "Price not specified",
                      date: app.created_at,
                    })
                  })

                  // Add conversations
                  conversations.forEach((c: any) => {
                    if (c.last_message) {
                      activityItems.push({
                        id: `msg-${c.id}`,
                        icon: MessageSquare,
                        iconBg: c.unread_count > 0 ? "bg-orange-100" : "bg-slate-100",
                        iconColor: c.unread_count > 0 ? "text-orange-600" : "text-slate-500",
                        title: `Message from ${c.landlord?.full_name || "Landlord"}`,
                        subtitle: c.last_message.length > 50 ? c.last_message.slice(0, 50) + "…" : c.last_message,
                        date: c.updated_at || c.created_at,
                      })
                    }
                  })

                  // Sort newest first
                  activityItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  const visible = activityItems.slice(0, 5)

                  if (visible.length === 0) {
                    return (
                      <div className="text-center py-6">
                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Activity className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 mb-1">No activity yet</p>
                        <p className="text-xs text-slate-500">Your viewing requests and messages will appear here</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3">
                      {visible.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 text-sm">
                          <div className={`h-7 w-7 ${item.iconBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <item.icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-900 font-medium leading-snug">{item.title}</p>
                            <p className="text-slate-500 text-xs mt-0.5 truncate">{item.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}