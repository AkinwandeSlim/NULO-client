import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// For client components - this is what you should use in React components
// This uses the NEXT_PUBLIC_SUPABASE_ANON_KEY which is safe to expose
export const supabase = createClientComponentClient()

// IMPORTANT: Never import supabaseAdmin in client components!
// Admin client is only in lib/supabase/server.ts for API routes

// Database types (will be auto-generated from Supabase)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'tenant' | 'landlord' | 'admin'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'tenant' | 'landlord' | 'admin'
          phone?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?: 'tenant' | 'landlord' | 'admin'
          phone?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          landlord_id: string
          title: string
          description: string | null
          location: string
          city: string
          country: string
          latitude: number | null
          longitude: number | null
          price: number
          price_per_month: number | null
          beds: number | null
          baths: number | null
          sqft: number | null
          property_type: 'apartment' | 'house' | 'villa' | 'penthouse' | 'studio' | 'loft' | null
          status: 'vacant' | 'occupied' | 'maintenance'
          featured: boolean
          images: string[] | null
          amenities: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          landlord_id: string
          title: string
          description?: string | null
          location: string
          city: string
          country: string
          latitude?: number | null
          longitude?: number | null
          price: number
          price_per_month?: number | null
          beds?: number | null
          baths?: number | null
          sqft?: number | null
          property_type?: 'apartment' | 'house' | 'villa' | 'penthouse' | 'studio' | 'loft' | null
          status?: 'vacant' | 'occupied' | 'maintenance'
          featured?: boolean
          images?: string[] | null
          amenities?: string[] | null
        }
        Update: {
          title?: string
          description?: string | null
          location?: string
          city?: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          price?: number
          price_per_month?: number | null
          beds?: number | null
          baths?: number | null
          sqft?: number | null
          property_type?: 'apartment' | 'house' | 'villa' | 'penthouse' | 'studio' | 'loft' | null
          status?: 'vacant' | 'occupied' | 'maintenance'
          featured?: boolean
          images?: string[] | null
          amenities?: string[] | null
          deleted_at?: string | null
        }
      }
    }
  }
}
