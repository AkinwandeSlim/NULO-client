"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, Clock, MapPin, Home, 
  ArrowLeft, CheckCircle, XCircle, 
  AlertCircle, Trash2, MessageSquare,
  Eye, Bell, Filter, Search, Star,
  TrendingUp, Users, Zap, FileText
} from "lucide-react"
import Link from "next/link"
// ✅ FIX 1: Was incorrectly importing viewingRequestsLandlord — tenant page must use tenant client
import { viewingRequestsAPI } from "@/lib/api/viewingRequestsTenant"
import { applicationsAPI } from "@/lib/api/applications"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

// ✅ FIX 4: Map raw DB status values to friendly tenant-facing labels
// DB stores 'pending' — tenant sees 'Scheduled'. 'completed' → 'Visited'.
const STATUS_LABELS: Record<string, string> = {
  pending: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Visited',
  cancelled: 'Cancelled'
}

interface ViewingCardProps {
request: any
cancelingId: string | null
onCancel: (id: string) => void
applications: any[] // Add applications data
}

function ViewingRequestCard({ request, cancelingId, onCancel, applications }: ViewingCardProps) {
  const property = request.property
  const isUpcoming = (request.status === 'confirmed' || request.status === 'pending') && 
    new Date(request.preferred_date) >= new Date()
  const isConfirmed = request.status === 'confirmed'
  const isCompleted = request.status === 'completed'
  
  // Check if tenant has already applied for this property
  const hasApplied = applications.some(app => app.property_id === property?.id)
  
  // ✅ FIX 8: Show Apply Now for confirmed viewings AND completed viewings
  // Tenant can apply at any point after scheduling — no need to wait for landlord confirmation
  // BUT only if they haven't already applied for this property
  const showApplyNow = (request.status === 'confirmed' || request.status === 'pending' || request.status === 'completed') && !hasApplied

  const getPriorityColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'border-l-4 border-l-green-500'
      case 'pending': return 'border-l-4 border-l-orange-500'
      case 'completed': return 'border-l-4 border-l-blue-500'
      case 'cancelled': return 'border-l-4 border-l-slate-300'
      default: return 'border-l-4 border-l-orange-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'cancelled':
        // ✅ FIX 3: Removed 'rejected' case — not a valid DB value
        return <XCircle className="h-5 w-5 text-slate-600" />
      default: // pending
        return <AlertCircle className="h-5 w-5 text-orange-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-orange-100 text-orange-800 border-orange-200 font-semibold",
      confirmed: "bg-green-100 text-green-800 border-green-200 font-semibold",
      completed: "bg-blue-100 text-blue-800 border-blue-200 font-semibold",
      // ✅ FIX 3: Removed 'rejected' — not a valid DB value
      cancelled: "bg-slate-100 text-slate-800 border-slate-200 font-semibold"
    }
    return styles[status] || styles.pending
  }



  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTimeSlot = (slot: string) => {
    const labels: Record<string, string> = {
      morning: 'Morning (9AM – 12PM)',
      afternoon: 'Afternoon (12PM – 4PM)',
      evening: 'Evening (4PM – 7PM)'
    }
    return labels[slot] || slot
  }


  return (
    <Card className={`border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${getPriorityColor(request.status)}`}>
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Property Image */}
          <div className="relative">
            <Link href={`/properties/${property?.id}`}>
              <div className="w-40 h-32 rounded-xl overflow-hidden bg-slate-100 shadow-md">
                <img
                  src={property?.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                  alt={property?.title || 'Property'}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            </Link>
            {property?.rating && (
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                {property.rating}
              </div>
            )}
          </div>

          {/* Request Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Link href={`/properties/${property?.id}`}>
                  <h3 className="text-xl font-bold text-slate-900 mb-1 hover:text-orange-600 transition-colors">
                    {property?.title || 'Property'}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{property?.location || 'Location not available'}</span>
                </div>
                
                {property?.price && (
                  <div className="text-lg font-bold text-orange-600 mb-2">
                    ₦{property.price.toLocaleString()}
                    <span className="text-sm text-slate-500 font-normal">/year</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  {/* ✅ FIX 4: Display friendly label, not raw DB value */}
                  <Badge className={getStatusBadge(request.status)}>
                    {STATUS_LABELS[request.status] || request.status}
                  </Badge>
                </div>
                {isUpcoming && isConfirmed && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold animate-pulse">
                    Upcoming
                  </Badge>
                )}
                {isUpcoming && !isConfirmed && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                    Awaiting Landlord
                  </Badge>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-6 text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-700">{formatDate(request.preferred_date)}</div>
                  <div className="text-xs text-slate-500">Date</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  {/* ✅ Format time slot properly instead of showing raw 'afternoon' */}
                  <div className="font-semibold text-slate-700">{formatTimeSlot(request.time_slot)}</div>
                  <div className="text-xs text-slate-500">Time Slot</div>
                </div>
              </div>
            </div>

            {/* Message */}
            {request.message && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Your Message</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 italic">"{request.message}"</p>
                </div>
              </div>
            )}

            {/* Landlord Response */}
            {request.landlord_notes && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold text-blue-700">Landlord Response</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 italic">"{request.landlord_notes}"</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 flex-wrap">
              {/* ✅ FIX 8: Apply Now button — visible for pending, confirmed, and completed viewings */}
              {/* BUT disabled if already applied for this property */}
              {showApplyNow && (
                <Link href={`/properties/${property?.id}/apply?viewing_id=${request.id}`}>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-sm"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Apply Now
                  </Button>
                </Link>
              )}
              
              {/* Show Applied button if already applied */}
              {hasApplied && (request.status === 'confirmed' || request.status === 'pending' || request.status === 'completed') && (
                <Button 
                  size="sm" 
                  disabled
                  className="bg-slate-100 text-slate-500 font-semibold border border-slate-300 cursor-not-allowed"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Applied
                </Button>
              )}

              <Link href={`/properties/${property?.id}`}>
                <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Eye className="mr-2 h-4 w-4" />
                  View Property
                </Button>
              </Link>
              
              {/* Cancel only for pending/confirmed future viewings */}
              {(request.status === 'pending' || request.status === 'confirmed') && 
                new Date(request.preferred_date) >= new Date() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => onCancel(request.id)}
                  disabled={cancelingId === request.id}
                >
                  {cancelingId === request.id ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Cancel
                </Button>
              )}

              {request.status === 'confirmed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={() => toast.info('Messaging feature coming soon!')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Landlord
                </Button>
              )}

              {isCompleted && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Visited
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ViewingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [viewingRequests, setViewingRequests] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchViewingRequests()
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await applicationsAPI.getMyApplications()
      if (response.success) {
        setApplications(response.applications || [])
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    }
  }

  const fetchViewingRequests = async () => {
    try {
      setLoading(true)
      // ✅ FIX 1 cont: tenant client returns { success, data } — handle correctly
      const response = await viewingRequestsAPI.getAll()
      if (response.success) {
        setViewingRequests(response.data?.viewing_requests || [])
      } else {
        toast.error('Failed to load viewing requests')
      }
    } catch (error: any) {
      console.error('Failed to fetch viewing requests:', error)
      toast.error(error.message || 'Failed to load viewing requests')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this viewing request?')) {
      return
    }

    try {
      setCancelingId(requestId)
      // ✅ FIX 2: Was calling delete() which removes the DB record entirely.
      // cancel() patches status to 'cancelled' — keeps the record for history.
      const response = await viewingRequestsAPI.cancel(requestId)
      if (response.success) {
        // Update status in local state rather than removing — tenant can still see it
        setViewingRequests(viewingRequests.map(r => 
          r.id === requestId ? { ...r, status: 'cancelled' } : r
        ))
        toast.success('Viewing request cancelled')
      } else {
        toast.error('Failed to cancel request')
      }
    } catch (error: any) {
      console.error('Failed to cancel request:', error)
      toast.error(error.message || 'Failed to cancel request')
    } finally {
      setCancelingId(null)
    }
  }


  const filteredRequests = viewingRequests.filter(request => {
    const matchesSearch = !searchQuery || 
      request.property?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.property?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.message?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const groupedRequests = {
    upcoming: filteredRequests.filter(r => 
      (r.status === 'confirmed' || r.status === 'pending') && 
      new Date(r.preferred_date) >= new Date()
    ),
    // ✅ FIX 5: Removed 'pending' group — merged into 'upcoming' (they're all scheduled viewings)
    past: filteredRequests.filter(r => 
      r.status === 'completed' || 
      r.status === 'cancelled' ||
      ((r.status === 'confirmed' || r.status === 'pending') && new Date(r.preferred_date) < new Date())
    )
  }

  const stats = {
    total: viewingRequests.length,
    pending: viewingRequests.filter(r => r.status === 'pending').length,
    confirmed: viewingRequests.filter(r => 
      r.status === 'confirmed' && new Date(r.preferred_date) >= new Date()
    ).length,
    completed: viewingRequests.filter(r => r.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Your Viewings</h3>
              <p className="text-slate-600">Please wait while we fetch your viewing requests...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/tenant">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
              Your Viewings
            </h1>
            <p className="text-slate-600">
              Manage your scheduled property viewings and applications
            </p>
          </div>
          <Link href="/properties">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
              <Search className="mr-2 h-4 w-4" />
              Browse Properties
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards — 4-grid for complete overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Viewings</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Awaiting Landlord</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className={`w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center ${stats.pending > 0 ? 'animate-pulse' : ''}`}>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Confirmed Upcoming</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completed Viewings</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <div className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ${stats.completed > 0 ? 'animate-pulse' : ''}`}>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      {viewingRequests.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by property name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            {/* ✅ FIX 7: Removed 'rejected' from filter — not a valid DB status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none bg-white"
            >
              <option value="all">All</option>
              <option value="pending">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Visited</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Viewings</span>
            <span className="text-sm font-normal text-slate-500">
              {viewingRequests.length} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewingRequests.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No Viewings Yet</h3>
              <p className="text-slate-600 mb-8">
                Browse properties and schedule a viewing — your appointments will appear here.
              </p>
              <Link href="/properties">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                  <Home className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-20 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">No matching viewings</h3>
                  <p className="text-slate-600 mb-6">Try adjusting your search or filter</p>
                  <Button 
                    variant="outline" 
                    onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Upcoming / Scheduled */}
                  {groupedRequests.upcoming.length > 0 && (
                    <div>
                      {/* ✅ FIX 5: Section heading now reflects friendly language */}
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-600" />
                        Scheduled Viewings ({groupedRequests.upcoming.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedRequests.upcoming.map(request => (
                          <ViewingRequestCard key={request.id} request={request} cancelingId={cancelingId} onCancel={handleCancelRequest} applications={applications} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past */}
                  {groupedRequests.past.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-slate-600" />
                        Past Viewings ({groupedRequests.past.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedRequests.past.map(request => (
                          <ViewingRequestCard key={request.id} request={request} cancelingId={cancelingId} onCancel={handleCancelRequest} applications={applications} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




