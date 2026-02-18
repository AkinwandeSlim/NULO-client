"use client"

import Link from "next/link"
import { Search, MapPin, Building2, ChevronDown, SlidersHorizontal, Home, Bed, Bath, Loader2, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface SearchBarProps {
  location: string
  setLocation: (location: string) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  propertyType: string
  setPropertyType: (type: string) => void
  showAdvanced: boolean
  setShowAdvanced: (show: boolean) => void
  locationInputRef: React.RefObject<HTMLInputElement | null>
  userType?: 'tenant' | 'landlord'
  defaultCity?: string // ✅ NEW: Default city for location suggestions
}

// ✅ City-specific location suggestions
const CITY_LOCATIONS: Record<string, LocationSuggestion[]> = {
  'Abuja': [
    { location: 'Maitama', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Maitama, FCT' },
    { location: 'Garki', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Garki, FCT' },
    { location: 'Wuse', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Wuse, FCT' },
    { location: 'Central Area', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Central Area, FCT' },
    { location: 'Gwarinpa', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Gwarinpa, FCT' },
    { location: 'Kubwa', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Kubwa, FCT' },
    { location: 'Jabi', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Jabi, FCT' },
    { location: 'Asokoro', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Asokoro, FCT' },
  ],
  'Lagos': [
    { location: 'Lekki', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Lekki, Lagos State' },
    { location: 'Victoria Island', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Victoria Island, Lagos State' },
    { location: 'Ikoyi', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Ikoyi, Lagos State' },
    { location: 'Ajah', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Ajah, Lagos State' },
    { location: 'Ikeja', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Ikeja, Lagos State' },
    { location: 'Yaba', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Yaba, Lagos State' },
    { location: 'Banana Island', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Banana Island, Lagos State' },
    { location: 'Surulere', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Surulere, Lagos State' },
  ],
  'Port Harcourt': [
    { location: 'GRA', state: 'Rivers State', country: 'Nigeria', property_count: 0, display_name: 'GRA, Rivers State' },
    { location: 'Elekahia', state: 'Rivers State', country: 'Nigeria', property_count: 0, display_name: 'Elekahia, Rivers State' },
    { location: 'Old GRA', state: 'Rivers State', country: 'Nigeria', property_count: 0, display_name: 'Old GRA, Rivers State' },
    { location: 'Trans Amadi', state: 'Rivers State', country: 'Nigeria', property_count: 0, display_name: 'Trans Amadi, Rivers State' },
    { location: 'Rumuokwuta', state: 'Rivers State', country: 'Nigeria', property_count: 0, display_name: 'Rumuokwuta, Rivers State' },
    { location: 'D-Line', state: 'Rivers State', country: 'Nigeria', property_count: 0, display_name: 'D-Line, Rivers State' },
    { location: 'Rumuola', state: 'Rivers State', country: 'Nigeria', property_count: 0, display_name: 'Rumuola, Rivers State' },
    { location: 'Rumuogbolu', state: 'Rivers State', country: 'Nigeria', property_count: 0, display_name: 'Rumuogbolu, Rivers State' },
  ],
  'default': [
    { location: 'Lekki', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Lekki, Lagos State' },
    { location: 'Victoria Island', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Victoria Island, Lagos State' },
    { location: 'Maitama', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Maitama, FCT' },
    { location: 'GRA', state: 'Rivers State', country: 'Nigeria', property_count: 0, display_name: 'GRA, Rivers State' },
    { location: 'Ikoyi', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Ikoyi, Lagos State' },
    { location: 'Garki', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Garki, FCT' },
    { location: 'Ajah', state: 'Lagos State', country: 'Nigeria', property_count: 0, display_name: 'Ajah, Lagos State' },
    { location: 'Wuse', state: 'FCT', country: 'Nigeria', property_count: 0, display_name: 'Wuse, FCT' },
  ]
}

// Nigerian property types
const NIGERIAN_PROPERTY_TYPES = [
  { value: 'all', label: 'All Properties' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'flat', label: 'Flat' },
  { value: 'self-contain', label: 'Self-Contain' },
  { value: 'mini-flat', label: 'Mini Flat' },
  { value: 'villa', label: 'Villa' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'townhouse', label: 'Townhouse' },
] as const

// ✅ FIXED: Proper Naira formatting
const formatPrice = (value: number): string => {
  if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₦${(value / 1000).toFixed(0)}K`
  return `₦${value.toLocaleString('en-NG')}`
}

// Price configuration
const PRICE_CONFIG = {
  MIN: 0,
  MAX: 50000000,
  DEFAULT_MAX: 10000000,
  STEP: 100000,
  COMMON_RANGES: [
    { label: 'Budget', min: 0, max: 1000000 },
    { label: 'Standard', min: 1000000, max: 3000000 },
    { label: 'Premium', min: 3000000, max: 10000000 },
    { label: 'Luxury', min: 10000000, max: 50000000 }
  ]
}

interface LocationSuggestion {
  location: string
  state: string
  country: string
  property_count: number
  display_name: string
}

export function SearchBar({
  location,
  setLocation,
  priceRange,
  setPriceRange,
  propertyType,
  setPropertyType,
  showAdvanced,
  setShowAdvanced,
  locationInputRef,
  userType = 'tenant',
  defaultCity = 'Lagos' // ✅ Default to Lagos, can be overridden for Abuja or Port Harcourt
}: SearchBarProps) {
  const [popularLocations, setPopularLocations] = useState<LocationSuggestion[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<LocationSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  
  const suggestionsId = 'search-suggestions'
  const inputId = 'search-location-input'
  const suggestionsRef = useRef<HTMLDivElement | null>(null)
  
  const [bedrooms, setBedrooms] = useState<string>('Any')
  const [bathrooms, setBathrooms] = useState<string>('Any')
  const [minSize, setMinSize] = useState<string>('')
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('custom')

  // ✅ ENHANCED: Show more cities by default and ensure good visibility
  useEffect(() => {
    const fetchPopularLocations = async () => {
      try {
        setLoadingLocations(true)
        setLocationError(null)
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        
        // ✅ Fetch cities for the default state
        const stateMap: Record<string, string> = {
          'Abuja': 'Abuja',
          'Lagos': 'Lagos',
          'Port Harcourt': 'Port Harcourt'
        }
        
        const selectedState = stateMap[defaultCity] || 'Lagos'
        const endpoint = `${API_BASE_URL}/api/locations/cities?state=${encodeURIComponent(selectedState)}&limit=10`
        
        console.log(`📍 Fetching cities from: ${endpoint}`)
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch locations: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!data.cities || !Array.isArray(data.cities)) {
          throw new Error('Invalid response format from API')
        }
        
        // ✅ Transform API cities to our format and limit to top 8 for better visibility
        const transformedLocations: LocationSuggestion[] = data.cities
          .slice(0, 8)
          .map((city: any) => ({
            location: city.name,
            state: data.state_code,
            country: 'Nigeria',
            property_count: 0,
            display_name: `${city.name}, ${data.state_code}`
          }))
        
        setPopularLocations(transformedLocations)
        setFilteredSuggestions(transformedLocations)
        console.log(`✅ Successfully loaded ${transformedLocations.length} cities for ${selectedState}`)
        
      } catch (error) {
        console.error('❌ Failed to fetch locations:', error)
        
        // ✅ Fallback to hardcoded city locations - show top 6 for better UX
        const fallbackLocations = (CITY_LOCATIONS[defaultCity] || CITY_LOCATIONS['default']).slice(0, 6)
        setPopularLocations(fallbackLocations)
        setFilteredSuggestions(fallbackLocations)
        console.log(`📍 Using fallback locations for: ${defaultCity}`)
      } finally {
        setLoadingLocations(false)
      }
    }

    fetchPopularLocations()
  }, [defaultCity])

  // ✅ ENHANCED: Auto-show suggestions when locations are loaded for better UX
  useEffect(() => {
    if (popularLocations.length > 0 && !location) {
      // Small delay to ensure proper positioning
      setTimeout(() => setShowSuggestions(true), 100)
    }
  }, [popularLocations, location])

  // Filter suggestions based on input
  useEffect(() => {
    if (location.trim()) {
      const filtered = popularLocations.filter(loc =>
        loc.display_name.toLowerCase().includes(location.toLowerCase()) ||
        loc.location.toLowerCase().includes(location.toLowerCase())
      )
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions(popularLocations)
    }
  }, [location, popularLocations])

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1)
  }, [filteredSuggestions, showSuggestions])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => {
        const next = Math.min(prev + 1, filteredSuggestions.length - 1)
        const activeElement = document.getElementById(`suggestion-${next}`)
        activeElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        return next
      })
      setShowSuggestions(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => {
        const next = Math.max(prev - 1, 0)
        const activeElement = document.getElementById(`suggestion-${next}`)
        activeElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        return next
      })
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
        e.preventDefault()
        selectLocation(filteredSuggestions[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  const selectLocation = (loc: LocationSuggestion) => {
    setLocation(loc.display_name)
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  const handleClearLocation = () => {
    setLocation('')
    setShowSuggestions(true)
    setActiveIndex(-1)
    setTimeout(() => locationInputRef.current?.focus(), 0)
  }

  const applyPricePreset = (preset: typeof PRICE_CONFIG.COMMON_RANGES[number]) => {
    setPriceRange([preset.min, preset.max])
    setSelectedPriceRange(`${preset.min}-${preset.max}`)
  }

  const buildSearchURL = () => {
    const params = new URLSearchParams()
    
    if (location && location.trim()) {
      const locationValue = location.trim()
      // ✅ IMPROVED: Send as 'location' to search across city, area, and neighborhood
      // The backend API searches: location, city, state, and area fields
      params.append('location', locationValue)
    }
    
    if (propertyType !== 'all' && propertyType) {
      params.append('property_type', propertyType.toLowerCase())
    }
    
    if (priceRange[0] > 0) {
      params.append('min_price', priceRange[0].toString())
    }
    
    if (priceRange[1] < PRICE_CONFIG.DEFAULT_MAX) {
      params.append('max_price', priceRange[1].toString())
    }
    
    if (bedrooms !== 'Any') {
      const bedroomValue = bedrooms.replace('+', '')
      params.append('bedrooms', bedroomValue)
    }
    
    if (bathrooms !== 'Any') {
      const bathroomValue = bathrooms.replace('+', '')
      params.append('bathrooms', bathroomValue)
    }
    
    if (minSize && parseInt(minSize) > 0) {
      params.append('min_size', minSize)
    }
    
    params.append('sort', 'newest')
    params.append('page', '1')
    params.append('limit', '20')
    
    const queryString = params.toString()
    return `/properties${queryString ? `?${queryString}` : ''}`
  }

  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Backdrop when dropdown is shown - REMOVED to prevent blur */}
      {/* {showSuggestions && (
        <div 
          className="fixed inset-0 bg-black/5 backdrop-blur-sm z-[50]" 
          onClick={() => setShowSuggestions(false)}
          aria-hidden="true"
        />
      )} */}
      {/* ✅ NEW: Error Banner */}
      {locationError && (
        <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-orange-900">Location search unavailable</p>
            <p className="text-xs text-orange-700 mt-1">{locationError}</p>
            <p className="text-xs text-orange-600 mt-1">Using default locations. You can still search.</p>
          </div>
        </div>
      )}

      <Card className="relative bg-white backdrop-blur-sm border-0 rounded-2xl shadow-xl overflow-visible transform scale-100">
        
      <CardContent className="relative p-3">
        <div className="flex flex-col md:flex-row gap-2">
          {/* Location Input */}
          <div className="flex-1 relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              {loadingLocations ? (
                <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              )}
            </div>
            
            <label htmlFor={inputId} className="sr-only">Search location</label>
            <input
              ref={locationInputRef}
              id={inputId}
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls={suggestionsId}
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => {
                setShowSuggestions(true)
                // Smart positioning based on available space
                setTimeout(() => {
                  const input = document.getElementById(inputId)
                  const dropdown = document.getElementById(suggestionsId)
                  
                  if (input && dropdown) {
                    const inputRect = input.getBoundingClientRect()
                    const viewportHeight = window.innerHeight
                    const spaceBelow = viewportHeight - inputRect.bottom
                    const spaceAbove = inputRect.top
                    
                    // Show above if not enough space below
                    if (spaceBelow < 200 && spaceAbove > 200) {
                      setDropdownPosition('top')
                      dropdown.style.top = 'auto'
                      dropdown.style.bottom = '100%'
                      dropdown.style.marginBottom = '12px'
                      dropdown.style.marginTop = '0'
                    } else {
                      setDropdownPosition('bottom')
                      dropdown.style.top = '100%'
                      dropdown.style.bottom = 'auto'
                      dropdown.style.marginTop = '12px'
                      dropdown.style.marginBottom = '0'
                    }
                  }
                }, 0)
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
              onKeyDown={handleKeyDown}
              placeholder="City, neighborhood, or address"
              className="w-full h-12 pl-10 pr-8 rounded-lg border-0 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-sm"
              autoComplete="off"
              aria-label="Search location"
              disabled={loadingLocations}
            />

            {location && (
              <button
                onClick={handleClearLocation}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Clear location"
              >
                <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}

            {/* Location Suggestions */}
            <AnimatePresence>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute left-0 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100]"
                  id={suggestionsId}
                  role="listbox"
                  ref={suggestionsRef}
                  style={{
                    top: dropdownPosition === 'bottom' ? '100%' : 'auto',
                    bottom: dropdownPosition === 'top' ? '100%' : 'auto',
                    marginTop: dropdownPosition === 'bottom' ? '12px' : '0',
                    marginBottom: dropdownPosition === 'top' ? '12px' : '0',
                    maxHeight: '320px',
                    minWidth: '100%'
                  }}
                >
                  <div className="p-4 overflow-y-auto" style={{ maxHeight: '280px' }}>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide px-3 py-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                      {location.trim() ? 'Matching Locations' : 'Popular Locations'}
                    </div>
                    {filteredSuggestions.map((loc, index) => (
                      <button
                        key={`${loc.location}-${index}`}
                        id={`suggestion-${index}`}
                        onClick={() => selectLocation(loc)}
                        onMouseEnter={() => setActiveIndex(index)}
                        role="option"
                        aria-selected={activeIndex === index}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left ${
                          activeIndex === index ? 'bg-orange-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            activeIndex === index ? 'bg-orange-500' : 'bg-orange-50'
                          }`}>
                            <MapPin className={`h-4 w-4 transition-colors ${
                              activeIndex === index ? 'text-white' : 'text-orange-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium block truncate transition-colors ${
                              activeIndex === index ? 'text-orange-600' : 'text-slate-700'
                            }`}>
                              {loc.location}
                            </span>
                            <span className="text-xs text-slate-500 block truncate">
                              {loc.state}, {loc.country}
                            </span>
                          </div>
                        </div>
                        {loc.property_count > 0 && (
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex-shrink-0 ml-2">
                            {loc.property_count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {showSuggestions && location.trim() && filteredSuggestions.length === 0 && !loadingLocations && (
              <div className="absolute left-0 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-[100]"
                   style={{
                     top: dropdownPosition === 'bottom' ? '100%' : 'auto',
                     bottom: dropdownPosition === 'top' ? '100%' : 'auto',
                     marginTop: dropdownPosition === 'bottom' ? '12px' : '0',
                     marginBottom: dropdownPosition === 'top' ? '12px' : '0',
                     minWidth: '100%'
                   }}
              >
                <p className="text-sm text-slate-600 text-center">
                  No locations found for "{location}"
                </p>
                <p className="text-xs text-slate-500 text-center mt-1">
                  Try searching for a major city like Lagos, Abuja, or Port Harcourt
                </p>
              </div>
            )}
          </div>

          {/* Property Type Dropdown */}
          <div className="md:w-40 relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <Home className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full h-12 pl-10 pr-8 rounded-lg border-0 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none cursor-pointer font-medium text-sm"
              aria-label="Select property type"
            >
              {NIGERIAN_PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Button */}
          <Link 
            href={buildSearchURL()} 
            className="w-full md:w-auto"
          >
            <Button
              type="button"
              className="w-full md:w-auto h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
              aria-label="Search for properties"
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </Link>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="mt-2 flex items-center justify-center">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-500 hover:text-slate-700 transition-all font-medium"
            aria-expanded={showAdvanced}
            aria-controls="advanced-filters"
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>{showAdvanced ? 'Less' : 'More filters'}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <motion.div
            id="advanced-filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-slate-100"
          >
            <div className="space-y-4">
              {/* Mobile Price Presets */}
              {isMobile && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-2 block">
                    Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICE_CONFIG.COMMON_RANGES.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyPricePreset(preset)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          selectedPriceRange === `${preset.min}-${preset.max}`
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                        <div className="text-[10px] opacity-80 mt-0.5">
                          {formatPrice(preset.min)} - {formatPrice(preset.max)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Desktop Price Sliders */}
              {!isMobile && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-slate-600">Price Range</label>
                    <span className="text-xs font-bold text-orange-600">
                      {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </span>
                  </div>
                  
                  <div className="flex gap-1.5 mb-3">
                    {PRICE_CONFIG.COMMON_RANGES.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyPricePreset(preset)}
                        className={`flex-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-all ${
                          selectedPriceRange === `${preset.min}-${preset.max}`
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="relative h-2 bg-slate-100 rounded-full">
                      <div 
                        className="absolute h-2 bg-orange-500 rounded-full transition-all duration-300"
                        style={{
                          left: `${(priceRange[0] / PRICE_CONFIG.MAX) * 100}%`,
                          right: `${100 - (priceRange[1] / PRICE_CONFIG.MAX) * 100}%`
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min={PRICE_CONFIG.MIN}
                      max={PRICE_CONFIG.MAX}
                      step={PRICE_CONFIG.STEP}
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (value < priceRange[1]) {
                          setPriceRange([value, priceRange[1]])
                          setSelectedPriceRange('custom')
                        }
                      }}
                      className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                      aria-label="Minimum price"
                    />
                    <input
                      type="range"
                      min={PRICE_CONFIG.MIN}
                      max={PRICE_CONFIG.MAX}
                      step={PRICE_CONFIG.STEP}
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (value > priceRange[0]) {
                          setPriceRange([priceRange[0], value])
                          setSelectedPriceRange('custom')
                        }
                      }}
                      className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                      aria-label="Maximum price"
                    />
                  </div>
                </div>
              )}

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                    <Bed className="h-3.5 w-3.5 text-orange-500" />
                    Bedrooms
                  </label>
                  <div className="flex gap-1.5">
                    {['Any', '1', '2', '3', '4', '5+'].map((num) => (
                      <button
                        key={num}
                        onClick={() => setBedrooms(num)}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                          bedrooms === num
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                        aria-label={`Select ${num} bedrooms`}
                        aria-pressed={bedrooms === num}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                    <Bath className="h-3.5 w-3.5 text-orange-500" />
                    Bathrooms
                  </label>
                  <div className="flex gap-1.5">
                    {['Any', '1', '2', '3', '4+'].map((num) => (
                      <button
                        key={num}
                        onClick={() => setBathrooms(num)}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                          bathrooms === num
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                        aria-label={`Select ${num} bathrooms`}
                        aria-pressed={bathrooms === num}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popular searches hint */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1.5">Popular searches:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Lekki', 'Victoria Island', 'Abuja'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocation(loc)
                        setShowSuggestions(false)
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 hover:underline font-medium"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </CardContent>
    </Card>
    </div>
  )
}

