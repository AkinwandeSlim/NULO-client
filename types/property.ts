export interface Property {
  id: string
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
  description: string
  landlord: {
    id: string
    name: string
    email: string
    phone: string
    verified: boolean
  }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export type ViewMode = 'list' | 'map' | 'split'

export interface PropertySearchParams {
  location?: string
  min_price?: number
  max_price?: number
  bedrooms?: number
  bathrooms?: number
  property_type?: string
  sort?: 'newest' | 'price_low' | 'price_high' | 'featured'
  page?: number
  limit?: number
}

export interface PropertySearchResponse {
  success: boolean
  properties: Property[]
  total: number
  page: number
  limit: number
}
