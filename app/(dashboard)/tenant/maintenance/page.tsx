"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { maintenanceAPI, MaintenanceRequest } from "@/lib/api/maintenance"
import { agreementsAPI } from "@/lib/api/agreements"
import {
  Settings, Plus, Calendar, AlertTriangle, CheckCircle, Clock, 
  MessageSquare, ArrowRight, Filter, Search, X, Wrench, Home
} from "lucide-react"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"

export default function TenantMaintenancePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedProperty, setSelectedProperty] = useState<string>("all")
  const [rentedProperties, setRentedProperties] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      fetchMaintenanceRequests()
    }
  }, [user?.id, selectedProperty])

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true)
      
      // First get all tenant's active agreements (rented properties)
      const agreementsResponse = await agreementsAPI.getMyAgreements('ACTIVE')
      const activeAgreements = agreementsResponse.agreements || []
      
      // Set rented properties for dropdown
      setRentedProperties(activeAgreements)
      
      // Extract all property IDs from active agreements
      const rentedPropertyIds = activeAgreements.map(agreement => agreement.property_id)
      
      // Fetch maintenance requests for all rented properties
      const allMaintenanceRequests = []
      
      if (rentedPropertyIds.length > 0) {
        // Fetch maintenance for each rented property
        const maintenancePromises = rentedPropertyIds.map(async (propertyId) => {
          try {
            const propertyMaintenance = await maintenanceAPI.getByProperty(propertyId)
            return propertyMaintenance || []
          } catch (error) {
            console.error(`Failed to fetch maintenance for property ${propertyId}:`, error)
            return []
          }
        })
        
        const maintenanceResults = await Promise.all(maintenancePromises)
        allMaintenanceRequests.push(...maintenanceResults.flat())
      }
      
      // Apply filters
      let filteredRequests = allMaintenanceRequests
      if (statusFilter !== "all") {
        filteredRequests = allMaintenanceRequests.filter(request => request.status === statusFilter)
      }
      if (selectedProperty !== "all") {
        filteredRequests = filteredRequests.filter(request => request.property_id === selectedProperty)
      }
      if (searchTerm) {
        filteredRequests = filteredRequests.filter(request => 
          request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (request.property?.title && request.property.title.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }
      
      setRequests(filteredRequests)
    } catch (err: any) {
      console.error("Failed to fetch maintenance requests:", err)
      setError(err.message || "Failed to load maintenance requests")
      toast.error("Failed to load maintenance requests")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACKNOWLEDGED': return 'bg-orange-100 text-orange-800'
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
      request.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [requests, searchTerm])

  const getUserName = () => {
    return user?.full_name || user?.email?.split('@')[0] || 'there'
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
                Maintenance Requests
              </h1>
              <p className="text-gray-600">Track and manage maintenance issues for all your rented properties</p>
            </div>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
              <Plus className="mr-2 h-4 w-4" />Report New Issue
            </Button>
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
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white mr-2"
              >
                <option value="all">All Properties</option>
                {rentedProperties.map((property: any) => (
                  <option key={property.property_id} value={property.property_id}>
                    {property.property?.title || 'Unknown Property'}
                  </option>
                ))}
              </select>
              {['all', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  {status === 'all' ? 'All' : status}
                </Button>
              ))}
            </div>
          </div>
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
                  {searchTerm || statusFilter !== 'all' 
                    ? "No requests match your filters" 
                    : "No maintenance requests for your rented properties. Report an issue to get started."}
                </p>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />Report New Issue
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
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
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
                        {request.category && (
                          <div className="flex items-center gap-1">
                            <Wrench className="h-4 w-4" />
                            <span>{request.category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />View Details
                      </Button>
                      {request.status === 'RESOLVED' && (
                        <Button variant="outline" size="sm">
                          <CheckCircle className="mr-2 h-4 w-4" />Rate Resolution
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {request.landlord_response && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Landlord Response</p>
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
