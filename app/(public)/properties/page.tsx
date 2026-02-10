"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { propertiesAPI } from '@/lib/api/properties'
import { formatPrice, formatPriceCompact, debounce, formatLocation } from '@/lib/utils/format'

// Components
import SearchBar from '@/components/properties/SearchBar'
import ViewModeToggle, { ViewMode } from '@/components/properties/ViewModeToggle'
import PaginationControls from '@/components/properties/PaginationControls'
import { PropertyFiltersModal } from '@/components/PropertyFiltersModal'
import SaveFavoriteModal from '@/components/SaveFavoriteModal'
import PropertyCard from '@/components/properties/PropertyCard'
import PropertyList from '@/components/properties/PropertyList'
import PropertyGrid from '@/components/properties/PropertyGrid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Filter, 
  Home, 
  AlertCircle, 
  RefreshCw, 
  MapPin, 
  Grid, 
  List, 
  Map, 
  Loader2, 
  TrendingUp,
  Heart,
  Bed,
  Bath,
  Square,
  Camera,
  Star,
  Shield,
  Wifi,
  Car,
  Zap,
  ChevronRight,
  Search,
  Users,
  Eye
} from 'lucide-react'
import { Navbar } from '@/components/navigation/Navbar'
import Link from 'next/link'
import Image from 'next/image'

// Dynamically import map with lazy loading - using lightweight PropertyMap
const PropertyMap = dynamic(() => import('@/components/PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
        <p className="text-slate-600 text-sm">Loading map...</p>
      </div>
    </div>
  )
})

// Constants
const DEFAULT_LAGOS_LAT = 6.5244
const DEFAULT_LAGOS_LNG = 3.3792
const SEARCH_DEBOUNCE_MS = 300
const ITEMS_PER_PAGE = 20


// Consistent Property Skeleton Component
function PropertySkeleton() {
  return (
    <Card className="overflow-hidden shadow-lg rounded-2xl border-slate-200 hover:shadow-xl transition-all duration-300">
      <div className="relative">
        <Skeleton className="h-48 w-full" />
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="absolute top-3 right-3">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="flex items-center gap-4 mb-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Loading State with Skeletons - Consistent across all views
function LoadingState({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'split') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="container mx-auto px-4 lg:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Finding perfect properties...</h3>
              <p className="text-sm text-slate-600">Discovering amazing homes in your area</p>
            </div>
          </div>
          
          {/* ✅ Split Mode: Map + 2-Column Properties Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
            {/* Map Skeleton on Left */}
            <div className="lg:col-span-1">
              <Skeleton className="w-full h-full min-h-[600px] rounded-2xl" />
            </div>
            
            {/* Properties Grid on Right - 2 columns */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <PropertySkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'map') {
    // Map-only view: Show 1 column map skeleton
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="container mx-auto px-4 lg:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Loading map...</h3>
              <p className="text-sm text-slate-600">Discovering properties near you</p>
            </div>
          </div>
          
          {/* ✅ Map Mode: Full-width map skeleton */}
          <Skeleton className="w-full h-[600px] rounded-2xl" />
        </div>
      </div>
    )
  }

  // ✅ List Mode: 4-column responsive grid skeleton
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="container mx-auto px-4 lg:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Finding perfect properties...</h3>
            <p className="text-sm text-slate-600">Discovering amazing homes in your area</p>
          </div>
        </div>
        
        {/* ✅ List View: 4-column grid (responsive: 1 col mobile, 2 col tablet, 3 col lg, 4 col xl) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <PropertySkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Enhanced Error State
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
          <div className="bg-orange-50 rounded-full p-6 mb-6">
            <AlertCircle className="h-12 w-12 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Oops! Something went wrong</h3>
          <p className="text-slate-600 mb-8 text-lg">{error}</p>
          <Button 
            onClick={onRetry} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

// Enhanced Empty State
function EmptyState({ onClearFilters, searchQuery }: { onClearFilters: () => void; searchQuery: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
          <div className="bg-slate-100 rounded-full p-8 mb-8">
            <Home className="h-16 w-16 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            {searchQuery ? `No properties found for "${searchQuery}"` : 'No properties found'}
          </h3>
          <p className="text-slate-600 text-lg mb-8">
            {searchQuery 
              ? 'Try adjusting your search terms or explore different neighborhoods'
              : 'Try adjusting your filters or explore different areas'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={onClearFilters} 
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl"
            >
              Clear All Filters
            </Button>
            {searchQuery && (
              <Button 
                onClick={() => onClearFilters()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Browse All Properties
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Search Stats Component
function SearchStats({ 
  total, 
  loadingTime, 
  location,
  isLoading,
  hasSearched
}: { 
  total: number
  loadingTime?: number
  location?: string
  isLoading?: boolean
  hasSearched?: boolean
}) {
  // ✅ IMPROVED: Hide count during any loading state OR if we have 0 results (might still be loading)
  // Only show count when we have actual results (total > 0)
  if (isLoading || total === 0) {
    return (
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-6">
        <span className="font-semibold text-slate-600 animate-pulse">
          {isLoading ? 'Loading properties...' : 'Preparing results...'}
        </span>
      </div>
    )
  }

  // ✅ After loading, show full stats ONLY when we have results (total > 0)
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-6">
      <div className="flex items-center gap-2">
        <span className="font-bold text-xl text-slate-900">
          {total.toLocaleString()}
        </span>
        <span className="text-slate-700">
          {total === 1 ? 'property' : 'properties'} found
        </span>
        {location && (
          <>
            <span>in</span>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 px-3 py-1">
              <MapPin className="h-3 w-3 mr-1" />
              {location}
            </Badge>
          </>
        )}
      </div>
      
      {loadingTime && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          {/* <TrendingUp className="h-3 w-3" /> */}
          {/* <span>Loaded in {loadingTime}ms</span> */}
        </div>
      )}
    </div>
  )
}

export default function PropertiesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, authInitialized } = useAuth()
  
  // State for modals and UI
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSaveFavoriteModal, setShowSaveFavoriteModal] = useState(false)
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [favorites, setFavorites] = useState<string[]>([])
  const [pendingFavorites, setPendingFavorites] = useState<Set<string>>(new Set())

  // Properties state
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true) // Start with loading state to prevent "0 properties found" flash
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingTime, setLoadingTime] = useState<number | undefined>()
  const [shouldShowEmpty, setShouldShowEmpty] = useState(false) // ✅ NEW: Track when to show empty state to prevent flash
  
  // Filters state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000])
  const [selectedType, setSelectedType] = useState("all")
  const [minBeds, setMinBeds] = useState(0)
  const [minBaths, setMinBaths] = useState(0)

  // Ref for abort controller
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // ✅ NEW: Track request ID to prevent race conditions with timeouts
  const requestIdRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ NO RESET EFFECT NEEDED: Just rely on initial state and URL-based fetching
  // The component mounts with proper initial state, no need for a reset effect

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      if (query !== searchQuery) {
        setSearchQuery(query)
        setCurrentPage(1)
      }
    }, SEARCH_DEBOUNCE_MS),
    [searchQuery]
  )

  // Memoized search params
  const searchParamsMemo = useMemo(() => ({
    location: searchQuery,
    min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
    max_price: priceRange[1] < 10000000 ? priceRange[1] : undefined,
    bedrooms: minBeds > 0 ? minBeds : undefined,
    bathrooms: minBaths > 0 ? minBaths : undefined,
    property_type: selectedType !== 'all' ? selectedType : undefined,
    sort: (['newest', 'price_low', 'price_high', 'featured'].includes(searchParams.get('sort') || '') ? searchParams.get('sort') as 'newest' | 'price_low' | 'price_high' | 'featured' : undefined), // ✅ FIXED: Safely type sort parameter
    page: currentPage,
    limit: ITEMS_PER_PAGE
  }), [searchQuery, priceRange, minBeds, minBaths, selectedType, currentPage, searchParams])

  // Enhanced fetch function with performance tracking
  const fetchProperties = useCallback(async (page: number = 1) => {
    // ✅ NEW: Cancel previous timeout to prevent race conditions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    // ✅ NEW: Increment request ID for this fetch
    requestIdRef.current += 1
    const currentRequestId = requestIdRef.current
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const startTime = performance.now()
    
    try {
      setIsLoading(true)
      setError(null)
      // ✅ IMPROVED: Don't clear properties yet - keep old ones visible while loading new ones
      // This prevents the "no properties" flash when navigating back

      const params = {
        ...searchParamsMemo,
        page,
        limit: ITEMS_PER_PAGE
      }

      console.log('🔍 [PROPERTIES PAGE] Fetching with params:', params)
      
      const response = await propertiesAPI.search(params, {
        signal: abortControllerRef.current.signal
      })

      const endTime = performance.now()
      setLoadingTime(Math.round(endTime - startTime))

      setProperties(response.properties || [])
      setPagination(response.pagination)
      setCurrentPage(page)
      
      // ✅ NEW: Only enable shouldShowEmpty after successful fetch
      // This prevents empty state from cancelled requests
      console.log('🏁 [FETCH COMPLETE] Fetch successful - setting isLoading false and scheduling shouldShowEmpty')
      setIsLoading(false)
      
      // ✅ Delay before showing empty state to prevent flash
      setTimeout(() => {
        setShouldShowEmpty(true)
      }, 600)

      console.log(`✅ [PROPERTIES PAGE] Loaded ${response.properties?.length || 0} properties`)
      console.log(`📊 [STATE UPDATE] Setting properties to length: ${(response.properties || []).length}`)
      console.log(`📊 [PAGINATION] Page: ${page}, Limit: ${ITEMS_PER_PAGE}, Expected: 20, Actual: ${response.properties?.length || 0}`)
      console.log(`📋 [API RESPONSE] Full pagination:`, response.pagination)
      
      // ✅ NEW: Debug property coordinates
      if (response.properties && response.properties.length > 0) {
        console.log('📍 [MAP DEBUG] First 3 properties coordinates:')
        response.properties.slice(0, 3).forEach((prop: any, idx: number) => {
          console.log(`Property ${idx + 1}:`, {
            title: prop.title,
            latitude: prop.latitude,
            longitude: prop.longitude,
            hasCoords: prop.latitude !== null && prop.longitude !== null,
            allKeys: Object.keys(prop)
          })
        })
      }
      
    } catch (error: any) {
      // ✅ Silently ignore request cancellations - they're expected during development
      // Check both error.name and error.message since the error gets re-thrown
      if (error.name === 'AbortError' || error.message === 'Search cancelled') {
        console.log('🚫 [PROPERTIES PAGE] Request cancelled')
        setIsLoading(false) // Still set loading to false for cancelled requests
        return
      }

      console.error('❌ [PROPERTIES PAGE] Error:', error)
      setError(error.message || 'Failed to load properties')
      setProperties([])
      setPagination(null)
      setIsLoading(false)
      // ✅ NEW: Don't set shouldShowEmpty for error cases - keep showing skeletons
    }
  }, [searchParamsMemo])

  // Optimized fetch for specific page
  const fetchPropertiesForPage = useCallback((page: number) => {
    fetchProperties(page)
  }, [fetchProperties])

  // Handle search with debouncing
  const handleSearchSubmit = useCallback((query: string) => {
    debouncedSearch(query)
  }, [debouncedSearch])

  // Handle property selection
  const handlePropertySelect = useCallback((property: any) => {
    setSelectedProperty(property)
  }, [])

  // Handle favorite toggle
  const handleFavoriteClick = useCallback(async (propertyId: string) => {
    // ✅ CRITICAL: Check auth is fully loaded before allowing favorite operations
    if (authLoading) {
      toast.info('Please wait while we verify your account...')
      return
    }

    if (!user) {
      setPendingFavoriteId(propertyId)
      setShowSaveFavoriteModal(true)
      return
    }

    try {
      // ✅ Check current favorite status
      const isFavorited = favorites.includes(propertyId);
      
      // ✅ OPTIMISTIC UPDATE: Update UI immediately
      const newFavorites = isFavorited
        ? favorites.filter(id => id !== propertyId)
        : [...favorites, propertyId];
      
      setFavorites(newFavorites);
      setPendingFavorites(prev => new Set([...prev, propertyId]));
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
      
      // ✅ Then sync with API in background
      try {
        const response = await propertiesAPI.toggleFavorite(propertyId, isFavorited);
        console.log(`✅ [OPTIMISTIC] Confirmed favorite state for ${propertyId}`);
        // UI is already updated, API confirmed it
      } catch (error: any) {
        // ❌ ROLLBACK: API failed, revert to previous state
        console.error('❌ [OPTIMISTIC] Failed, rolling back:', error);
        setFavorites(isFavorited ? [...favorites, propertyId] : favorites.filter(id => id !== propertyId));
        toast.error('Failed to update favorite. Changes reverted.');
      } finally {
        // Remove from pending set
        setPendingFavorites(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      }
    } catch (error: any) {
      // ✅ Show error but don't affect properties display
      const errorMsg = error.message || 'Failed to update favorite'
      console.error('❌ Favorite toggle failed:', errorMsg)
      toast.error(errorMsg)
    }
  }, [user, authLoading, favorites])

  // Memoize property cards to prevent unnecessary re-renders
  const propertyCards = useMemo(() => {
    return properties.map((property: any) => (
      <PropertyCard
        key={property.id}
        property={property}
        onSelect={handlePropertySelect}
        onFavorite={handleFavoriteClick}
        isFavorite={favorites.includes(property.id)}
        compact={viewMode === 'split'}
        isAuthLoading={authLoading}
        isPendingFavorite={pendingFavorites.has(property.id)}
      />
    ))
  }, [properties, handlePropertySelect, handleFavoriteClick, favorites, viewMode, authLoading, pendingFavorites])

  // Clear all filters
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    // ✅ CRITICAL: Reset ALL filter state
    setPriceRange([0, 10000000])
    setSelectedType('all')
    setMinBeds(0)
    setMinBaths(0)
    setSearchQuery('') // This will trigger fetch effect
    setCurrentPage(1)

    // Clear URL completely - no query params at all
    try {
      // Use router.push to clear ALL query parameters
      router.push('/properties', { scroll: false })
    } catch (err) {
      console.warn('Router push failed when clearing filters:', err)
    }

    // ✅ fetch will be triggered by useEffect watching searchQuery changes
  }, [router])

  // Effects
  // ✅ NEW: Load user's favorites on mount - improved auth handling
  useEffect(() => {
    const loadFavorites = async () => {
      // ✅ CRITICAL: Wait for auth to complete before loading favorites
      if (authLoading) {
        return
      }

      if (!user) {
        // Silently clear favorites for unauthenticated users
        setFavorites([])
        return
      }

      // ✅ ADDITIONAL: Check if user has valid session
      if (!user.id) {
        console.warn('⚠️ [FAVORITES] User found but no valid ID, skipping favorites load')
        setFavorites([])
        return
      }

      try {
        console.log('🔄 [FAVORITES] Auth confirmed, loading user favorites...')
        const response = await propertiesAPI.getFavorites(1, 1000); // Load all favorites
        const favoriteIds = (response.properties || []).map((fav: any) => fav.id);
        console.log(`✅ [FAVORITES] Loaded ${favoriteIds.length} favorites`, favoriteIds)
        setFavorites(favoriteIds)
      } catch (error: any) {
        // ✅ IMPROVED: Better error handling - don't log 401s as warnings
        if (error.status === 401 || error.message?.includes('401')) {
          console.log('ℹ️ [FAVORITES] User not authenticated for favorites, clearing list')
        } else {
          console.warn('⚠️ [FAVORITES] Failed to load favorites:', error)
        }
        // Don't block page load if favorites fail
        setFavorites([])
      }
    }

    loadFavorites()
  }, [user, authLoading])

  // Consolidated data loading effect - handles initial load, URL params, and search changes
  // ✅ SIMPLIFIED: Separate URL sync from fetching to avoid circular dependencies
  useEffect(() => {
    // ✅ Check multiple location parameters (flexible location search)
    const city = searchParams.get('city')
    const location = searchParams.get('location')
    const area = searchParams.get('area')
    const neighborhood = searchParams.get('neighborhood')
    
    const searchValue = city || location || area || neighborhood
    console.log('🔍 [DEBUG] URL search value:', searchValue, 'Current searchQuery:', searchQuery)
    
    // ✅ Update searchQuery if URL has different value
    if (searchValue && searchValue !== searchQuery) {
      console.log('🔍 [DEBUG] Updating searchQuery from URL:', searchValue)
      setSearchQuery(searchValue)
      setCurrentPage(1)
    }
  }, [searchParams]) // Only sync URL changes

  // ✅ SEPARATE: Fetch when search query or filters actually change
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect triggered - About to fetch', { searchQuery, isLoading })
    
    // ✅ NEW: Reset shouldShowEmpty when search changes
    setShouldShowEmpty(false)
    
    // ✅ Always fetch when searchQuery changes (including empty string)
    console.log('🔍 [SEARCH EFFECT] Fetching properties for:', searchQuery || '(all)')
    setIsLoading(true)
    fetchProperties(1)
  }, [searchQuery, priceRange, minBeds, minBaths, selectedType]) // Only real data change deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Show loading state immediately when loading, even if we have old properties
  if (isLoading) {
    console.log('🔴 [RENDER] Early return: Loading state')
    return <LoadingState viewMode={viewMode} />
  }

  // Show error state only if there's an error and no properties to show
  if (error && properties.length === 0) {
    console.log('🔴 [RENDER] Early return: Error state')
    return <ErrorState error={error} onRetry={() => fetchProperties(1)} />
  }

  console.log('🟢 [RENDER] Main render - properties:', properties.length, 'shouldShowEmpty:', shouldShowEmpty, 'searchQuery:', searchQuery)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <Navbar />
      
      {/* ✅ NEW: Auth Loading Indicator - Only show during initial load */}
      {!authInitialized && authLoading && (
        <div className="bg-blue-50 border-b border-blue-200 sticky top-16 z-39">
          <div className="container mx-auto px-4 lg:px-6 py-2 flex items-center gap-2 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying your account...</span>
          </div>
        </div>
      )}
      
      {/* Enhanced Search Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:flex-1">
              <SearchBar 
                searchQuery={searchQuery}
                onSearchChange={debouncedSearch}
                onSearchSubmit={handleSearchSubmit}
                onClear={() => {
                  // ✅ FIXED: Just update state and let effect handle it
                  setSearchQuery('')
                  setCurrentPage(1)

                  // Navigate to clean properties page (removes all search params)
                  try {
                    router.push('/properties', { scroll: false })
                    // fetch will be triggered by useEffect watching searchQuery
                  } catch (err) {
                    console.warn('Router push failed when clearing search:', err)
                  }
                }}
                placeholder="Search by location, property type, or features..."
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <ViewModeToggle 
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              {/* Clear Filters button - visible when any filter is active */}
              {(searchQuery !== '' || priceRange[0] > 0 || priceRange[1] < 10000000 || selectedType !== 'all' || minBeds > 0 || minBaths > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 text-slate-700 hover:bg-slate-50 rounded-xl border border-transparent"
                >
                  Clear Filters
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {(priceRange[0] > 0 || priceRange[1] < 10000000 || selectedType !== 'all' || minBeds > 0 || minBaths > 0) && (
                  <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700">
                    •
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'map' ? (
        <div className="h-[calc(100vh-80px)]">
          <PropertyMap
            properties={properties}
            selectedProperty={selectedProperty}
            onPropertySelect={handlePropertySelect}
            zoom={11}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      ) : viewMode === 'split' ? (
        <div className="h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Map on the left */}
          <div className="h-full relative">
            <PropertyMap
              properties={properties}
              selectedProperty={selectedProperty}
              onPropertySelect={handlePropertySelect}
              zoom={11}
              currentPage={currentPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
          
          {/* Properties on the right */}
          <div className="h-full overflow-y-auto bg-slate-50">
            <div className="p-4">
              <SearchStats 
                total={properties.length}
                loadingTime={loadingTime}
                isLoading={isLoading}
              />
              
              {/* ✅ IMPROVED: Loading → Skeleton | No Results (and allowed) → Empty State | Has Results → Properties */}
              {(() => {
                console.log('🎨 [RENDER DEBUG] isLoading:', isLoading, 'properties.length:', properties.length, 'shouldShowEmpty:', shouldShowEmpty, 'searchQuery:', searchQuery)
                
                if (isLoading) {
                  console.log('  → Showing skeletons (isLoading=true)')
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <PropertySkeleton key={index} />
                      ))}
                    </div>
                  )
                }
                
                if (properties.length === 0 && shouldShowEmpty) {
                  console.log('  → Showing empty state (no properties & shouldShowEmpty=true)')
                  return <EmptyState onClearFilters={clearAllFilters} searchQuery={searchQuery} />
                }
                
                if (properties.length === 0) {
                  console.log('  → Showing skeletons (no properties yet)')
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <PropertySkeleton key={index} />
                      ))}
                    </div>
                  )
                }
                
                // Show properties when we have results
                console.log('  → Showing', properties.length, 'properties')
                return (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Properties ({properties.length})
                      </h3>
                      <p className="text-sm text-slate-600">
                        Click on a property to view details on the map
                      </p>
                    </div>
                    
                    {/* Properties Grid for split view */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {propertyCards}
                    </div>
                    
                    {/* Pagination for split view */}
                    {pagination && (
                      <div className="flex justify-center mt-6">
                        <PaginationControls
                          pagination={pagination}
                          currentPage={currentPage}
                          onPageChange={fetchPropertiesForPage}
                        />
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      ) : (
        <PropertyList 
          properties={properties}
          selectedProperty={selectedProperty}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
          currentPage={currentPage}
          handlePageChange={fetchPropertiesForPage}
          handlePropertySelect={handlePropertySelect}
          handleFavoriteClick={handleFavoriteClick}
          favorites={favorites}
          viewMode={viewMode}
          clearAllFilters={clearAllFilters}
          searchQuery={searchQuery}
          loadingTime={loadingTime}
          propertyCards={propertyCards}
          shouldShowEmpty={shouldShowEmpty} // ✅ NEW: Pass flag to control when to show empty state
        />
      )}

      {/* Enhanced Filter Modal */}
      {showFilterModal && (
        <PropertyFiltersModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filters={{
            priceRange,
            propertyType: selectedType,
            bedrooms: minBeds,
            bathrooms: minBaths
          }}
          onFiltersChange={(filters) => {
            setPriceRange(filters.priceRange || [0, 10000000])
            setSelectedType(filters.propertyType || 'all')
            setMinBeds(filters.bedrooms || 0)
            setMinBaths(filters.bathrooms || 0)
            setCurrentPage(1)
            fetchProperties(1)
          }}
        />
      )}

      {/* Save Favorite Modal */}
      {showSaveFavoriteModal && (
        <SaveFavoriteModal
          isOpen={showSaveFavoriteModal}
          onClose={() => setShowSaveFavoriteModal(false)}
          propertyTitle={properties.find((p: any) => p.id === pendingFavoriteId)?.title || ''}
          onSaveWithEmail={() => {
            setShowSaveFavoriteModal(false)
            toast.success('Please sign in to save favorites')
          }}
          onContinueBrowsing={() => {
            setShowSaveFavoriteModal(false)
            setPendingFavoriteId(null)
          }}
        />
      )}
    </div>
  )
}