/**
 * Locations API - For Nigerian cities and states
 */

import apiClient from './client'

export interface Location {
  name: string
  state: string
  country: string
  code?: string
}

export interface PopularLocation {
  location: string
  city: string
  state: string
  country: string
  property_count: number
  average_price?: number
}

export interface LocationsResponse {
  success: boolean
  locations: Location[]
  total_locations: number
}

export interface PopularLocationsResponse {
  success: boolean
  locations: PopularLocation[]
  total_locations: number
}

// Predefined Nigerian locations (fallback)
const NIGERIAN_LOCATIONS: Location[] = [
  // Lagos
  { name: 'Lagos', state: 'Lagos State', country: 'Nigeria' },
  { name: 'Victoria Island', state: 'Lagos State', country: 'Nigeria' },
  { name: 'Ikoyi', state: 'Lagos State', country: 'Nigeria' },
  { name: 'Lekki', state: 'Lagos State', country: 'Nigeria' },
  { name: 'Ajah', state: 'Lagos State', country: 'Nigeria' },
  { name: 'Ikeja', state: 'Lagos State', country: 'Nigeria' },
  { name: 'Surulere', state: 'Lagos State', country: 'Nigeria' },
  { name: 'Apapa', state: 'Lagos State', country: 'Nigeria' },
  { name: 'Badagry', state: 'Lagos State', country: 'Nigeria' },
  { name: 'Epe', state: 'Lagos State', country: 'Nigeria' },
  
  // Abuja
  { name: 'Abuja', state: 'FCT', country: 'Nigeria' },
  { name: 'Maitama', state: 'FCT', country: 'Nigeria' },
  { name: 'Asokoro', state: 'FCT', country: 'Nigeria' },
  { name: 'Garki', state: 'FCT', country: 'Nigeria' },
  { name: 'Wuse', state: 'FCT', country: 'Nigeria' },
  { name: 'Jabi', state: 'FCT', country: 'Nigeria' },
  { name: 'Kubwa', state: 'FCT', country: 'Nigeria' },
  { name: 'Gwarinpa', state: 'FCT', country: 'Nigeria' },
  { name: 'Central Area', state: 'FCT', country: 'Nigeria' },
  
  // Port Harcourt
  { name: 'Port Harcourt', state: 'Rivers State', country: 'Nigeria' },
  { name: 'GRA Port Harcourt', state: 'Rivers State', country: 'Nigeria' },
  { name: 'Elekahia', state: 'Rivers State', country: 'Nigeria' },
  { name: 'Rumuogbolu', state: 'Rivers State', country: 'Nigeria' },
  { name: 'Trans Amadi', state: 'Rivers State', country: 'Nigeria' },
  { name: 'Rumuokwuta', state: 'Rivers State', country: 'Nigeria' },
  { name: 'D-Line', state: 'Rivers State', country: 'Nigeria' },
  { name: 'Rumuola', state: 'Rivers State', country: 'Nigeria' },
  
  // Other major cities
  { name: 'Kano', state: 'Kano State', country: 'Nigeria' },
  { name: 'Ibadan', state: 'Oyo State', country: 'Nigeria' },
  { name: 'Kaduna', state: 'Kaduna State', country: 'Nigeria' },
  { name: 'Benin City', state: 'Edo State', country: 'Nigeria' },
  { name: 'Maiduguri', state: 'Borno State', country: 'Nigeria' },
  { name: 'Zaria', state: 'Kaduna State', country: 'Nigeria' },
  { name: 'Aba', state: 'Abia State', country: 'Nigeria' },
  { name: 'Jos', state: 'Plateau State', country: 'Nigeria' },
  { name: 'Ilorin', state: 'Kwara State', country: 'Nigeria' },
  { name: 'Oyo', state: 'Oyo State', country: 'Nigeria' },
  { name: 'Enugu', state: 'Enugu State', country: 'Nigeria' },
  { name: 'Abeokuta', state: 'Ogun State', country: 'Nigeria' },
  { name: 'Onitsha', state: 'Anambra State', country: 'Nigeria' },
  { name: 'Warri', state: 'Delta State', country: 'Nigeria' },
  { name: 'Auchi', state: 'Edo State', country: 'Nigeria' },
]

export interface StatesResponse {
  success: boolean
  states: string[]
  total_states: number
}

export interface CitiesResponse {
  success: boolean
  cities: Array<{
    id: string
    name: string
    state_code: string
    lat?: number
    lng?: number
  }>
  total_cities: number
}

// Predefined Nigerian states
const NIGERIAN_STATES = [
  'Abia State', 'Adamawa State', 'Akwa Ibom State', 'Anambra State', 'Bauchi State',
  'Bayelsa State', 'Benue State', 'Borno State', 'Cross River State', 'Delta State',
  'Ebonyi State', 'Edo State', 'Ekiti State', 'Enugu State', 'FCT', 'Gombe State',
  'Imo State', 'Jigawa State', 'Kaduna State', 'Kano State', 'Katsina State',
  'Kebbi State', 'Kogi State', 'Kwara State', 'Lagos State', 'Nasarawa State',
  'Niger State', 'Ogun State', 'Ondo State', 'Osun State', 'Oyo State',
  'Plateau State', 'Rivers State', 'Sokoto State', 'Taraba State', 'Yobe State', 'Zamfara State'
]

export const locationsAPI = {
  /**
   * Get all available locations
   */
  async getLocations(): Promise<LocationsResponse> {
    try {
      const response = await apiClient.get('/locations')
      return response.data
    } catch (error) {
      console.warn('Failed to fetch locations from API, using fallback data')
      // Return fallback data
      return {
        success: true,
        locations: NIGERIAN_LOCATIONS,
        total_locations: NIGERIAN_LOCATIONS.length
      }
    }
  },

  /**
   * Get all Nigerian states
   */
  async getStates(): Promise<StatesResponse> {
    try {
      const response = await apiClient.get('/locations/states')
      return response.data
    } catch (error) {
      console.warn('Failed to fetch states from API, using fallback data')
      // Return fallback data
      return {
        success: true,
        states: NIGERIAN_STATES,
        total_states: NIGERIAN_STATES.length
      }
    }
  },

  /**
   * Get cities by state
   */
  async getCities(state: string): Promise<CitiesResponse> {
    try {
      const response = await apiClient.get(`/locations/cities?state=${encodeURIComponent(state)}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch cities from API, using fallback data')
      // Filter fallback data by state and format correctly
      const citiesInState = NIGERIAN_LOCATIONS
        .filter(location => location.state === state)
        .map((location, index) => ({
          id: `${state.toLowerCase().replace(/\s+/g, '-')}-${location.name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
          name: location.name,
          state_code: state.replace(' State', '').toUpperCase()
        }))
        .filter((city, index, arr) => arr.findIndex(c => c.name === city.name) === index) // Remove duplicates
      
      return {
        success: true,
        cities: citiesInState,
        total_cities: citiesInState.length
      }
    }
  },

  /**
   * Get popular locations with property counts
   */
  async getPopularLocations(limit: number = 10): Promise<PopularLocationsResponse> {
    try {
      const response = await apiClient.get(`/locations/popular?limit=${limit}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch popular locations from API, using fallback data')
      // Return fallback popular locations
      const popularLocations: PopularLocation[] = [
        {
          location: 'Lekki Phase 1',
          city: 'Lagos',
          state: 'Lagos State',
          country: 'Nigeria',
          property_count: 156,
          average_price: 850000
        },
        {
          location: 'Victoria Island',
          city: 'Lagos',
          state: 'Lagos State',
          country: 'Nigeria',
          property_count: 98,
          average_price: 1200000
        },
        {
          location: 'Ikoyi',
          city: 'Lagos',
          state: 'Lagos State',
          country: 'Nigeria',
          property_count: 67,
          average_price: 1500000
        },
        {
          location: 'Maitama',
          city: 'Abuja',
          state: 'FCT',
          country: 'Nigeria',
          property_count: 45,
          average_price: 950000
        },
        {
          location: 'GRA Port Harcourt',
          city: 'Port Harcourt',
          state: 'Rivers State',
          country: 'Nigeria',
          property_count: 38,
          average_price: 750000
        }
      ]
      
      return {
        success: true,
        locations: popularLocations.slice(0, limit),
        total_locations: popularLocations.length
      }
    }
  },

  /**
   * Search locations by query
   */
  async searchLocations(query: string): Promise<LocationsResponse> {
    try {
      const response = await apiClient.get(`/locations/search?q=${encodeURIComponent(query)}`)
      return response.data
    } catch (error) {
      console.warn('Failed to search locations, using fallback data')
      // Search in fallback data
      const filteredLocations = NIGERIAN_LOCATIONS.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.state.toLowerCase().includes(query.toLowerCase())
      )
      
      return {
        success: true,
        locations: filteredLocations,
        total_locations: filteredLocations.length
      }
    }
  },

  /**
   * Get locations by state
   */
  async getLocationsByState(state: string): Promise<LocationsResponse> {
    try {
      const response = await apiClient.get(`/locations/state/${encodeURIComponent(state)}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch locations by state, using fallback data')
      // Filter fallback data by state
      const filteredLocations = NIGERIAN_LOCATIONS.filter(location =>
        location.state.toLowerCase() === state.toLowerCase()
      )
      
      return {
        success: true,
        locations: filteredLocations,
        total_locations: filteredLocations.length
      }
    }
  }
}

// Export individual functions for convenience
export const {
  getLocations,
  getStates,
  getCities,
  getPopularLocations,
  searchLocations,
  getLocationsByState
} = locationsAPI
