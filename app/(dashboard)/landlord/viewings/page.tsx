"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, Clock, MapPin, Building2,
  ArrowLeft, CheckCircle, XCircle,
  AlertCircle, MessageSquare, Eye,
  Phone, Mail, Filter, Search, Users
} from "lucide-react"
import Link from "next/link"
import { viewingRequestsAPI } from "@/lib/api/viewingRequestsLandlord"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed='

const STATUS_LABELS: Record<string, string> = {
  pending:   'Awaiting Review',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// Card defined OUTSIDE the page component to prevent the remount bug:
// if defined inside, every setUpdatingId() triggers a re-render that recreates
// the component type, causing React to unmount/remount mid-request and double-fire actions.
interface ViewingCardProps {
  request: any
  updatingId: string | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

function getStatusBadgeStyle(status: string) {
  const styles: Record<string, string> = {
    pending:   "bg-orange-100 text-orange-800 border-orange-200 font-semibold",
    confirmed: "bg-green-100 text-green-800 border-green-200 font-semibold",
    completed: "bg-blue-100 text-blue-800 border-blue-200 font-semibold",
    cancelled: "bg-slate-100 text-slate-800 border-slate-200 font-semibold",
  }
  return styles[status] || styles.pending
}

function getPriorityBorder(status: string) {
  switch (status) {
    case 'pending':   return 'border-l-4 border-l-orange-500'
    case 'confirmed': return 'border-l-4 border-l-green-500'
    case 'completed': return 'border-l-4 border-l-blue-500'
    case 'cancelled': return 'border-l-4 border-l-slate-300'
    default:          return 'border-l-4 border-l-orange-500'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'confirmed': return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'completed': return <CheckCircle className="h-5 w-5 text-blue-600" />
    case 'cancelled': return <XCircle className="h-5 w-5 text-slate-500" />
    default:          return <AlertCircle className="h-5 w-5 text-orange-600" />
  }
}

function formatDateCard(dateString: string) {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatTimeSlotCard(slot: string) {
  const slots: Record<string, string> = {
    morning:   'Morning (9AM - 12PM)',
    afternoon: 'Afternoon (12PM - 4PM)',
    evening:   'Evening (4PM - 7PM)',
  }
  return slots[slot?.toLowerCase()] ?? slot
}

function formatViewingType(type: string) {
  const types: Record<string, string> = {
    PHYSICAL:   '🏠 Physical',
    VIRTUAL:    '💻 Virtual',
    LIVE_VIDEO: '📹 Live Video',
  }
  return types[type] ?? type
}

function ViewingRequestCard({ request, updatingId, onApprove, onReject }: ViewingCardProps) {
  const property = request.property
  const tenant = request.tenant
  const isFuture = new Date(request.preferred_date) >= new Date()

  return (
    <Card className={`border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${getPriorityBorder(request.status)}`}>
      <CardContent className="p-6">
        <div className="flex gap-6">

          {/* Property Image */}
          <div className="relative flex-shrink-0">
            <Link href={`/properties/${property?.id}`}>
              <div className="w-40 h-32 rounded-xl overflow-hidden bg-slate-100 shadow-md">
                <img
                  src={property?.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                  alt={property?.title || 'Property'}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            </Link>
            {property?.price && (
              <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow">
                ₦{property.price.toLocaleString()}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Title + status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <Link href={`/properties/${property?.id}`}>
                  <h3 className="text-xl font-bold text-slate-900 mb-1 hover:text-orange-600 transition-colors truncate">
                    {property?.title || 'Property'}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="font-medium truncate">{property?.location || 'Location not available'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <Badge className={getStatusBadgeStyle(request.status)}>
                    {STATUS_LABELS[request.status] || request.status}
                  </Badge>
                </div>
                {request.viewing_type && (
                  <span className="text-xs text-slate-500 font-medium">
                    {formatViewingType(request.viewing_type)}
                  </span>
                )}
              </div>
            </div>

            {/* Tenant info */}
            <div className="flex items-center gap-3 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <img
                src={tenant?.avatar_url || DEFAULT_AVATAR + (tenant?.id || 'unknown')}
                alt={tenant?.full_name || 'Tenant'}
                className="h-10 w-10 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <p className="font-semibold text-slate-900 text-sm">
                    {tenant?.full_name || request.tenant_name || 'Tenant'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                  {tenant?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />{tenant.email}
                    </span>
                  )}
                  {request.contact_number && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />{request.contact_number}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Date & time — same pill style as tenant */}
            <div className="flex items-center gap-6 text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-700">{formatDateCard(request.preferred_date)}</div>
                  <div className="text-xs text-slate-500">Date</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-700">{formatTimeSlotCard(request.time_slot)}</div>
                  <div className="text-xs text-slate-500">Time Slot</div>
                </div>
              </div>
            </div>

            {/* Tenant message */}
            {request.message && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Tenant's Message</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 italic">"{request.message}"</p>
                </div>
              </div>
            )}

            {/* Landlord notes */}
            {request.landlord_notes && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold text-slate-700">Your Response</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 italic">"{request.landlord_notes}"</p>
                </div>
              </div>
            )}

            {/* Actions — same bottom-border pattern as tenant */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 flex-wrap">
              <Link href={`/properties/${property?.id}`}>
                <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Eye className="mr-2 h-4 w-4" />
                  View Property
                </Button>
              </Link>

              {request.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                    onClick={() => onApprove(request.id)}
                    disabled={updatingId === request.id}
                  >
                    {updatingId === request.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Confirm Viewing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => onReject(request.id)}
                    disabled={updatingId === request.id}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </>
              )}

              {request.status === 'confirmed' && isFuture && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={() => toast.info('Messaging feature coming soon!')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Tenant
                </Button>
              )}

              {request.status === 'confirmed' && (
                <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold animate-pulse">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Viewing Confirmed
                </Badge>
              )}
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandlordViewingsPage() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [viewingRequests, setViewingRequests] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetchViewingRequests()
  }, [pathname])

  const fetchViewingRequests = async () => {
    try {
      setLoading(true)
      const data = await viewingRequestsAPI.getLandlord()
      const list: any[] = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.viewing_requests)
        ? (data as any).viewing_requests
        : []
      setViewingRequests(list)
    } catch (error: any) {
      console.error('Failed to fetch viewing requests:', error)
      toast.error(error.message || 'Failed to load viewing requests')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: 'confirmed' | 'cancelled',
    notes?: string
  ) => {
    try {
      setUpdatingId(requestId)
      await viewingRequestsAPI.review(requestId, { status: newStatus, landlord_notes: notes })
      setViewingRequests(prev =>
        prev.map(r => r.id === requestId ? { ...r, status: newStatus, landlord_notes: notes } : r)
      )
      if (newStatus === 'confirmed') {
        try { await viewingRequestsAPI.sendSms(requestId, 'confirmation') } catch {}
        toast.success('Viewing confirmed — tenant has been notified!')
      } else {
        toast.success('Viewing request declined')
      }
    } catch (error: any) {
      console.error('Failed to update request:', error)
      toast.error(error.message || 'Failed to update request')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleApprove = (id: string) =>
    handleUpdateStatus(id, 'confirmed', 'Your viewing request has been approved.')
  const handleReject = (id: string) =>
    handleUpdateStatus(id, 'cancelled', 'Unfortunately, this time slot is not available.')

  const filteredRequests = viewingRequests.filter(r => {
    const matchesSearch =
      !searchQuery ||
      r.property?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.property?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tenant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.message?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const groupedRequests = {
    pending:  filteredRequests.filter(r => r.status === 'pending'),
    upcoming: filteredRequests.filter(r =>
      r.status === 'confirmed' && new Date(r.preferred_date) >= new Date()
    ),
    past: filteredRequests.filter(r =>
      r.status === 'completed' ||
      r.status === 'cancelled' ||
      (r.status === 'confirmed' && new Date(r.preferred_date) < new Date())
    ),
  }

  const stats = {
    total:    viewingRequests.length,
    pending:  viewingRequests.filter(r => r.status === 'pending').length,
    upcoming: viewingRequests.filter(r =>
      r.status === 'confirmed' && new Date(r.preferred_date) >= new Date()
    ).length,
    completed: viewingRequests.filter(r => r.status === 'completed').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Viewing Requests</h3>
              <p className="text-slate-600">Please wait while we fetch your viewing appointments...</p>
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
        <Link href="/landlord/overview">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
              Viewing Requests
            </h1>
            <p className="text-slate-600">
              Manage property viewing appointments from tenants
            </p>
          </div>
          <Link href="/landlord/properties">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
              <Building2 className="mr-2 h-4 w-4" />
              My Properties
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats cards — 3-grid matching tenant */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Requests</p>
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
                <p className="text-sm font-medium text-slate-600">Needs Review</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.upcoming}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & filter */}
      {viewingRequests.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by property, location, or tenant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none bg-white"
            >
              <option value="all">All</option>
              <option value="pending">Needs Review</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      )}

      {/* Main content card */}
      <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Viewing Requests</span>
            <span className="text-sm font-normal text-slate-500">{viewingRequests.length} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewingRequests.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No viewing requests yet</h3>
              <p className="text-slate-600 mb-8">
                Viewing requests from tenants will appear here once they start booking appointments for your properties.
              </p>
              <Link href="/landlord/properties">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Properties
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-20 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">No matching requests</h3>
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

                  {groupedRequests.pending.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        Needs Review ({groupedRequests.pending.length})
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs animate-pulse ml-1">
                          Action Required
                        </Badge>
                      </h3>
                      <div className="space-y-3">
                        {groupedRequests.pending.map(request => (
                          <ViewingRequestCard
                            key={request.id}
                            request={request}
                            updatingId={updatingId}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {groupedRequests.upcoming.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Upcoming Viewings ({groupedRequests.upcoming.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedRequests.upcoming.map(request => (
                          <ViewingRequestCard
                            key={request.id}
                            request={request}
                            updatingId={updatingId}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {groupedRequests.past.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-slate-600" />
                        Past Viewings ({groupedRequests.past.length})
                      </h3>
                      <div className="space-y-3">
                        {groupedRequests.past.map(request => (
                          <ViewingRequestCard
                            key={request.id}
                            request={request}
                            updatingId={updatingId}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
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