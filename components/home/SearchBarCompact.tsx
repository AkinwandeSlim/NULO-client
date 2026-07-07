"use client"

import Link from "next/link"
import { Search, MapPin, ChevronDown, Sliders, Home, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FILTER_PRICE_MAX,
  PROPERTY_TYPES,
} from "@/lib/filters/constants"

interface SearchBarCompactProps {
  location: string
  setLocation: (location: string) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  propertyType: string
  setPropertyType: (type: string) => void
  showAdvanced: boolean
  setShowAdvanced: (show: boolean) => void
  locationInputRef: React.RefObject<HTMLInputElement | null>
  defaultCity?: string
}

const CITY_LOCATIONS: Record<string, LocationSuggestion[]> = {
  'Abuja': [
    { location: 'Maitama', state: 'FCT', country: 'Nigeria', display_name: 'Maitama, FCT' },
    { location: 'Garki', state: 'FCT', country: 'Nigeria', display_name: 'Garki, FCT' },
    { location: 'Wuse', state: 'FCT', country: 'Nigeria', display_name: 'Wuse, FCT' },
    { location: 'Central Area', state: 'FCT', country: 'Nigeria', display_name: 'Central Area, FCT' },
    { location: 'Gwarinpa', state: 'FCT', country: 'Nigeria', display_name: 'Gwarinpa, FCT' },
    { location: 'Kubwa', state: 'FCT', country: 'Nigeria', display_name: 'Kubwa, FCT' },
  ],
  'Lagos': [
    { location: 'Lekki', state: 'Lagos State', country: 'Nigeria', display_name: 'Lekki, Lagos State' },
    { location: 'Victoria Island', state: 'Lagos State', country: 'Nigeria', display_name: 'Victoria Island, Lagos State' },
    { location: 'Ikoyi', state: 'Lagos State', country: 'Nigeria', display_name: 'Ikoyi, Lagos State' },
    { location: 'Ajah', state: 'Lagos State', country: 'Nigeria', display_name: 'Ajah, Lagos State' },
    { location: 'Ikeja', state: 'Lagos State', country: 'Nigeria', display_name: 'Ikeja, Lagos State' },
    { location: 'Yaba', state: 'Lagos State', country: 'Nigeria', display_name: 'Yaba, Lagos State' },
  ],
  'default': [
    { location: 'Lekki', state: 'Lagos State', country: 'Nigeria', display_name: 'Lekki, Lagos State' },
    { location: 'Victoria Island', state: 'Lagos State', country: 'Nigeria', display_name: 'Victoria Island, Lagos State' },
    { location: 'Maitama', state: 'FCT', country: 'Nigeria', display_name: 'Maitama, FCT' },
    { location: 'Ikoyi', state: 'Lagos State', country: 'Nigeria', display_name: 'Ikoyi, Lagos State' },
    { location: 'Garki', state: 'FCT', country: 'Nigeria', display_name: 'Garki, FCT' },
    { location: 'Ajah', state: 'Lagos State', country: 'Nigeria', display_name: 'Ajah, Lagos State' },
  ]
}

const PROPERTY_TYPES_LOCAL = PROPERTY_TYPES // re-export so the JSX below reads naturally

interface LocationSuggestion {
  location: string
  state: string
  country: string
  display_name: string
}

export function SearchBarCompact({
  location,
  setLocation,
  priceRange,
  propertyType,
  setPropertyType,
  showAdvanced,
  setShowAdvanced,
  locationInputRef,
  defaultCity = 'Lagos'
}: SearchBarCompactProps) {
  const [popularLocations, setPopularLocations] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<LocationSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [loadingLocations, setLoadingLocations] = useState(false)

  const suggestionsId = 'search-suggestions-compact'
  const inputId = 'search-location-compact'

  // Load popular locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoadingLocations(true)
        const fallback = (CITY_LOCATIONS[defaultCity] || CITY_LOCATIONS['default']).slice(0, 6)
        
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          const response = await fetch(`${API_BASE_URL}/api/locations/cities?state=${defaultCity}&limit=6`)
          
          if (response.ok) {
            const data = await response.json()
            if (data.cities?.length) {
              const locations = data.cities.map((city: any) => ({
                location: city.name,
                state: data.state_code,
                country: 'Nigeria',
                display_name: `${city.name}, ${data.state_code}`
              }))
              setPopularLocations(locations)
              setFilteredSuggestions(locations)
              return
            }
          }
        } catch (err) {
          console.log('API fetch failed, using fallback')
        }
        
        setPopularLocations(fallback)
        setFilteredSuggestions(fallback)
      } finally {
        setLoadingLocations(false)
      }
    }

    fetchLocations()
  }, [defaultCity])

  // Auto-show suggestions when loaded
  useEffect(() => {
    if (popularLocations.length > 0 && !location) {
      setTimeout(() => setShowSuggestions(true), 100)
    }
  }, [popularLocations, location])

  // Filter suggestions
  useEffect(() => {
    if (location.trim()) {
      const filtered = popularLocations.filter(loc =>
        loc.display_name.toLowerCase().includes(location.toLowerCase())
      )
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions(popularLocations)
    }
  }, [location, popularLocations])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
        e.preventDefault()
        setLocation(filteredSuggestions[activeIndex].display_name)
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const buildSearchURL = () => {
    const params = new URLSearchParams()
    if (location?.trim()) params.append('location', location.trim())
    if (propertyType && propertyType !== 'all') params.append('property_type', propertyType)
    if (priceRange[0] > 0) params.append('min_price', priceRange[0].toString())
    if (priceRange[1] < FILTER_PRICE_MAX) params.append('max_price', priceRange[1].toString())
    params.append('sort', 'newest')
    params.append('page', '1')
    params.append('limit', '20')
    return `/properties${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="relative max-w-4xl mx-auto w-full">
      {/* Main Search Card */}
      <Card className="relative bg-white/98 backdrop-blur-sm border-0 rounded-2xl shadow-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-2 md:gap-3">
            {/* Location Input */}
            <div className="flex-1 relative">
              <label
                htmlFor={inputId}
                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block"
              >
                <MapPin className="inline h-3 w-3 mr-1 -mt-0.5" />
                Location
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  {loadingLocations ? (
                    <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 text-slate-400" />
                  )}
                </div>

                <input
                  ref={locationInputRef}
                  id={inputId}
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={handleKeyDown}
                  placeholder="City, neighborhood, or address"
                  aria-label="Search location"
                  className="w-full h-12 pl-10 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 text-slate-900 transition-all"
                  autoComplete="off"
                />

                {location && (
                  <button
                    onClick={() => setLocation('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
                    aria-label="Clear location"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Location Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-40 max-h-64 overflow-y-auto overscroll-contain"
                    id={suggestionsId}
                    role="listbox"
                  >
                    <div className="p-2">
                      {filteredSuggestions.map((loc, idx) => (
                        <button
                          key={`${loc.location}-${idx}`}
                          onClick={() => {
                            setLocation(loc.display_name)
                            setShowSuggestions(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            activeIndex === idx
                              ? 'bg-orange-50 text-orange-600'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                          onMouseEnter={() => setActiveIndex(idx)}
                        >
                          <MapPin className="h-4 w-4 flex-shrink-0 text-orange-500" />
                          <div>
                            <div className="text-sm font-semibold">{loc.location}</div>
                            <div className="text-xs text-slate-500">{loc.state}, {loc.country}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Property Type Select */}
            <div className="md:w-44 relative">
              <label
                htmlFor="search-property-type"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block"
              >
                <Home className="inline h-3 w-3 mr-1 -mt-0.5" />
                Property Type
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <Home className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  id="search-property-type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  aria-label="Property type"
                  className="w-full h-12 pl-10 pr-8 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 appearance-none cursor-pointer font-medium text-sm transition-all"
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Advanced Filters Button */}
            {(() => {
              // Count how many active filters we can detect from this component
              // (price + propertyType). Bedroom/bath/minSize live in the parent
              // and are surfaced via the active-filters badge inside the modal.
              const activeCount =
                (priceRange[0] > 0 || priceRange[1] < FILTER_PRICE_MAX ? 1 : 0) +
                (propertyType !== 'all' ? 1 : 0)
              return (
                <div className="md:w-auto">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    <Sliders className="inline h-3 w-3 mr-1 -mt-0.5" />
                    Refine
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    aria-label={`Open advanced filters${activeCount ? ` (${activeCount} active)` : ''}`}
                    aria-expanded={showAdvanced}
                    title="More filters: price, beds, baths, size"
                    className={`w-full h-12 px-4 flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-all border min-w-[110px] ${
                      activeCount > 0
                        ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Sliders className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>Filters</span>
                    {activeCount > 0 && (
                      <span className="ml-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center">
                        {activeCount}
                      </span>
                    )}
                  </button>
                </div>
              )
            })()}

            {/* Search Button */}
            <div className="md:w-auto">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block md:invisible">
                <Search className="inline h-3 w-3 mr-1 -mt-0.5" />
                Search
              </label>
              <Link href={buildSearchURL()} className="block">
                <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-md shadow-orange-500/30">
                  <Search className="h-4 w-4 mr-2" />
                  <span>Search</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
