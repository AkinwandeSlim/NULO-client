/**
 * 🏠 MARKETPLACE PROPERTIES PAGE - AIRBNB/ZILLOW STYLE
 * 
 * FEATURES:
 * - Map always mounted (no unmounting on search)
 * - List LEFT (42%) + Map RIGHT (58%) layout
 * - Compact horizontal cards (5-6 visible at once)
 * - Auto-scroll sync between map and list
 * - Performance optimized loading states
 */
"use client"

import {useEffect, useState, useMemo, useCallback, useRef } from 'react'
import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboard } from '@/contexts/DashboardContext'
import { useSignupCallbackUrl } from '@/hooks/useSignupCallbackUrl'
import { toast } from 'sonner'
import { propertiesAPI } from '@/lib/api/properties'
import { debounce } from '@/lib/utils/format'
import { favoritesAPI } from '@/lib/api/favorites'

// Components
import SearchBar from '@/components/properties/SearchBar'
import ViewModeToggle, { ViewMode } from '@/components/properties/ViewModeToggle'
import PaginationControls from '@/components/properties/PaginationControls'
import PropertyCardGrid from '@/components/properties/PropertyCardGrid'
import { PropertyFiltersModal } from '@/components/PropertyFiltersModal'
import SaveFavoriteModal from '@/components/SaveFavoriteModal'
import PropertyCard from '@/components/properties/PropertyCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Filter, 
  Home, 
  AlertCircle, 
  RefreshCw, 
  MapPin,
  Loader2,
  Bed,
  Bath,
} from 'lucide-react'
import { Navbar } from '@/components/navigation/Navbar'

// Lazy load optimized map
const PropertyMapOptimized = dynamic(() => import('@/components/PropertyMapOptimized'), {
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

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const DEFAULT_LAGOS_LAT = 6.5244
const DEFAULT_LAGOS_LNG = 3.3792
const SEARCH_DEBOUNCE_MS = 300
const ITEMS_PER_PAGE = 24

interface SearchFilters {
  location?: string
  min_price?: number
  max_price?: number
  bedrooms?: number
  bathrooms?: number
  property_type?: string
  sort?: 'newest' | 'price_low' | 'price_high' | 'featured'
  page: number
  limit: number
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PropertiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { invalidateTenantCache } = useDashboard()
  useSignupCallbackUrl()

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [searchQuery, setSearchQuery] = useState('')
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null)
  const [pagination, setPagination] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [renderState, setRenderState] = useState<'loading' | 'error' | 'empty' | 'loaded'>('loading')

  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000])
  const [selectedType, setSelectedType] = useState('all')
  const [minBeds, setMinBeds] = useState(0)
  const [minBaths, setMinBaths] = useState(0)
  const [sortBy, setSortBy] = useState('featured')

  // Modals
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSaveFavoriteModal, setShowSaveFavoriteModal] = useState(false)
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null)

  // Favorites
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [pendingFavorites, setPendingFavorites] = useState<Set<string>>(new Set())
  const lastFavoritesCheckRef = useRef(0)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  const fetchProperties = useCallback(async (page: number = 1, forceRefresh: boolean = false) => {
    try {
      setIsLoading(true)
      setError(null)
      setRenderState('loading')

      const filters: SearchFilters = {
        location: searchQuery || undefined,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 10000000 ? priceRange[1] : undefined,
        bedrooms: minBeds > 0 ? minBeds : undefined,
        bathrooms: minBaths > 0 ? minBaths : undefined,
        property_type: selectedType !== 'all' ? selectedType : undefined,
        sort: sortBy as any,
        page,
        limit: ITEMS_PER_PAGE,
      }

      console.log('🔍 [PROPERTIES] Fetching...', { 
        searchQuery, 
        filters, 
        forceRefresh,
        debug: 'Current state values'
      })

      const response = await propertiesAPI.search(filters, {
        skipCache: forceRefresh,
      })

      console.log('✅ [PROPERTIES] Response:', {
        total: response.pagination?.total,
        page: response.pagination?.page,
        properties: response.properties?.length,
        cached: response.performance?.cache_hit,
      })

      setProperties(response.properties || [])
      setPagination(response.pagination)
      setCurrentPage(page)

      if (response.properties?.length === 0) {
        setRenderState('empty')
      } else {
        setRenderState('loaded')
      }

    } catch (err: any) {
      // Check for cancellation FIRST - don't log these as errors
      if (err?.isCancelled || err?.message === 'Search cancelled') {
        console.log('🔍 [PROPERTIES] Search cancelled (expected behavior)')
        return
      }
      
      console.error('❌ [PROPERTIES] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load properties')
      setRenderState('error')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, priceRange, selectedType, minBeds, minBaths, sortBy])

  // const loadFavorites = useCallback(async () => {
  //   if (!user || authLoading) return
    
  //   const now = Date.now()
  //   if (now - lastFavoritesCheckRef.current < 2000) {
  //     return
  //   }

  //   try {
  //     setFavoritesLoading(true)
  //     console.log('🤍 [FAVORITES] Loading...')

  //     const data = await favoritesAPI.getAll()
  //     const favoriteIds = data.favorites.map((fav: any) => fav.property_id)
  //     setFavorites(favoriteIds)
  //     lastFavoritesCheckRef.current = now

  //     console.log(`✅ [FAVORITES] Loaded ${favoriteIds.length} favorites`)
  //   } catch (err) {
  //     console.warn('⚠️  [FAVORITES] Failed to load:', err)
  //     setFavorites([])
  //   } finally {
  //     setFavoritesLoading(false)
  //   }
  // }, [user, authLoading])


  const loadFavorites = useCallback(async (force = false) => {
    if (!user || authLoading) return

    const now = Date.now()
    // Allow bypassing the debounce with force=true (used after mutations)
    if (!force && now - lastFavoritesCheckRef.current < 2000) {
      return
    }

    try {
      setFavoritesLoading(true)
      console.log('🤍 [FAVORITES] Loading...')

      const data = await favoritesAPI.getAll()
      const favoriteIds = data.favorites.map((fav: any) => fav.property_id)
      setFavorites(favoriteIds)
      lastFavoritesCheckRef.current = now

      console.log(`✅ [FAVORITES] Loaded ${favoriteIds.length} favorites`)
    } catch (err) {
      console.warn('⚠️  [FAVORITES] Failed to load:', err)
      // Don't wipe existing favorites on a background sync failure
    } finally {
      setFavoritesLoading(false)
    }
  }, [user, authLoading])

  // ============================================================================
  // SEARCH & FILTERS
  // ============================================================================

  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query)
      setCurrentPage(1)
    }, SEARCH_DEBOUNCE_MS),
    []
  )

  const handleSearch = useCallback((filters: Partial<SearchFilters>) => {
    if (filters.location !== undefined) {
      setSearchQuery(filters.location || '')
    }
    setCurrentPage(1)
  }, [])

  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setPriceRange([0, 10000000])
    setSelectedType('all')
    setMinBeds(0)
    setMinBaths(0)
    setSortBy('featured')
    setCurrentPage(1)
    router.push('/properties', { scroll: false })
  }, [router])

  // const handleFavoriteClick = useCallback(async (propertyId: string) => {
  //   // Step 0: Check if user is logged in
  //   if (!user) {
  //     console.log(`🔐 [FAVORITES] User not logged in, showing modal for property: ${propertyId}`)
  //     setPendingFavoriteId(propertyId)
  //     setShowSaveFavoriteModal(true)
  //     return
  //   }

  //   const isFavorite = favorites.includes(propertyId)
  //   console.log(`📍 [FAVORITES] Toggle favorite request:`, {
  //     propertyId,
  //     isFavorite,
  //     userId: user.id,
  //     userType: user.user_type
  //   })

  //   try {
  //     // Add to pending set for UI feedback
  //     setPendingFavorites(prev => new Set([...prev, propertyId]))
      
  //     if (isFavorite) {
  //       // ── REMOVE FAVORITE ────────────────────────────────────────────────
  //       console.log(`🗑️ [FAVORITES] Removing favorite: ${propertyId}`)
        
  //       try {
  //         const removeResponse = await favoritesAPI.remove(propertyId)
  //         console.log(`✅ [FAVORITES] Backend confirmed removal:`, removeResponse)
          
  //         // Only update UI AFTER server confirms
  //         setFavorites(prev => prev.filter(id => id !== propertyId))
  //         toast.success('Removed from favorites')
          
  //         // Invalidate tenant dashboard cache so it refetches updated favorites
  //         if (user?.user_type === 'tenant') {
  //           invalidateTenantCache()
  //           console.log(`🔄 [FAVORITES] Invalidated tenant dashboard cache after removal`)
  //         }
          
  //         // Immediately refetch to ensure sync
  //         await loadFavorites()
  //       } catch (err: any) {
  //         const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to remove from favorites'
  //         console.error(`❌ [FAVORITES] Remove failed:`, {
  //           errorMsg,
  //           status: err?.response?.status,
  //           fullError: err?.response?.data
  //         })
  //         toast.error(errorMsg)
  //       }
  //     } else {
  //       // ── ADD FAVORITE ───────────────────────────────────────────────────
  //       console.log(`💾 [FAVORITES] Backend call - Adding favorite: ${propertyId}`)
        
  //       try {
  //         const addResponse = await favoritesAPI.add(propertyId)
  //         console.log(`✅ [FAVORITES] Backend confirmed addition:`, addResponse)
          
  //         // Only update UI AFTER server confirms
  //         setFavorites(prev => [...prev, propertyId])
  //         toast.success('Added to favorites!')
          
  //         // Invalidate tenant dashboard cache so it refetches updated favorites
  //         if (user?.user_type === 'tenant') {
  //           invalidateTenantCache()
  //           console.log(`🔄 [FAVORITES] Invalidated tenant dashboard cache after addition`)
  //         }
          
  //         // Immediately refetch to ensure sync with database
  //         console.log(`🔄 [FAVORITES] Refetching all favorites after addition...`)
  //         await loadFavorites()
  //         console.log(`✅ [FAVORITES] Refetch complete`)
  //       } catch (err: any) {
  //         const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to add to favorites'
  //         console.error(`❌ [FAVORITES] Add failed:`, {
  //           errorMsg,
  //           status: err?.response?.status,
  //           propertyId,
  //           userId: user.id,
  //           fullError: err?.response?.data
  //         })
          
  //         // Show error to user
  //         toast.error(errorMsg)
          
  //         // Debug: Log if it's an auth issue
  //         if (err?.response?.status === 401) {
  //           console.error(`❌ [FAVORITES] Auth error - Token may be invalid or expired`)
  //         } else if (err?.response?.status === 403) {
  //           console.error(`❌ [FAVORITES] Permission denied - User might not be a tenant`)
  //         }
  //       }
  //     }
  //   } catch (err) {
  //     console.error('❌ [FAVORITES] Unexpected error:', err)
  //     toast.error('Unexpected error updating favorites')
  //   } finally {
  //     // Remove from pending set
  //     setPendingFavorites(prev => {
  //       const next = new Set(prev)
  //       next.delete(propertyId)
  //       return next
  //     })
  //   }
  // }, [user, favorites, loadFavorites, invalidateTenantCache])


  const handleFavoriteClick = useCallback(async (propertyId: string) => {
    if (!user) {
      console.log(`🔐 [FAVORITES] User not logged in, showing modal for property: ${propertyId}`)
      setPendingFavoriteId(propertyId)
      setShowSaveFavoriteModal(true)
      return
    }

    const isFavorite = favorites.includes(propertyId)
    console.log(`📍 [FAVORITES] Toggle favorite:`, { propertyId, isFavorite, userId: user.id })

    // ── OPTIMISTIC UPDATE: update the heart icon immediately ──────────────────
    if (isFavorite) {
      setFavorites(prev => prev.filter(id => id !== propertyId))
    } else {
      setFavorites(prev => [...prev, propertyId])
    }

    setPendingFavorites(prev => new Set([...prev, propertyId]))

    try {
      if (isFavorite) {
        // ── REMOVE ────────────────────────────────────────────────────────────
        await favoritesAPI.remove(propertyId)
        toast.success('Removed from favorites')
        if (user?.user_type === 'tenant') {
          invalidateTenantCache()
        }
      } else {
        // ── ADD ───────────────────────────────────────────────────────────────
        try {
          await favoritesAPI.add(propertyId)
          toast.success('Added to favorites!')
          if (user?.user_type === 'tenant') {
            invalidateTenantCache()
          }
        } catch (addErr: any) {
          // Check all possible status locations — axios uses .response.status,
          // fetch-based clients often use .status or .statusCode directly
          const status = addErr?.response?.status ?? addErr?.status ?? addErr?.statusCode
          if (status === 409) {
            // Already saved on server — optimistic heart is correct, just keep it
            console.log(`ℹ️ [FAVORITES] Already favorited on server (409) — keeping UI state`)
            return
          }
          throw addErr
        }
      }

      // Background re-sync after any mutation (force=true bypasses 2s debounce)
      // loadFavorites(true)

    } catch (err: any) {
      // ── REVERT optimistic update on real errors ────────────────────────────
      if (isFavorite) {
        setFavorites(prev => [...prev, propertyId]) // restore removed item
      } else {
        setFavorites(prev => prev.filter(id => id !== propertyId)) // un-add item
      }

      const errorMsg = err?.response?.data?.detail || err?.message
        || `Failed to ${isFavorite ? 'remove from' : 'add to'} favorites`

      console.error(`❌ [FAVORITES] ${isFavorite ? 'Remove' : 'Add'} failed:`, {
        errorMsg,
        status: err?.response?.status,
        propertyId,
      })
      toast.error(errorMsg)
    } finally {
      setPendingFavorites(prev => {
        const next = new Set(prev)
        next.delete(propertyId)
        return next
      })
    }
  }, [user, favorites, invalidateTenantCache])




  // ============================================================================
  // EFFECTS
  // ============================================================================

  // ✅ Responsive view mode - Auto-switch based on screen size
  useEffect(() => {
    const handleResize = () => {
      // Tailwind lg breakpoint is 1024px
      // Mobile: < 1024px -> List view
      // Desktop: >= 1024px -> Split view
      const isMobile = window.innerWidth < 1024
      setViewMode(isMobile ? 'list' : 'split')
    }

    // Set initial view mode on mount
    handleResize()

    // Add resize listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initialize from URL params
  useEffect(() => {
    const location = searchParams?.get('location')
    const type = searchParams?.get('type')
    const beds = searchParams?.get('beds')
    const baths = searchParams?.get('baths')
    const minPrice = searchParams?.get('min_price')
    const maxPrice = searchParams?.get('max_price')
    const sort = searchParams?.get('sort')

    console.log('🔍 [URL PARAMS] Processing:', {
      location,
      type,
      beds,
      baths,
      minPrice,
      maxPrice,
      sort
    })

    if (location) {
      console.log('🏙️ [URL PARAMS] Setting searchQuery to:', location)
      setSearchQuery(location)
    }
    if (type) setSelectedType(type)
    if (beds) setMinBeds(parseInt(beds))
    if (baths) setMinBaths(parseInt(baths))
    if (minPrice) setPriceRange(prev => [parseInt(minPrice), prev[1]])
    if (maxPrice) setPriceRange(prev => [prev[0], parseInt(maxPrice)])
    if (sort) setSortBy(sort)

    // Focus search input if location param exists
    if (location) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [searchParams])

  // Load properties when filters change
  useEffect(() => {
    fetchProperties(currentPage)
  }, [searchQuery, priceRange, selectedType, minBeds, minBaths, sortBy, currentPage])

  // Load favorites when user changes
  // useEffect(() => {
  //   loadFavorites()
  // }, [user, loadFavorites])

  // Load favorites on page arrival — force=true skips debounce so hearts show immediately
useEffect(() => {
  if (user && !authLoading) {
    loadFavorites(true)
  }
}, [user?.id, authLoading]) // user.id (not full object) prevents spurious re-runs

  // ============================================================================
  // RENDER - MARKETPLACE LAYOUT
  // ============================================================================

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50">

        {/* ── Sticky search header ───────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 sticky top-[64px] z-40">
          <div className="container mx-auto px-4 lg:px-6 py-3">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              <div className="flex-1">
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={debouncedSearch}
                  onSearchSubmit={(query) => setSearchQuery(query)}
                  onClear={clearAllFilters}
                  placeholder="Search by location, property type..."
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                {(searchQuery || priceRange[0] > 0 || selectedType !== 'all') && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}
                    className="text-slate-500 hover:text-slate-900 text-sm px-2">
                    Clear
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowFilterModal(true)}
                  className="flex items-center gap-2 border-slate-300 rounded-full px-4">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="text-sm">Filters</span>
                  {(priceRange[0] > 0 || selectedType !== 'all' || minBeds > 0 || minBaths > 0) && (
                    <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {[priceRange[0] > 0, selectedType !== 'all', minBeds > 0, minBaths > 0].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Inline error banner — map stays mounted ────────────────────── */}
        {renderState === 'error' && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error || 'Failed to load properties'}</span>
            </div>
            <Button size="sm" variant="outline"
              onClick={() => fetchProperties(currentPage, true)}
              className="border-red-300 text-red-600 hover:bg-red-100 text-xs h-7 px-2">
              <RefreshCw className="h-3 w-3 mr-1" />Retry
            </Button>
          </div>
        )}

        {/* ── Split view — list LEFT, map RIGHT ─────────────────────────── */}
        {viewMode === 'split' ? (
          <div style={{ height: 'calc(100vh - 130px)' }} className="flex overflow-hidden">

            {/* List panel — 42% width, scrollable */}
            <div className="w-[42%] flex-shrink-0 h-full overflow-y-auto bg-white border-r border-slate-200"
                 id="property-list-panel">
              <div className="p-4">

                {/* Result count + sort */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                        <span className="text-sm text-slate-500">Searching...</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">
                        {properties.length.toLocaleString()}
                        <span className="font-normal text-slate-500"> {properties.length === 1 ? 'property' : 'properties'}</span>
                        {searchQuery && (
                          <span className="font-normal text-slate-500"> in <span className="text-orange-600 font-medium">{searchQuery}</span></span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Loading skeletons — 2-column grid */}
                {isLoading && (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-slate-200 rounded-xl mb-2" />
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-200 rounded w-1/2" />
                          <div className="h-4 bg-slate-200 rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state inline */}
                {!isLoading && renderState === 'empty' && (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="bg-slate-100 rounded-full p-6 mb-3">
                      <Home className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">No properties found</p>
                    <p className="text-xs text-slate-500 mb-3">Try adjusting your filters</p>
                    <Button size="sm" onClick={clearAllFilters}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                      Clear filters
                    </Button>
                  </div>
                )}

                {/* 2-column property cards */}
                {!isLoading && properties.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {properties.map((property) => (
                      <div
                        key={property.id}
                        id={`property-card-${property.id}`}
                        className={`group bg-white rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-orange-300 ${
                          selectedProperty?.id === property.id
                            ? 'border-orange-400 shadow-lg ring-2 ring-orange-200'
                            : 'border-slate-200'
                        }`}
                        onClick={() => {
                          // Select property for map sync (don't navigate)
                          setSelectedProperty(property)
                          
                          // Scroll to card in view
                          const card = document.getElementById(`property-card-${property.id}`)
                          card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                        }}
                      >
                        {/* Image container */}
                        <div className="relative h-32 overflow-hidden bg-slate-100">
                          {property.images?.[0] ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-8 w-8 text-slate-300" />
                            </div>
                          )}
                          
                          {/* Status badge - Improved visibility */}
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold shadow-md ${
                            property.status === 'vacant' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-orange-500 text-white'
                          }`}>
                            {property.status === 'vacant' ? 'Available' : 'Rented'}
                          </div>

                          {/* Favorite button */}
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleFavoriteClick(property.id) 
                            }}
                            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:bg-white transition-colors"
                          >
                            <svg className={`w-4 h-4 ${favorites.includes(property.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`}
                              viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                            </svg>
                          </button>

                          {/* Price overlay */}
                          <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md">
                            <span className="text-sm font-bold text-orange-600">
                              ₦{(property.price || 0).toLocaleString()}
                              <span className="text-xs font-normal text-slate-400">/mo</span>
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3">
                          {/* Title */}
                          <h3 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors mb-1">
                            {property.title}
                          </h3>

                          {/* Location */}
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3 text-orange-400 flex-shrink-0" />
                            {property.location || `${property.city}, ${property.state}`}
                          </p>

                          {/* Specs - Improved with better icons and tooltips */}
                          <div className="flex items-center gap-2 text-xs mb-2">
                            {property.beds && (
                              <div 
                                className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded hover:bg-orange-50 transition-colors group relative"
                                title={`${property.beds} Bedroom${property.beds !== 1 ? 's' : ''}`}
                              >
                                <Bed className="w-3 h-3 text-orange-500" />
                                <span className="font-semibold text-slate-700">{property.beds}</span>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  {property.beds} Bedroom{property.beds !== 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                            {property.baths && (
                              <div 
                                className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded hover:bg-blue-50 transition-colors group relative"
                                title={`${property.baths} Bathroom${property.baths !== 1 ? 's' : ''}`}
                              >
                                <Bath className="w-3 h-3 text-blue-500" />
                                <span className="font-semibold text-slate-700">{property.baths}</span>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  {property.baths} Bathroom{property.baths !== 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                            {property.sqft && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded text-slate-700">
                                <span className="text-[10px] font-semibold">{Math.round(property.sqft / 100) * 100}</span>
                              </div>
                            )}
                          </div>

                          {/* Verified badge */}
                          {property.landlord?.verified && (
                            <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                              <svg viewBox="0 0 20 20" fill="currentColor" width="10" height="10">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                              Verified
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                // Select property and fly to it on map
                                setSelectedProperty(property)
                                // Scroll to card
                                const card = document.getElementById(`property-card-${property.id}`)
                                card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                              }}
                              className={`flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-colors ${
                                selectedProperty?.id === property.id
                                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {selectedProperty?.id === property.id ? '📍 Selected' : '📍 View on Map'}
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                router.push(`/properties/${property.id}`)
                              }}
                              className="flex-1 text-xs py-1.5 px-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 font-medium transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination && !isLoading && properties.length > 0 && (
                  <div className="flex justify-center mt-4 pb-2">
                    <PaginationControls
                      pagination={pagination}
                      currentPage={currentPage}
                      onPageChange={(page) => fetchProperties(page)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Map panel — 58% width, always mounted */}
            <div className="flex-1 h-full relative">
              {/* Translucent shimmer during search — map tiles stay visible */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
                  <div className="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span className="text-sm font-medium text-slate-700">Updating...</span>
                  </div>
                </div>
              )}
              <PropertyMapOptimized
                properties={properties}
                selectedProperty={selectedProperty}
                onPropertySelect={(property) => {
                  setSelectedProperty(property)
                  if (property) {
                    setTimeout(() => {
                      const card = document.getElementById(`property-card-${property.id}`)
                      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    }, 100)
                  }
                }}
                zoom={11}
              />
            </div>
          </div>

        ) : viewMode === 'map' ? (
          /* Full-screen map view */
          <div style={{ height: 'calc(100vh - 130px)' }} className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center pointer-events-none">
                <div className="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span className="text-sm text-slate-700">Updating...</span>
                </div>
              </div>
            )}
            <PropertyMapOptimized
              properties={properties}
              selectedProperty={selectedProperty}
              onPropertySelect={setSelectedProperty}
              zoom={11}
            />
          </div>

        ) : (
          /* Grid view - Optimized compact layout */
          <div className="container mx-auto px-3 lg:px-6 py-8">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                    <div className="h-32 bg-slate-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                      <div className="h-2 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : renderState === 'empty' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
                <div className="bg-slate-100 rounded-full p-8 mb-6">
                  <Home className="h-14 w-14 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {searchQuery ? `No results for "${searchQuery}"` : 'No properties found'}
                </h3>
                <p className="text-slate-500 mb-6">Try adjusting your search or filters</p>
                <Button onClick={clearAllFilters} className="bg-orange-500 hover:bg-orange-600 text-white">
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                {properties.length > 0 && (
                  <p className="text-sm text-slate-600 mb-6">
                    <span className="font-semibold text-slate-900">{properties.length.toLocaleString()}</span> properties found
                    {searchQuery && <> in <span className="text-orange-600 font-medium">{searchQuery}</span></>}
                  </p>
                )}
                <PropertyCardGrid
                  properties={properties}
                  onSelect={(property) => router.push(`/properties/${property.id}`)}
                  onFavorite={handleFavoriteClick}
                  favorites={favorites}
                  variant="compact"
                  isAuthLoading={authLoading}
                  isPendingFavorites={pendingFavorites}
                />
                {pagination && (
                  <div className="flex justify-center mt-8">
                    <PaginationControls
                      pagination={pagination}
                      currentPage={currentPage}
                      onPageChange={(page) => fetchProperties(page)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Modals ──────────────────────────────────────────────────────── */}
        {showFilterModal && (
          <PropertyFiltersModal
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            filters={{ priceRange, propertyType: selectedType, bedrooms: minBeds, bathrooms: minBaths }}
            onFiltersChange={(filters) => {
              setPriceRange(filters.priceRange || [0, 10000000])
              setSelectedType(filters.propertyType || 'all')
              setMinBeds(filters.bedrooms || 0)
              setMinBaths(filters.bathrooms || 0)
              setCurrentPage(1)
            }}
          />
        )}
        {showSaveFavoriteModal && (
          <SaveFavoriteModal
            isOpen={showSaveFavoriteModal}
            onClose={() => setShowSaveFavoriteModal(false)}
            propertyTitle={properties.find(p => p.id === pendingFavoriteId)?.title || ''}
            onSaveWithEmail={() => { setShowSaveFavoriteModal(false); toast.success('Please sign in to save favorites') }}
            onContinueBrowsing={() => { setShowSaveFavoriteModal(false); setPendingFavoriteId(null) }}
          />
        )}
      </div>
    </>
  )
}
