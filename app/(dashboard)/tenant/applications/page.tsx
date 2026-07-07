"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, ArrowLeft, Search, Filter, FileText,
  Loader2, AlertCircle, MapPin, CheckCircle, XCircle,
  Eye, MessageSquare, Clock, Users, Grid, List
} from "lucide-react"
import Link from "next/link"
import { applicationsAPI, type Application } from "@/lib/api/applications"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { normalizeAppStatus } from "@/lib/utils/applicationStatus"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

// ============ HELPER FUNCTIONS ============

const formatNGN = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount)

const getStatusBadgeStyle = (status: string) => ({
  pending:   "bg-orange-100 text-orange-800 border-orange-200 font-semibold",
  approved:  "bg-green-100 text-green-800 border-green-200 font-semibold",
  rejected:  "bg-red-100 text-red-800 border-red-200 font-semibold",
  withdrawn: "bg-slate-100 text-slate-800 border-slate-200 font-semibold"
}[status] ?? "bg-slate-100 text-slate-800 border-slate-200 font-semibold")

const getPriorityBorder = (status: string) => {
  switch (status) {
    case 'pending':   return 'border-l-4 border-l-orange-500'
    case 'approved':  return 'border-l-4 border-l-green-500'
    case 'rejected':  return 'border-l-4 border-l-red-500'
    case 'withdrawn': return 'border-l-4 border-l-slate-300'
    default:          return 'border-l-4 border-l-orange-500'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />
    case 'withdrawn': return <AlertCircle className="h-5 w-5 text-slate-500" />
    default:          return <AlertCircle className="h-5 w-5 text-orange-600" />
  }
}

const getStatusLabel = (status: string) => ({
  pending:   'Under Review',
  approved:  'Approved',
  rejected:  'Rejected',
  withdrawn: 'Withdrawn'
}[status] ?? status)

// ============ APPLICATION CARD COMPONENT ============

interface ApplicationCardProps {
  application: Application
  onWithdraw: (id: string) => void
  withdrawingId: string | null
}

function ApplicationCard({ application, onWithdraw, withdrawingId }: ApplicationCardProps) {
  const router = useRouter()
  const property = application.property
  const isPending = application.status === 'pending'
  const isWithdrawing = withdrawingId === application.id

  return (
    <Card className={`border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${getPriorityBorder(application.status)}`}>
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
                ₦{property.price.toLocaleString()}/mo
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
                  {getStatusIcon(application.status)}
                  <Badge className={getStatusBadgeStyle(application.status)}>
                    {getStatusLabel(application.status)}
                  </Badge>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Application details */}
            <div className="flex items-center gap-6 text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-lg">
              {application.monthly_income && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">{formatNGN(application.monthly_income)}</div>
                    <div className="text-xs text-slate-500">Monthly Income</div>
                  </div>
                </div>
              )}
              {application.lease_duration && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">{application.lease_duration}</div>
                    <div className="text-xs text-slate-500">Lease Duration</div>
                  </div>
                </div>
              )}
              {application.move_in_date && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">{new Date(application.move_in_date).toLocaleDateString('en-NG')}</div>
                    <div className="text-xs text-slate-500">Move-in Date</div>
                  </div>
                </div>
              )}
            </div>

            {/* Tenant message */}
            {application.message && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Your Message</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 italic">"{application.message}"</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 flex-wrap">
              <Button
                onClick={() => router.push(`/tenant/applications/${application.id}`)}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-sm"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
              {isPending && (
                <Button
                  onClick={() => onWithdraw(application.id)}
                  disabled={isWithdrawing}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {isWithdrawing ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Withdraw
                </Button>
              )}

              {application.status === 'approved' && (
                <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold animate-pulse">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Application Approved
                </Badge>
              )}

              {application.status === 'rejected' && (
                <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold">
                  <XCircle className="h-3 w-3 mr-1" />
                  Application Rejected
                </Badge>
              )}
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============ TABLE ROW COMPONENT ============

interface ApplicationTableRowProps {
  application: Application
  onWithdraw: (id: string) => void
  withdrawingId: string | null
}

function ApplicationTableRow({ application, onWithdraw, withdrawingId }: ApplicationTableRowProps) {
  const router = useRouter()
  const property = application.property
  const isPending = application.status === 'pending'
  const isWithdrawing = withdrawingId === application.id

  return (
    <tr className="hover:bg-slate-50 border-b border-slate-200">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
            <img
              src={property?.images?.[0] || DEFAULT_PROPERTY_IMAGE}
              alt={property?.title || 'Property'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate max-w-xs">{property?.title || 'Property'}</p>
            <p className="text-sm text-slate-500 truncate flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {property?.location || 'Location not available'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <Badge className={getStatusBadgeStyle(application.status)}>
          {getStatusLabel(application.status)}
        </Badge>
      </td>
      <td className="px-4 py-4 text-sm text-slate-700">
        {application.monthly_income ? formatNGN(application.monthly_income) : '-'}
      </td>
      <td className="px-4 py-4 text-sm text-slate-700">
        {application.move_in_date ? new Date(application.move_in_date).toLocaleDateString('en-NG') : '-'}
      </td>
      <td className="px-4 py-4 text-sm text-slate-500">
        {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => router.push(`/tenant/applications/${application.id}`)}
            size="sm"
            variant="ghost"
            className="text-slate-600 hover:text-orange-600"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {isPending && (
            <Button
              onClick={() => onWithdraw(application.id)}
              disabled={isWithdrawing}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isWithdrawing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ============ PAGE COMPONENT ============

export default function TenantApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/signin")
    }
  }, [user, isLoading, router])

  // Fetch applications on mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true)
        const response = await applicationsAPI.getMyApplications()
        if (response.success && response.applications) {
          // Normalize server-side statuses ("submitted"/"under_review") to the
          // UI-friendly values used by this page (pending/approved/...). The
          // DB check constraint requires "submitted", but the page's filter,
          // stats, and badge logic all key off "pending". Without this,
          // freshly-submitted apps fall through every status check and show
          // up with the wrong badge color + 0 in the pending counter.
          const normalized = (response.applications as any[]).map((a) => ({
            ...a,
            status: normalizeAppStatus(a.status),
          }))
          setApplications(normalized as Application[])
        }
      } catch (error) {
        console.error("Failed to fetch applications:", error)
        toast.error("Failed to load applications")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchApplications()
    }
  }, [user])

  // Handle withdraw
  const handleWithdraw = async (applicationId: string) => {
    // Get application details for confirmation message
    const app = applications.find(a => a.id === applicationId)
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to withdraw your application for "${app?.property?.title}"?\n\n` +
      "You can reapply for this property later."
    )
    if (!confirmed) return

    setWithdrawingId(applicationId)
    try {
      await applicationsAPI.withdraw(applicationId)
      setApplications(prev => prev.filter(a => a.id !== applicationId))
      toast.success("Application withdrawn", {
        description: "You can reapply for this property anytime.",
        duration: 4000
      })
    } catch (error: any) {
      console.error("Failed to withdraw application:", error)
      const errorMessage = 
        error?.response?.data?.detail || 
        error?.message || 
        "Please try again"
      toast.error("Failed to withdraw application", {
        description: errorMessage,
        duration: 4000
      })
    } finally {
      setWithdrawingId(null)
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      !searchQuery ||
      app.property?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.property?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.message?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const groupedApplications = {
    pending: filteredApplications.filter(app => app.status === 'pending'),
    approved: filteredApplications.filter(app => app.status === 'approved'),
    closed: filteredApplications.filter(app => app.status === 'rejected' || app.status === 'withdrawn')
  }

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    withdrawn: applications.filter(a => a.status === 'withdrawn').length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Applications</h3>
              <p className="text-slate-600">Please wait while we fetch your applications...</p>
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
              My Applications
            </h1>
            <p className="text-slate-600">
              Track your property rental applications
            </p>
          </div>
          <Link href="/tenant/properties">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
              <FileText className="mr-2 h-4 w-4" />
              Browse Properties
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Applications</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Review</p>
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
                <p className="text-sm font-medium text-slate-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Withdrawn</p>
                <p className="text-2xl font-bold text-slate-600">{stats.withdrawn}</p>
              </div>
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & filter */}
      {applications.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by property, location, or message..."
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
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className={`${viewMode === 'cards' ? 'bg-orange-500 hover:bg-orange-600' : 'text-slate-600'}`}
            >
              <Grid className="h-4 w-4 mr-2" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={`${viewMode === 'table' ? 'bg-orange-500 hover:bg-orange-600' : 'text-slate-600'}`}
            >
              <List className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
        </div>
      )}

      {/* Main content card */}
      <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Applications</span>
            <span className="text-sm font-normal text-slate-500">{applications.length} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No applications yet</h3>
              <p className="text-slate-600 mb-8">
                Your rental applications will appear here once you start applying for properties.
              </p>
              <Link href="/tenant/properties">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                  <FileText className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-20 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">No matching applications</h3>
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
                viewMode === 'cards' ? (
                  <div className="space-y-6">

                    {groupedApplications.pending.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                          Pending Review ({groupedApplications.pending.length})
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs animate-pulse ml-1">
                            Action Required
                          </Badge>
                        </h3>
                        <div className="space-y-3">
                          {groupedApplications.pending.map(app => (
                            <ApplicationCard
                              key={app.id}
                              application={app}
                              onWithdraw={handleWithdraw}
                              withdrawingId={withdrawingId}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedApplications.approved.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Approved Applications ({groupedApplications.approved.length})
                        </h3>
                        <div className="space-y-3">
                          {groupedApplications.approved.map(app => (
                            <ApplicationCard
                              key={app.id}
                              application={app}
                              onWithdraw={handleWithdraw}
                              withdrawingId={withdrawingId}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedApplications.closed.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-slate-600" />
                          Closed Applications ({groupedApplications.closed.length})
                        </h3>
                        <div className="space-y-3">
                          {groupedApplications.closed.map(app => (
                            <ApplicationCard
                              key={app.id}
                              application={app}
                              onWithdraw={handleWithdraw}
                              withdrawingId={withdrawingId}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Property
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Monthly Income
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Move-in Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Applied
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredApplications.map(app => (
                          <ApplicationTableRow
                            key={app.id}
                            application={app}
                            onWithdraw={handleWithdraw}
                            withdrawingId={withdrawingId}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
