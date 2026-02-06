// User-specific types extracted from auth context
import { User, TenantProfile, LandlordProfile, Admin } from '../lib/types'

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
  user_type?: 'admin' | 'landlord' | 'tenant'
  avatar_url?: string
  verification_status?: string
  trust_score?: number
  phone_number?: string
  email_verified?: boolean
  phone_verified?: boolean
  onboarding_completed?: boolean
  onboarding_step?: number
  created_at?: string
}
