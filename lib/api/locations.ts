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

export interface StateData {
  id: string
  name: string
  state_code: string
  cities_count?: number
}

export interface StatesResponse {
  success: boolean
  states: StateData[]
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

// Predefined Nigerian states as properly shaped objects (fallback when API is unavailable)
const NIGERIAN_STATES_DATA: StateData[] = [
  { id: 'abia', name: 'Abia', state_code: 'AB' },
  { id: 'adamawa', name: 'Adamawa', state_code: 'AD' },
  { id: 'akwa-ibom', name: 'Akwa Ibom', state_code: 'AK' },
  { id: 'anambra', name: 'Anambra', state_code: 'AN' },
  { id: 'bauchi', name: 'Bauchi', state_code: 'BA' },
  { id: 'bayelsa', name: 'Bayelsa', state_code: 'BY' },
  { id: 'benue', name: 'Benue', state_code: 'BE' },
  { id: 'borno', name: 'Borno', state_code: 'BO' },
  { id: 'cross-river', name: 'Cross River', state_code: 'CR' },
  { id: 'delta', name: 'Delta', state_code: 'DE' },
  { id: 'ebonyi', name: 'Ebonyi', state_code: 'EB' },
  { id: 'edo', name: 'Edo', state_code: 'ED' },
  { id: 'ekiti', name: 'Ekiti', state_code: 'EK' },
  { id: 'enugu', name: 'Enugu', state_code: 'EN' },
  { id: 'fct', name: 'FCT (Abuja)', state_code: 'FC' },
  { id: 'gombe', name: 'Gombe', state_code: 'GO' },
  { id: 'imo', name: 'Imo', state_code: 'IM' },
  { id: 'jigawa', name: 'Jigawa', state_code: 'JI' },
  { id: 'kaduna', name: 'Kaduna', state_code: 'KD' },
  { id: 'kano', name: 'Kano', state_code: 'KN' },
  { id: 'katsina', name: 'Katsina', state_code: 'KT' },
  { id: 'kebbi', name: 'Kebbi', state_code: 'KE' },
  { id: 'kogi', name: 'Kogi', state_code: 'KO' },
  { id: 'kwara', name: 'Kwara', state_code: 'KW' },
  { id: 'lagos', name: 'Lagos', state_code: 'LA' },
  { id: 'nasarawa', name: 'Nasarawa', state_code: 'NA' },
  { id: 'niger', name: 'Niger', state_code: 'NI' },
  { id: 'ogun', name: 'Ogun', state_code: 'OG' },
  { id: 'ondo', name: 'Ondo', state_code: 'ON' },
  { id: 'osun', name: 'Osun', state_code: 'OS' },
  { id: 'oyo', name: 'Oyo', state_code: 'OY' },
  { id: 'plateau', name: 'Plateau', state_code: 'PL' },
  { id: 'rivers', name: 'Rivers', state_code: 'RI' },
  { id: 'sokoto', name: 'Sokoto', state_code: 'SO' },
  { id: 'taraba', name: 'Taraba', state_code: 'TA' },
  { id: 'yobe', name: 'Yobe', state_code: 'YO' },
  { id: 'zamfara', name: 'Zamfara', state_code: 'ZA' },
]

// Fallback cities per state (used when API is unavailable)
const NIGERIAN_CITIES_FALLBACK: Record<string, Array<{ id: string; name: string; state_code: string }>> = {
  'Lagos': [
    { id: 'lekki', name: 'Lekki', state_code: 'LA' },
    { id: 'victoria-island', name: 'Victoria Island', state_code: 'LA' },
    { id: 'ikoyi', name: 'Ikoyi', state_code: 'LA' },
    { id: 'ikeja', name: 'Ikeja', state_code: 'LA' },
    { id: 'surulere', name: 'Surulere', state_code: 'LA' },
    { id: 'yaba', name: 'Yaba', state_code: 'LA' },
    { id: 'ajah', name: 'Ajah', state_code: 'LA' },
    { id: 'lagos-island', name: 'Lagos Island', state_code: 'LA' },
    { id: 'apapa', name: 'Apapa', state_code: 'LA' },
    { id: 'badagry', name: 'Badagry', state_code: 'LA' },
    { id: 'ikorodu', name: 'Ikorodu', state_code: 'LA' },
    { id: 'epe', name: 'Epe', state_code: 'LA' },
    { id: 'mushin', name: 'Mushin', state_code: 'LA' },
    { id: 'oshodi', name: 'Oshodi', state_code: 'LA' },
    { id: 'alimosho', name: 'Alimosho', state_code: 'LA' },
    { id: 'banana-island', name: 'Banana Island', state_code: 'LA' },
  ],
  'FCT (Abuja)': [
    { id: 'maitama', name: 'Maitama', state_code: 'FC' },
    { id: 'asokoro', name: 'Asokoro', state_code: 'FC' },
    { id: 'garki', name: 'Garki', state_code: 'FC' },
    { id: 'wuse', name: 'Wuse', state_code: 'FC' },
    { id: 'jabi', name: 'Jabi', state_code: 'FC' },
    { id: 'gwarinpa', name: 'Gwarinpa', state_code: 'FC' },
    { id: 'kubwa', name: 'Kubwa', state_code: 'FC' },
    { id: 'abuja-cbd', name: 'Central Business District', state_code: 'FC' },
    { id: 'gwagwalada', name: 'Gwagwalada', state_code: 'FC' },
    { id: 'kuje', name: 'Kuje', state_code: 'FC' },
  ],
  'Rivers': [
    { id: 'port-harcourt', name: 'Port Harcourt', state_code: 'RI' },
    { id: 'gra-ph', name: 'GRA Port Harcourt', state_code: 'RI' },
    { id: 'elekahia', name: 'Elekahia', state_code: 'RI' },
    { id: 'trans-amadi', name: 'Trans Amadi', state_code: 'RI' },
    { id: 'rumuokwuta', name: 'Rumuokwuta', state_code: 'RI' },
    { id: 'd-line', name: 'D-Line', state_code: 'RI' },
    { id: 'bonny', name: 'Bonny', state_code: 'RI' },
    { id: 'ahoada', name: 'Ahoada', state_code: 'RI' },
  ],
  'Kano': [
    { id: 'kano-city', name: 'Kano City', state_code: 'KN' },
    { id: 'wudil', name: 'Wudil', state_code: 'KN' },
    { id: 'bichi', name: 'Bichi', state_code: 'KN' },
    { id: 'gaya', name: 'Gaya', state_code: 'KN' },
    { id: 'rano', name: 'Rano', state_code: 'KN' },
  ],
  'Oyo': [
    { id: 'ibadan', name: 'Ibadan', state_code: 'OY' },
    { id: 'ogbomosho', name: 'Ogbomosho', state_code: 'OY' },
    { id: 'oyo-town', name: 'Oyo', state_code: 'OY' },
    { id: 'iseyin', name: 'Iseyin', state_code: 'OY' },
    { id: 'saki', name: 'Saki', state_code: 'OY' },
  ],
  'Kaduna': [
    { id: 'kaduna-city', name: 'Kaduna', state_code: 'KD' },
    { id: 'zaria', name: 'Zaria', state_code: 'KD' },
    { id: 'kafanchan', name: 'Kafanchan', state_code: 'KD' },
  ],
  'Enugu': [
    { id: 'enugu-city', name: 'Enugu', state_code: 'EN' },
    { id: 'nsukka', name: 'Nsukka', state_code: 'EN' },
    { id: 'agbani', name: 'Agbani', state_code: 'EN' },
    { id: 'awgu', name: 'Awgu', state_code: 'EN' },
  ],
  'Edo': [
    { id: 'benin-city', name: 'Benin City', state_code: 'ED' },
    { id: 'auchi', name: 'Auchi', state_code: 'ED' },
    { id: 'ekpoma', name: 'Ekpoma', state_code: 'ED' },
    { id: 'uromi', name: 'Uromi', state_code: 'ED' },
  ],
  'Ogun': [
    { id: 'abeokuta', name: 'Abeokuta', state_code: 'OG' },
    { id: 'sagamu', name: 'Sagamu', state_code: 'OG' },
    { id: 'ijebu-ode', name: 'Ijebu-Ode', state_code: 'OG' },
    { id: 'ota', name: 'Ota', state_code: 'OG' },
  ],
  'Anambra': [
    { id: 'awka', name: 'Awka', state_code: 'AN' },
    { id: 'onitsha', name: 'Onitsha', state_code: 'AN' },
    { id: 'nnewi', name: 'Nnewi', state_code: 'AN' },
  ],
  'Delta': [
    { id: 'asaba', name: 'Asaba', state_code: 'DE' },
    { id: 'warri', name: 'Warri', state_code: 'DE' },
    { id: 'sapele', name: 'Sapele', state_code: 'DE' },
    { id: 'ughelli', name: 'Ughelli', state_code: 'DE' },
  ],
  'Imo': [
    { id: 'owerri', name: 'Owerri', state_code: 'IM' },
    { id: 'orlu', name: 'Orlu', state_code: 'IM' },
    { id: 'okigwe', name: 'Okigwe', state_code: 'IM' },
  ],
  'Kwara': [
    { id: 'ilorin', name: 'Ilorin', state_code: 'KW' },
    { id: 'offa', name: 'Offa', state_code: 'KW' },
    { id: 'jebba', name: 'Jebba', state_code: 'KW' },
  ],
  'Plateau': [
    { id: 'jos', name: 'Jos', state_code: 'PL' },
    { id: 'bukuru', name: 'Bukuru', state_code: 'PL' },
    { id: 'shendam', name: 'Shendam', state_code: 'PL' },
  ],
}

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
      // Backend returns objects with {id, name, state_code} — use as-is
      return response.data
    } catch (error) {
      console.warn('Failed to fetch states from API, using fallback data')
      return {
        success: true,
        states: NIGERIAN_STATES_DATA,
        total_states: NIGERIAN_STATES_DATA.length
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
      // Use the pre-built fallback cities map, or generate basic entries
      const fallback = NIGERIAN_CITIES_FALLBACK[state] || []
      return {
        success: true,
        cities: fallback,
        total_cities: fallback.length
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