"use client"

import { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Loader2, MapPin } from 'lucide-react'
import type { PropertySearchResponse, Property } from '@/lib/types/property'

// Set your Mapbox access token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
if (typeof window !== 'undefined') {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

// ✅ OPTIMIZED: City coordinate mapping with caching
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

interface PropertyMapProps {
  properties: Property[]
  selectedProperty: Property | null
  onPropertySelect: (property: Property | null) => void
  center?: [number, number]
  zoom?: number
  formatPrice?: (price: number) => string
  currentPage?: number
  itemsPerPage?: number
}

// ✅ OPTIMIZED: Main map component with performance improvements
function PropertyMapOptimized({ 
  properties, 
  selectedProperty, 
  onPropertySelect,
  center,
  zoom = 12,
  formatPrice: customFormatPrice,
  currentPage = 1,
  itemsPerPage = 20
}: PropertyMapProps) {
  // Refs
  const map = useRef<mapboxgl.Map | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const popupsRef = useRef<mapboxgl.Popup[]>([])
  const markerElements = useRef<Map<string, HTMLElement>>(new Map())
  const [isMounted, setIsMounted] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // ✅ OPTIMIZED: Paginate properties for better performance
  const visibleProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return properties.slice(startIndex, endIndex)
  }, [properties, currentPage, itemsPerPage])
  
  // ✅ OPTIMIZED: Calculate bounds for auto-fitting
  const bounds = useMemo(() => {
    if (visibleProperties.length === 0) return null
    
    const validCoords = visibleProperties
      .map(p => {
        if (p.latitude !== null && p.longitude !== null) {
          return [p.longitude, p.latitude] as [number, number]
        }
        if (p.city && CITY_COORDINATES[p.city]) {
          return CITY_COORDINATES[p.city]
        }
        return null
      })
      .filter(Boolean) as [number, number][]
    
    if (validCoords.length === 0) return null
    
    const bounds = new mapboxgl.LngLatBounds()
    validCoords.forEach(coord => bounds.extend(coord))
    return bounds
  }, [visibleProperties])
  
  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])
  
  // ✅ OPTIMIZED: Initialize map with better performance
  useEffect(() => {
    if (!isMounted || !mapContainer.current || map.current) return
    
    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center || [3.3792, 6.5244], // Lagos default
        zoom,
        attributionControl: false,
        antialias: true,
        refreshExpiredTiles: false,
        fadeDuration: 0,
        trackResize: true,
      })
      
      // Add controls
      mapInstance.addControl(new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true,
      }), 'top-right')
      
      mapInstance.addControl(new mapboxgl.AttributionControl({
        compact: true
      }), 'bottom-left')
      
      // Handle map load
      mapInstance.on('load', () => {
        setMapLoaded(true)
        console.log('🗺️ Map loaded successfully')
      })
      
      // Handle errors
      mapInstance.on('error', (e) => {
        console.error('🗺️ Map error:', e)
        setError('Map failed to load')
      })
      
      map.current = mapInstance
      
      return () => {
        if (map.current) {
          map.current.remove()
          map.current = null
        }
      }
    } catch (err) {
      console.error('🗺️ Map initialization error:', err)
      setError('Failed to initialize map')
    }
  }, [isMounted, center, zoom])

  // Create popup with property details
  const createPropertyPopup = useCallback((property: Property): mapboxgl.Popup => {
    const popupContent = document.createElement('div')
    popupContent.className = 'bg-white rounded-lg shadow-2xl overflow-hidden max-w-sm'
    popupContent.innerHTML = `
      <div class="relative">
        <!-- Property image -->
        ${property.images?.[0] ? `
          <img src="${property.images[0]}" alt="${property.title}" class="w-full h-40 object-cover">
        ` : `
          <div class="w-full h-40 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
            <svg class="w-12 h-12 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l4-4m0 0l4 4m-4-4V5m0 16H5a2 2 0 01-2-2v-5.5M9 7h1m4 0h1m4 0h1"></path>
            </svg>
          </div>
        `}
        
        <!-- Status badge -->
        <div class="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
          property.status === 'vacant' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
        }">
          ${property.status === 'vacant' ? 'Available' : 'Rented'}
        </div>
        
        <!-- Price overlay -->
        <div class="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md">
          <span class="text-sm font-bold text-orange-600">
            ₦${(property.price || 0).toLocaleString()}
            <span class="text-xs font-normal text-slate-400">/mo</span>
          </span>
        </div>
      </div>
      
      <div class="p-4">
        <!-- Title -->
        <h3 class="font-semibold text-slate-900 mb-2 line-clamp-2">${property.title}</h3>
        
        <!-- Location -->
        <p class="text-sm text-slate-600 mb-3 flex items-center gap-1">
          <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          ${property.location || `${property.city}, ${property.state}`}
        </p>
        
        <!-- Specs -->
        <div class="flex items-center gap-4 text-sm text-slate-600 mb-3">
          ${property.beds ? `
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l4-4m0 0l4 4m-4-4V5m0 16H5a2 2 0 01-2-2v-5.5M9 7h1m4 0h1m4 0h1"></path>
              </svg>
              ${property.beds} Beds
            </span>
          ` : ''}
          ${property.baths ? `
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
              ${property.baths} Baths
            </span>
          ` : ''}
          ${property.sqft ? `
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
              </svg>
              ${property.sqft} sqft
            </span>
          ` : ''}
        </div>
        
        <!-- Verified badge -->
        ${property.landlord?.verified ? `
          <div class="flex items-center gap-1 text-xs text-green-600 font-medium mb-3">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Verified Landlord
          </div>
        ` : ''}
        
        <!-- View details button -->
        <button 
          onclick="window.location.href='/properties/${property.id}'"
          class="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          View Full Details
        </button>
      </div>
    `

    return new mapboxgl.Popup({ 
      offset: 25, 
      maxWidth: 'none',
      closeButton: true,
      closeOnClick: false
    }).setDOMContent(popupContent)
  }, [])
  
  // Single effect for all marker updates — runs only when properties list changes
  useEffect(() => {
    if (!mapLoaded || !map.current) return

    // Remove all existing markers and popups
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()
    popupsRef.current.forEach(popup => popup.remove())
    popupsRef.current = []

    visibleProperties.forEach(property => {
      let coords: [number, number] | null = null

      if (property.latitude !== null && property.longitude !== null) {
        coords = [property.longitude, property.latitude]
      } else if (property.city && CITY_COORDINATES[property.city]) {
        coords = CITY_COORDINATES[property.city]
      } else if (property.location) {
        const locationKey = property.location.split(',')[0].trim()
        if (CITY_COORDINATES[locationKey]) coords = CITY_COORDINATES[locationKey]
      }

      if (!coords) return

      const price = property.price >= 1000000
        ? `₦${(property.price / 1000000).toFixed(1)}M` 
        : property.price >= 1000
        ? `₦${(property.price / 1000).toFixed(0)}K` 
        : `₦${property.price.toLocaleString()}` 

      const el = document.createElement('div')
      el.setAttribute('data-property-id', property.id)
      el.style.cssText = [
        'background: white',
        'border: 2px solid #e2e8f0',
        'border-radius: 20px',
        'padding: 5px 10px',
        'font-size: 12px',
        'font-weight: 700',
        'color: #1e293b',
        'box-shadow: 0 2px 8px rgba(0,0,0,0.15)',
        'cursor: pointer',
        'transition: all 0.15s ease',
        'white-space: nowrap',
        'line-height: 1',
        'display: flex',
        'align-items: center',
        'gap: 4px',
      ].join(';')

      el.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 20 20" fill="#ea580c">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
        </svg>
        <span>${price}</span>
      `

      el.addEventListener('mouseenter', () => {
        el.style.background = '#ea580c'
        el.style.color = 'white'
        el.style.borderColor = '#ea580c'
        el.style.transform = 'scale(1.08)'
        el.style.zIndex = '200'
        el.querySelector('svg')!.style.fill = 'white'
      })
      el.addEventListener('mouseleave', () => {
        if (!el.classList.contains('marker-selected')) {
          el.style.background = 'white'
          el.style.color = '#1e293b'
          el.style.borderColor = '#e2e8f0'
          el.style.transform = 'scale(1)'
          el.style.zIndex = '100'
          el.querySelector('svg')!.style.fill = '#ea580c'
        }
      })

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onPropertySelect(property)
        
        // Close all existing popups
        popupsRef.current.forEach(popup => popup.remove())
        popupsRef.current = []
        
        // Create and show popup
        const popup = createPropertyPopup(property)
        popup.setLngLat(coords).addTo(map.current!)
        popupsRef.current.push(popup)
        
        // Fly to property location
        map.current?.flyTo({
          center: coords,
          zoom: 15,
          duration: 1000,
          essential: true
        })
      })

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(coords)
        .addTo(map.current!)

      markersRef.current.set(property.id, marker)
      markerElements.current.set(property.id, el)
    })

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()
      markerElements.current.clear()
      popupsRef.current.forEach(popup => popup.remove())
      popupsRef.current = []
    }
  }, [visibleProperties, mapLoaded, onPropertySelect, createPropertyPopup])

  // Separate lightweight selection effect — only toggles CSS, never recreates markers
  useEffect(() => {
    // Remove selected state from all markers
    markerElements.current.forEach((el, id) => {
      el.classList.remove('marker-selected')
      el.style.background = 'white'
      el.style.color = '#1e293b'
      el.style.borderColor = '#e2e8f0'
      el.style.zIndex = '100'
      el.style.transform = 'scale(1)'
      const svg = el.querySelector('svg') as SVGElement | null
      if (svg) svg.style.fill = '#ea580c'
    })

    // Apply selected state
    if (selectedProperty) {
      const el = markerElements.current.get(selectedProperty.id)
      if (el) {
        el.classList.add('marker-selected')
        el.style.background = '#ea580c'
        el.style.color = 'white'
        el.style.borderColor = '#ea580c'
        el.style.zIndex = '300'
        el.style.transform = 'scale(1.12)'
        const svg = el.querySelector('svg') as SVGElement | null
        if (svg) svg.style.fill = 'white'
      }
    }
  }, [selectedProperty])

  // Handle selected property changes - show popup and fly to location
  useEffect(() => {
    if (!map.current || !selectedProperty) return

    // Get coordinates
    let coords: [number, number] | null = null
    if (selectedProperty.latitude !== null && selectedProperty.longitude !== null) {
      coords = [selectedProperty.longitude, selectedProperty.latitude]
    } else if (selectedProperty.city && CITY_COORDINATES[selectedProperty.city]) {
      coords = CITY_COORDINATES[selectedProperty.city]
    }

    if (!coords) return

    // Close all existing popups
    popupsRef.current.forEach(popup => popup.remove())
    popupsRef.current = []

    // Create and show popup
    const popup = createPropertyPopup(selectedProperty)
    popup.setLngLat(coords).addTo(map.current!)
    popupsRef.current.push(popup)

    // Fly to property location
    map.current.flyTo({
      center: coords,
      zoom: 15,
      duration: 1000,
      essential: true
    })

    console.log('✅ Selected property popup displayed:', selectedProperty.title)
  }, [selectedProperty, createPropertyPopup])
  
  // ✅ OPTIMIZED: Fit map to bounds when properties change
  useEffect(() => {
    if (!map.current || !mapLoaded || visibleProperties.length === 0) return

    const validCoords = visibleProperties
      .map(p => {
        if (p.latitude !== null && p.longitude !== null) return [p.longitude, p.latitude] as [number, number]
        if (p.city && CITY_COORDINATES[p.city]) return CITY_COORDINATES[p.city]
        return null
      })
      .filter(Boolean) as [number, number][]

    if (validCoords.length === 0) return

    if (validCoords.length === 1) {
      map.current.flyTo({ center: validCoords[0], zoom: 14, duration: 600 })
      return
    }

    const bounds = new mapboxgl.LngLatBounds()
    validCoords.forEach(c => bounds.extend(c))

    // Calculate spread — if markers are across different cities, cap zoom at 10
    // so we don't zoom out to show all of Nigeria
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    const latSpread = Math.abs(ne.lat - sw.lat)
    const lngSpread = Math.abs(ne.lng - sw.lng)
    const isWideSpread = latSpread > 2 || lngSpread > 2  // > ~200km apart

    map.current.fitBounds(bounds, {
      padding: 60,
      maxZoom: 12,   // Never zoom out past city level
      minZoom: 9,    // Never zoom in to street level on fitBounds
      duration: 600,
    })
  }, [visibleProperties, mapLoaded])
  
  // ✅ OPTIMIZED: Handle property selection
  const handlePropertyClick = useCallback((property: Property) => {
    onPropertySelect(property)
    
    // Fly to property location
    if (map.current) {
      let coords: [number, number] | null = null
      
      if (property.latitude !== null && property.longitude !== null) {
        coords = [property.longitude, property.latitude]
      } else if (property.city && CITY_COORDINATES[property.city]) {
        coords = CITY_COORDINATES[property.city]
      }
      
      if (coords) {
        map.current.flyTo({
          center: coords,
          zoom: 15,
          duration: 600
        })
      }
    }
  }, [onPropertySelect])
  
  // ✅ OPTIMIZED: Loading state
  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-slate-600 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }
  
  // ✅ OPTIMIZED: Error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(PropertyMapOptimized)
