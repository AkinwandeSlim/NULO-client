"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, Clock, MapPin, User, 
  ArrowLeft, CheckCircle, XCircle, 
  AlertCircle, MessageSquare, Eye,
  Phone, Mail
} from "lucide-react"
import Link from "next/link"
import { viewingRequestsAPI } from "@/lib/api/viewingRequests"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed='

export default function LandlordViewingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [viewingRequests, setViewingRequests] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchViewingRequests()
  }, [])

  const fetchViewingRequests = async () => {
    try {
      setLoading(true)
      const data = await viewingRequestsAPI.getAll()
      setViewingRequests(data.viewing_requests)
    } catch (error: any) {
      console.error('Failed to fetch viewing requests:', error)
      toast.error(error.message || 'Failed to load viewing requests')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      setUpdatingId(requestId)
      await viewingRequestsAPI.update(requestId, { 
        status,
        landlord_notes: notes 
      })
      
      setViewingRequests(viewingRequests.map(r => 
        r.id === requestId ? { ...r, status, landlord_notes: notes } : r
      ))
      
      toast.success(`Viewing request ${status}`)
    } catch (error: any) {
      console.error('Failed to update request:', error)
      toast.error(error.message || 'Failed to update request')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleApprove = (requestId: string) => {
    handleUpdateStatus(requestId, 'confirmed', 'Your viewing request has been approved.')
  }

  const handleReject = (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):')
    handleUpdateStatus(requestId, 'rejected', reason || 'Unfortunately, this time slot is not available.')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 border-0",
      confirmed: "bg-green-100 text-green-700 border-0",
      rejected: "bg-red-100 text-red-700 border-0",
      completed: "bg-blue-100 text-blue-700 border-0",
      cancelled: "bg-slate-100 text-slate-700 border-0"
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const groupedRequests = {
    pending: viewingRequests.filter(r => r.status === 'pending'),
    confirmed: viewingRequests.filter(r => 
      r.status === 'confirmed' && new Date(r.preferred_date) >= new Date()
    ),
    past: viewingRequests.filter(r => 
      r.status === 'completed' || 
      r.status === 'rejected' || 
      r.status === 'cancelled' ||
      (r.status === 'confirmed' && new Date(r.preferred_date) < new Date())
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading viewing requests...</p>
        </div>
      </div>
    )
  }

  const ViewingRequestCard = ({ request }: { request: any }) => {
    const property = request.property
    const tenant = request.tenant

    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Link href={`/properties/${property?.id}`}>
              <img
                src={property?.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                alt={property?.title || 'Property'}
                className="h-24 w-32 rounded-lg object-cover hover:opacity-90 transition-opacity"
              />
            </Link>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/properties/${property?.id}`}>
                    <h3 className="font-bold text-lg text-slate-900 hover:text-orange-600 transition-colors">
                      {property?.title || 'Property'}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-600 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1 text-orange-500" />
                    {property?.location || 'Location not available'}
                  </p>
                </div>
                <Badge className={getStatusBadge(request.status)}>
                  {request.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-3 p-3 bg-slate-50 rounded-lg">
                <img
                  src={tenant?.avatar_url || DEFAULT_AVATAR + tenant?.id}
                  alt={tenant?.full_name || 'Tenant'}
                  className="h-10 w-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{tenant?.full_name || 'Tenant'}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                    {user && tenant?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {tenant.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  {formatDate(request.preferred_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  {request.time_slot}
                </span>
              </div>

              {request.message && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Tenant's Message:</p>
                  <p className="text-sm text-blue-800">"{request.message}"</p>
                </div>
              )}

              {request.landlord_notes && (
                <div className="bg-slate-50 p-3 rounded-lg mb-3">
                  <p className="text-xs font-semibold text-slate-900 mb-1">Your Response:</p>
                  <p className="text-sm text-slate-600">"{request.landlord_notes}"</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Link href={`/properties/${property?.id}`}>
                  <Button variant="outline" size="sm" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                    <Eye className="mr-1 h-4 w-4" />
                    View Property
                  </Button>
                </Link>
                
                {request.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(request.id)}
                      disabled={updatingId === request.id}
                    >
                      {updatingId === request.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="mr-1 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleReject(request.id)}
                      disabled={updatingId === request.id}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}

                {request.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info('Messaging feature coming soon!')}
                  >
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Message Tenant
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
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
              Viewing Requests
            </h1>
            <p className="text-slate-600">
              Manage property viewing appointments from tenants
            </p>
          </div>
        </div>
      </div>

      {viewingRequests.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="py-16">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No viewing requests yet
              </h3>
              <p className="text-slate-600 mb-6">
                Viewing requests from tenants will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedRequests.pending.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Pending Requests ({groupedRequests.pending.length})
              </h2>
              <div className="space-y-4">
                {groupedRequests.pending.map(request => (
                  <ViewingRequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}

          {groupedRequests.confirmed.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Upcoming Viewings ({groupedRequests.confirmed.length})
              </h2>
              <div className="space-y-4">
                {groupedRequests.confirmed.map(request => (
                  <ViewingRequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}

          {groupedRequests.past.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-600" />
                Past Viewings ({groupedRequests.past.length})
              </h2>
              <div className="space-y-4">
                {groupedRequests.past.map(request => (
                  <ViewingRequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
