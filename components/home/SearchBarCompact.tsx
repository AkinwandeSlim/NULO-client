"use client"

import Link from "next/link"
import { Search, MapPin, ChevronDown, Sliders, Home, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

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

const PROPERTY_TYPES = [
  { value: 'all', label: 'All Properties' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'flat', label: 'Flat' },
  { value: 'villa', label: 'Villa' },
  { value: 'penthouse', label: 'Penthouse' },
]

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
    if (priceRange[1] < 10000000) params.append('max_price', priceRange[1].toString())
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
          <div className="flex flex-col md:flex-row gap-2">
            {/* Location Input */}
            <div className="flex-1 relative">
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
                className="w-full h-12 pl-10 pr-8 rounded-lg bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-orange-500 placeholder:text-slate-400 text-slate-900"
                autoComplete="off"
              />

              {location && (
                <button
                  onClick={() => setLocation('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}

              {/* Location Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-64 overflow-y-auto"
                    id={suggestionsId}
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
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <Home className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full h-12 pl-10 pr-8 rounded-lg bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-orange-500 text-slate-900 appearance-none cursor-pointer font-medium text-sm"
              >
                {PROPERTY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="md:w-auto px-4 h-12 flex items-center gap-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors border border-slate-200"
            >
              <Sliders className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {/* Search Button */}
            <Link href={buildSearchURL()} className="md:w-auto">
              <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg">
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Search</span>
                <span className="sm:hidden">Go</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
