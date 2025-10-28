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
  Eye
} from "lucide-react"
import Link from "next/link"
import { viewingRequestsAPI } from "@/lib/api/viewingRequests"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function ViewingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [viewingRequests, setViewingRequests] = useState<any[]>([])
  const [cancelingId, setCancelingId] = useState<string | null>(null)

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

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this viewing request?')) {
      return
    }

    try {
      setCancelingId(requestId)
      await viewingRequestsAPI.delete(requestId)
      setViewingRequests(viewingRequests.filter(r => r.id !== requestId))
      toast.success('Viewing request cancelled')
    } catch (error: any) {
      console.error('Failed to cancel request:', error)
      toast.error(error.message || 'Failed to cancel request')
    } finally {
      setCancelingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-amber-600" />
    }
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
    upcoming: viewingRequests.filter(r => 
      r.status === 'confirmed' && new Date(r.preferred_date) >= new Date()
    ),
    pending: viewingRequests.filter(r => r.status === 'pending'),
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

    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/50 hover:shadow-lg transition-all">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Property Image */}
            <Link href={`/properties/${property?.id}`}>
              <img
                src={property?.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                alt={property?.title || 'Property'}
                className="h-24 w-32 rounded-lg object-cover hover:opacity-90 transition-opacity"
              />
            </Link>

            {/* Request Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
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
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <Badge className={getStatusBadge(request.status)}>
                    {request.status}
                  </Badge>
                </div>
              </div>

              {/* Date & Time */}
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

              {/* Message */}
              {request.message && (
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mb-3">
                  "{request.message}"
                </p>
              )}

              {/* Landlord Response */}
              {request.landlord_notes && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Landlord Response:</p>
                  <p className="text-sm text-blue-800">"{request.landlord_notes}"</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link href={`/properties/${property?.id}`}>
                  <Button variant="outline" size="sm" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                    <Eye className="mr-1 h-4 w-4" />
                    View Property
                  </Button>
                </Link>
                
                {request.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleCancelRequest(request.id)}
                    disabled={cancelingId === request.id}
                  >
                    {cancelingId === request.id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <Trash2 className="mr-1 h-4 w-4" />
                    )}
                    Cancel
                  </Button>
                )}

                {request.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info('Messaging feature coming soon!')}
                  >
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Message Landlord
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
      {/* Header */}
      <div className="mb-8">
        <Link href="/tenant">
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
              Manage your property viewing appointments
            </p>
          </div>
          <Link href="/properties">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Calendar className="mr-2 h-4 w-4" />
              Request New Viewing
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {viewingRequests.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-white/50">
          <CardContent className="py-16">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No viewing requests yet
              </h3>
              <p className="text-slate-600 mb-6">
                Browse properties and request viewings to get started
              </p>
              <Link href="/properties">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Home className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Viewings */}
          {groupedRequests.upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Upcoming Viewings ({groupedRequests.upcoming.length})
              </h2>
              <div className="space-y-4">
                {groupedRequests.upcoming.map(request => (
                  <ViewingRequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}

          {/* Pending Requests */}
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

          {/* Past Viewings */}
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
