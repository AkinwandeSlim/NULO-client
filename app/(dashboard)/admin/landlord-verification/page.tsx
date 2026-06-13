"use client"

/**
 * Landlord Verification Management Page - FIXED
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  AlertTriangle,
  ArrowLeft,
  Users,
  Shield,
  Loader2
} from 'lucide-react'

import { verificationAPI } from "@/lib/api"
import type { LandlordVerification, VerificationStats } from "@/lib/api"

// ============================================================================
// CONSTANTS
// ============================================================================

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LandlordVerificationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
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

  const fetchVerifications = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true)
      setError(null)

      console.log('📤 [VERIFICATION PAGE] Fetching data...')
      console.log('📤 [VERIFICATION PAGE] Current statusFilter:', statusFilter)

      // Now use verification API for all statuses
      // Backend was fixed to query from users table (same source as management page)
      // So we can use the single API endpoint for everything
      
      let mapStatusFilter = statusFilter
      if (statusFilter === 'awaiting_submission') {
        mapStatusFilter = 'partial' // Map UI status to DB status
      }
      
      console.log('📤 [VERIFICATION PAGE] Using verification API with filter:', mapStatusFilter === 'all' ? 'undefined' : mapStatusFilter)
      const verificationsData = await verificationAPI.getAllLandlordVerifications(
        mapStatusFilter === 'all' ? undefined : mapStatusFilter, 
        currentPage, 
        itemsPerPage
      )

      const statsData = await verificationAPI.getVerificationStats()

      if (!isMountedRef.current) return

      setAllVerifications(verificationsData.verifications || [])
      setStats(statsData)
      hasInitialLoadRef.current = true

      console.log('✅ [VERIFICATION PAGE] Data loaded:', verificationsData.verifications?.length || 0)

    } catch (err: any) {
      console.error('❌ [VERIFICATION PAGE] Error:', err)
      if (!isMountedRef.current) return
      setError(err.message || 'Failed to load verifications')
    } finally {
      // FIX: Always reset both loading flags here so they can never get stuck
      if (isMountedRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [statusFilter, currentPage, itemsPerPage])

  // FIX: isRefreshing is now reliably reset via the finally block above
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    fetchVerifications(false)
  }, [fetchVerifications])

  // ============================================================================
  // FILTERING & PAGINATION
  // ============================================================================

  // Client-side search filtering only (status filtering is done server-side via API)
  const filteredVerifications = allVerifications.filter((v) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = v.landlord?.full_name?.toLowerCase().includes(query)
      const matchesEmail = v.landlord?.email?.toLowerCase().includes(query)
      const matchesCompany = v.company_name?.toLowerCase().includes(query)
      if (!matchesName && !matchesEmail && !matchesCompany) return false
    }
    // Note: statusFilter and accountTypeFilter are handled server-side via API
    // Don't apply them here to avoid double-filtering
    return true
  })

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

  const totalPages = Math.ceil(sortedVerifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVerifications = sortedVerifications.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, accountTypeFilter, sortBy])

  // Fetch data when page or filters change
  useEffect(() => {
    if (!authLoading && user?.user_type === 'admin') {
      console.log('🔄 [VERIFICATION PAGE] Filter/page changed, fetching...')
      fetchVerifications(false)
    }
  }, [currentPage, statusFilter, accountTypeFilter, sortBy, searchQuery, authLoading, user, fetchVerifications])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // FIX: Properly guard auth + redirect non-admins + simplified flow (no broken orphaned code)
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (user.user_type !== 'admin') {
      router.push('/')
      return
    }

    isMountedRef.current = true
    fetchVerifications(true)

    // Auto-refresh every 5 minutes to avoid excessive API calls / auth token conflicts
    refreshIntervalRef.current = setInterval(() => {
      console.log('🔄 [AUTO-REFRESH] Background refresh...')
      fetchVerifications(false)
    }, 5 * 60 * 1000)

    return () => {
      isMountedRef.current = false
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [authLoading, user, fetchVerifications, router])

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getStatusBadge = (status: string) => {
    const configs = {
      awaiting_submission: {
        icon: Clock,
        label: 'Awaiting Submission',
        className: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
      },
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
  // LOADING STATE
  // FIX: Only block the full render during Supabase auth check (authLoading).
  //      Data loading is handled inline below with skeleton cards.
  // ============================================================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
        <div className="container mx-auto py-6 space-y-6 px-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-10 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
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
          <Card className="border-slate-200">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
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
                Landlord Verification
              </h1>
              <p className="text-gray-600">Review and manage landlord verification requests</p>
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {isLoading && !hasInitialLoadRef.current ? (
            // Loading skeletons
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="border-orange-200 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                    <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mt-2" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            // Actual stats with icons and colors
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

              <Card className="border-yellow-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Awaiting Submit</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.awaiting_submission || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
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
          )}
        </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="flex-1">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">Filters &amp; Search</CardTitle>
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
                <SelectItem value="awaiting_submission">⏳ Awaiting Submission</SelectItem>
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
              {sortedVerifications.length > 0
                ? `Showing ${startIndex + 1}–${Math.min(endIndex, sortedVerifications.length)} of ${sortedVerifications.length} verifications`
                : 'No results'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifications Table */}
      <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-orange-100">
          <CardTitle className="flex items-center justify-between text-orange-800">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Verification Requests</span>
            </div>
            <span className="text-sm text-slate-600">
              {paginatedVerifications.length} of {sortedVerifications.length} shown
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && !hasInitialLoadRef.current ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-3 text-gray-600">Loading verifications...</span>
            </div>
          ) : paginatedVerifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-100 to-orange-200 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">No verifications found</p>
              <p className="text-slate-600">
                {searchQuery || statusFilter !== 'all' || accountTypeFilter !== 'all'
                  ? 'Try adjusting your filters or reset to view all verification requests.'
                  : 'No verification requests have been submitted yet.'}
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="mt-3 text-sm text-orange-600 underline hover:text-orange-800"
                >
                  Show all verifications
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-orange-50/50">
                  <TableRow>
                    <TableHead className="text-orange-800">Request</TableHead>
                    <TableHead className="text-orange-800">Landlord</TableHead>
                    <TableHead className="text-orange-800">Type</TableHead>
                    <TableHead className="text-orange-800">Status</TableHead>
                    <TableHead className="text-orange-800">Submitted</TableHead>
                    <TableHead className="text-orange-800">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVerifications.map((verification) => (
                    <TableRow key={verification.id} className="hover:bg-orange-50/30">
                      <TableCell>
                        <div className="text-sm font-medium text-slate-900">{verification.landlord?.full_name || 'N/A'}</div>
                        <div className="text-xs text-slate-500">{verification.company_name || 'Individual'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-900">{verification.landlord?.email || 'No email'}</div>
                      </TableCell>
                      <TableCell className="capitalize text-slate-700">
                        {verification.account_type}
                      </TableCell>
                      <TableCell>{getStatusBadge(verification.admin_review_status)}</TableCell>
                      <TableCell className="text-slate-700">
                        {formatDate(
                          verification.submitted_at || verification.submitted_for_review_at || verification.verification_submitted_at
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/landlord-verification/${verification.id}`)}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {verification.admin_review_status === 'approved' || verification.admin_review_status === 'rejected'
                            ? 'View'
                            : verification.admin_review_status === 'awaiting_submission'
                            ? 'Monitor'
                            : 'Review'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}










