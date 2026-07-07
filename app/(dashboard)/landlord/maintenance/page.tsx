"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { maintenanceAPI, MaintenanceRequest, MaintenanceStats } from "@/lib/api/maintenance"
import { agreementsAPI } from "@/lib/api/agreements"
import {
  Settings, Plus, Calendar, AlertTriangle, CheckCircle, Clock, 
  MessageSquare, ArrowRight, Filter, Search, X, User, Home,
  DollarSign, Wrench, Building2, TrendingUp, Zap
} from "lucide-react"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"

export default function LandlordMaintenancePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [stats, setStats] = useState<MaintenanceStats | null>(null)
  const [agreements, setAgreements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all")

  useEffect(() => {
    if (user?.id) {
      fetchAllData()
    }
  }, [user?.id])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (statusFilter !== "all") filters.status = statusFilter
      if (urgencyFilter !== "all") filters.urgency = urgencyFilter
      
      const [requestsData, statsData, agreementsData] = await Promise.all([
        maintenanceAPI.getAll(filters),
        maintenanceAPI.getStats(),
        agreementsAPI.getMyAgreements()
      ])
      
      setRequests(requestsData)
      setStats(statsData)
      setAgreements(agreementsData.agreements || [])
    } catch (err: any) {
      console.error("Failed to fetch data:", err)
      setError(err.message || "Failed to load maintenance requests")
      toast.error("Failed to load maintenance requests")
    } finally {
      setLoading(false)
    }
  }

  const fetchMaintenanceRequests = fetchAllData

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACKNOWLEDGED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'LOW': return 'bg-blue-100 text-blue-800'
      case 'MEDIUM': return 'bg-orange-100 text-orange-800'
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'EMERGENCY': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRequests = useMemo(() => {
    return requests.filter(request => 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.property?.title && request.property.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [requests, searchTerm])

  const getUserName = () => {
    return user?.full_name || user?.email?.split('@')[0] || 'there'
  }

  const handleStatusUpdate = async (requestId: string, newStatus: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    try {
      await maintenanceAPI.update(requestId, { status: newStatus })
      toast.success("Maintenance request updated successfully")
      fetchMaintenanceRequests()
    } catch (err: any) {
      console.error("Failed to update maintenance request:", err)
      toast.error("Failed to update maintenance request")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading maintenance requests...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Maintenance Requests</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <Button onClick={fetchMaintenanceRequests} className="bg-orange-500 hover:bg-orange-600">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                Maintenance Management
              </h1>
              <p className="text-gray-600">Track and manage maintenance requests for your properties</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                <Settings className="mr-2 h-4 w-4" />Maintenance Stats
              </Button>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                <DollarSign className="mr-2 h-4 w-4" />View Costs
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search maintenance requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  {status === 'all' ? 'All Status' : status}
                </Button>
              ))}
              {['all', 'EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'].map(urgency => (
                <Button
                  key={urgency}
                  variant={urgencyFilter === urgency ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUrgencyFilter(urgency)}
                  className={urgencyFilter === urgency ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  {urgency === 'all' ? 'All Priority' : urgency}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Rented Properties Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Building2 className="h-10 w-10 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">Rented Properties</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {agreements.filter(a => a.status === 'ACTIVE' || a.status === 'SIGNED').length}
                  </p>
                  <p className="text-xs text-orange-500 mt-1">Total active tenancies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-10 w-10 text-indigo-600" />
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Monthly Rent</p>
                  <p className="text-3xl font-bold text-indigo-900">
                    ₦{agreements.filter(a => a.status === 'ACTIVE' || a.status === 'SIGNED').reduce((sum, a) => sum + (Number(a.rent_amount) || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-indigo-500 mt-1">Total monthly revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-teal-200 bg-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Zap className="h-10 w-10 text-teal-600" />
                <div>
                  <p className="text-sm text-teal-600 font-medium">Properties Needing Attention</p>
                  <p className="text-3xl font-bold text-teal-900">
                    {stats?.pending_requests || 0}
                  </p>
                  <p className="text-xs text-teal-500 mt-1">Pending maintenance requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Maintenance Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {stats?.pending_requests ?? requests.filter(r => r.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wrench className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats?.in_progress_requests ?? requests.filter(r => r.status === 'IN_PROGRESS').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-red-600">Emergency</p>
                  <p className="text-2xl font-bold text-red-900">
                    {stats?.emergency_requests ?? requests.filter(r => r.urgency === 'EMERGENCY').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats?.resolved_requests ?? requests.filter(r => r.status === 'RESOLVED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Total Cost</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ₦{stats?.total_cost?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Requests */}
        {filteredRequests.length === 0 ? (
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No maintenance requests</h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all' 
                    ? "No requests match your filters" 
                    : "Your tenants haven't reported any maintenance issues yet"}
                </p>
                <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                  <ArrowRight className="mr-2 h-4 w-4" />View Properties
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{request.title}</h3>
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">{request.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Reported: {new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        {request.property && (
                          <div className="flex items-center gap-1">
                            <Home className="h-4 w-4" />
                            <span>{request.property.title}</span>
                          </div>
                        )}
                        {request.tenant && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{request.tenant.full_name}</span>
                          </div>
                        )}
                        {request.category && (
                          <div className="flex items-center gap-1">
                            <Wrench className="h-4 w-4" />
                            <span>{request.category}</span>
                          </div>
                        )}
                      </div>
                      
                      {request.estimated_cost && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                          <DollarSign className="h-4 w-4" />
                          <span>Estimated Cost: ₦{request.estimated_cost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {request.status === 'PENDING' && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => handleStatusUpdate(request.id, 'ACKNOWLEDGED')}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />Acknowledge
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'IN_PROGRESS')}
                          >
                            <Wrench className="mr-2 h-4 w-4" />Start Work
                          </Button>
                        </>
                      )}
                      {request.status === 'ACKNOWLEDGED' && (
                        <Button 
                          size="sm" 
                          className="bg-purple-500 hover:bg-purple-600 text-white"
                          onClick={() => handleStatusUpdate(request.id, 'IN_PROGRESS')}
                        >
                          <Wrench className="mr-2 h-4 w-4" />Start Work
                        </Button>
                      )}
                      {request.status === 'IN_PROGRESS' && (
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => handleStatusUpdate(request.id, 'RESOLVED')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />Mark Resolved
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />View Details
                      </Button>
                    </div>
                  </div>
                  
                  {request.landlord_response && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Response</p>
                          <p className="text-gray-600">{request.landlord_response}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
