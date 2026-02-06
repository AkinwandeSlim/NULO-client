"use client"

import { useEffect, useRef, useState, memo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Set your Mapbox access token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
if (typeof window !== 'undefined') {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

// Debug: Log token status
console.log('🗺️ Mapbox Token Status:', MAPBOX_TOKEN ? '✅ Token Found' : '❌ Token Missing')
console.log('🗺️ Token Preview:', MAPBOX_TOKEN ? MAPBOX_TOKEN.substring(0, 20) + '...' : 'No token')

// ✅ NEW: City coordinate mapping for properties without coordinates
const CITY_COORDINATES: Record<string, [number, number]> = {
  'Lagos': [3.3792, 6.5244],
  'Abuja': [7.4969, 9.0765],
  'Port Harcourt': [7.0498, 4.8474],
  'Lekki': [3.6753, 6.4283],
  'Victoria Island': [3.4167, 6.4667],
  'Ikoyi': [3.4167, 6.4500],
  'Ajah': [3.6753, 6.3500],
  'Ikeja': [3.3500, 6.5500],
  'Maitama': [7.5400, 9.0800],
  'Garki': [7.4969, 9.0765],
  'Asokoro': [7.5500, 9.0500],
  'Kubwa': [7.3500, 9.2000],
  'Wuse': [7.4500, 9.0800],
  'Jabi': [7.5000, 9.1000],
  'Gwarinpa': [7.3000, 9.2500],
  'Central Area': [7.4900, 9.0800],
  'Elekahia': [7.0200, 4.8500],
  'Rumuogbolu': [7.0500, 4.8300],
  'Trans Amadi': [7.0300, 4.8400],
  'Rumuokwuta': [7.0100, 4.8200],
  'D-Line': [7.0000, 4.8000],
  'Rumuola': [7.0400, 4.8350],
  'GRA Port Harcourt': [7.0600, 4.8500],
}

interface Property {
  id: string  // Changed from number to string (UUID)
  title: string
  location: string
  city?: string
  price: number
  pricePerMonth?: number
  beds: number
  baths: number
  sqft?: number
  type?: string
  property_type?: string
  image?: string
  images?: string[]
  latitude: number | null
  longitude: number | null
}

interface PropertyMapProps {
  properties: Property[]
  selectedProperty: Property | null
  onPropertySelect: (property: Property | null) => void
  center?: [number, number]
  zoom?: number
  formatPrice?: (price: number) => string  // Optional custom formatter
  currentPage?: number  // ✅ NEW: For pagination - only show current page properties
  itemsPerPage?: number  // ✅ NEW: Items per page for pagination
}

function PropertyMap({ 
  properties, 
  selectedProperty, 
  onPropertySelect,
  center,
  zoom = 12,
  formatPrice: customFormatPrice,
  currentPage = 1,  // ✅ NEW: Default to page 1
  itemsPerPage = 20  // ✅ NEW: Default to 20 items per page
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const popups = useRef<mapboxgl.Popup[]>([])  // ✅ NEW: Track popups
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // ✅ NEW: Get fallback coordinates from city name
  const getCoordinatesFromCity = (property: Property): [number, number] | null => {
    if (property.latitude !== null && property.longitude !== null) {
      return [property.longitude, property.latitude]
    }

    // Try to find city in mapping
    if (property.city) {
      const cityName = property.city.trim()
      if (CITY_COORDINATES[cityName]) {
        console.log(`🔍 Using fallback coordinates for city: ${cityName}`)
        return CITY_COORDINATES[cityName]
      }
    }

    // Try location as fallback
    if (property.location) {
      const locationName = property.location.split(',')[0].trim()
      if (CITY_COORDINATES[locationName]) {
        console.log(`🔍 Using fallback coordinates for location: ${locationName}`)
        return CITY_COORDINATES[locationName]
      }
    }

    return null
  }

  // Compact price formatter for map markers (₦2.5M)
  const formatPriceCompact = (price: number) => {
    if (!isMounted) return ''
    
    if (price >= 1000000) {
      return `₦${(price / 1000000).toFixed(1)}M`
    } else if (price >= 1000) {
      return `₦${(price / 1000).toFixed(0)}K`
    }
    return `₦${price.toLocaleString()}`
  }

  // Use custom formatter if provided, otherwise use compact format
  const formatPrice = customFormatPrice || formatPriceCompact

  // Initialize map and markers
  useEffect(() => {
    if (!isMounted || !mapContainer.current) return

    // Initialize map if it doesn't exist
    if (!map.current) {
      try {
        console.log('🗺️ Initializing map with center:', center)
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',  // Updated to newer style
          center: center || [3.3792, 6.5244], // Default to Lagos coordinates
          zoom: zoom
        })

        // Add navigation control
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
        
        // Add zoom and scale controls
        map.current.addControl(new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'metric'
        }), 'bottom-left')

        console.log('✅ Map initialized successfully')
      } catch (error) {
        console.error('❌ Error initializing map:', error)
        return
      }
    }

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // ✅ NEW: Clear existing popups
    popups.current.forEach(popup => popup.remove())
    popups.current = []

    // ✅ NEW: Calculate current page properties
    const startIdx = (currentPage - 1) * itemsPerPage
    const endIdx = startIdx + itemsPerPage
    const currentPageProperties = properties.slice(startIdx, endIdx)

    // Only log pagination when we have actual data to avoid confusing "0/0 properties" messages
    if (properties.length > 0) {
      console.log(`📄 [PAGINATION] Current Page: ${currentPage}, Items: ${itemsPerPage}, Showing: ${currentPageProperties.length}/${properties.length} properties`)
    }

    // Filter properties with valid coordinates (including fallback city coordinates)
    const validProperties = currentPageProperties.filter(property => {
      const coords = getCoordinatesFromCity(property)
      
      if (!coords) {
        console.warn(`⚠️ No coordinates available for property: ${property.title}`, {
          city: property.city,
          location: property.location,
          latitude: property.latitude,
          longitude: property.longitude
        })
        return false
      }

      const [lng, lat] = coords
      const isValid = !isNaN(Number(lat)) && !isNaN(Number(lng)) &&
                      Number(lat) >= -90 && Number(lat) <= 90 &&
                      Number(lng) >= -180 && Number(lng) <= 180

      if (isValid) {
        console.log(`✅ Valid property: ${property.title}`, {
          lat,
          lng,
          price: property.price,
          isApproximate: property.latitude === null
        })
      }

      return isValid
    })

    if (properties.length > 0) {
      console.log(`📍 Total properties received: ${properties.length}`)
      console.log(`📍 Valid properties with coordinates: ${validProperties.length}`)
      console.log(`📍 Properties without valid coords: ${currentPageProperties.length - validProperties.length}`)
    }

    // ✅ NEW: Add animation styles dynamically if not already present
    if (!document.getElementById('map-animation-styles')) {
      const style = document.createElement('style')
      style.id = 'map-animation-styles'
      style.innerHTML = `
        @keyframes markerBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes markerPulse {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
        @keyframes markerFadeIn {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .marker-animate {
          animation: markerFadeIn 0.6s ease-out;
        }
        .marker-animate:hover {
          animation: markerBounce 0.6s ease-in-out !important;
        }
        .marker-selected {
          animation: markerPulse 1.5s infinite;
        }
      `
      document.head.appendChild(style)
    }

    // Add markers for each property with valid coordinates
    validProperties.forEach((property, idx) => {
      const coords = getCoordinatesFromCity(property)
      if (!coords) return

      const [lng, lat] = coords
      const el = document.createElement('div')
      el.className = 'custom-marker marker-animate'
      el.style.cursor = 'pointer'
      // ✅ NEW: Add staggered animation delay for sequential appearance
      el.style.animationDelay = `${idx * 0.1}s`
      
      // Create marker content with formatted price
      const isSelected = selectedProperty?.id === property.id
      el.innerHTML = `
        <div class="relative group ${isSelected ? 'marker-selected' : ''}">
          <!-- Price tooltip on hover -->
          <div class="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap text-sm font-bold text-slate-900 border border-slate-200 z-50">
            ${formatPrice(property.price)}
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-slate-200 rotate-45"></div>
          </div>
          
          <!-- Marker pin -->
          <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 transform ${
            isSelected ? 'ring-4 ring-orange-300 scale-125 shadow-2xl' : ''
          }">
            <svg class="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
          </div>
          
          <!-- Price badge below marker -->
          <div class="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow-md border border-slate-200 ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } transition-opacity duration-200 text-xs font-semibold text-slate-900 whitespace-nowrap">
            ${formatPrice(property.price)}
          </div>
        </div>
      `

      try {
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!)
        
        // ✅ NEW: Create popup with property details
        const popupContent = document.createElement('div')
        popupContent.className = 'bg-white rounded-lg shadow-2xl overflow-hidden max-w-sm'
        popupContent.innerHTML = `
          <div class="relative">
            <!-- Property image -->
            ${property.image || (property.images && property.images[0]) ? `
              <img src="${property.image || property.images?.[0]}" alt="${property.title}" class="w-full h-40 object-cover">
            ` : `
              <div class="w-full h-40 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                <svg class="w-12 h-12 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l4-4m0 0l4 4m-4-4V5m0 16H5a2 2 0 01-2-2v-5.5M9 7h1m4 0h1m4 0h1"></path>
                </svg>
              </div>
            `}
          </div>
          <div class="p-4 space-y-3">
            <!-- Title -->
            <h3 class="font-bold text-slate-900 text-base line-clamp-2">${property.title}</h3>
            
            <!-- Address -->
            <div class="flex items-start gap-2">
              <span class="text-lg">📍</span>
              <div class="flex-1">
                <p class="text-sm font-semibold text-slate-900">${property.location}</p>
                ${property.city ? `<p class="text-xs text-slate-500">${property.city}</p>` : ''}
              </div>
            </div>
            
            <!-- Price -->
            <div class="pt-2 border-t border-slate-200">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-600">Monthly Rent</span>
                <span class="text-2xl font-bold text-orange-600">${formatPrice(property.price)}</span>
              </div>
            </div>
            
            <!-- Property Details -->
            <div class="grid grid-cols-3 gap-2 pt-2">
              ${property.beds ? `
                <div class="text-center p-2 bg-slate-50 rounded">
                  <div class="text-lg font-bold text-slate-900">${property.beds}</div>
                  <div class="text-xs text-slate-600">Bedrooms</div>
                </div>
              ` : ''}
              ${property.baths ? `
                <div class="text-center p-2 bg-slate-50 rounded">
                  <div class="text-lg font-bold text-slate-900">${property.baths}</div>
                  <div class="text-xs text-slate-600">Bathrooms</div>
                </div>
              ` : ''}
              ${property.sqft ? `
                <div class="text-center p-2 bg-slate-50 rounded">
                  <div class="text-lg font-bold text-slate-900">${property.sqft}</div>
                  <div class="text-xs text-slate-600">Sqft</div>
                </div>
              ` : ''}
            </div>
            
            <!-- View Details Button -->
            <button class="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-200">
              View Full Details
            </button>
          </div>
        `

        const popup = new mapboxgl.Popup({ offset: 25, maxWidth: 'none' })
          .setDOMContent(popupContent)
        
        popups.current.push(popup)
        
        // Add click handler
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          console.log('📍 Marker clicked:', property.title)
          onPropertySelect(property)
          
          // ✅ NEW: Show popup on marker click
          popup.addTo(map.current!)
          
          // Smooth fly to property location
          map.current?.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 1000,
            essential: true
          })
        })

        markers.current.push(marker)
      } catch (error) {
        console.error(`❌ Failed to create marker for property: ${property.title}`, error)
      }
    })

    // Fit map to show all markers if we have properties
    if (validProperties.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds()
      
      validProperties.forEach(property => {
        const coords = getCoordinatesFromCity(property)
        if (coords) {
          bounds.extend(coords)
        }
      })

      // Only fit bounds if we have more than one property
      if (validProperties.length > 1) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14,
          duration: 1000
        })
      }
    }

    // Clean up markers on unmount
    return () => {
      markers.current.forEach(marker => marker.remove())
      popups.current.forEach(popup => popup.remove())
    }
  }, [isMounted, properties, selectedProperty, onPropertySelect, center, zoom, formatPrice, currentPage, itemsPerPage])

  // ✅ NEW: Handle selected property changes - show popup and fly to location
  useEffect(() => {
    if (!isMounted || !map.current || !selectedProperty) return

    const coords = getCoordinatesFromCity(selectedProperty)
    if (!coords) return

    const [lng, lat] = coords

    // Close all existing popups
    popups.current.forEach(popup => popup.remove())

    // Create and show popup for selected property
    const popupContent = document.createElement('div')
    popupContent.className = 'bg-white rounded-lg shadow-2xl overflow-hidden max-w-sm'
    popupContent.innerHTML = `
      <div class="relative">
        <!-- Property image -->
        ${selectedProperty.image || (selectedProperty.images && selectedProperty.images[0]) ? `
          <img src="${selectedProperty.image || selectedProperty.images?.[0]}" alt="${selectedProperty.title}" class="w-full h-40 object-cover">
        ` : `
          <div class="w-full h-40 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
            <svg class="w-12 h-12 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l4-4m0 0l4 4m-4-4V5m0 16H5a2 2 0 01-2-2v-5.5M9 7h1m4 0h1m4 0h1"></path>
            </svg>
          </div>
        `}
      </div>
      <div class="p-4 space-y-3">
        <!-- Title -->
        <h3 class="font-bold text-slate-900 text-base line-clamp-2">${selectedProperty.title}</h3>
        
        <!-- Address -->
        <div class="flex items-start gap-2">
          <span class="text-lg">📍</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-slate-900">${selectedProperty.location}</p>
            ${selectedProperty.city ? `<p class="text-xs text-slate-500">${selectedProperty.city}</p>` : ''}
          </div>
        </div>
        
        <!-- Price -->
        <div class="pt-2 border-t border-slate-200">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-600">Monthly Rent</span>
            <span class="text-2xl font-bold text-orange-600">${formatPrice(selectedProperty.price)}</span>
          </div>
        </div>
        
        <!-- Property Details -->
        <div class="grid grid-cols-3 gap-2 pt-2">
          ${selectedProperty.beds ? `
            <div class="text-center p-2 bg-slate-50 rounded">
              <div class="text-lg font-bold text-slate-900">${selectedProperty.beds}</div>
              <div class="text-xs text-slate-600">Bedrooms</div>
            </div>
          ` : ''}
          ${selectedProperty.baths ? `
            <div class="text-center p-2 bg-slate-50 rounded">
              <div class="text-lg font-bold text-slate-900">${selectedProperty.baths}</div>
              <div class="text-xs text-slate-600">Bathrooms</div>
            </div>
          ` : ''}
          ${selectedProperty.sqft ? `
            <div class="text-center p-2 bg-slate-50 rounded">
              <div class="text-lg font-bold text-slate-900">${selectedProperty.sqft}</div>
              <div class="text-xs text-slate-600">Sqft</div>
            </div>
          ` : ''}
        </div>
        
        <!-- View Details Button -->
        <button class="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-200">
          View Full Details
        </button>
      </div>
    `

    const popup = new mapboxgl.Popup({ offset: 25, maxWidth: 'none' })
      .setLngLat([lng, lat])
      .setDOMContent(popupContent)
      .addTo(map.current!)

    // Fly to property location
    map.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 1000,
      essential: true
    })

    console.log('✅ Selected property popup displayed:', selectedProperty.title)
  }, [selectedProperty, isMounted])

  // Handle map center/zoom changes
  useEffect(() => {
    if (!isMounted || !map.current || !center) return
    
    map.current.flyTo({
      center,
      zoom,
      duration: 1000,
      essential: true
    })
  }, [center, zoom, isMounted])

  // Show loading state on server-side
  if (!isMounted) {
    return (
      <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
        <div className="text-slate-400">Loading map...</div>
      </div>
    )
  }

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />
}

export default memo(PropertyMap)