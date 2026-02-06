// User-specific types extracted from auth context

import type { TenantProfile, LandlordProfile, Admin } from './index'

export interface User {
  id: string
  email: string
  phone_number?: string
  full_name?: string
  first_name?: string
  last_name?: string
  user_type: 'admin' | 'landlord' | 'tenant'
  avatar_url?: string
  verification_status?: string
  trust_score?: number
  email_verified?: boolean
  phone_verified?: boolean
  onboarding_completed?: boolean
  onboarding_step?: number
  auth_provider?: string
  provider_id?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  user: User | null
  profile: TenantProfile | LandlordProfile | Admin | null
  loading: boolean
  error: string | null
}

export interface AuthUser {
  id: string
  email?: string
  full_name?: string
  user_type?: 'tenant' | 'landlord' | 'admin'
  avatar_url?: string
  verification_status?: string
  trust_score?: number
  phone_number?: string
  email_verified?: boolean
  phone_verified?: boolean
  onboarding_completed?: boolean
  onboarding_step?: number
}

// Re-export from main types
export type { 
  TenantProfile, 
  LandlordProfile, 
  Admin, 
  AuthContextType,
  UserRole,
  AuthStatus 
} from './index'
