"use client"

import {
  useState,
  useEffect,
  useCallback,
  useRef
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building2, Plus, ArrowLeft,
  RefreshCw, ArrowRight, AlertCircle,
  Search, X, ChevronLeft, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"
import { PropertyCard } from "@/components/landlord/PropertyCard"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

export default function PropertiesPage() {
  const { user, userProfile } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams?.get('status') || 'all'
  )
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  // Pagination state
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(16)
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const isMounted = useRef(false)

  // ── Verification Gate Helper ──
  // Landlords can only list properties when their account is approved.
  // Pending and rejected landlords see disabled buttons with helpful messaging.
  const canListProperties = user?.verification_status === 'approved'
  const verificationMessage = user?.verification_status === 'rejected'
    ? 'Your account is rejected — contact support to re-verify'
    : 'Your verification is pending — you can list properties once approved'
  const listingButtonLabel = user?.verification_status === 'rejected'
    ? 'Add Property (Rejected)'
    : user?.verification_status === 'pending'
    ? 'Add Property (Pending Verification)'
    : 'Add Property'

  // Handle Add Property click - redirect to verification page if not approved
  const handleAddPropertyClick = useCallback((e: React.MouseEvent) => {
    if (!canListProperties) {
      e.preventDefault()
      toast.error(verificationMessage)
      router.push('/onboarding/landlord/verification-pending')
      return
    }
  }, [canListProperties, verificationMessage, router])

  // Debounce search input so we don't hammer the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchProperties = useCallback(async (
    filter: string,
    pg: number = page,
    pgSize: number = pageSize,
    search: string = debouncedSearch
  ) => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 [PROPERTIES PAGE] Fetching properties...')

      // Map our UI filter values to the right backend params.
      // - 'all' / 'pending' / 'rejected' are verification_status filters
      // - 'vacant' / 'occupied' / 'maintenance' are lifecycle status filters
      const isVerificationFilter = filter === 'all' || filter === 'pending' || filter === 'rejected'
      const lifecycleFilter = isVerificationFilter ? undefined : filter
      const includePending = filter === 'all' || filter === 'pending'
      const includeRejected = filter === 'all' || filter === 'rejected'

      // skipCache: true on every call — the properties page always needs fresh data.
      const data = await propertiesAPI.getMyProperties(pg, pgSize, lifecycleFilter, {
        skipCache: true,
        search: search || undefined,
        includePending,
        includeRejected,
      })
      console.log('📦 [PROPERTIES PAGE] Properties data received:', data.properties?.length || 0)

      setProperties(data.properties || [])

      // Pull pagination metadata from response
      const pagination = (data as any).pagination
      if (pagination) {
        setTotal(pagination.total ?? (data.properties?.length || 0))
        setTotalPages(pagination.total_pages ?? 1)
        if (typeof pagination.page === 'number') setPage(pagination.page)
      } else {
        setTotal(data.properties?.length || 0)
        setTotalPages(1)
      }
    } catch (error: any) {
      console.error('❌ [PROPERTIES PAGE] Failed to fetch properties:', error)
      setError(error.message || 'Failed to load properties')
      toast.error(error.message || 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, statusFilter])

  // Refetch when filter / debounced search / page / pageSize change
  useEffect(() => {
    fetchProperties(statusFilter, page, pageSize, debouncedSearch)
  }, [statusFilter, debouncedSearch, page, pageSize, fetchProperties])

  // When the filter or search changes, jump back to page 1
  useEffect(() => {
    setPage(1)
  }, [statusFilter, debouncedSearch])

  // Sync statusFilter with URL search params
  useEffect(() => {
    const statusFromUrl = searchParams?.get('status')
    if (statusFromUrl && statusFromUrl !== statusFilter) {
      setStatusFilter(statusFromUrl)
    }
  }, [searchParams, statusFilter])

  // Filter change now only updates state — the useEffect above handles the fetch
  const handleStatusFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter)
    // Update URL with new filter
    const params = new URLSearchParams(searchParams?.toString())
    if (newFilter === 'all') {
      params.delete('status')
    } else {
      params.set('status', newFilter)
    }
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => setSearchQuery('')

  const handleDeleteProperty = async (propertyId: string, propertyTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(propertyId)
      await propertiesAPI.delete(propertyId)
      setProperties(properties.filter(p => p.id !== propertyId))
      toast.success(`"${propertyTitle}" deleted successfully`)
      fetchProperties(statusFilter, page, pageSize, debouncedSearch)
    } catch (error: any) {
      console.error('Failed to delete property:', error)
      toast.error(error.message || 'Failed to delete property')
    } finally {
      setDeletingId(null)
    }
  }

  // Refresh uses the current filter, page, and search
  const handleRefresh = () => {
    fetchProperties(statusFilter, page, pageSize, debouncedSearch)
  }

  // Pagination helpers
  const goToPage = (n: number) => {
    const next = Math.max(1, Math.min(totalPages, n))
    if (next !== page) setPage(next)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const getUserName = () =>
    userProfile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'there'

  // ─── Error State ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Properties</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <Button onClick={() => fetchProperties(statusFilter)} className="bg-orange-500 hover:bg-orange-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading State ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Your Properties</h3>
              <p className="text-slate-600">Please wait while we fetch your property listings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="container mx-auto px-4 py-8">

        {/* Hero — Same structure as tenant/landlord overview */}
        <div className="mb-10">
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                  My Properties
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  Manage your property listings and track performance
                </p>

                <div className="flex flex-wrap gap-3">
                  {/* Verification Gate: Only approved landlords can list properties */}
                  {!canListProperties ? (
                    <Button
                      disabled
                      title={verificationMessage}
                      className="bg-gray-300 text-gray-500 cursor-not-allowed px-6"
                    >
                      <Plus className="mr-2 h-4 w-4" />{listingButtonLabel}
                    </Button>
                  ) : (
                    <Link href="/landlord/properties/new">
                      <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                        <Plus className="mr-2 h-4 w-4" />Add Property
                      </Button>
                    </Link>
                  )}
                  <Link href="/landlord/overview">
                    <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                      <ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Stats Summary */}
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleRefresh}
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Verification + Status Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all',         label: 'All Properties' },
                { value: 'pending',     label: '⏳ Pending Review' },
                { value: 'vacant',      label: '✅ Available' },
                { value: 'occupied',    label: '🔒 Occupied' },
                { value: 'maintenance', label: '🔧 Maintenance' },
                { value: 'rejected',    label: '❌ Rejected' },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={statusFilter === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilterChange(value)}
                  className={statusFilter === value
                    ? 'bg-orange-500 text-white'
                    : 'border-orange-200 text-orange-700 hover:bg-orange-50'}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by title, address, city, or state..."
                aria-label="Search my properties"
                className="w-full pl-9 pr-10 py-2 rounded-lg border border-orange-200 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Properties Content */}
        {properties.length === 0 ? (
          /* Empty State — ONBD-09: branches on verification_status
              - rejected   → no CTA, show blocked message
              - everything else → "List Your First Property" CTA */
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  user?.verification_status === 'rejected'
                    ? 'bg-red-100'
                    : 'bg-blue-100'
                }`}>
                  {user?.verification_status === 'rejected' ? (
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  ) : (
                    <Building2 className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {user?.verification_status === 'rejected'
                    ? 'Account Rejected - Listing Blocked'
                    : user?.verification_status === 'pending'
                    ? 'Verification Pending - Listing Blocked'
                    : 'No properties listed yet'}
                </h3>
                <p className="text-slate-600 mb-2">
                  {user?.verification_status === 'rejected'
                    ? 'Your landlord account was rejected by our admin team. You cannot create new property listings.'
                    : user?.verification_status === 'pending'
                    ? 'Your verification is currently being reviewed by our admin team. You\'ll be able to list properties once approved.'
                    : 'Start earning by listing your first property'}
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  {user?.verification_status === 'rejected'
                    ? 'Please contact support to re-verify your account.'
                    : user?.verification_status === 'pending'
                    ? 'Verification usually takes 1-2 business days.'
                    : 'All properties require admin verification before appearing in the marketplace'}
                </p>
                {!canListProperties ? (
                  <Button
                    disabled
                    title={verificationMessage}
                    className="bg-gray-300 text-gray-500 cursor-not-allowed shadow-lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />{listingButtonLabel}
                  </Button>
                ) : (
                  <Link href="/landlord/properties/new">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                      <Plus className="mr-2 h-4 w-4" />List Your First Property
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Properties Grid — Using PropertyCardGrid for consistent styling */
          <div>
            <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  variant="full"
                  onDelete={handleDeleteProperty}
                  deletingId={deletingId}
                  formatPrice={formatPrice}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-6 border-t border-orange-100">
                <div className="text-sm text-slate-600">
                  Showing <span className="font-semibold">{(page - 1) * pageSize + 1}</span>–
                  <span className="font-semibold">{Math.min(page * pageSize, total)}</span> of{' '}
                  <span className="font-semibold">{total}</span>
                  {debouncedSearch && (
                    <span className="ml-1 text-slate-500">matching "{debouncedSearch}"</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || loading}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
                  </Button>
                  <div className="px-3 py-1 rounded-md bg-orange-50 text-orange-700 text-sm font-medium border border-orange-200">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
