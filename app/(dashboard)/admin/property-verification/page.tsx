"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useDashboard } from "@/contexts/DashboardContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Home, 
  MapPin,
  AlertTriangle,
  RefreshCw,
  Calendar,
  FileText,
  Image,
  Building2,
  Filter,
  Search,
  ArrowLeft,
  Loader2,
  Shield,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Bath,
  Square,
  Car,
  Wifi,
  Tv
} from "lucide-react"

// Import our new API client
import propertyVerificationAPI, { 
  type Property, 
  type PropertyStats, 
  type PropertyFilters,
  getVerificationStatusBadge,
  formatPrice,
  formatAddress,
  getPrimaryImage
} from "@/lib/api/propertyVerification"

export default function PropertyVerification() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  // ✅ USE DASHBOARD CONTEXT FOR CACHING
  const { 
    stats: cachedStats,
    invalidateCache,
    fetchDashboardStats
  } = useDashboard()
  
  // Debug: Log user info
  useEffect(() => {
    if (user && !authLoading) {
      console.log('🔍 [PROPERTY-VERIFICATION] Current user:', {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        verification_status: user.verification_status
      })
    }
  }, [user, authLoading])
  
  // Data state
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<PropertyStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [verificationFilter, setVerificationFilter] = useState<string>("pending")
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all")
  const [cityFilter, setCityFilter] = useState<string>("all")
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Dialog state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null)

  // ✅ TRACK INITIAL LOAD - Smart loading condition
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // ==================== FETCH STATS ====================
  const fetchStats = async (skipLoading = false) => {
    try {
      if (!skipLoading) setStatsLoading(true)
      const data = await propertyVerificationAPI.getPropertyStats()
      setStats(data)
      console.log('✅ Property stats loaded:', data)
      return data
    } catch (error: any) {
      console.error('❌ Error fetching stats:', error)
      if (!skipLoading) toast.error(error.message || 'Failed to fetch statistics')
      return null
    } finally {
      if (!skipLoading) setStatsLoading(false)
    }
  }

  // ==================== FETCH PROPERTIES ====================
  const fetchProperties = async () => {
    try {
      setLoading(true)
      
      // Build filters
      const filters: PropertyFilters = {}
      if (verificationFilter !== "all") {
        filters.verification_status = verificationFilter as any
      }
      if (propertyTypeFilter !== "all") {
        filters.property_type = propertyTypeFilter
      }
      if (cityFilter !== "all") {
        filters.city = cityFilter
      }
      
      console.log('📤 Fetching properties with filters:', filters)
      
      const data = await propertyVerificationAPI.getAllProperties(filters, page, limit)
      
      setProperties(data.properties)
      setTotal(data.total)
      setTotalPages(data.total_pages)
      
      console.log('📤 Properties Fetched ', data.properties)
      console.log('✅ Properties loaded:', data.properties.length)
      
      // Log first property structure to debug
      if (data.properties.length > 0) {
        console.log('🔍 [PROPERTY-VERIFICATION PAGE] First property keys:', Object.keys(data.properties[0]))
        console.log('🔍 Landlord data on first property:', data.properties[0].landlord)
        console.log('🔍 Price field:', data.properties[0].price)
        console.log('🔍 Beds field:', data.properties[0].beds)
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching properties:', error)
      toast.error(error.message || 'Failed to fetch properties')
    } finally {
      setLoading(false)
    }
  }

  // ==================== PROPERTY ACTIONS ====================
  const handleApprove = async (property: Property) => {
    try {
      await propertyVerificationAPI.verifyProperty(property.id, { action: 'approve' })
      toast.success('Property approved successfully!')
      
      // Close dialog and reset state
      setActionDialogOpen(false)
      setSelectedProperty(null)
      setPendingAction(null)
      
      // Invalidate cache and fetch fresh data
      invalidateCache()
      await Promise.all([
        fetchProperties(),
        fetchStats()  // ✅ Use local fetchStats to update page stats immediately
      ])
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve property')
    }
  }

  const handleReject = async (property: Property) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    
    try {
      await propertyVerificationAPI.verifyProperty(property.id, { 
        action: 'reject', 
        rejection_reason: rejectionReason 
      })
      toast.success('Property rejected successfully!')
      setActionDialogOpen(false)
      setRejectionReason("")
      setSelectedProperty(null)
      setPendingAction(null)
      
      // Invalidate cache and fetch fresh data
      invalidateCache()
      await Promise.all([
        fetchProperties(),
        fetchStats()  // ✅ Use local fetchStats to update page stats immediately
      ])
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject property')
    }
  }

  const openActionDialog = (property: Property, action: 'approve' | 'reject') => {
    setSelectedProperty(property)
    setPendingAction(action)
    setActionDialogOpen(true)
    if (action === 'reject') {
      setRejectionReason("")
    }
  }

  // ==================== EFFECTS ====================
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initial data fetch - runs once when user is authenticated
  useEffect(() => {
    if (mounted && !authLoading && user?.user_type === 'admin' && !hasInitialLoad) {
      // Set flag immediately to prevent duplicate calls
      setHasInitialLoad(true)
      
      // Fetch both stats and properties without loading states on initial load
      const loadInitialData = async () => {
        try {
          await Promise.all([
            fetchStats(true),  // Skip loading state for initial load
            fetchProperties()
          ])
        } finally {
          setIsInitialLoading(false)  // Mark initial load as complete
        }
      }
      
      loadInitialData()
    }
  }, [mounted, authLoading, user, hasInitialLoad])

  // Refetch when filters change (after initial load)
  useEffect(() => {
    if (hasInitialLoad && mounted) {
      fetchProperties()
    }
  }, [page, verificationFilter, propertyTypeFilter, cityFilter, hasInitialLoad, mounted])

  // Auth protection
  useEffect(() => {
    if (!authLoading && mounted) {
      if (!user) {
        router.push('/signin')
        return
      }
      
      if (user.user_type !== 'admin') {
        router.push('/dashboard')
        return
      }
    }
  }, [user, authLoading, mounted, router])

  // ==================== LOADING STATE ====================
  // ✅ FIX: Smart loading state - shows skeleton ONLY if initial load is in progress
  // Prevents stuck loading when data is available
  if (!mounted || isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Skeleton className="h-10 w-1/2 mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-orange-200 bg-white/80">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Skeleton */}
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  // ==================== HELPER FUNCTIONS ====================
  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase()
    if (amenityLower.includes('parking')) return <Car className="h-4 w-4" />
    if (amenityLower.includes('wifi')) return <Wifi className="h-4 w-4" />
    if (amenityLower.includes('tv')) return <Tv className="h-4 w-4" />
    return <Home className="h-4 w-4" />
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const handleRefresh = () => {
    fetchStats()
    fetchProperties()
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                Property Verification
              </h1>
              <p className="text-gray-600">Review and approve property listings submitted by landlords</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {statsLoading && !stats ? (
              // Loading skeletons
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-orange-200 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                      <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : stats ? (
              // Actual stats
              <>
                <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Properties</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Pending Review</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Approved</p>
                        <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm text-gray-600">Rejected</p>
                        <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              
              {/* Verification Filter */}
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-full sm:w-40 border-orange-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Property Type Filter */}
              <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                <SelectTrigger className="w-full sm:w-40 border-orange-200">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="duplex">Duplex</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>
              
              {/* City Filter */}
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-40 border-orange-200">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Lagos">Lagos</SelectItem>
                  <SelectItem value="Abuja">Abuja</SelectItem>
                  <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        {/* Properties Table */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Shield className="h-5 w-5" />
              Property Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-2 text-gray-600">Loading properties...</span>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No properties found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow key={property.id} className="hover:bg-orange-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={getPrimaryImage(property)} 
                                alt={property.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/property-placeholder.svg'
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 max-w-xs truncate">{property.title}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {formatAddress(property)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{property.landlord?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{property.landlord?.email || 'No email'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {property.property_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-gray-900">{formatPrice(property.price)}</p>
                          <p className="text-sm text-gray-500">/month</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getVerificationStatusBadge(property.verification_status).className}>
                            {getVerificationStatusBadge(property.verification_status).icon}
                            {getVerificationStatusBadge(property.verification_status).text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500">
                            {new Date(property.created_at).toLocaleDateString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedProperty(property)}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {property.verification_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => openActionDialog(property, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openActionDialog(property, 'reject')}
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} properties
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Property Details Dialog */}
        <Dialog open={!!selectedProperty && !actionDialogOpen} onOpenChange={(open) => !open && setSelectedProperty(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedProperty && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-orange-900">
                    <Home className="h-5 w-5" />
                    {selectedProperty.title}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Property Images */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Property Images</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProperty.images && selectedProperty.images.length > 0 ? (
                        selectedProperty.images.slice(0, 4).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Property image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = '/images/property-placeholder.svg'
                            }}
                          />
                        ))
                      ) : (
                        <div className="col-span-2 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Property Details */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Property Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{selectedProperty.property_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bedrooms:</span>
                        <span className="font-medium">{selectedProperty.beds}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bathrooms:</span>
                        <span className="font-medium">{selectedProperty.baths}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium">{selectedProperty.sqft} sqft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rent:</span>
                        <span className="font-medium text-orange-600">{formatPrice(selectedProperty.price)}/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Security Deposit:</span>
                        <span className="font-medium">{formatPrice(selectedProperty.security_deposit)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600">{selectedProperty.description}</p>
                </div>
                
                {/* Amenities */}
                {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProperty.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {getAmenityIcon(amenity)}
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Landlord Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Landlord Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedProperty.landlord?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{selectedProperty.landlord?.email || 'No email'}</p>
                    <Badge className="mt-2">
                      {selectedProperty.landlord?.verification_status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                
                {/* Actions */}
                {selectedProperty.verification_status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => openActionDialog(selectedProperty, 'approve')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Property
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openActionDialog(selectedProperty, 'reject')}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Property
                    </Button>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {pendingAction === 'approve' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Approve Property
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    Reject Property
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedProperty && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{selectedProperty.title}</p>
                  <p className="text-sm text-gray-500">{formatAddress(selectedProperty)}</p>
                </div>
                
                {pendingAction === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <Textarea
                      placeholder="Please provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                )}
                
                {pendingAction === 'approve' && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      This property will be approved and listed on the marketplace for tenants to view and apply for.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      if (pendingAction === 'approve') {
                        handleApprove(selectedProperty)
                      } else {
                        handleReject(selectedProperty)
                      }
                    }}
                    className={pendingAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                    disabled={pendingAction === 'reject' && !rejectionReason.trim()}
                  >
                    {pendingAction === 'approve' ? 'Approve' : 'Reject'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionDialogOpen(false)
                      setSelectedProperty(null)
                      setPendingAction(null)
                      setRejectionReason("")
                    }}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
