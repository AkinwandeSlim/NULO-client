"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  Building2, Plus, Edit, Eye, Search,
  Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Clock,
  ArrowLeft, RefreshCw, Loader2, Shield, ChevronLeft, ChevronRight
} from "lucide-react"

// OPTION 1: Import directly from the module (RECOMMENDED)
import landlordUsersAPI from "@/lib/api/landlordUsers"
import type { LandlordUser, LandlordStats, LandlordListParams } from "@/lib/api/landlordUsers"

// OPTION 2: Import from centralized index (if you prefer)
// import { landlordUsersAPI } from "@/lib/api"
// import type { LandlordUser, LandlordStats, LandlordListParams } from "@/lib/api"

export default function LandlordManagement() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  // Debug: Log user info
  useEffect(() => {
    if (user && !authLoading) {
      console.log('🔍 [LANDLORD-MGMT] Current user:', {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        verification_status: user.verification_status
      })
    }
  }, [user, authLoading])
  
  // Data state
  const [landlords, setLandlords] = useState<LandlordUser[]>([])
  const [stats, setStats] = useState<LandlordStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [verificationFilter, setVerificationFilter] = useState<string>("all")
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "trust_score">("newest")
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Refs
  const hasInitialLoadRef = useRef(false)

  // ==================== FETCH STATS ====================
  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const data = await landlordUsersAPI.getLandlordStats()
      setStats(data)
      console.log('✅ Stats loaded:', data)
    } catch (error: any) {
      console.error('❌ Error fetching stats:', error)
      toast.error(error.message || 'Failed to fetch statistics')
    } finally {
      setStatsLoading(false)
    }
  }

  // ==================== FETCH LANDLORDS ====================
  const fetchLandlords = async () => {
    try {
      setLoading(true)
      
      // Build params
      const params: LandlordListParams = {
        page,
        limit,
        sort_by: sortBy
      }
      
      if (searchQuery) params.search = searchQuery
      if (verificationFilter !== "all") params.verification_status = verificationFilter as any
      if (accountTypeFilter !== "all") params.account_type = accountTypeFilter as any
      
      console.log('📤 Fetching landlords with params:', params)
      
      const data = await landlordUsersAPI.getAllLandlords(params)
      
      setLandlords(data.landlords)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.total_pages)
      
      console.log('✅ Landlords loaded:', data.landlords.length)
      
      if (!hasInitialLoadRef.current) {
        hasInitialLoadRef.current = true
      }
    } catch (error: any) {
      console.error('❌ Error fetching landlords:', error)
      toast.error(error.message || 'Failed to fetch landlords')
    } finally {
      setLoading(false)
    }
  }

  // ==================== EFFECTS ====================
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch data when mounted and authenticated
  useEffect(() => {
    if (mounted && !authLoading && user) {
      // Add a small delay to ensure token refresh is complete
      const timer = setTimeout(() => {
        fetchStats()
        fetchLandlords()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [mounted, authLoading, user, page, sortBy])

  // Refetch when filters change (reset to page 1)
  useEffect(() => {
    if (hasInitialLoadRef.current) {
      setPage(1)
      fetchLandlords()
    }
  }, [searchQuery, verificationFilter, accountTypeFilter])

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
  // ✅ FIX: Only show full-page loading on true initial auth load
  // If mounted and not authLoading, show content even while data is fetching
  if (!mounted || (authLoading && !hasInitialLoadRef.current)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  // ==================== HELPER FUNCTIONS ====================
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'pending':
        return <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Partial</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getAccountTypeBadge = (type?: string) => {
    if (type === 'company') {
      return <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white">Company</Badge>
    }
    return <Badge className="bg-gradient-to-r from-orange-300 to-orange-400 text-white">Individual</Badge>
  }

  const handleRefresh = () => {
    fetchStats()
    fetchLandlords()
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
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
                Landlord Management
              </h1>
              <p className="text-gray-600">View and manage all landlord accounts</p>
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
                        <p className="text-sm text-gray-600">Total Landlords</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Verified</p>
                        <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">With Properties</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.with_properties}</p>
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
                  placeholder="Search landlords..."
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
                  <SelectItem value="approved">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Account Type Filter */}
              <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                <SelectTrigger className="w-full sm:w-40 border-orange-200">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-full sm:w-40 border-orange-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="trust_score">Trust Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleRefresh} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => router.push('/admin/users/create')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Landlord
              </Button>
            </div>
          </div>
        </div>

        {/* Landlords Table */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-orange-100">
            <CardTitle className="flex items-center justify-between text-orange-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span>All Landlords ({total})</span>
              </div>
              <div className="text-sm font-normal text-gray-600">
                Page {page} of {totalPages}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !hasInitialLoadRef.current ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-2 text-gray-600">Loading landlords...</span>
              </div>
            ) : landlords.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-16 w-16 mx-auto text-orange-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Landlords Found</h3>
                <p className="text-gray-600">
                  {searchQuery || verificationFilter !== "all" || accountTypeFilter !== "all" 
                    ? 'No landlords match your search criteria.' 
                    : 'No landlords have registered yet.'}
                </p>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-orange-50/50">
                      <TableRow>
                        <TableHead className="text-orange-800">Landlord Info</TableHead>
                        <TableHead className="text-orange-800">Contact</TableHead>
                        <TableHead className="text-orange-800">Account Type</TableHead>
                        <TableHead className="text-orange-800">Verification</TableHead>
                        <TableHead className="text-orange-800">Properties</TableHead>
                        <TableHead className="text-orange-800">Joined</TableHead>
                        <TableHead className="text-orange-800">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {landlords.map((landlord) => (
                        <TableRow key={landlord.id} className="hover:bg-orange-50/30">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900">{landlord.full_name || 'N/A'}</p>
                              {landlord.company_name && (
                                <p className="text-sm text-gray-600">{landlord.company_name}</p>
                              )}
                              <p className="text-xs text-gray-500">ID: {landlord.id.slice(0, 8)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">{landlord.email}</span>
                              </div>
                              {landlord.phone_number && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600">{landlord.phone_number}</span>
                                </div>
                              )}
                              {landlord.location && (
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600">{landlord.location}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getAccountTypeBadge(landlord.account_type)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {getStatusBadge(landlord.verification_status)}
                              <div className="flex gap-1">
                                {landlord.nin_verified && (
                                  <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                                    <Shield className="h-2 w-2 mr-1" />NIN
                                  </Badge>
                                )}
                                {landlord.bvn_verified && (
                                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                                    <Shield className="h-2 w-2 mr-1" />BVN
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Listed:</span>
                                <span className="font-medium text-orange-600">{landlord.properties_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Applications:</span>
                                <span className="font-medium">{landlord.applications_count || 0}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span>{new Date(landlord.created_at).toLocaleDateString()}</span>
                              </div>
                              {landlord.verification_submitted_at && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Applied: {new Date(landlord.verification_submitted_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/users/landlords/${landlord.id}`)}
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/users/landlords/${landlord.id}/edit`)}
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} landlords
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1 || loading}
                        className="border-orange-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = i + 1
                          if (totalPages > 5) {
                            if (page <= 3) {
                              pageNum = i + 1
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = page - 2 + i
                            }
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              disabled={loading}
                              className={page === pageNum 
                                ? "bg-orange-500 hover:bg-orange-600" 
                                : "border-orange-200"
                              }
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages || loading}
                        className="border-orange-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}