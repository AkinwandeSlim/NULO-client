"use client"

/**
 * Landlord Verification Management Page - IMPROVED
 * 🚀 Enhanced with search, filters, pagination, and better UX
 * 
 * NEW FEATURES:
 * - 🔍 Real-time search
 * - 🎯 Advanced filters (status, account type, date range)
 * - 📄 Pagination with page size control
 * - ⚡ Optimized caching strategy
 * - 🎨 Better visual hierarchy
 * - 📊 Enhanced stats cards
 * - 🔄 Smart background refresh
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboard } from '@/contexts/DashboardContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2,
  Eye,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'

import { verificationAPI } from "@/lib/api"
import type { LandlordVerification, VerificationStats } from "@/lib/api"

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEY = 'landlord_verifications_cache_v2'
const CACHE_STATS_KEY = 'verification_stats_cache_v2'
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
const AUTO_REFRESH_INTERVAL = 60 * 1000 // 60 seconds
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

interface CachedData<T> {
  data: T
  timestamp: number
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

const saveToCache = <T,>(key: string, data: T): void => {
  try {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(cached))
  } catch (error) {
    console.warn('Failed to save to cache:', error)
  }
}

const getFromCache = <T,>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    
    const { data, timestamp }: CachedData<T> = JSON.parse(cached)
    
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key)
      return null
    }
    
    return data
  } catch (error) {
    console.warn('Failed to read from cache:', error)
    return null
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LandlordVerificationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // ✅ USE DASHBOARD CONTEXT FOR AUTO-CACHING
  const { stats: cachedStats } = useDashboard()
  
  // Core State
  const [allVerifications, setAllVerifications] = useState<LandlordVerification[]>([])
  const [stats, setStats] = useState<VerificationStats>({
    total: 0,
    pending: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
    needs_correction: 0,
    not_submitted: 0
  })
  
  // UI State
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasCacheData, setHasCacheData] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  
  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isMountedRef = useRef<boolean>(true)
  const hasInitialLoadRef = useRef<boolean>(false)

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  const fetchVerifications = useCallback(async (showLoader = true, useCache = true) => {
    try {
      if (showLoader && !hasInitialLoadRef.current) {
        setIsLoading(true)
      }
      setError(null)
      
      console.log('📤 [VERIFICATION PAGE] Fetching data...')
      
      // Try cache first for instant load
      if (useCache && hasInitialLoadRef.current) {
        const cachedData = getFromCache<LandlordVerification[]>(CACHE_KEY)
        const cachedStats = getFromCache<VerificationStats>(CACHE_STATS_KEY)
        
        if (cachedData && cachedStats) {
          console.log('⚡ [CACHE] Loading from cache')
          setAllVerifications(cachedData)
          setStats(cachedStats)
          setHasCacheData(true)
          setIsLoading(false)
          showLoader = false
        }
      }
      
      // Fetch fresh data
      const [verificationsData, statsData] = await Promise.all([
        verificationAPI.getAllLandlordVerifications(),
        verificationAPI.getVerificationStats()
      ])
      
      if (!isMountedRef.current) return
      
      // Update state
      setAllVerifications(verificationsData.verifications || [])
      setStats(statsData)
      setIsLoading(false)
      hasInitialLoadRef.current = true
      
      // Save to cache
      saveToCache(CACHE_KEY, verificationsData.verifications || [])
      saveToCache(CACHE_STATS_KEY, statsData)
      
      console.log('✅ [VERIFICATION PAGE] Data loaded:', verificationsData.verifications?.length || 0)
      
      if (hasCacheData) {
        console.log('🔄 [CACHE] Background refresh completed')
      }
      
    } catch (err: any) {
      console.error('❌ [VERIFICATION PAGE] Error:', err)
      if (!isMountedRef.current) return
      
      if (!hasCacheData && !hasInitialLoadRef.current) {
        setError(err.message || 'Failed to load verifications')
      }
      
      setIsLoading(false)
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false)
      }
    }
  }, [hasCacheData])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    fetchVerifications(false, false)
  }, [fetchVerifications])

  // ============================================================================
  // FILTERING & PAGINATION
  // ============================================================================

  const filteredVerifications = allVerifications.filter((v) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = v.landlord?.full_name?.toLowerCase().includes(query)
      const matchesEmail = v.landlord?.email?.toLowerCase().includes(query)
      const matchesCompany = v.company_name?.toLowerCase().includes(query)
      
      if (!matchesName && !matchesEmail && !matchesCompany) {
        return false
      }
    }
    
    // Status filter
    if (statusFilter !== 'all' && v.admin_review_status !== statusFilter) {
      return false
    }
    
    // Account type filter
    if (accountTypeFilter !== 'all' && v.account_type !== accountTypeFilter) {
      return false
    }
    
    return true
  })

  // Sort
  const sortedVerifications = [...filteredVerifications].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'name':
        return (a.landlord?.full_name || '').localeCompare(b.landlord?.full_name || '')
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedVerifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVerifications = sortedVerifications.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, accountTypeFilter, sortBy])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // ✅ Auth protection and initial data load
  useEffect(() => {
    if (!authLoading && user && user.user_type === 'admin') {
      setDataReady(true)
      isMountedRef.current = true
      
      fetchVerifications(true, true)
      
      refreshIntervalRef.current = setInterval(() => {
        console.log('🔄 [AUTO-REFRESH] Background refresh...')
        fetchVerifications(false, false)
      }, AUTO_REFRESH_INTERVAL)
      
      return () => {
        isMountedRef.current = false
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
  }, [authLoading, user, fetchVerifications])

  // ✅ USE CACHED STATS IF AVAILABLE
  useEffect(() => {
    if (cachedStats && !stats.total) {
      console.log('💾 [CACHE HIT] Using cached dashboard stats')
      setDataReady(true)
    }
  }, [cachedStats, stats.total])

  // ============================================================================
  // LOADING STATE - Smart: only show on true auth load with no data
  // ============================================================================
  if (!dataReady || (authLoading && !hasInitialLoadRef.current && !allVerifications.length)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
        <div className="container mx-auto py-6 space-y-6 px-4">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-10 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-slate-200">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Filters Skeleton */}
          <Card className="border-slate-200">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Skeleton */}
          <Card className="border-slate-200">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { 
        icon: Clock, 
        label: 'Pending',
        className: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
      },
      in_review: {
        icon: AlertTriangle,
        label: 'In Review',
        className: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
      },
      approved: { 
        icon: CheckCircle, 
        label: 'Approved',
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      rejected: { 
        icon: XCircle, 
        label: 'Rejected',
        className: 'bg-red-100 text-red-700 border-red-200'
      },
      needs_correction: {
        icon: AlertCircle,
        label: 'Needs Correction',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      }
    }
    const config = configs[status as keyof typeof configs] || configs.pending
    const Icon = config.icon
    
    return (
      <Badge className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Landlord Verifications</h1>
          <p className="text-slate-600 mt-1">
            Review and manage landlord verification requests
            {hasCacheData && !isLoading && (
              <span className="ml-2 text-xs text-orange-600 font-medium">
                ⚡ Cached • Auto-refresh every 60s
              </span>
            )}
          </p>
        </div>
        
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading && !hasInitialLoadRef.current ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-slate-200">
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2" />
                </CardHeader>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-600">Total</CardDescription>
                <CardTitle className="text-3xl text-slate-900">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
              <CardHeader className="pb-2">
                <CardDescription className="text-orange-700">Pending</CardDescription>
                <CardTitle className="text-3xl text-orange-600">{stats.pending}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="border-green-100 bg-gradient-to-br from-green-50 to-green-100/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-green-700">Approved</CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="border-red-100 bg-gradient-to-br from-red-50 to-red-100/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-red-700">Rejected</CardDescription>
                <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      {/* Error State */}
      {error && !hasCacheData && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-600" />
            <CardTitle>Filters & Search</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="needs_correction">Needs Correction</SelectItem>
              </SelectContent>
            </Select>

            {/* Account Type Filter */}
            <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
              <SelectTrigger className="border-slate-300">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort & Results Info */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-slate-600">
              Showing {startIndex + 1}-{Math.min(endIndex, sortedVerifications.length)} of {sortedVerifications.length} verifications
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifications List */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-slate-900">Verification Requests</CardTitle>
          <CardDescription className="text-slate-600">
            {isLoading && !hasInitialLoadRef.current ? 'Loading verifications...' : 
             `${paginatedVerifications.length} verification${paginatedVerifications.length !== 1 ? 's' : ''} on this page`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {isLoading && !hasInitialLoadRef.current ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-orange-600" />
              <p className="text-slate-600 mt-4">Loading verifications...</p>
            </div>
          ) : paginatedVerifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-lg font-medium text-slate-900 mb-2">No verifications found</p>
              <p className="text-slate-600">
                {searchQuery || statusFilter !== 'all' || accountTypeFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'No verification requests available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedVerifications.map((verification) => (
                <Card 
                  key={verification.id} 
                  className="hover:shadow-lg hover:border-orange-300 transition-all duration-200 border-slate-200"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-sm">
                          {verification.account_type === 'company' ? (
                            <Building2 className="h-6 w-6 text-orange-600" />
                          ) : (
                            <User className="h-6 w-6 text-orange-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-slate-900">
                              {verification.landlord?.full_name || 'N/A'}
                            </h3>
                            {getStatusBadge(verification.admin_review_status)}
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-2">
                            {verification.landlord?.email || 'No email'}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Type:</span>{' '}
                              <span className="font-medium text-slate-700 capitalize">
                                {verification.account_type}
                              </span>
                            </div>
                            
                            {verification.company_name && (
                              <div>
                                <span className="text-slate-500">Company:</span>{' '}
                                <span className="font-medium text-slate-700">
                                  {verification.company_name}
                                </span>
                              </div>
                            )}
                            
                            <div>
                              <span className="text-slate-500">Submitted:</span>{' '}
                              <span className="font-medium text-slate-700">
                                {formatDate(verification.submitted_for_review_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => router.push(`/admin/landlord-verification/${verification.id}`)}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && paginatedVerifications.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Show:</span>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[100px] border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toString()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-600">per page</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-300"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-slate-600 px-4">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}