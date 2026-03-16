"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  MapPin, 
  Home, 
  Bed, 
  Bath, 
  Square,
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2,
  Grid,
  Map,
  Split
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { propertiesAPI } from '@/lib/api/properties'
import { favoritesAPI } from '@/lib/api/favorites'
import { useAuth } from '@/contexts/AuthContext'
import PropertyCard from '@/components/properties/PropertyCard'
import PropertyMapOptimized from './PropertyMapOptimized'
import { toast } from 'sonner'
import type { PropertySearchResponse, Property } from '@/lib/types/property'

interface PaginationState {
  page: number
  limit: number
  total: number
  total_pages: number  // Match API response
}

interface SearchFilters {
  location?: string
  min_price?: number
  max_price?: number
  bedrooms?: number
  bathrooms?: number
  property_type?: string
  sort_by?: 'newest' | 'price_low' | 'price_high' | 'featured' | 'rating'
  page: number
  limit: number
}

type ViewMode = 'grid' | 'map' | 'split'

// Constants
const DEFAULT_LOCATION = 'Lagos'
const ITEMS_PER_PAGE = 20 // 20 properties per page as requested
const SEARCH_DEBOUNCE_MS = 400
const MAX_PRICE = 5000000
const PRICE_STEP = 100000

// ✅ Custom debounce function (no lodash dependency)
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// ✅ OPTIMIZED: Property type options
const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'flat', label: 'Flat' },
  { value: 'studio', label: 'Studio' },
  { value: 'terrace', label: 'Terrace' },
  { value: 'bungalow', label: 'Bungalow' },
]

// ✅ OPTIMIZED: Sort options
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
]

// ✅ OPTIMIZED: Bedroom options
const BEDROOM_OPTIONS = [
  { value: 'all', label: 'Any Beds' },
  { value: '1', label: '1 Bedroom' },
  { value: '2', label: '2 Bedrooms' },
  { value: '3', label: '3 Bedrooms' },
  { value: '4', label: '4+ Bedrooms' },
]

export default function PropertySearchOptimized() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  
  // State
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    total_pages: 0
  })
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    location: searchParams?.get('location') || DEFAULT_LOCATION,
    min_price: undefined,
    max_price: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    property_type: 'all',
    sort_by: 'featured',
    page: 1,
    limit: ITEMS_PER_PAGE
  })
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // ✅ OPTIMIZED: Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController()
      
      try {
        setLoading(true)
        setError(null)
        
        // Build search params object
        const searchParams: any = {}
        Object.entries(searchFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== 'all') {
            searchParams[key] = value
          }
        })
        
        // Fetch properties
        const response: PropertySearchResponse = await propertiesAPI.search(searchParams, {
          signal: abortControllerRef.current.signal
        })
        
        if (response.success && response.properties) {
          setProperties(response.properties || [])
          setPagination(response.pagination || {
            page: 1,
            limit: ITEMS_PER_PAGE,
            total: 0,
            total_pages: 0
          })
        } else {
          throw new Error('Failed to fetch properties')
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err)
          setError(err.message || 'Failed to search properties')
          toast.error('Failed to load properties')
        }
      } finally {
        setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS),
    [pagination]
  )
  
  // ✅ OPTIMIZED: Load favorites
  const loadFavorites = useCallback(async () => {
    if (!user) return
    
    try {
      const response = await favoritesAPI.getAll()
      if (response.success && response.favorites) {
        const favoriteIds = new Set(response.favorites.map((fav: any) => fav.property_id))
        setFavorites(favoriteIds)
      }
    } catch (err) {
      console.error('Failed to load favorites:', err)
    }
  }, [user])
  
  // ✅ OPTIMIZED: Handle search
  const handleSearch = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    setFilters(updatedFilters)
    
    // Update URL
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all' && key !== 'page') {
        params.append(key, value.toString())
      }
    })
    router.push(`/properties?${params.toString()}`, { scroll: false })
    
    // Trigger search
    debouncedSearch(updatedFilters)
  }, [filters, router, debouncedSearch])
  
  // ✅ OPTIMIZED: Handle pagination
  const handlePageChange = useCallback((page: number) => {
    const updatedFilters = { ...filters, page }
    setFilters(updatedFilters)
    debouncedSearch(updatedFilters)
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters, debouncedSearch])
  
  // ✅ OPTIMIZED: Toggle favorite
  const toggleFavorite = useCallback(async (propertyId: string) => {
    if (!user) {
      toast.error('Please sign in to save favorites')
      return
    }
    
    try {
      const isFavorited = favorites.has(propertyId)
      
      if (isFavorited) {
        await favoritesAPI.remove(propertyId)
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          newFavorites.delete(propertyId)
          return newFavorites
        })
        toast.success('Removed from favorites')
      } else {
        await favoritesAPI.add(propertyId)
        setFavorites(prev => new Set(prev).add(propertyId))
        toast.success('Added to favorites')
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
      toast.error('Failed to update favorites')
    }
  }, [user, favorites])
  
  // ✅ OPTIMIZED: Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    handleSearch({
      location: DEFAULT_LOCATION,
      min_price: undefined,
      max_price: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      property_type: 'all',
      sort_by: 'featured'
    })
  }, [handleSearch])
  
  // ✅ OPTIMIZED: Format price
  const formatPrice = useCallback((price: number) => {
    if (price >= 1000000) {
      return `₦${(price / 1000000).toFixed(1)}M`
    }
    return `₦${price.toLocaleString()}`
  }, [])
  
  // ✅ OPTIMIZED: Initialize search
  useEffect(() => {
    const initialFilters = {
      ...filters,
      location: searchParams?.get('location') || DEFAULT_LOCATION,
      property_type: searchParams?.get('property_type') || 'all',
      bedrooms: searchParams?.get('bedrooms') ? parseInt(searchParams?.get('bedrooms')!) : undefined,
      min_price: searchParams?.get('min_price') ? parseInt(searchParams?.get('min_price')!) : undefined,
      max_price: searchParams?.get('max_price') ? parseInt(searchParams?.get('max_price')!) : undefined,
      sort_by: (searchParams?.get('sort_by') as any) || 'featured'
    }
    
    setFilters(initialFilters)
    debouncedSearch(initialFilters)
    loadFavorites()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  // ✅ OPTIMIZED: Calculate stats
  const stats = useMemo(() => ({
    total: pagination.total,
    showing: properties.length,
    page: pagination.page,
    totalPages: pagination.total_pages
  }), [pagination, properties])
  
  // Auto-scroll list to selected card when selection changes from map click
  useEffect(() => {
    if (!selectedProperty || viewMode !== 'split') return
    const card = document.getElementById(`split-card-${selectedProperty.id}`)
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedProperty, viewMode])
   
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by location, property name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleSearch({ location: e.target.value || DEFAULT_LOCATION })
                    }}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'split' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('split')}
                    className="h-8 w-8 p-0"
                  >
                    <Split className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="h-8 w-8 p-0"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Filters Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-12 px-4"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {(filters.min_price || filters.max_price || filters.bedrooms || filters.property_type !== 'all') && (
                    <Badge variant="secondary" className="ml-2 h-5">
                      Active
                    </Badge>
                  )}
                </Button>
                
                {/* Clear Filters */}
                {(searchQuery || filters.min_price || filters.max_price || filters.bedrooms || filters.property_type !== 'all') && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-12 px-4"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Select
                value={filters.property_type}
                onValueChange={(value) => handleSearch({ property_type: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.bedrooms?.toString() || 'all'}
                onValueChange={(value) => handleSearch({ bedrooms: value === 'all' ? undefined : parseInt(value) })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  {BEDROOM_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.sort_by}
                onValueChange={(value) => handleSearch({ sort_by: value as any })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: {formatPrice(filters.min_price || 0)} - {formatPrice(filters.max_price || MAX_PRICE)}
                </label>
                <Slider
                  value={[filters.min_price || 0, filters.max_price || MAX_PRICE]}
                  onValueChange={([min, max]) => handleSearch({ min_price: min, max_price: max })}
                  max={MAX_PRICE}
                  step={PRICE_STEP}
                  className="mt-4"
                />
              </div>
              
              {/* Bathrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(num => (
                    <Button
                      key={num}
                      variant={filters.bathrooms === num ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSearch({ bathrooms: filters.bathrooms === num ? undefined : num })}
                    >
                      {num}+
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Results Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.location ? `Properties in ${filters.location}` : 'All Properties'}
            </h1>
            <p className="text-gray-600 mt-1">
              Showing {stats.showing} of {stats.total} properties
            </p>
          </div>
          
          {/* Pagination */}
          {stats.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(stats.page - 1)}
                disabled={stats.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {stats.page} of {stats.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(stats.page + 1)}
                disabled={stats.page === stats.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
      
            {/* ── Loading skeletons ─────────────────────────────────────────────────── */}
      {loading && properties.length === 0 && viewMode !== 'split' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => debouncedSearch(filters)}>Try Again</Button>
        </div>
      )}

      {/* ── Split view — full viewport height, 2-column grid list left + map right ─────────── */}
      {viewMode === 'split' && !error && (
        <div
          style={{ height: 'calc(100vh - 160px)' }}
          className="flex"
        >
          {/* List panel — 40% width, scrollable, 2-column grid */}
          <div className="w-[40%] flex-shrink-0 overflow-y-auto bg-slate-50 border-r border-slate-200" id="split-list-panel">
            <div className="p-3">
              {/* Result count */}
              <p className="text-xs font-medium text-slate-500 px-1 py-1">
                {stats.total} {stats.total === 1 ? 'property' : 'properties'}
                {filters.location ? ` in ${filters.location}` : ''}
              </p>

              {/* Loading shimmer over list only */}
              {loading && (
                <div className="grid grid-cols-2 gap-2">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && properties.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Home className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-700 mb-1">No properties found</p>
                  <p className="text-xs text-slate-500 mb-4">Try adjusting your filters</p>
                  <Button size="sm" onClick={clearFilters} className="bg-orange-500 hover:bg-orange-600 text-white">
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* 2-column grid of compact cards */}
              {!loading && properties.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {properties.map(property => (
                    <div
                      key={property.id}
                      id={`split-card-${property.id}`}
                      className={`rounded-xl transition-all duration-150 ${
                        selectedProperty?.id === property.id
                          ? 'ring-2 ring-orange-500'
                          : ''
                      }`}
                    >
                      <PropertyCard
                        property={property}
                        isFavorite={favorites.has(property.id)}
                        onFavorite={(propertyId: string) => toggleFavorite(propertyId)}
                        onSelect={() => {
                          setSelectedProperty(property)
                        }}
                        compact={true}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {stats.totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-2 pt-3 pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(stats.page - 1)}
                    disabled={stats.page === 1}
                    className="h-7 text-xs"
                  >
                    ← Prev
                  </Button>
                  <span className="text-xs text-slate-500">
                    {stats.page} / {stats.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(stats.page + 1)}
                    disabled={stats.page === stats.totalPages}
                    className="h-7 text-xs"
                  >
                    Next →
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Map panel — 60% width, always mounted, never conditionally removed */}
          <div className="flex-1 relative">
            {/* Translucent shimmer overlay during loading — map stays rendered */}
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span className="text-sm font-medium text-slate-700">Updating results...</span>
                </div>
              </div>
            )}
            <PropertyMapOptimized
              properties={properties}
              selectedProperty={selectedProperty}
              onPropertySelect={(property) => {
                setSelectedProperty(property)
                // Scroll the list panel to the selected card
                if (property) {
                  setTimeout(() => {
                    const card = document.getElementById(`split-card-${property.id}`)
                    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  }, 50)
                }
              }}
              formatPrice={formatPrice}
              currentPage={stats.page}
              itemsPerPage={20} // 20 properties per page as requested
            />
          </div>
        </div>
      )}

      {/* ── Map-only view ──────────────────────────────────────────────────────── */}
      {viewMode === 'map' && !error && (
        <div style={{ height: 'calc(100vh - 160px)' }} className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          )}
          <PropertyMapOptimized
              properties={properties}
              selectedProperty={selectedProperty}
              onPropertySelect={setSelectedProperty}
              formatPrice={formatPrice}
              currentPage={stats.page}
              itemsPerPage={20} // 20 properties per page
            />
        </div>
      )}

      {/* ── Grid view ─────────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && !error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {!loading && properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg" />
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map(property => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isFavorite={favorites.has(property.id)}
                      onFavorite={(propertyId: string) => toggleFavorite(propertyId)}
                      onSelect={() => setSelectedProperty(property)}
                    />
                  ))}
                </div>
              )}
              {/* Grid view pagination */}
              {stats.totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(stats.page - 1)} disabled={stats.page === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">Page {stats.page} of {stats.totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(stats.page + 1)} disabled={stats.page === stats.totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
          </div>
        )
      }
    </div>
  )
}