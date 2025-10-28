"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MapPin, Bed, Bath, Square, Heart, Search, 
  Home, Loader2, X, SlidersHorizontal, Wifi, Car, 
  Dumbbell, Shield, Waves, Wind, Zap, Dog, Filter,
  List, Map as MapIcon, Columns3, ChevronDown, DollarSign,
  Star, Bookmark, MoreHorizontal, Tag
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { PropertyFiltersModal } from "@/components/PropertyFiltersModal"
import { SaveFavoriteModal } from "@/components/SaveFavoriteModal"
import { propertiesAPI } from "@/lib/api/properties"

// Placeholder image for properties without photos
const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

// Helper to get property image with fallback
const getPropertyImage = (property: any): string => {
  // Try images array first
  if (property.images && property.images.length > 0 && property.images[0]) {
    return property.images[0]
  }
  // Try single image field
  if (property.image && property.image.trim() !== '') {
    return property.image
  }
  // Return placeholder
  return DEFAULT_PROPERTY_IMAGE
}

// Dynamically import Mapbox component to avoid SSR issues
const PropertyMap = dynamic(() => import('@/components/PropertyMapbox'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-3" />
        <p className="text-white font-medium">Loading interactive map...</p>
      </div>
    </div>
  )
})

interface Property {
  id: string  // Changed from number to string (UUID)
  title: string
  location: string
  price: number
  pricePerMonth: number
  beds: number
  baths: number
  sqft: number
  type: string
  property_type: string
  image: string
  images: string[]
  featured: boolean
  latitude: number
  longitude: number
  description?: string
  landlord?: {
    id: string
    name: string
    avatar_url?: string
  }
}



type ViewMode = 'list' | 'map' | 'split'

export default function PropertiesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  
  // ADD THESE THREE NEW STATES:
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSaveFavoriteModal, setShowSaveFavoriteModal] = useState(false)
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [showPriceDropdown, setShowPriceDropdown] = useState(false)
  const [showBedsDropdown, setShowBedsDropdown] = useState(false)
  const [showBathsDropdown, setShowBathsDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  
  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000])
  const [selectedType, setSelectedType] = useState<string>("all")
  const [minBeds, setMinBeds] = useState<number>(0)
  const [minBaths, setMinBaths] = useState<number>(0)
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high'>('recent')
  
  // Advanced Filters
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])

  // REMOVED: Problematic click-outside handler
  // Dropdowns now close only via Apply/Reset buttons or clicking another filter




  // Fetch properties from database
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await propertiesAPI.search({
          page: 1,
          limit: 100
        })
        
        // DEBUG: Log API response
        console.log('🔍 API Response:', response)
        console.log('📊 Total properties from API:', response.properties?.length)
        console.log('📦 Raw properties data:', response.properties)
        
        // Transform API response to match component interface
        const transformedProperties = response.properties.map(prop => ({
          id: prop.id,
          title: prop.title,
          location: prop.location,
          price: prop.price,
          pricePerMonth: prop.price,
          beds: prop.beds || 0,
          baths: prop.baths || 0,
          sqft: prop.sqft || 0,
          type: prop.property_type || 'apartment',
          property_type: prop.property_type || 'apartment',
          image: prop.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          images: prop.images || [],
          featured: prop.featured || false,
          latitude: prop.latitude || 0,
          longitude: prop.longitude || 0,
          description: prop.description,
          landlord: prop.landlord
        }))
        
        console.log('✅ Transformed properties:', transformedProperties)
        console.log('📈 Total transformed:', transformedProperties.length)
        
        setProperties(transformedProperties)
      } catch (err: any) {
        console.error('Failed to fetch properties:', err)
        console.error('Error response:', err.response)
        console.error('Error message:', err.message)
        console.error('Error details:', err.response?.data)
        
        const errorMsg = err.response?.data?.detail || err.message || 'Failed to load properties'
        setError(errorMsg)
        toast.error(`Failed to load properties: ${errorMsg}`)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProperties()
  }, [])















  // Read URL parameters and set filters
  useEffect(() => {
    const location = searchParams.get('location')
    const type = searchParams.get('type')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const bedrooms = searchParams.get('bedrooms')
    const bathrooms = searchParams.get('bathrooms')

    if (location) setSearchQuery(location)
    if (type) setSelectedType(type)
    if (minPrice) setPriceRange(prev => [parseInt(minPrice), prev[1]])
    if (maxPrice) setPriceRange(prev => [prev[0], parseInt(maxPrice)])
    if (bedrooms && bedrooms !== 'Any') setMinBeds(parseInt(bedrooms.replace('+', '')))
    if (bathrooms && bathrooms !== 'Any') setMinBaths(parseInt(bathrooms.replace('+', '')))
  }, [searchParams])

  // Filter properties
  const filteredProperties = properties.filter(property => {
    // More flexible search - split by comma and check each part
    const searchTerms = searchQuery.toLowerCase().split(',').map(s => s.trim()).filter(s => s.length > 0)
    const matchesSearch = searchQuery === '' || searchTerms.some(term => 
      property.title.toLowerCase().includes(term) ||
      property.location.toLowerCase().includes(term)
    )
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1]
    const matchesType = selectedType === "all" || property.type === selectedType
    const matchesBeds = property.beds >= minBeds
    const matchesBaths = property.baths >= minBaths
    
    // DEBUG: Log filtering
    if (!matchesSearch || !matchesPrice || !matchesType || !matchesBeds || !matchesBaths) {
      console.log(`❌ Property "${property.title}" filtered out:`, {
        matchesSearch,
        matchesPrice,
        matchesType,
        matchesBeds,
        matchesBaths,
        property: { price: property.price, type: property.type, beds: property.beds, baths: property.baths }
      })
    }
    
    return matchesSearch && matchesPrice && matchesType && matchesBeds && matchesBaths
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price
    if (sortBy === 'price-high') return b.price - a.price
    return 0
  })
  
  // DEBUG: Log final filtered count
  console.log('🎯 Filtered properties count:', filteredProperties.length)
  console.log('🔍 Current filters:', { searchQuery, priceRange, selectedType, minBeds, minBaths, sortBy })

  const toggleFavorite = (id: number) => {
    // If not logged in, show the save favorite modal
    if (!user) {
      setPendingFavoriteId(id)
      setShowSaveFavoriteModal(true)
      return
    }

    // If logged in, toggle favorite normally
    const isFavorite = favorites.includes(id)
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    )

    if (isFavorite) {
      toast.success(
        <div className="flex items-center justify-between gap-4">
          <span>❤️ Removed from favorites</span>
        </div>,
        { duration: 3000 }
      )
    } else {
      toast.success("✅ Saved to Favorites!", { duration: 3000 })
    }
  }

  const handlePropertySelect = (property: Property | null) => {
    if (property) {
      const lat = Number(property.latitude)
      const lng = Number(property.longitude)
      
      const hasValidCoords = !isNaN(lat) && !isNaN(lng) && 
                            lat >= -90 && lat <= 90 && 
                            lng >= -180 && lng <= 180
      
      if (hasValidCoords) {
        setSelectedProperty({ ...property, latitude: lat, longitude: lng })
      } else {
        setSelectedProperty(null)
      }
    } else {
      setSelectedProperty(null)
    }
  }

  // Handle save favorite with email (quick signup)
  const handleSaveWithEmail = async (email: string) => {
    // TODO: Implement quick signup API call
    // For now, save to localStorage and show success
    if (pendingFavoriteId) {
      const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
      localFavorites.push(pendingFavoriteId)
      localStorage.setItem('favorites', JSON.stringify(localFavorites))
      localStorage.setItem('userEmail', email)
      
      setFavorites(prev => [...prev, pendingFavoriteId])
      toast.success("Property saved! Check your email to complete signup.")
    }
    setShowSaveFavoriteModal(false)
    setPendingFavoriteId(null)
  }

  // Handle continue browsing without account (Skip - Don't save)
  const handleContinueBrowsing = () => {
    // User chose to skip - don't save the property
    toast.info("You can browse freely. Sign in anytime to save properties!")
    setShowSaveFavoriteModal(false)
    setPendingFavoriteId(null)
  }

  const propertyTypes = ["all", "Villa", "Apartment", "House", "Penthouse", "Bungalow", "Duplex", "Mansion", "Terrace"]
  
  const amenities = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'security', label: '24/7 Security', icon: Shield },
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'ac', label: 'Air Conditioning', icon: Wind },
    { id: 'generator', label: 'Generator', icon: Zap },
    { id: 'pets', label: 'Pet Friendly', icon: Dog },
  ]
  
  const preferences = [
    'Furnished', 'Unfurnished', 'Serviced', 'Newly Built',
    'Gated Estate', 'Close to School', 'Close to Market', 'Waterfront'
  ]

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const togglePreference = (pref: string) => {
    setSelectedPreferences(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    )
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }


  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading properties...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <Home className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops!</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Modern Inline Filter Bar - Fixed */}
      <div className="fixed top-16 left-0 right-0 z-[100] bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-3 py-3">
            {/* Simple Filter Chips - No Dropdowns! */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
              
              {/* All Filters Button - Opens Modal */}
              <button
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap border-2 ${
                  minBeds > 0 || minBaths > 0 || selectedType !== 'all' || priceRange[0] > 0 || priceRange[1] < 1000000
                    ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-orange-500'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>All Filters</span>
                {(minBeds > 0 || minBaths > 0 || selectedType !== 'all' || priceRange[0] > 0 || priceRange[1] < 1000000) && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {[minBeds > 0, minBaths > 0, selectedType !== 'all', priceRange[0] > 0 || priceRange[1] < 1000000].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Active Filter Tags */}
              {minBeds > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 text-sm font-medium border border-orange-200">
                  <Bed className="h-3.5 w-3.5" />
                  <span>{minBeds}+ beds</span>
                  <button onClick={() => setMinBeds(0)} className="ml-1 hover:bg-orange-100 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {minBaths > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 text-sm font-medium border border-orange-200">
                  <Bath className="h-3.5 w-3.5" />
                  <span>{minBaths}+ baths</span>
                  <button onClick={() => setMinBaths(0)} className="ml-1 hover:bg-orange-100 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {selectedType !== 'all' && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 text-sm font-medium border border-orange-200">
                  <Home className="h-3.5 w-3.5" />
                  <span>{selectedType}</span>
                  <button onClick={() => setSelectedType('all')} className="ml-1 hover:bg-orange-100 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {(priceRange[0] > 0 || priceRange[1] < 1000000) && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 text-sm font-medium border border-orange-200">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>{formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}</span>
                  <button onClick={() => setPriceRange([0, 1000000])} className="ml-1 hover:bg-orange-100 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Quick Toggle Chips */}
              <button
                onClick={() => {
                  const isActive = selectedAmenities.includes('pets')
                  const amenities = isActive
                    ? selectedAmenities.filter(a => a !== 'pets')
                    : [...selectedAmenities, 'pets']
                  setSelectedAmenities(amenities)
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                  selectedAmenities.includes('pets')
                    ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-orange-500'
                }`}
              >
                <Dog className="h-3.5 w-3.5" />
                <span>Pets</span>
              </button>

              <button
                onClick={() => {
                  const isActive = selectedPreferences.includes('Deals')
                  const prefs = isActive
                    ? selectedPreferences.filter(p => p !== 'Deals')
                    : [...selectedPreferences, 'Deals']
                  setSelectedPreferences(prefs)
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                  selectedPreferences.includes('Deals')
                    ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-orange-500'
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Deals</span>
              </button>

              {/* Clear All */}
              {(minBeds > 0 || minBaths > 0 || selectedType !== 'all' || priceRange[0] > 0 || priceRange[1] < 10000000 || selectedAmenities.length > 0 || selectedPreferences.length > 0 || searchQuery !== '') && (
                <button
                  onClick={() => {
                    setMinBeds(0)
                    setMinBaths(0)
                    setSelectedType('all')
                    setPriceRange([0, 10000000])
                    setSearchQuery('')
                    setSelectedAmenities([])
                    setSelectedPreferences([])
                    router.push('/properties')
                    toast.success('All filters cleared')
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all whitespace-nowrap"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear all</span>
                </button>
              )}
            </div>

            {/* Right: View Toggle & Results */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Results Count */}
              <span className="hidden md:inline text-xs font-medium text-slate-600 whitespace-nowrap">
                {filteredProperties.length} results
              </span>

              {/* View Mode Toggle - Compact */}
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="List"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'split' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Split"
                >
                  <Columns3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Map"
                >
                  <MapIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <PropertyFiltersModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        minBeds={minBeds}
        setMinBeds={setMinBeds}
        minBaths={minBaths}
        setMinBaths={setMinBaths}
        selectedAmenities={selectedAmenities}
        setSelectedAmenities={setSelectedAmenities}
        selectedPreferences={selectedPreferences}
        setSelectedPreferences={setSelectedPreferences}
        onClearAll={() => {
          setMinBeds(0)
          setMinBaths(0)
          setSelectedType('all')
          setPriceRange([0, 10000000])
          setSearchQuery('')
          setSelectedAmenities([])
          setSelectedPreferences([])
          router.push('/properties')
          toast.success('All filters cleared')

        }}
        onApply={() => {
          // Filters are already applied in real-time
        }}
        resultsCount={filteredProperties.length}
      />

      {/* Main Content - Below Fixed Navbar + Filter Bar */}
      <div className="fixed top-[124px] left-0 right-0 bottom-0 overflow-y-scroll overflow-x-hidden bg-slate-50">
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {/* Wrapper for both map and listings - SWAPPED LAYOUT */}
        <div className="flex relative">
          {/* Map Column - Sticky Position (LEFT SIDE) */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div className={`${viewMode === 'map' ? 'w-full' : 'w-1/2'} h-screen sticky top-0 bg-white`}>
            {/* Map Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white/95 to-transparent p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <MapIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Map View</h3>
                    <p className="text-xs text-slate-600">{filteredProperties.length} properties</p>
                  </div>
                </div>
                {selectedProperty && (
                  <div className="bg-orange-50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-orange-200">
                    <p className="text-xs font-medium text-orange-700">{selectedProperty.title}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Map Container */}
            <div className="w-full h-full">
              <PropertyMap
                properties={filteredProperties}
                selectedProperty={selectedProperty}
                onPropertySelect={handlePropertySelect}
              />
            </div>

            {/* Map Footer - Property Count */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between">
              <div className="bg-white rounded-lg shadow-lg px-4 py-2 border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-900">
                    {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} shown
                  </span>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Listings Column - Content that scrolls (RIGHT SIDE) */}
          <div className={`pb-20 ${
            viewMode === 'map' ? 'hidden' : ''
          } ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <div className="p-4">
              {/* Zumper-style Header */}
              <div className="mb-6 pt-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                  {selectedType !== 'all' 
                    ? `${selectedType}s for Rent${searchQuery ? ` in ${searchQuery}` : ' in Nigeria'}`
                    : searchQuery 
                      ? `Apartments for Rent in ${searchQuery}`
                      : 'Apartments for Rent in Nigeria'
                  }
                </h1>
                <p className="text-sm text-slate-600">
                  {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} available
                  {minBeds > 0 && ` • ${minBeds}+ beds`}
                  {minBaths > 0 && ` • ${minBaths}+ baths`}
                  {(priceRange[0] > 0 || priceRange[1] < 1000000) && ` • ${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`}
                </p>
              </div>

              {filteredProperties.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <Home className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
                  <p className="text-slate-600 mb-6">Try adjusting your filters or clear them to see all properties</p>
                  <Button
                    onClick={() => {
                      setPriceRange([0, 10000000])
                      setSelectedType("all")
                      setMinBeds(0)
                      setMinBaths(0)
                      setSearchQuery("")
                      setSelectedAmenities([])
                      setSelectedPreferences([])
                      router.push('/properties')
                      toast.success("All filters cleared")
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredProperties.map((property) => (
                  <Link 
                    key={property.id}
                    href={`/properties/${property.id}`}
                  >
                    <Card 
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200 hover:border-orange-300 bg-white"
                      onMouseEnter={() => handlePropertySelect(property)}
                    >
                    {/* Image */}
                    <div className="relative w-full h-56 overflow-hidden bg-slate-100">
                      <img
                        src={getPropertyImage(property)}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {property.featured && (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Featured
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleFavorite(property.id)
                        }}
                        className="absolute top-3 right-3 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg z-10"
                      >
                        <Heart
                          className={`h-4 w-4 transition-all ${
                            favorites.includes(property.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <CardContent className="p-4">
                      {/* Price */}
                      <div className="mb-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-slate-900">
                            {formatPrice(property.price)}
                          </span>
                          <span className="text-xs text-slate-500">
                            /month
                          </span>
                        </div>
                      </div>

                      {/* Title & Location */}
                      <h4 className="font-semibold text-base text-slate-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {property.title}
                      </h4>
                      <p className="text-sm text-slate-600 flex items-center gap-1 mb-3 line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        {property.location}
                      </p>

                      {/* Features */}
                      <div className="flex items-center gap-4 pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Bed className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{property.beds}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bath className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{property.baths}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Square className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{property.sqft}</span>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                  </Link>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Favorite Modal */}
      <SaveFavoriteModal
        isOpen={showSaveFavoriteModal}
        onClose={() => {
          setShowSaveFavoriteModal(false)
          setPendingFavoriteId(null)
        }}
        onSaveWithEmail={handleSaveWithEmail}
        onContinueBrowsing={handleContinueBrowsing}
        propertyTitle={
          pendingFavoriteId 
            ? properties.find(p => p.id === pendingFavoriteId)?.title || "this property"
            : "this property"
        }
      />
    </div>
  )
}
