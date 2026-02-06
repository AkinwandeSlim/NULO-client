// export interface Property {
//   id: string
//   title: string
//   location: string
//   price: number
//   pricePerMonth: number
//   beds: number
//   baths: number
//   sqft: number
//   type: string
//   property_type: string
//   image: string
//   images: string[]
//   featured: boolean
//   latitude: number
//   longitude: number
//   description: string
//   landlord: {
//     id: string
//     name: string
//     email: string
//     phone: string
//     verified: boolean
//   }
// }

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

// export type ViewMode = 'list' | 'map' | 'split'

// export interface PropertySearchParams {
//   location?: string
//   min_price?: number
//   max_price?: number
//   bedrooms?: number
//   bathrooms?: number
//   property_type?: string
//   page?: number
//   limit?: number
// }

// export interface PropertySearchResponse {
//   success: boolean
//   properties: Property[]
//   total: number
//   page: number
//   limit: number
// }




















/**
 * Database-Aligned TypeScript Types
 * Generated from Supabase schema - properties table
 * 
 * IMPORTANT: These types match your actual database columns exactly
 */

// ============================================================================
// PROPERTY MODEL - Matches Supabase `properties` table exactly
// ============================================================================

export interface Property {
  // Core identifiers
  id: string;                          // uuid (primary key)
  landlord_id: string;                 // uuid (foreign key to users)
  
  // Basic information
  title: string;                       // text
  description: string;                 // text
  property_type: string;               // text (apartment, house, studio, etc.)
  
  // Location details
  address: string;                     // text
  full_address: string | null;         // text
  location: string;                    // text (main search field)
  city: string;                        // text (indexed)
  state: string;                       // text (indexed)
  country: string;                     // text
  neighborhood: string | null;         // text
  latitude: number | null;             // numeric(10,8)
  longitude: number | null;            // numeric(11,8)
  
  // Pricing
  price: number;                       // integer (indexed) - monthly rent
  security_deposit: number | null;     // integer
  
  // Property specs
  beds: number;                        // integer (indexed)
  baths: number;                       // integer
  sqft: number | null;                 // integer (square feet)
  floor_number: number | null;         // integer
  total_floors: number | null;         // integer
  year_built: number | null;           // integer
  year_built_display: string | null;   // text
  
  // Features & amenities
  amenities: string[];                 // text[] (array)
  rules: string[];                     // text[] (array)
  furnished: boolean | null;           // boolean
  parking_spaces: number | null;       // integer
  pet_friendly: boolean | null;        // boolean
  utilities_included: boolean | null;  // boolean
  
  // Media
  images: string[];                    // text[] (array of URLs)
  video_tour_url: string | null;       // text
  virtual_tour_url: string | null;     // text
  
  // Availability
  available_from: string | null;       // date (indexed)
  lease_duration: string | null;       // text (e.g., "12 months")
  status: string;                      // text (indexed) - vacant, occupied, etc.
  
  // Verification & featured
  featured: boolean | null;            // boolean (indexed)
  verification_status: string | null;  // text - pending, approved, rejected
  rejection_reason: string | null;     // text
  reviewed_at: Date | null;            // timestamp with time zone
  reviewed_by: string | null;          // uuid
  
  // Engagement metrics
  view_count: number | null;           // integer
  application_count: number | null;    // integer
  average_rating: number | null;       // numeric(3,2)
  review_count: number | null;         // integer
  
  // Additional data
  nearby_places: Record<string, any> | null;  // jsonb
  
  // Timestamps
  created_at: string;                  // timestamp with time zone
  updated_at: string;                  // timestamp with time zone
  
  // Computed/joined fields (not in database, added by API)
  landlord?: LandlordInfo;             // Joined from users table
  is_favorited?: boolean;              // Computed from favorites table
}

// ============================================================================
// USER MODEL - Matches Supabase `users` table
// ============================================================================

export interface User {
  id: string;                          // uuid (primary key)
  email: string;                       // text (unique, indexed)
  phone_number: string | null;         // text (unique, indexed)
  
  // Profile
  first_name: string | null;           // text
  last_name: string | null;            // text
  full_name: string | null;            // text
  avatar_url: string | null;           // text
  
  // User type & verification
  user_type: string;                   // text (indexed) - tenant, landlord, admin
  verification_status: string | null;  // text (indexed) - pending, approved, rejected
  trust_score: number | null;          // integer (0-100, indexed)
  
  // Onboarding
  onboarding_completed: boolean | null; // boolean (indexed)
  onboarding_step: number | null;      // integer
  
  // Auth & verification
  email_verified: boolean | null;      // boolean
  phone_verified: boolean | null;      // boolean (indexed)
  auth_provider: string | null;        // text (indexed) - email, google, etc.
  provider_id: string | null;          // text
  password_hash: string | null;        // text
  
  // Location & activity
  location: string | null;             // text (indexed)
  last_login_at: Date | null;          // timestamp with time zone
  
  // Timestamps
  created_at: string;                  // timestamp with time zone (indexed)
  updated_at: string;                  // timestamp with time zone
  deleted_at: Date | null;             // timestamp with time zone (soft delete)
}

// ============================================================================
// FAVORITES MODEL
// ============================================================================

export interface Favorite {
  id: string;                          // uuid (primary key)
  tenant_id: string;                   // uuid (foreign key to users, indexed)
  property_id: string;                 // uuid (foreign key to properties, indexed)
  created_at: string;                  // timestamp with time zone
}

// ============================================================================
// VIEWING REQUESTS MODEL
// ============================================================================

export interface ViewingRequest {
  id: string;                          // uuid (primary key)
  property_id: string;                 // uuid (foreign key, indexed)
  tenant_id: string;                   // uuid (foreign key, indexed)
  landlord_id: string;                 // uuid (foreign key, indexed)
  
  // Request details
  tenant_name: string;                 // varchar(100)
  contact_number: string;              // varchar(20)
  message: string | null;              // text
  
  // Scheduling
  preferred_date: string;              // date (indexed, must be future)
  time_slot: string | null;            // varchar(20) - morning, afternoon, evening
  confirmed_date: string | null;       // date
  confirmed_time: string | null;       // varchar(50)
  
  // Status & notes
  status: string;                      // varchar(20) (indexed) - pending, confirmed, completed, cancelled
  landlord_notes: string | null;       // text
  
  // Timestamps
  created_at: string;                  // timestamp with time zone
  updated_at: string;                  // timestamp with time zone
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PropertySearchParams {
  // Filters
  location?: string;                   // Search in city, state, or location field
  min_price?: number;
  max_price?: number;
  bedrooms?: number;                   // Minimum beds
  bathrooms?: number;                  // Minimum baths
  property_type?: string;              // apartment, house, studio, etc.
  
  // Additional filters
  furnished?: boolean;
  pet_friendly?: boolean;
  parking_required?: boolean;
  
  // Sorting
  sort?: 'newest' | 'price_low' | 'price_high' | 'featured';
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface PropertySearchResponse {
  success: boolean;
  properties: Property[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  performance?: {
    execution_time?: number;
    cache_hit?: boolean;
    optimized?: boolean;
    query_time?: number;
  };
  optimization?: {
    client_cache_ttl?: number;
    batch_operations?: boolean;
    query_optimized?: boolean;
  };
}

export interface CreatePropertyData {
  // Required fields
  title: string;
  description: string;
  property_type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  price: number;
  beds: number;
  baths: number;
  
  // Optional fields
  full_address?: string;
  location?: string;
  neighborhood?: string;
  sqft?: number;
  security_deposit?: number;
  amenities?: string[];
  rules?: string[];
  furnished?: boolean;
  parking_spaces?: number;
  pet_friendly?: boolean;
  utilities_included?: boolean;
  images?: string[];
  available_from?: string;
  lease_duration?: string;
  latitude?: number;
  longitude?: number;
  floor_number?: number;
  total_floors?: number;
  year_built?: number;
}

export interface UpdatePropertyData {
  title?: string;
  description?: string;
  property_type?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  amenities?: string[];
  rules?: string[];
  furnished?: boolean;
  parking_spaces?: number;
  pet_friendly?: boolean;
  utilities_included?: boolean;
  images?: string[];
  available_from?: string;
  status?: string;
  featured?: boolean;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface LandlordInfo {
  id: string;
  name: string | null;
  avatar_url: string | null;
  trust_score: number;
  verified: boolean;
  properties_count: number;
  joined_year: number;
  guarantee_joined: boolean;
}

export interface PlatformStats {
  total_properties: number;
  active_tenants: number;
  verified_landlords: number;
  cities_covered: number;
  new_this_week: number;
  verification_rate: number;
  avg_response_time: string;
}

export interface CityWithCount {
  name: string;
  state: string;
  country: string;
  image_url: string;
  description: string;
  property_count: number;
}

export interface PopularLocation {
  location: string;
  city: string;
  state: string;
  country: string;
  property_count: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PopularLocationsResponse {
  success: boolean;
  locations: PopularLocation[];
  total_locations: number;
}

// ============================================================================
// DATABASE ENUMS (as constants for type safety)
// ============================================================================

export const PropertyTypes = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  STUDIO: 'studio',
  CONDO: 'condo',
  TOWNHOUSE: 'townhouse',
  DUPLEX: 'duplex',
} as const;

export const PropertyStatus = {
  VACANT: 'vacant',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
} as const;

export const VerificationStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const UserTypes = {
  TENANT: 'tenant',
  LANDLORD: 'landlord',
  ADMIN: 'admin',
} as const;

export const ViewingRequestStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidPropertyType(type: string): type is typeof PropertyTypes[keyof typeof PropertyTypes] {
  return Object.values(PropertyTypes).includes(type as any);
}

export function isValidPropertyStatus(status: string): status is typeof PropertyStatus[keyof typeof PropertyStatus] {
  return Object.values(PropertyStatus).includes(status as any);
}

export function isValidUserType(type: string): type is typeof UserTypes[keyof typeof UserTypes] {
  return Object.values(UserTypes).includes(type as any);
}